"""校验配色对比度。

令牌取值直接从 assets/css/style.css 里解析，脚本内不再保留副本——
之前脚本把 ink-4 硬编码成 47%，而 CSS 早已改成 60%，
导致脚本把已修复的项误报为不合格，属于"检查工具本身会说谎"。
现在一律以 CSS 为准。

用法：
    python tools/check_contrast.py            # 打印全部组合
    python tools/check_contrast.py --quiet    # 只打印不合格项
退出码：存在不合格组合时为 1，否则为 0（便于串进审计流程）。
"""

import math
import re
import sys
from pathlib import Path

CSS_PATH = Path(__file__).resolve().parent.parent / "assets" / "css" / "style.css"

BG_TOKENS = ["bg", "bg-deep", "surface-1", "surface-2", "surface-3"]

# (前景令牌, 背景令牌, 要求比值, 用途说明)
#
# 组合按"实际会同时出现"来列，不做前景×背景的笛卡尔积：
# 无脑两两相除会把 accent-on 拿去跟页面背景比（假失败 1.0），
# 也会把从未同屏的 ink-4 / surface-2 报成缺陷。
# 下面是逐条核对过使用位置的结论：
#   - surface-2 作为背景时，文字一律是 --ink（.doclink:hover / [aria-current] /
#     .prose code / .prose th / .docpreview__item:hover），对比度 15:1 以上；
#   - ink-4 只出现在 bg / bg-deep / surface-1 之上，#surface-2 上的那个
#     .doclink.is-pending:hover 显式写了 background: none。
# 若今后把 ink-4 放到 surface-2 / surface-3 上，会低于 4.5:1，
# 此时必须调深 surface 或改用 ink-3 —— 见文末 EXCLUDED 的提示值。
PAIRS = (
    [(t, b, 4.5, "正文") for t in ("ink",) for b in BG_TOKENS]
    + [(t, b, 4.5, "次要正文") for t in ("ink-2",) for b in BG_TOKENS]
    + [(t, b, 4.5, "弱化正文") for t in ("ink-3",) for b in BG_TOKENS]
    + [("ink-4", b, 4.5, "微标签 / 编号") for b in ("bg", "bg-deep", "surface-1")]
    + [("accent", b, 4.5, "强调文字") for b in ("bg", "bg-deep", "surface-1")]
    + [("accent-deep", "bg", 4.5, "强调文字（深）")]
    + [
        ("accent-on", "accent", 4.5, "强调底上的文字"),
        ("accent-on", "accent-deep", 4.5, "强调底上的文字（深底）"),
    ]
    + [("line-strong", b, 3.0, "可交互描边（非文字）") for b in ("bg", "surface-1", "surface-2")]
)

# 当前未实际同屏、但一旦组合就会不达标的搭配。只做提示，不计入失败。
EXCLUDED = [
    ("ink-4", "surface-2", "未同屏；若引入需改 ink-3 或调深 surface"),
    ("ink-4", "surface-3", "未同屏；若引入需改 ink-3 或调深 surface"),
]


def read_tokens(path):
    """从 CSS 里抓出所有 oklch 令牌，返回 {名: (L, C, h)}（L 归一化到 0..1）。"""
    text = path.read_text(encoding="utf-8")
    found = {}
    for name, raw in re.findall(r"--([a-zA-Z0-9-]+)\s*:\s*oklch\(([^)]*)\)", text):
        if name in found:          # 同名的主题覆盖只取第一次出现的基准值
            continue
        found[name] = parse_oklch(raw)
    return found


def parse_oklch(raw):
    parts = raw.replace(",", " ").split()
    if len(parts) < 3:
        raise ValueError(f"无法解析 oklch 取值：{raw!r}")
    light = parts[0]
    L = float(light.rstrip("%")) / 100 if light.endswith("%") else float(light)
    return L, float(parts[1]), float(parts[2])


def oklch_to_srgb(L, C, h):
    hr = math.radians(h)
    a, b = C * math.cos(hr), C * math.sin(hr)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def enc(x):
        x = max(0.0, min(1.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return enc(r), enc(g), enc(bb)


def lum(rgb):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(fg, bg):
    la, lb = lum(fg), lum(bg)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def hexs(rgb):
    return "#" + "".join(f"{round(c * 255):02x}" for c in rgb)


def main():
    quiet = "--quiet" in sys.argv
    tokens = read_tokens(CSS_PATH)
    if not tokens:
        print(f"错误：没能从 {CSS_PATH} 解析出任何 oklch 令牌。")
        return 1

    print(f"令牌来源：{CSS_PATH.relative_to(CSS_PATH.parent.parent.parent)}")
    print(f"共解析 {len(tokens)} 个 oklch 令牌。\n")
    print(f"{'前景':<13}{'背景':<12}{'要求':>6}{'实际':>8}  {'结果':<6}{'HEX':<18}{'用途'}")
    print("-" * 78)

    failures = []
    missing = set()
    for fg_name, bg_name, need, note in PAIRS:
        if fg_name not in tokens:
            missing.add(fg_name)
            continue
        if bg_name not in tokens:
            missing.add(bg_name)
            continue
        fg = oklch_to_srgb(*tokens[fg_name])
        bg = oklch_to_srgb(*tokens[bg_name])
        r = ratio(fg, bg)
        ok = r >= need
        if not ok:
            failures.append((fg_name, bg_name, need, r))
        if quiet and ok:
            continue
        print(
            f"{fg_name:<13}{bg_name:<12}{need:>6.1f}{r:>8.2f}  "
            f"{'通过' if ok else '不通过':<6}{hexs(fg)} / {hexs(bg):<9}{note}"
        )

    if missing:
        print("\n警告：以下令牌在 CSS 中未找到，已跳过：" + "、".join(sorted(missing)))

    if EXCLUDED:
        print("\n提示：以下搭配当前未同屏出现，不计入失败，但一旦引入即不达标——")
        for fg_name, bg_name, note in EXCLUDED:
            if fg_name in tokens and bg_name in tokens:
                r = ratio(oklch_to_srgb(*tokens[fg_name]), oklch_to_srgb(*tokens[bg_name]))
                print(f"  · {fg_name} on {bg_name}：{r:.2f}  （{note}）")

    print()
    if failures:
        print(f"✗ {len(failures)} 项未达标注要求的对比度：")
        for fg_name, bg_name, need, r in failures:
            print(f"  - {fg_name} on {bg_name}：{r:.2f} < {need:.1f}")
        return 1

    print("✓ 全部组合达到标注要求的对比度。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
