# 任务：基于现有 Demo 搭建电脑医院官网多人协作开发框架

你现在负责浙江农林大学电脑医院官网项目的**第一阶段基础框架搭建**。

这个项目后续会由多人使用 Codex、Claude Code、Kimi 等 Agent 进行 Vibe Coding 协作，因此本次任务的核心不是完成所有页面，而是建立一个：

- 风格统一
- 目录清晰
- 易于多人并行开发
- 后续可以继续扩展业务功能
- 不容易被不同 Agent 改乱

的项目基础。

---

# 一、首先阅读和分析现有 Demo

项目中已经存在一个团队成员制作的 Demo。

**这个 Demo 的视觉设计已经得到团队认可，后续官网应以它作为 Design System 的主要来源。**

开始编码前，请完整检查 Demo，包括但不限于：

- 页面整体视觉风格
- 品牌色
- 背景色
- 字体与字号层级
- Header / Navbar
- Footer
- Button
- Card
- Section
- 页面最大宽度
- 留白和间距
- 圆角
- 阴影
- 边框
- 图标风格
- Hero 区域
- 动画和 Hover 效果
- PC / Mobile 响应式表现

不要重新设计一套新的 UI。

原则：

> **Demo 是视觉基准，你的任务是把 Demo 中已有的设计规律工程化、组件化、规范化。**

如果 Demo 中某些设计存在轻微不一致，可以整理成统一规则，但不要擅自进行大规模视觉改版。

---

# 二、技术目标

建立官网正式开发框架。

推荐技术栈：

- Next.js
- TypeScript
- Tailwind CSS
- pnpm

如果现有 Demo 已经使用这些技术，尽量在现有实现基础上整理。

如果 Demo 技术实现不同，但视觉设计可复用，则保留其视觉效果，在正式框架中重新组件化实现。

如需使用 shadcn/ui，可以使用，但必须遵守：

> shadcn/ui 只是组件基础设施，不能让网站变成默认的 shadcn 风格。

最终视觉必须以现有 Demo 为准。

不要为了搭框架引入大量不必要依赖。

---

# 三、本阶段页面范围

第一期只考虑四个公开页面：

```text
/
首页

/about
关于我们

/join
加入我们

/docs
技术文档入口
```

技术文档目前已有独立 mdBook 项目：

```text
https://github.com/ZAFU-PCHospital
```

因此当前 `/docs` 不需要重新开发文档系统。

它可以作为技术文档入口或跳转入口，为以后绑定正式文档域名预留配置。

---

# 四、本次不开发的功能

目前不要实现：

- 手机号验证码登录
- 用户系统
- 成员系统
- 权限系统
- 管理后台
- 数据库
- 报修系统
- 活动报名
- 维修备案
- 志愿时长
- API
- 在线招新系统

这些属于后续阶段。

但是目录和整体架构不能阻碍以后增加这些模块。

不要为了“考虑未来”提前实现不存在的业务。

---

# 五、建立合理的目录结构

请根据 Next.js 当前推荐实践建立简洁、可维护的结构。

参考方向：

```text
src/
├── app/
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── join/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   │
│   ├── ui/
│   │
│   ├── home/
│   │
│   ├── about/
│   │
│   └── join/
│
├── config/
│   ├── site.ts
│   └── navigation.ts
│
├── lib/
│
└── ...
```

你可以根据实际项目做合理调整，不要求机械复制。

但必须保证：

- 页面组件与公共组件分离
- Header / Footer 不重复实现
- 公共 UI 可以复用
- 页面专属组件有明确归属
- 配置数据不要大量硬编码散落在组件中

---

# 六、把 Demo 整理成 Design System

请根据现有 Demo 提炼设计规范，并创建：

```text
docs/design-system.md
```

至少记录：

## Colors

记录：

- Primary
- Background
- Foreground
- Muted
- Border
- Accent
- Success / Warning / Danger（如果 Demo 中存在）

优先把这些整理为统一 CSS Variables / Tailwind Token。

禁止后续页面随意写不同的品牌色。

---

## Typography

记录：

- H1
- H2
- H3
- Body
- Small Text
- 字重
- 行高

---

## Layout

记录：

- 页面最大宽度
- Container 规则
- 页面左右边距
- Section 间距
- 响应式断点

---

## Components

至少描述：

- Header
- Footer
- Button
- Card
- Container
- Section

如果 Demo 有其他明显可复用模式，也一起记录。

---

## Radius / Shadow / Border

把 Demo 中的规律整理成统一规则。

不要每个页面自行决定圆角和阴影。

---

## Motion

记录 Demo 已有动画。

如果 Demo 没有明显动画，不要为了“高级感”增加大量动画。

尤其避免：

- 大量粒子特效
- 复杂 3D
- 鼠标跟随特效
- 大面积炫光
- 每个组件单独使用不同动画体系

---

# 七、建立公共组件

至少完成：

```text
Header
Footer
Container
```

根据 Demo 情况，可以进一步抽取：

```text
Button
Section
SectionTitle
Card
Logo
```

原则：

> 只有真正重复、稳定的视觉模式才抽公共组件。

不要为了“组件化”把每一行 HTML 都拆成组件。

---

# 八、四个页面建立基础路由

建立：

```text
/
```

```text
/about
```

```text
/join
```

并建立技术文档入口。

这一阶段可以：

- 首页尽量保留现有 Demo
- About / Join 使用简单占位结构
- 不需要提前把其他成员负责的页面全部写完

重点是保证：

```text
Header
页面
Footer
```

整体布局已经可以运行。

以后其他成员只需要进入自己的页面模块开发。

