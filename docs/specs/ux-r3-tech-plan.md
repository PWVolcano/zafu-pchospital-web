# UX R3 技术方案（导航 / CTA / 易用性）

> 仓库：`ZAFU-PCHospital/zafu-pchospital-web`（本地 `/workspace/zafu-pchospital-web`）  
> 调研基线：`origin/main` @ `95e25e88cbbe9146f0ab544be7ed040bf0c1bb78`（**已合入 PR #59**，2026-09-25 22:57 CST）  
> 约束：本文只描述方案与验收；**不改业务代码、不 push、不开/合 PR**  
> 起草：2026-09-26（Asia/Shanghai）  
> 产品拍板：Hanlin · UX R3；推荐项做 **2–7**，**不做 1**

---

## 0. 调研快照（git / #59）

| 项 | 事实 |
| --- | --- |
| `origin/main` HEAD | `95e25e88cbbe9146f0ab544be7ed040bf0c1bb78` — `Merge pull request #59 from Xiaoyuan-114/feat/ui-polish-r2` |
| PR #59 | **已 merged**（`merged_at` ≈ 2026-09-25 22:57 CST）；功能 head = `dae0444` |
| #59 公开列表终态 | 一页最多 **4** 张 + 翻页；**无拖动**；卡片定宽等高；排序方案 B 已落地 |
| 本地工作区 | 可停在任意旧分支；R3 **必须**从 `origin/main` 新开 `feat/ux-r3`，勿在 `feat/ui-polish-r2` 上续堆 |

**含义**：R2（#59）已是主干。本轮以含 #59 的 `origin/main` 为唯一基线另开 PR；测通再提，**不 merge**（由主线决定）。

---

## 1. 目标 / 非目标

### 1.1 目标（硬需求 N1–N4 + 推荐 R2–R7）

| ID | 摘要 |
| --- | --- |
| **N1** | 公开 `mainNav`：「维修活动」紧挨「首页」后（第二位）；凡带数字标签的导航按**各自列表顺序**重编为连续 `01、02、03…`（公开 / 成员 / 管理 / 文档页头与页内分区一并校准，避免跳号、重号） |
| **N2** | 成员工作台新增「活动管理」按钮 → `/member/repair-activities`（现网等价路径，侧栏已有「维修活动」入口） |
| **N3** | 公开首页主 CTA：由「维修报修」（当前 `href: ""` 死链）改为「报名活动」→ `/repair-activities`；保留次要链（报修 / 说明类，文案可改为「维修说明」等） |
| **N4** | 成员 + 管理后台壳：加强层次 / 主次操作 / 空态与加载 / 可读性；可加少量线条 / 几何图标（`Icon`）；**禁止 emoji 当图标**；短过渡 150–200ms，尊重 `prefers-reduced-motion`；`swiss-cobalt` / `black-yellow` 双主题都过 |
| **R2** | 活动工作台空态：未出勤突出「参加本场」；无人排队提示去左侧签到 |
| **R3** | 管理活动列表：状态色 + 短标签；行内已报 / 上限（已有雏形，收敛视觉与文案） |
| **R4** | 破坏操作统一二次确认（删活动 / 删报名 / 撤回等），文案说清后果 |
| **R5** | 公开活动详情：查号改类型与报名区**同屏**（宽屏并排，窄屏仍可上下但同页可见） |
| **R6** | 动效 token：成员 / 管理与深浅色同一套；可减弱动效 |
| **R7** | 首页露出 1～3 场**未结束**活动卡片 +「查看全部」；排序方案 B（未结束 `activityAt` 升序）；已结束不进这 1～3；卡片可点进详情 |

### 1.2 非目标

- **不做推荐项 1**（产品明确）。
- 不换品牌色、不重做插画、不大改侧栏 IA、不动效炫技。
- 不改 GreatSQL / Prisma 契约；不新增业务域；不放开「已结束可进详情报名」。
- 不回退 #59：公开列表保持「≤4 / 页 + 翻页、无拖动、定宽等高」；R7 是**首页另块**，不是把列表改回横滑/拖拽。
- 不要求改首页正文其它结构（近场活动仅 R7 增量区块）。
- 本轮文档只出方案；实施另开 PR，测通再提，**不在本助手流程内 merge**。

