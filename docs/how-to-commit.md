# 手动提交本地 commit 操作指南

> 针对当前仓库状态：分支 `feat-about-gallery`，有 5 个文件待提交。
> 全部命令在**项目根目录** `E:\codes\zafu-pchospital-web` 下执行。

---

## 一、当前状态

开始前先看一眼，确认待提交内容符合预期：

```bash
git status
```

你现在会看到（**5 个文件**）：

```
 M src/app/about/page.tsx        # 删掉两句话 + 二维码引用改名
 M src/app/globals.css           # .qr 背景与 .qr__img 调整
 M src/config/site.ts            # contactQr.src 指向改色后的 PNG
?? public/qq-group-qrcode-accent.png   # 改色后的二维码（黄码点）
?? tools/recolor-qr.mjs                # 二维码改色脚本
```

**为什么只有 5 个**：上一轮那 18 个文件已经在 `5737ad9` 提交过了，
本次只是二维码改色 + 删两句话这一轮的增量。

---

## 二、提交（二选一）

### 方式 A：交互式挑选（推荐，最直观）

```bash
git add -p
```

它会**逐个代码块**问你 `Stage this hunk [y,n,q,a,d,s,e,?]?`，回答：

| 按键 | 含义 |
|---|---|
| `y` | 提交这一块 |
| `n` | 不提交这一块 |
| `s` | 这一块太大，拆成更小的块再问 |
| `q` | 退出（已选中的保留） |
| `?` | 看帮助 |

本次三个 `.tsx/.css/.ts` 都是**纯增量改动**，一路 `y` 即可。

### 方式 B：直接暂存全部（快，适合确认过状态的情况）

```bash
git add src/app/about/page.tsx src/app/globals.css src/config/site.ts
git add public/qq-group-qrcode-accent.png tools/recolor-qr.mjs
```

> ⚠️ **不要用 `git add -A` 或 `git add .`**
> 那样会把 `zafu-pchospital-site/`（AGENTS.md 规定**只读**，不该进提交）
> 和 `912tempprompt.md` 一起卷进来。

---

## 三、检查暂存内容（提交前最后一道关）

```bash
git status
git diff --cached
```

确认两件事：

1. 暂存区**不多不少就是 5 个文件**
2. `git diff --cached` 里**没有** `zafu-pchospital-site/` 的任何改动

如果想反悔某个文件：

```bash
git restore --staged <文件名>     # 只取消暂存，不动文件内容
```

---

## 四、写提交信息并提交

**多行提交信息**（推荐，和上一次 `5737ad9` 的风格保持一致）：

```bash
git commit
```

会打开编辑器，粘贴下面内容后保存退出：

```text
feat(about): 二维码改色融入页面，移除两处说明文案

二维码
- 码点由蓝紫渐变改为强调黄 --accent，深色文字反白，背景铺 --bg
- 新增 tools/recolor-qr.mjs，逐像素区分码点/文字/背景/印章
- contactQr 改用 qq-group-qrcode-accent.png，保留彩色原版可切回
- .qr 卡片去掉浅色承板，图片自带页面同色底

文案
- 移除服务范围的「超出能力范围……」说明
- 移除联系方式的「校园网认证登录……」说明
```

**单行简版**（不想开编辑器就这样写）：

```bash
git commit -m "feat(about): 二维码改色融入页面，移除两处说明文案"
```

---

## 五、确认提交成功

```bash
git log --oneline -3
```

应该看到新的 commit 在最上面，历史顺序：

```
<新提交>  feat(about): 二维码改色融入页面，移除两处说明文案
5737ad9  feat(about): 关于电脑医院页面实现与现场图集
6115270  chore: ignore local agent workspace
```

再看一眼工作区是否干净：

```bash
git status
```

显示 `nothing to commit, working tree clean` = 完成。

---

## 六、几个常见问题

**Q：提交了才发现漏文件 / 信息写错了怎么办？**

还没 push 之前可以补救：

```bash
git commit --amend              # 追加暂存的文件 / 改提交信息
git commit --amend -m "新信息"   # 只改信息
```

⚠️ 如果**已经 push 过**，就不要 `--amend` 了，再补一个提交更安全。

**Q：想撤掉最后一次 commit，但保留文件改动？**

```bash
git reset --soft HEAD~1
```

**Q：`git add -p` 时提示 `s` 用不了？**

说明这个改动块无法再切分。直接 `y` 或 `n` 即可。

**Q：执行 git 命令时报 `not a git repository`？**

确认当前目录是项目根，且 `.git` 目录存在：

```bash
git rev-parse --show-toplevel
```

---

## 七、提交之后

想推到远端（**注意先确认分支与远端策略**，AGENTS.md 规定**禁止直接 push `main`**）：

```bash
git push -u origin feat-about-gallery
```

---

## 附：本次未处理的遗留项

- 无。`feature/about-us` 孤儿分支已删除；`--plate` 令牌已从
  `globals.css` 与 `docs/design-system.md` 移除。