---

# 九、创建 AGENTS.md

项目根目录创建：

```text
AGENTS.md
```

它是给后续 Codex / Claude Code / Kimi 等 Agent 阅读的项目规则。

至少包含：

## 技术栈

明确当前技术栈。

禁止 Agent 擅自：

- 更换框架
- 更换包管理器
- 引入另一套 CSS 体系
- 引入另一套 UI Framework

---

## Design

明确：

> 所有页面必须遵守 `docs/design-system.md`。

禁止 Agent：

- 自己创造新的品牌色
- 自己重新设计 Header
- 自己重新设计 Footer
- 自己创建第二套 Button / Container

---

## Scope

要求 Agent：

> 只修改当前任务真正需要修改的代码。

未经任务明确要求，禁止：

- 大规模重构
- 修改其他页面
- 删除已有业务代码
- 重命名大量目录
- 修改公共组件 API
- 安装大型新依赖

---

## Existing Code

明确：

> 已经存在且工作的代码应优先复用。

不要为了“代码更优雅”随意重写团队成员已经完成的内容。

---

# 十、创建 Architecture 文档

创建：

```text
docs/architecture.md
```

简单说明：

- 项目技术栈
- 项目目录结构
- `app` 负责什么
- `components/layout` 负责什么
- `components/ui` 负责什么
- 页面组件放哪里
- 全局配置放哪里
- 静态资源放哪里

并说明未来可以增加：

```text
login
activities
repair
profile
member
admin
```

但当前不实现。

Architecture 文档不要写成几十页技术论文。

目标是：

> 新成员看 5～10 分钟，就知道代码应该放在哪里。

---

# 十一、创建 Git Workflow

创建：

```text
docs/git-workflow.md
```

规定至少以下规则：

正式代码：

```text
main
```

所有开发通过独立分支，例如：

```text
feat/home
feat/about
feat/join

fix/mobile-navbar

docs/update-design-system
```

标准流程：

```text
同步 main
↓
创建分支
↓
开发
↓
lint / build
↓
commit
↓
push
↓
Pull Request
↓
Review
↓
合并 main
```

明确：

- 禁止普通开发直接 push main
- 一个 PR 尽量只解决一个任务
- 不要在一个 PR 混入大量无关修改
- 合并前确保项目可以正常构建

---

# 十二、README

整理项目根目录：

```text
README.md
```

至少说明：

- 项目是什么
- 当前开发阶段
- 技术栈
- 如何安装依赖
- 如何启动开发服务器
- 如何生产构建
- 基本目录结构
- Design System 在哪里
- Architecture 在哪里
- Git Workflow 在哪里
- AGENTS.md 的作用

确保新成员执行：

```bash
pnpm install
pnpm dev
```

即可进入开发。

---

# 十三、基础工程质量

至少确保：

```bash
pnpm lint
pnpm build
```

可以正常通过。

检查：

- TypeScript 错误
- ESLint 错误
- 无明显 Console Error
- Desktop 页面正常
- Mobile 页面基本正常
- 不存在明显横向溢出

如果项目已有格式化工具则沿用。

如没有，可以合理配置 Prettier。

---

# 十四、Git 安全要求

开始修改之前：

1. 查看当前 Git 状态。
2. 查看当前分支。
3. 查看现有文件。
4. 确认 Demo 和已有代码情况。
5. 不要直接删除现有项目内容。

尤其注意：

> 不允许为了重新初始化项目而直接删除已有 Demo 或团队成员代码。

如果必须迁移，请先理解已有内容，然后逐步迁移。

任何删除都必须确认文件确实被新结构替代。

不要使用危险的批量删除、reset、clean 等操作处理已有工作。

---

# 十五、提交要求

完成后，请先执行完整检查。

然后提交到独立分支，例如：

```text
feat/project-foundation
```

提交信息可以类似：

```text
feat: establish website foundation and design system
```

Push 到 GitHub，并准备 Pull Request。

不要未经确认直接覆盖远端 `main`。

---

# 十六、最终交付标准

本次工作的成功标准不是“页面做得很多”。

而是其他成员拉取代码后：

```bash
git clone ...
pnpm install
pnpm dev
```

即可开始自己的工作。

并且成员可以明确知道：

- UI 应该长什么样
- 页面代码放哪里
- 公共组件在哪里
- 哪些东西不能随便改
- Git 分支怎么建
- PR 怎么提交
- Agent 应遵守什么规则

最终仓库应至少形成类似：

```text
AGENTS.md
README.md

docs/
├── design-system.md
├── architecture.md
└── git-workflow.md

src/
├── app/
├── components/
├── config/
└── ...

public/
```

---

# 十七、执行原则

执行过程中遵循以下优先级：

```text
1. 保留并工程化现有 Demo 的设计风格
2. 保证项目稳定可运行
3. 建立多人协作基础
4. 建立公共组件
5. 建立清晰文档
6. 最后才考虑额外优化
```

不要脱离任务范围进行“大改造”。

不要为了展示 Agent 能力加入额外功能。

如果现有 Demo、仓库结构和本提示词存在冲突：

> 优先保留已经确认的视觉设计和已有有效代码，在不破坏现有工作的前提下完成框架整理。

完成后请给出一份简洁的实施报告，包括：

1. 你检查到的现有项目情况
2. 最终采用的技术栈
3. 创建/修改的主要目录
4. 提取出的 Design System
5. 创建的公共组件
6. 创建的协作文档
7. lint/build 检查结果
8. 当前 Git 分支与 commit
9. 是否已成功 push
10. 留给下一阶段成员的注意事项