---

## 2. 分支衔接

```bash
git fetch origin
git checkout -b feat/ux-r3 origin/main
# …按 T-UX-1～5 实现…
# PR: feat/ux-r3 → main（另开；勿复用 #58/#59）
```

| 方案 | 做法 | 结论 |
| --- | --- | --- |
| **A（推荐）** | 从 `origin/main`@`95e25e8` 拉 `feat/ux-r3` | #59 已合入，diff 干净 |
| B | 在 `feat/ui-polish-r2` 上续写 | **禁止**：易与已 merge 树分叉 |
| C | 从过时本地 `main` | **禁止**：可能 behind 数十 commit |

---

## 3. 现状摸底（关键落点）

### 3.1 公开导航与数字标签（N1）

| 位置 | 现状 | 问题 |
| --- | --- | --- |
| `src/config/navigation.ts` → `mainNav` | 01 首页 · 02 关于 · 03 加入 · **05** 维修活动 · **06** 文档 | **缺 04**；活动不在首页后 |
| `/about` `PageHead` | `index="02"`；`aboutSections` 03/04/05 | 随导航重排需顺延 |
| `/join` `PageHead` | `index="03"`；`joinSections` 04–07 | 同上 |
| `/repair-activities` `PageHead` | `index="05"` | 目标应为 **02** |
| `/docs` | `SectionHead index="06"` | 目标应为 **05** |
| `src/config/member.ts` → `memberNav` / `memberSettingsNav` | 05–08 工作区 · 09–11 设置 | 列表内连续，但与公开历史「公开 01–04 / 成员 05+」约定耦合；公开扩到 01–05 后建议成员整段 **+1 → 06–12**，或成员壳内独立 01…（见 §7 口径） |
| `src/config/admin.ts` → `ADMIN_SECTION_INDEX` / `adminNavGroups` / `adminSettingsNav` | home `00`；业务 09–19；侧栏展示顺序 ≠ 编号升序；注释写明「不重排」因 `SectionHead` 共用 | N1 要求按**各自列表顺序**重编时，须 **index 常量 + 各页 SectionHead 同步改** |

**目标公开顺序（写死）：**

1. `01` 首页 `/`  
2. `02` 维修活动 `/repair-activities`  
3. `03` 关于我们 `/about`  
4. `04` 加入我们 `/join`  
5. `05` 技术文档 `/docs`  

页内分区：About 页头 03、分区 04–06；Join 页头 04、分区 05–08；活动页头 02；文档 05。

### 3.2 首页 CTA（N3）

| 落点 | 现状 |
| --- | --- |
| `src/config/home.ts` → `heroActions` | `repair: { label: "维修报修", href: "" }`（死链）；`docs: { label: "查看文档", href: "/handbook/Intro.html" }` |
| `src/components/home/Hero.tsx` | `href` 空则渲染无跳转的 solid `Button` |

**目标：** solid 主按钮「报名活动」→ `/repair-activities`；次要链保留报修/说明语义（建议「维修说明」→ 首页 `#process`，见 §7）。文档入口仍在导航 / Docs 区，不强制占 Hero 次位。

### 3.3 成员工作台入口（N2）

| 落点 | 现状 |
| --- | --- |
| `MemberDashboard` hero actions | 唯一 solid「新增维修记录」→ `/member/repairs/new`；次要「编辑个人资料」 |
| 侧栏 `memberNav` | 已有「维修活动」→ `/member/repair-activities` |

**目标：** 增加「活动管理」按钮（文案产品指定）→ `/member/repair-activities`。建议 solid 仍留给「新增维修记录」，「活动管理」用默认/ghost，避免双主 CTA（见 §7）。

### 3.4 成员活动工作台（R2 / R4）

| 落点 | 现状 |
| --- | --- |
| `MemberRepairActivityBoard` | 未出勤：工具栏 solid「参加本场」+ `attendRequired` 文案；排队空：`queueEmpty`「排队为空。签到后会出现在这里。」 |
| 撤回 | `withdraw()` **无二次确认**，直接 POST |

R2：强化未出勤时主 CTA 视觉权重；排队空态明确「请到左侧勾选并签到」。  
R4：撤回（及同类破坏操作）走确认层，说明会退出排队、需重新签到等后果。

