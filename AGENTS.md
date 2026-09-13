# AGENTS.md

> 本文件是给后续 AI Agent（Codex / Claude Code / Kimi / Cursor 等）阅读的**项目规则**。
> 开始任何改动前，先读完本文件，再读 `docs/design-system.md`。
>
> 你是这个项目的协作者，不是重写者。**已有且能正常工作的代码优先复用。**

---

## 0. 项目一句话

浙江农林大学电脑医院官网（社团综合服务平台）的第一阶段基础框架。
目标是**风格统一、目录清晰、易于多人并行开发**，而不是把页面做完。

---

## 1. 技术栈（不得擅自更换）

| 项目     | 当前选择                                       |
| -------- | ---------------------------------------------- |
| 框架     | Next.js 15（App Router）                       |
| 语言     | TypeScript（strict）                           |
| 样式     | Tailwind CSS v4 + `src/app/globals.css` 组件层 |
| 包管理器 | **pnpm**（锁文件 `pnpm-lock.yaml`）            |
| 规范     | ESLint（eslint-config-next）+ Prettier         |

**禁止 Agent 擅自：**

- ❌ 更换框架（不要引入 Vite / Nuxt / Astro / Remix）
- ❌ 更换包管理器（不要改用 npm / yarn，不要删除 `pnpm-lock.yaml`）
- ❌ 引入另一套 CSS 体系（不要引入 styled-components / emotion / CSS Modules 体系 / Sass / Less）
- ❌ 引入另一套 UI Framework（不要引入 MUI / Ant Design / Chakra / Bootstrap）
- ❌ 引入状态管理库、动画库、图标库、`clsx` / `tailwind-merge`
- ❌ 安装大型新依赖（新增任何运行时依赖都必须在 PR 中单独说明理由）

如果确实认为需要引入某个依赖，**先问，不要直接装**。

---

## 2. Design（必须遵守）

> **所有页面必须遵守 `docs/design-system.md`。该文件是视觉的唯一来源。**

**禁止 Agent：**

- ❌ 自己创造新的品牌色（全站只有一个强调色：信号黄 `--accent`）
- ❌ 在组件里写死主题色值（`color: #2457ff`、`background: #ffd400` 这类），必须走语义令牌
- ❌ 在组件里判断当前显示模式再挑颜色（`theme === "dark" ? "#FFD400" : "#2457FF"`）
- ❌ 自己重新设计 Header（桌面索引栏 / 移动端顶栏与浮层的结构已固定）
- ❌ 自己重新设计 Footer
- ❌ 自己创建第二套 Button / Container / Card / Section
- ❌ 使用 `docs/design-system.md` 之外的圆角数值（只有 `2px` / `4px` / `999px`；
     主题层自带的 `--r-frame` 属于主题取值，组件不要自己写新的圆角）
- ❌ 添加 `box-shadow`（设计基准不使用任何阴影）
- ❌ 使用标准断点之外的新断点（只用 `760px` 与 `1100px`，即 `md:` / `lg:`）
- ❌ 为「高级感」添加粒子、3D、光晕、新的鼠标跟随特效

**必须做到：**

- ✅ 颜色与视觉取值一律使用语义令牌（`var(--bg)` / `var(--surface-1)` / `var(--ink)` /
     `var(--line)` / `var(--accent)` 等）。当前生效的主题由 `<html data-theme>` 决定，
     组件不需要知道是哪个主题 —— 详见 `docs/design-system.md` 第 9 节
- ✅ 需要新增主题：改 `src/config/theme.ts` 的注册表 + 在 `globals.css` 主题层加一段
     `html[data-theme="<id>"]`；**不要**为不同模式写两套页面或两套组件
- ✅ 文案与列表数据放在 `src/config/`，不要硬编码在组件里
- ✅ 页面区块用 `components/ui/Section.tsx` 包裹，不要自己写 `padding-block`
- ✅ 内容放在 `components/layout/Container.tsx` 内
- ✅ 图标使用 `components/ui/Icon.tsx`（24 格 / stroke 2 / round 端点）
- ✅ 需要社团确认的信息标注为「待补充」，**不要编造事实**

---

## 3. Scope（只做该做的）

> **只修改当前任务真正需要修改的代码。**

**未经任务明确要求，禁止：**

