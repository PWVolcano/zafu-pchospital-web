"""清除编辑器实时预览注入的 data-page-node-id 属性。

背景：内置预览面板会把「元素 ↔ 源文件节点」的映射 id 写回磁盘上的 HTML，
每打开一次预览就可能重新注入一批。这些属性对站点运行毫无作用，
只是把 index.html 从 ~27KB 撑到 ~47KB（+70%），属于交付物污染。

用法：
    python tools/strip_preview_attrs.py            # 清理并报告
    python tools/strip_preview_attrs.py --check    # 只检查，有污染则退出码 1

幂等：没有该属性时不做任何写入。
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATTR = re.compile(r'\s+data-page-node-id="[^"]*"')
TARGETS = ["index.html"]


def main():
    check_only = "--check" in sys.argv
    total = 0

    for rel in TARGETS:
        path = ROOT / rel
        if not path.exists():
            print(f"跳过（不存在）：{rel}")
            continue

        # 用二进制读写：Path.write_text 会把 \n 按平台默认换行翻译成 \r\n，
        # 会静默改动整个文件的行尾（本项目统一 CRLF）。走字节通道则原样保留。
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        count = len(ATTR.findall(text))
        tags_before = len(re.findall(r"<[a-zA-Z][^>]*>", text))

        if count == 0:
            print(f"✓ {rel}：干净（{len(raw)} B）")
            continue

        total += count
        if check_only:
            print(f"✗ {rel}：发现 {count} 处注入属性")
            continue

        cleaned = ATTR.sub("", text)
        tags_after = len(re.findall(r"<[a-zA-Z][^>]*>", cleaned))
        if tags_before != tags_after:
            print(
                f"✗ {rel}：标签数发生变化（{tags_before} → {tags_after}），"
                "已中止写入，请人工检查。"
            )
            return 1

        payload = cleaned.encode("utf-8")
        path.write_bytes(payload)
        print(
            f"✓ {rel}：移除 {count} 处属性，"
            f"{len(raw)} B → {len(payload)} B"
        )

    if check_only and total:
        print(f"\n共 {total} 处污染。执行 python tools/strip_preview_attrs.py 清理。")
        return 1

    if total == 0 and not check_only:
        print("\n无需清理。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