### 3.5 管理活动列表（R3 / R4）

| 落点 | 现状 |
| --- | --- |
| `RepairActivityAdminPanel` | 行内已有 `registeredCount / capacity`；`statusTagClass` → `admin-tag*`（色弱、短标签不统一） |
| 删活动 / 删报名 | 已用 `AdminModal` 二次确认；文案含软删 / 名额后果（可再收紧） |

R3：状态色与公开 `repair-tag` / 五态映射对齐或管理侧专用短标签（开放/已满/未开始/已截止/已结束）；行内「已报 n / 上限 m」可读性加强。  
R4：确认文案统一说清后果；成员撤回补齐同一交互模式（可抽轻量 `ConfirmDialog` 或复用 Modal 模式）。

### 3.6 公开详情布局（R5）

| 落点 | 现状 |
| --- | --- |
| `RepairActivityDetail` | 信息卡 → **报名 Card** → **查号/改类型 Card** 纵向堆叠 |
| CSS | `.activity-detail` 多为单列 `grid` |

目标：宽屏（建议 ≥760px，与 #59 断点一致）报名 | 查号改类型同屏两列；窄屏保持上下，但仍在同一详情页（无需跳转）。

### 3.7 动效 / token（R6 / N4）

| 令牌 | 现状 |
| --- | --- |
| `--d-fast` / `--d-mid` / `--d-slow` | 140ms / 260ms / 420ms（`globals.css`） |
| `--ease-quart` 等 | 已有；主题切换另有 `--d-theme` |
| `prefers-reduced-motion: reduce` | 已有全局压制 |

目标：成员壳 / 管理壳 / 公开活动相关 UI 的短交互统一落在 **150–200ms**（建议新增 `--d-ui: 180ms` 或把 `--d-fast` 调到 160–180ms，并让壳层 hover/focus/面板展开引用它）；减弱动效路径不新增炫技动画。

### 3.8 首页近场活动（R7）与 #59 边界

| 落点 | 现状 |
| --- | --- |
| `src/app/page.tsx` | Hero → Ticker → Process → Docs → Contact；**无**活动区块 |
| `sortRepairActivitiesForPublicList` | 方案 B 已实现；`listPublic` 已接线 |
| `RepairActivityList` | `PAGE_SIZE = 4`，分页，无拖动 |

R7（issue #68 定稿的口径）：`HomeActivityPreview` 服务端取 `listPublic`，按
`pickNonEndedRepairActivitiesForHomePreview` 挑未结束的前 1–3 条 —— **报名开放中（OPEN）优先**，
其次 UPCOMING，再其次 FULL / CLOSED，同档内 `activityAt` 升序；卡片可点详情；「查看全部」→
`/repair-activities`。（早先「直接取 B 序前 3 条」会让已满 / 已截止的场次压在还能报名的场次前面，
所以首页不复用列表页的排序。）  
**勿**在首页复用横滑拖拽；卡片视觉可复用列表卡字段（标题 / 时间 / 状态 / 名额），布局用简单响应式网格即可。

### 3.9 图标

`src/components/ui/Icon.tsx` 已提供线条 SVG（`IconName`）。N4 只增必要几何图标，**禁止** emoji / 彩色表情作图标。

---

## 4. 任务卡 T-UX-1～5

### T-UX-1：N1 + N3 + R7（公开面）

| 项 | 内容 |
| --- | --- |
| **依赖** | 无（可先做） |
| **落点** | `src/config/navigation.ts`；`src/config/about.ts` / `join.ts`；`src/app/about|join|docs|repair-activities/**/page.tsx` 中硬编码 index；`src/config/home.ts` + `Hero.tsx`；新建首页活动区块组件（如 `src/components/home/HomeActivityPreview.tsx`）+ `page.tsx` 接入；可选复用 `activity-status-badge` / `activity-format`；文案进 `home.ts` 或 `repair-activities` config |
| **实现要点** | ① 重排 `mainNav` 并重编号 ①–⑤；② 级联校准各公开页 PageHead / SectionHead / about·join sections；③ Hero 主 CTA → 报名活动；次要链见 §7；④ 首页 1–3 未结束卡 + 查看全部；空态不占脏版（无未结束则整块隐藏或一句空文案，二选一写死在验收） |
| **验收** | 桌面/移动导航顺序与编号正确无跳号；活动页头为 02；Hero 主按钮可进列表；首页卡片 ≤3、均为未结束、顺序符合 B、可进详情；「查看全部」进 `/repair-activities` 且列表仍为 #59 形态（4/页、无拖） |
| **测试** | 若有导航单测则更新期望顺序；可补 sort/filter 纯函数测「首页取前 N 未结束」 |