- ❌ 大规模重构
- ❌ 修改其他页面（做 `/about` 就不要动 `/join`）
- ❌ 删除已有业务代码
- ❌ 重命名大量目录
- ❌ 修改公共组件 API（`components/layout/*`、`components/ui/*` 的 props）
- ❌ 安装大型新依赖
- ❌ 全量格式化（会淹没真实改动）

**关于业务范围（重要）：**

本项目后续会承载报修、活动报名、维修备案、志愿时长、成员系统、管理后台等业务，
但**这些属于后续阶段，本阶段一律不实现**：

- ❌ 不要引入数据库、ORM、鉴权、会话
- ❌ 不要实现登录、用户系统、成员系统、权限系统
- ❌ 不要实现报修系统、活动报名、备案、评价、志愿时长
- ❌ 不要实现 API 路由与后台管理界面

业务规则以仓库根目录的《电脑医院社团综合服务平台需求分析.md》为准。
**目录结构已经为这些模块预留了位置**（见 `docs/architecture.md` 第 6 节），
但不要为了「考虑未来」提前实现不存在的业务。

---

## 4. Existing Code（优先复用）

> **已经存在且工作的代码应优先复用。**

- ✅ 先搜索 `src/components/ui/` 与 `src/components/layout/`，确认没有现成实现再动手写。
- ✅ 先读 `src/config/`，确认要用的数据是否已经存在。
- ✅ 先读 `docs/design-system.md` 第 4 节，确认要用的视觉模式是否已经存在。
- ❌ 不要为了「代码更优雅」随意重写团队成员已经完成的内容。
- ❌ 不要把一个跨页面复用的区块留在页面专属目录里 —— 提升到 `components/ui/`。

**关于设计基准 Demo：**

- `zafu-pchospital-site/` 是团队已确认的**视觉基准**，**只读**。
- ❌ 不要修改、删除、重构、格式化它。
- ✅ 需要确认某个视觉细节时，直接读其中的 `assets/css/style.css`。

---

## 5. 目录职责速查

| 路径                     | 放什么                                                           | 不放什么                 |
| ------------------------ | ---------------------------------------------------------------- | ------------------------ |
| `src/app/*/page.tsx`     | 路由、`metadata`、区块拼装                                       | 大段 JSX、文案、内联样式 |
| `src/components/layout/` | 全站骨架（Header / Footer / Container / PageHead / SiteEffects） | 页面专属内容             |
| `src/components/ui/`     | 跨页面复用的 UI 原语                                             | 只被一个页面用的东西     |
| `src/components/<页面>/` | 该页面专属区块                                                   | 跨页面复用的东西         |
| `src/config/`            | 站点配置、导航、页面文案数据                                     | 组件、逻辑               |
| `src/lib/`               | 纯函数、数据读取                                                 | React 组件               |
| `src/data/`              | 构建脚本生成的结构化数据                                         | 手写内容                 |
| `src/app/globals.css`    | 设计令牌 + 基础层 + 组件层                                       | 页面专属样式             |
| `public/`                | 字体、图片等静态资源                                             | 源码里能 import 的东西   |

新增页面时的标准动作：

```text
1. src/app/<route>/page.tsx
2. src/components/<route>/         （如果需要页面专属区块）
3. src/config/<route>.ts           （文案与数据）
4. src/config/navigation.ts        （登记导航项）
```

---

## 6. 开工前必做

```bash
git status              # 确认工作区状态
git switch -c feat/xxx  # 确认不在 main 上直接开发
```

- 查看当前分支与已有文件，**不要直接删除现有项目内容**。
- 确认本次任务的范围，只改相关文件。
- 不确定的视觉、文案、业务判断，**先问再做**。

---

## 7. 完工前必做

```bash
pnpm lint      # 必须 0 error
pnpm build     # 必须成功
pnpm dev       # 手动检查 Desktop / Mobile / Console
```

自检清单：

- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 通过
- [ ] Desktop（≥1100px）与 Mobile（<760px）都正常
- [ ] 无横向溢出
- [ ] Console 无报错
- [ ] 未偏离 `docs/design-system.md`
- [ ] 未修改 `zafu-pchospital-site/`
- [ ] 未修改与任务无关的文件
- [ ] 文案数据在 `src/config/`，未硬编码

分支与提交规范见 `docs/git-workflow.md`。**禁止直接 push `main`。**

---

## 8. 一句话总结

> 保持风格统一、目录清晰、改动最小。
> 有疑问先读文档，读不到就问，**不要猜**。
