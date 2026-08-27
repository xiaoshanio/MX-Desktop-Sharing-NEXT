# 改造计划：房间→频道，内部房间，播放器集成，UI 修复

## 概念重命名

当前的「房间」在外层变成「频道」概念：
- 侧栏导航从 "房间" 改为 "频道"
- `/dashboard` 页面标题从 "我加入的房间" 改为 "我加入的频道"
- 创建按钮/弹窗从 "创建房间" 改为 "创建频道"
- 卡片文案统一用 "频道"
- 频道内的设置从 "房间设置" 改为 "频道设置"

频道管理员（现在的 owner）可以在频道设置内创建和管理「房间」（子空间）。

## 具体改动

### 1. 外层「房间」→「频道」文案替换

**涉及文件：**
- `src/i18n/messages/zh-CN.ts`（和其他语言文件中对应的键值）
- `src/components/AppShell.tsx`（导航项标签 `shell.nav.rooms` → "频道"）
- `src/app/dashboard/DashboardClient.tsx`（标题、副标题文案）

改动范围：纯 i18n 文案层面，把 `dash.heading`、`dash.title`、`dash.subtitle`、`dash.create` 等键的值从"房间"替换为"频道"。侧栏 icon 名 `rooms` 保持不变（只改 label）。

### 2. `/dashboard` 页面布局调整

**需求：**
- 删除 `dash.title`（"我加入的房间"）行 header 中的 `dash.subtitle`（"点卡片直接进入。每个房间绑定一个 LiveKit 节点，媒体流量只走那个节点。"）
- 删除 header 中的 "刷新" 按钮
- 删除 header 中的 "创建房间" 按钮
- 把 "创建频道" 按钮移到搜索框右侧（搜索框和按钮在同一行，居中展示）
- 搜索框加宽（从 `620px` 增加到约 `720px`）
- 房间卡片 grid 间距加大（从 `var(--mx-space-lg)` 增大到 `var(--mx-space-xl)`）

**涉及文件：**
- `src/app/dashboard/DashboardClient.tsx` — 调整 `RoomFinder` 组件，在搜索框右侧加一个"创建频道"按钮；删除 `<header className="mx-section__header">` 区块
- `src/styles/pages.css` — `.mx-finder__box` 宽度改大；`.mx-roomgrid` gap 改大

### 3. 频道内部房间系统

**当前结构：** 进入频道（`/room/[code]`）后直接看到大屏 + 左侧成员栏。

**目标结构：** 进入频道后默认**不进入任何房间**，需要管理员先创建房间。每个房间自带一个同步播放器。

这是一个较大的架构改动。方案：

- 频道页面增加一个"房间列表"视图（当没有选中任何房间时显示）
- 管理员在频道设置内可以创建/管理房间
- 选中一个房间后才进入工作区（大屏 + 左侧成员栏 + 同步播放器）
- 每个房间默认绑定一个同步播放器（不再需要手动创建）

**数据层面：** 在现有 `sync_players` 表的基础上扩展，或新建一个 `channel_rooms` 概念表。由于当前的 DB schema 中一个 room 已经有了完整的成员、token、ingress 体系，最简方案是：

> 频道 = 现有的 room；频道内的"房间" = 现有的 sync_player（每个 sync_player 已经自带播放器）

这样改动最小。频道管理员创建的"房间"就是创建一个 sync_player，进入"房间"就是选中那个 sync_player 的画面。

### 4. Stage 区域增加播放地址输入

**需求：** 在「无信号·房内 1 人·共享我的屏幕」这一行的中间位置，增加"输入播放地址 + 播放按钮"。

**实现：**
- 在 `Stage` 组件的 `mx-stage__bar` 中间（在"房内 N 人"和"共享我的屏幕"之间），加一个内联输入框 + 播放按钮
- 点击播放时调用 sync_player 的 API 或者创建一个临时播放器

**涉及文件：**
- `src/app/room/[code]/RoomClient.tsx` — `Stage` 组件内部
- `src/styles/room.css` — 新增 `.mx-stage__url` 样式

### 5. 屏幕共享全屏支持

**需求：** 分享屏幕的播放器要支持全屏观看。

**实现：**
- 在 `VideoTrack` 旁边（或 tile 上）加一个全屏按钮
- 点击后 `requestFullscreen()` 到 `.mx-stage__tile` 或整个 `.mx-stage__grid`

**涉及文件：**
- `src/app/room/[code]/RoomClient.tsx` — `Stage` 组件的每个 tile 加全屏按钮
- `src/styles/room.css` — 全屏按钮样式

### 6. 左侧用户卡片显示"分享屏幕中"状态

**需求：** 用户开启共享屏幕后，左侧用户卡片显示"分享屏幕中"文字，点击可切换到该用户的屏幕画面。

**当前实现：** `ParticipantRail` 已经有 `hasVideo` 标记（亮绿点），点击卡片已经会切换 `selected`。需要：
- 把绿点旁边加上"分享屏幕中"文字
- 确保点击行为正确（已经实现：`onSelect` 切换 `selected`）

**涉及文件：**
- `src/components/room/ParticipantRail.tsx` — `RailCard` 组件增加文字标签

### 7. 删除侧栏图标点击动画

**需求：** 后台的左侧栏点击为什么图标会动，删除这个动画。

**分析：** `introSidebar` 函数（`src/lib/shell-motion.ts`）在侧栏首次挂载时做了一个"一项项落进来"的 stagger 动画。这是进场动画不是点击动画。点击导航项时图标会"动"可能是选中指示条的 `moveIndicator` 滑动，但那是指示条在动，不是图标。

根据代码，sidebar 的点击动画应该是 `moveIndicator` 里的 `gsap.to(bar, {...})` 补间。但用户说的"图标会动"更可能是 `introSidebar` 中 `gsap.from` 对 `.mx-sidebar__item` 的动画残留，或者是切换页面时 `moveIndicator` 带动了视觉感知。

**方案：** 删除 `introSidebar` 中对 sidebar items 的进场动画。保留 `moveIndicator`（选中指示条滑动）因为那是 UX 反馈，但如果用户确认不要，一并删除。

**涉及文件：**
- `src/lib/shell-motion.ts` — 删除 `introSidebar` 函数体中的 `gsap.from` 调用
- `src/components/AppShell.tsx` — 删除 `introSidebar(sidebarRef.current)` 调用

## 执行顺序

1. 删除侧栏动画（最简单，马上可验证）
2. Dashboard 布局调整（搜索框居中加宽、创建按钮移到搜索框右侧、删除 header 内容、卡片间距加大）
3. 文案替换（房间→频道）
4. Stage 区域增加播放地址输入 + 全屏按钮
5. 左侧卡片"分享屏幕中"文字
6. 频道内部房间系统（最大的改动，需要进一步确认细节）

## 需确认

关于第 3 点（频道内部房间系统）：这是一个较大的架构改动，涉及新的 DB 表/字段、新的 API 路由、新的 UI 页面。建议先完成 1-5 的 UI 改动，然后单独讨论房间系统的设计。