### T-UX-2：N2 + R2 + 成员 C1 / 动效

| 项 | 内容 |
| --- | --- |
| **依赖** | 建议在 T-UX-1 导航口径（成员编号）确定后改 `member.ts` index，或本卡内一并重编成员导航数字 |
| **落点** | `MemberDashboard.tsx` + `config/member.ts`；`MemberRepairActivityBoard.tsx` + `config/repair-activities.ts`（board 文案）；成员壳样式（`globals.css` 中 `.member-*`）与 `--d-ui` |
| **实现要点** | ① 「活动管理」入口；② 未出勤空态/提示突出参加本场；③ 排队空态指向左侧签到；④ 层次/主次/空加载微调；短过渡；无 emoji |
| **验收** | 工作台可一键进活动列表；未出勤时「参加本场」为最显眼操作；无人排队文案指向左侧；深浅色可读；reduced-motion 下无长动画 |

### T-UX-3：管理 C1 + R3 + R4 + 动效

| 项 | 内容 |
| --- | --- |
| **依赖** | R4 与成员撤回可共用确认组件（若 T-UX-2 已抽则复用） |
| **落点** | `RepairActivityAdminPanel.tsx`；`config/admin.ts`（repairActivities 文案 / 状态短标）；`AdminModal` 或共享 Confirm；管理壳 `.admin-*` 样式；`ADMIN_SECTION_INDEX` 重编（若 N1 含管理）及各 admin 页 SectionHead |
| **实现要点** | ① 状态色+短标签；② 行内已报/上限；③ 删活动/删报名确认后果文案统一；成员撤回确认可在本卡或 T-UX-2；④ 壳层易用性与动效 token |
| **验收** | 五态可辨（不只靠颜色，含文字短标）；名额一行可读；破坏操作均需确认且说明后果；双主题；reduced-motion |

### T-UX-4：R5

| 项 | 内容 |
| --- | --- |
| **依赖** | 无强依赖；可与 T-UX-1 并行 |
| **落点** | `RepairActivityDetail.tsx`；`globals.css`（`.activity-detail` 双列） |
| **实现要点** | 宽屏报名 ∥ 查号改类型；窄屏堆叠但仍同页；共享 notice/error 区域不丢；已结束/不可报状态逻辑不变 |
| **验收** | ≥760px 两栏同屏；窄屏无需跳转即可完成查号；报名成功/查号成功反馈仍清晰 |

### T-UX-5：深浅色 / 动效走查 + 测试 + 开 PR

| 项 | 内容 |
| --- | --- |
| **依赖** | T-UX-1～4 完成 |
| **落点** | 不改业务逻辑；补测、改 PR 描述、自检清单 |
| **验收** | `swiss-cobalt` + `black-yellow` 走查：导航编号、Hero、首页活动卡、详情双栏、成员工作台/看板、管理列表与确认框；`prefers-reduced-motion`；单测/门禁绿；PR → `main`，**不 merge** |
| **建议命令** | 现有 unit（含 `repair-activity-sort`）；eslint / `tsc --noEmit`；手动双主题 |

---

## 5. 动效 token 约定（R6）

| Token | 建议值 | 用途 |
| --- | --- | --- |
| `--d-ui`（新）或上调后的 `--d-fast` | **160–180ms**（落在 150–200 要求内） | 按钮 hover、边框、标签、侧栏项、空态切换 |
| `--d-mid` | 保持 ~260ms 或略降 | 面板展开等稍长反馈 |
| `--d-slow` / `--d-theme` | 保持 | 进场 / 主题切换；本轮不拉长、不炫技 |
| `--ease-quart` / `--ease-expo` | 保持 | 与现设计系统一致 |
| `prefers-reduced-motion: reduce` | 保持全局 0.01ms 压制 | 成员/管理新增过渡必须吃同一媒体查询 |

