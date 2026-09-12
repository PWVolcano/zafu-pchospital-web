#!/usr/bin/env python3
"""把 mdBook 文档仓库内置进静态站。

用法：
    python tools/build_doc_data.py [文档仓库路径] [站点根目录]

默认：
    文档仓库 E:/PWVolcano/ZAFU-PCHospital-Doc-main/ZAFU-PCHospital-Doc-main
    站点根   本文件所在目录的上一级

产物：
    <site>/docs/src/**          原样拷贝的文档源文件与资源
    <site>/docs/manifest.json   目录树 + 元信息（供程序读取）
    <site>/docs/doc-data.js     window.ZAFU_DOC_DATA —— 供 file:// 直接打开时读取
"""

from __future__ import annotations

import datetime as _dt
import json
import re
import shutil
import sys
from pathlib import Path

DEFAULT_REPO = Path("E:/PWVolcano/ZAFU-PCHospital-Doc-main/ZAFU-PCHospital-Doc-main")

SUMMARY_LINK = re.compile(r"^\s*(?:-\s+)?\[(?P<title>[^\]]*)\]\((?P<path>[^)]*)\)\s*$")
GROUP_LINE = re.compile(r"^#\s+(?P<title>.+?)\s*$")


def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def parse_summary(md: str) -> list[dict]:
    """把 SUMMARY.md 解析成嵌套目录树。

    规则：行首的 `# ` 是一级分组；`- [标题](路径)` 是条目，
    缩进 4 空格表示挂到上一个条目下面；路径为空字符串表示尚未撰写。
    """
    root: list[dict] = []
    # stack 记录 (缩进宽度, 该层容器列表)
    stack: list[tuple[int, list[dict]]] = [(-1, root)]

    for raw in md.splitlines():
        if not raw.strip():
            continue

        group = GROUP_LINE.match(raw)
        if group:
            title = group.group("title").strip()
            if title.lower() == "summary":
                continue
            node = {"kind": "group", "title": title, "children": []}
            root.append(node)
            # 分组标题自身缩进为 0，其成员同样缩进为 0，
            # 所以这一层的"门槛"要低于 0，成员才不会被弹回根节点。
            stack = [(-1, root), (-1, node["children"])]
            continue

        link = SUMMARY_LINK.match(raw)
        if not link:
            continue

        indent = len(raw) - len(raw.lstrip())
        title = link.group("title").strip()
        target = link.group("path").strip()

        if not title:
            continue

        node: dict = {"kind": "page" if target else "pending", "title": title}
        if target:
            node["path"] = target
        else:
            node["path"] = None

        while len(stack) > 1 and indent <= stack[-1][0]:
            stack.pop()

        stack[-1][1].append(node)

        # 每个条目都可以挂子级：即使它自身还没写正文，
        # 只要下一行缩进更深，就是它的子条目（例如「校园网」下的「认证相关」）。
        node["children"] = []
        stack.append((indent, node["children"]))

    return root


def prune(node: dict) -> None:
    """清掉空的 children，保持输出干净。"""
    kids = node.get("children")
    if kids is None:
        return
    for k in kids:
        prune(k)
    if not kids:
        node.pop("children", None)


def walk(nodes: list[dict]):
    for n in nodes:
        yield n
        yield from walk(n.get("children", []))


def main() -> int:
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_REPO
    site = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent

    if not repo.is_dir():
        print(f"[x] 文档仓库不存在: {repo}", file=sys.stderr)
        return 1

    src_dir = repo / "src"
    if not src_dir.is_dir():
        print(f"[x] 未找到 {src_dir}", file=sys.stderr)
        return 1

    docs_dir = site / "docs"
    if docs_dir.exists():
        shutil.rmtree(docs_dir)
    docs_dir.mkdir(parents=True, exist_ok=True)

    # 1) 原样拷贝 src/，保持相对路径，页面里的 ./assets/x.png 才能解析
    shutil.copytree(src_dir, docs_dir / "src")
    # 2) 附上仓库自身的构建配置，说明这份文档从哪来（标题/作者/仓库地址在 manifest 里要用）
    if (repo / "book.toml").exists():
        shutil.copy2(repo / "book.toml", docs_dir / "book.toml")

    # 3) 解析目录树
    summary_path = docs_dir / "src" / "SUMMARY.md"
    tree = parse_summary(read_text(summary_path)) if summary_path.exists() else []
    for n in tree:
        prune(n)
        for sub in walk([n]):
            if sub.get("path"):
                sub["exists"] = (docs_dir / "src" / sub["path"]).is_file()

    # 4) 收集正文
    pages: dict[str, dict] = {}
    for n in tree:
        for node in walk([n]):
            rel = node.get("path")
            if not rel:
                continue
            f = docs_dir / "src" / rel
            if not f.is_file():
                node["exists"] = False
                continue
            text = read_text(f)
            h1 = next(
                (ln.lstrip("# ").strip() for ln in text.splitlines() if ln.startswith("# ")),
                node["title"],
            )
            pages[rel] = {
                "title": node["title"],
                "heading": re.sub(r"\*\*", "", h1),
                "markdown": text,
                "bytes": f.stat().st_size,
            }

    leaves = [n for n in walk(tree) if n["kind"] in ("page", "pending")]
    ready = sum(1 for n in leaves if n["kind"] == "page" and n.get("exists"))
    pending = len(leaves) - ready

    book_toml = read_text(docs_dir / "book.toml") if (docs_dir / "book.toml").exists() else ""
    authors = re.findall(r'authors\s*=\s*\[(.*?)\]', book_toml, re.S)
    authors = re.findall(r'"([^"]+)"', authors[0]) if authors else []
    title = re.search(r'title\s*=\s*"([^"]+)"', book_toml)
    lang = re.search(r'language\s*=\s*"([^"]+)"', book_toml)
    repo_url = re.search(r'git-repository-url\s*=\s*"([^"]+)"', book_toml)

    now = _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=8)))
    data = {
        "meta": {
            "title": title.group(1) if title else "ZAFU-PCHospital-Doc",
            "authors": authors,
            "language": lang.group(1) if lang else "zh-Hans-CN",
            "repoUrl": repo_url.group(1) if repo_url else "",
            "sourcePath": str(repo).replace("\\", "/"),
            "generatedAt": now.isoformat(timespec="seconds"),
            "counts": {"total": len(leaves), "ready": ready, "pending": pending},
        },
        "tree": tree,
        "pages": pages,
    }

    payload = json.dumps(data, ensure_ascii=False, indent=2)
    (docs_dir / "manifest.json").write_text(payload, encoding="utf-8")
    (docs_dir / "doc-data.js").write_text(
        "/* 由 tools/build_doc_data.py 生成，请勿手改。 */\n"
        "window.ZAFU_DOC_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )

    print(f"[+] 文档源目录 : {src_dir}")
    print(f"[+] 输出        : {docs_dir}")
    print(f"[+] 目录条目    : {len(leaves)}（已就绪 {ready} / 待撰写 {pending}）")
    print(f"[+] 正文页数    : {len(pages)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