原则：成员壳与管理壳**禁止**第二套时长；组件内不写死 `theme === dark` 上色；过渡只加在已有交互反馈上。

---

## 6. 给测试的验收清单

### 6.1 导航与编号（N1）

- [ ] 公开桌面索引栏 + 移动浮层：首页 → **维修活动** → 关于 → 加入 → 文档  
- [ ] 编号为 01–05 连续，无跳号  
- [ ] `/repair-activities` 页头 02；`/about` 03；`/join` 04；`/docs` 05  
- [ ] about/join 页内分区编号与页头不冲突、不重号  
- [ ] 成员侧栏 / 设置菜单编号在**本列表内**连续、无跳号重号（按 §7 选定口径）  
- [ ] 管理侧栏常驻 + 设置菜单编号按展示顺序连续（若本轮纳入重编）

### 6.2 Hero 与首页活动（N3 / R7）

- [ ] 主按钮文案「报名活动」，进入 `/repair-activities`  
- [ ] 次要链仍在且语义为报修/说明类（非死链）  
- [ ] 有未结束活动时首页展示 1–3 张卡；均为未结束；**OPEN 优先**、同档内时间升序；点击进详情  
- [ ] 「查看全部」进列表；列表仍 ≤4/页、可翻页、不可拖、定宽等高  
- [ ] 无未结束活动时的空态符合方案约定（隐藏整块或短文案）

### 6.3 成员（N2 / R2 / N4 / R4）

- [ ] 工作台有「活动管理」→ `/member/repair-activities`  
- [ ] 未出勤：突出「参加本场」  
- [ ] 排队空：提示去左侧签到  
- [ ] 撤回需确认，文案含后果  
- [ ] 无 emoji 图标；加载/空态可读；短过渡；深浅色

### 6.4 管理（R3 / R4 / N4）

- [ ] 列表状态短标签 + 可辨色；行内已报/上限  
- [ ] 删活动、删报名确认且说明后果  
- [ ] 壳层主次清晰；双主题；reduced-motion

### 6.5 详情（R5）

- [ ] 宽屏报名与查号改类型同屏  
- [ ] 窄屏同页可完成两套操作  
- [ ] 已结束直链行为与 #58/#59 一致（不可报 / missing 返回列表）

### 6.6 回归

- [ ] 公开列表排序 B 未回归  
- [ ] 报名 / 查号 / 改类型 / 出勤 / 签到 / 接待 API 行为未改契约  
- [ ] 主题切换与焦点环仍可用  

---

## 7. 口径备注（实施前建议拍板，不阻塞开分支）

| # | 议题 | 建议默认（可被产品改口） | 是否阻塞编码 |
| --- | --- | --- | --- |
| C1 | Hero 次要链 | 主：「报名活动」→ `/repair-activities`；次：「维修说明」→ `/#process`（首页流程锚点）。原「查看文档」不占 Hero，文档仍走导航 05 | 否（按默认做） |
| C2 | 成员导航编号 | **方案 M-B**：公开 01–05 后，成员整段改为 **06–12**（工作 06–09，设置 10–12），延续「公开 / 成员分段」历史注释；不做成员壳内从 01 另起（避免与页内其它 01 视觉混淆） | 否 |
| C3 | 管理编号重编 | **做**：按侧栏展示顺序重编 `ADMIN_SECTION_INDEX` + 设置菜单 + 各页 `SectionHead`，home 保留 `00`；接受与旧截图编号不一致 | 否（工作量计在 T-UX-3） |
| C4 | N2 按钮层级 | 「新增维修记录」保持唯一 solid；「活动管理」用默认/ghost | 否 |
| C5 | R7 空态 | 无未结束活动时**整块不渲染**（避免首页空卡噪音） | 否 |
| C6 | R7 数据获取 | 优先 RSC/服务端调 `listPublic`（或等价），避免首页再打一次无缓存瀑布；若只能 client，与列表相同 API | 否 |
| C7 | 确认对话框 | 管理继续 `AdminModal`；成员撤回抽小型确认（同 Modal 交互：Esc、焦点返回、说清后果），不引入 `window.confirm` | 否 |
| C8 | 状态短标文案 | 与公开五态中文标签对齐（未开始/开放/已满/已截止/已结束），管理侧可用更短两字：将开/开放/已满/截止/结束 | 否 |

**无阻断开分支的未知项**；上表仅为减少返工的默认口径。若 Hanlin 对 C1/C2 有不同偏好，改 config 成本低。

---

## 8. 与 #59 的冲突规避

- 公开列表组件（`RepairActivityList`）**不**改回拖拽/横滑无限带；分页 4 保持。  
- R7 只在首页新增区块，不改列表页 IA。  
- 排序继续用 `sortRepairActivitiesForPublicList`；首页多一步 `filter !== ENDED` + `slice(0, 3)`。  
- 活动卡字段与徽章尽量复用 `activity-status-badge` / `repair-tag`，避免第三套颜色。

---

## 9. 建议提交切片（实施时）

1. `feat(nav): 公开 mainNav 活动第二位并重编号（N1）`  
2. `feat(home): Hero 报名活动 CTA + 近场活动 1–3（N3/R7）`  
3. `feat(member): 工作台活动管理入口与看板空态（N2/R2）`  
4. `feat(admin): 活动列表状态短标与确认文案（R3/R4）`  
5. `feat(ui): 详情报名/查号同屏 + 壳层动效 token（R5/R6/N4）`  
6. `test/docs: 走查与 PR 说明（T-UX-5）`  

---

## 10. 摘要（给主线）

- **main HEAD**：`95e25e88cbbe9146f0ab544be7ed040bf0c1bb78`（#59 已 merge）。  
- **分支**：`feat/ux-r3` from `origin/main`。  
- **关键落点**：`navigation.ts` / 各页 index、`home.ts`+`Hero`、`MemberDashboard`、`MemberRepairActivityBoard`、`RepairActivityAdminPanel`、`RepairActivityDetail`、`globals.css` token、首页新活动区块。  
- **口径**：无阻塞项；C1–C8 有建议默认。  
- **本文件**：只读调研 + 方案；未改业务代码、未 push、未开 PR。

---

## 附录 A · 仓库内精确落点（对照 `95e25e8`）

| 主题 | 路径 / 符号 |
| --- | --- |
| 公开导航 | `src/config/navigation.ts` → `mainNav`（当前 01/02/03/**05**/06） |
| 首页 CTA | `src/config/home.ts` → `heroActions.repair/docs`；`src/components/home/Hero.tsx` |
| 首页结构 | `src/app/page.tsx`：Hero → Ticker → Process(`#process`) → Docs → Contact |
| 成员导航 | `src/config/member.ts` → `memberNav` / `memberSettingsNav` |
| 成员工作台 | `src/components/member/MemberDashboard.tsx`（hero：`/member/repairs/new` + profile） |
| 成员活动列表/看板 | `src/components/repair-activities/MemberRepairActivityList.tsx`；`MemberRepairActivityBoard.tsx` |
| 公开列表/详情 | `RepairActivityList.tsx`（`PAGE_SIZE=4`）；`RepairActivityDetail.tsx`（报名卡 ⊕ 查号卡纵向） |
| 管理面板 | `src/components/admin/RepairActivityAdminPanel.tsx` + `AdminModal` |
| 管理导航编号 | `src/config/admin.ts` → `ADMIN_SECTION_INDEX` / `adminNavGroups` / `adminSettingsNav` |
| 排序 B | `src/features/repair-activities/repair-activity-sort.ts` → `sortRepairActivitiesForPublicList` |
| 动效 | `src/app/globals.css`：`--d-fast:140ms` / `--d-mid:260ms` + `prefers-reduced-motion` |
| 主题 | `swiss-cobalt`（正常）/ `black-yellow`（深色），`src/config/theme.ts` |
| 图标 | `src/components/ui/Icon.tsx`（SVG，禁 emoji） |
| 确认模式 | 管理删除已用 `AdminModal`；成员 `withdraw` **无**确认 |

**文案现状对照**

- Hero 主按钮现文案为「维修报修」且 `href: ""`（死链）；次要「查看文档」→ handbook。
- 成员看板已有「参加本场」/`attendRequired` / `queueEmpty`，R2 以强化层次与指向为主，而非从零新增。
- 管理列表已有 `registeredCount/capacity` 与 `statusTagClass`，R3 做色与短标收敛。
