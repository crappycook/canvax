## Canvas / Chat Node Wireframe（Flowith 风格 · MVP）

参考：`prd.md`、`docs/ui-architecture.md`，以及截图 `canvas1.png`、`canvas2.png`（见 `.cursor/task/`）。本文件用于指导 Figma 组件搭建与前端实现的低保真布局与交互规范。

---

### 设计 Tokens（供 Figma 变量与代码共用）

- 基准栅格：8px，画布网格 16px 间距、1px 线，10% 透明度
- 圆角：xs=6、sm=8、md=12（节点外框）、lg=16
- 阴影：e1=0 1 2 rgba(0,0,0,0.05)、e2=0 4 12 rgba(0,0,0,0.08)
- 颜色（命名示例）：
  - Layer/Background: `--bg: #0B0C0F`（暗）/ `#F7F8FA`（亮）
  - Layer/Surface: `--surface: #111318`（暗）/ `#FFFFFF`（亮）
  - Border/Default: `--border: #2A2E37`
  - Brand/Primary: `--primary: #6E6BFF`
  - Info/Running: `--running: #7AA2F7`
  - Success: `--success: #22C55E`
  - Error: `--error: #F43F5E`

---

### 画布布局（AppShell → CanvasPage）

- 顶部栏 TopBar：高度 56，左右内边距 16/24（sm/md+），内容：项目名、保存状态、导出、设置
- 左侧工具栏 LeftToolbar：宽 56（icon 24），含：新建节点、连线提示、撤销重做
- 右侧属性面板 RightPanel：默认收起，展开宽 280，显示选中节点属性（标题、模型、参数）
- 主画布 ReactFlow：充满剩余空间；网格背景；吸附开启；缩放范围 10%–400%
- 迷你地图/控制（P1）：右下角悬浮；与 Flowith 风格贴边圆角卡片

低保真示意（非比例）：

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ TopBar (56)    Project • Saved ⬤      Export  Settings (⚙)              │
├──╴LeftToolbar(56)╶──────────────────── Canvas / ReactFlow ───────────────┤
│  •  New Node                                                             │
│  •  Connect hint                                                         │
│  •  Undo / Redo                                                          │
│                                                                          │
│   [ChatNode M]           [ChatNode M  running]       [ChatNode S]        │
│        ↘──────────────→        ↘──────────────→                          │
│                                                                          │
│                                                     MiniMap (P1)         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Chat 节点结构（NodeType: `chat`）

- 外框：圆角 md=12、1px 边框；默认 e1 阴影；选中时边框 2px `--primary`
- 尺寸（可拖拽）：
  - S: 320 × 260 ；M: 420 × 320（默认）；L: 560 × 420
- Header（48 高）：
  - 左：标题（可编辑，单行省略）
  - 中：模型徽章（如 `gpt-4o`）
  - 右：操作按钮组（Run/Stop、Duplicate、Delete、More）。间距 8
- Body 内容区（自适应高度，可滚动）：
  - 空态：提示“编辑提示词并运行，或连接上游节点”
  - 消息：卡片或气泡（P1 Markdown 渲染）
- Footer（56 高，可折叠）：
  - 多行文本框（提示词/追问），`⌘/Ctrl+Enter` 运行；按钮：Run（主要）/ Stop（运行时）
- 端口（Ports）：
  - 入端口：左侧中线位置，可多条连接
  - 出端口：右侧中线位置，单条向外
  - 状态：default / hover / connected；命中热区 16×16
  - 可达性：端口 24×24 的可点击外环，辅助线对齐提示

节点状态与可视样式：

- idle：边框 `--border`，Run 按钮可用
- running：顶部出现 2px 进度条（`--running` 渐变），光晕动画；Stop 可用
- success：边框 `--success`（浅），显示最近一次耗时/模型 tooltip
- error：顶端错误条，`--error` 背景与说明；提供 Retry 按钮
- selected/focused/dragging：外框描边 + 轻微提升阴影 e2
  - resizing：显示四角与边中点手柄；最小尺寸 S 不可再缩小

ASCII 结构：

```text
┌─ Header (48) ──────────────────────────────────────────────┐
│  Title       [ModelBadge]                       ⏵ ⎘ 🗑 ⋯   │
├─ Body (auto, scroll) ──────────────────────────────────────┤
│  • Messages / Empty state                                 │
├─ Footer (56) ──────────────────────────────────────────────┤
│  [  Prompt textarea ...                    ]   Run / Stop  │
└────────────────────────────────────────────────────────────┘
  ◉ in                                        out ◉
```

---

### 关键交互（MVP）

- 新建节点：左栏按钮或快捷键 `N` → 在视窗中心放置 `ChatNode M`
- 拖拽与缩放：空格/中键平移；滚轮缩放；吸附对齐线出现时磁吸
- 连线：从出端口拖到目标入端口；循环连接阻止并提示
- 运行：节点内 `⌘/Ctrl + Enter` 或点击 Run；运行中可 Stop；失败显示错误并可 Retry
- 复制/删除：`⌘/Ctrl + D` 复制，`Delete` 删除
- 保存/打开：全局层面；导出 PNG（P0），Markdown/JSON（P1）
- 框选/多选（P1）：按住 `Shift` 拖拽出现选择框；移动保持相对位置
- 迷你地图（P1）：点击跳转；滚轮缩放同步

快捷键总览（与 `docs/ui-architecture.md` 对齐）：

- `N` 新建节点；`⌘/Ctrl + Enter` 运行；`⌘/Ctrl + D` 复制；`Delete` 删除
- `⌘/Ctrl + Z` 撤销；`⌘/Ctrl + Shift + Z` 重做

---

### Figma 组件结构与命名

- 库名：`Canvas System`（建议发布为团队库）
- 组件：
  - `TopBar`（variant: density[comfortable/compact]）
  - `LeftToolbar`（items 可交换）
  - `RightPanel`（variant: open[true/false]）
  - `ReactFlowCanvas`（网格背景作为样式）
  - `ChatNode`（核心）
    - variants：
      - size[S/M/L]；status[idle/running/success/error]
      - selected[true/false]；focused[true/false]
      - footer[visible/hidden]
    - 部件：`Header`, `Body`, `Footer`, `PortIn`, `PortOut`, `Actions`
  - `Port`（独立原子组件）：type[in/out]、state[default/hover/connected]
  - `Edge`（样式规格组件）：曲线、箭头、hover 加粗
  - `MiniMap`（P1）：variant: visible[true/false]
  - `Toast`：状态 info/success/error
- 样式变量：颜色、圆角、阴影、间距（采用上文 Tokens 名称）
- 示例图层命名：`ChatNode/size=M,status=running,selected=true`

组装关系（与代码映射）：

```text
ChatNode (component)
  ├─ Header → React: <NodeHeader />
  ├─ Body   → React: <NodeBody />
  ├─ Footer → React: <NodePrompt />
  ├─ PortIn / PortOut → React Flow Handles
  └─ Actions → Run/Stop, Duplicate, Delete
```

---

### 与前端实现的对照（关键 props）

```ts
// ChatNode props（建议）
export interface ChatNodeProps {
  id: string
  title: string
  modelId: string
  status: 'idle' | 'running' | 'error' | 'success'
  messagesCount: number
  prompt: string
  onChangeTitle(value: string): void
  onChangePrompt(value: string): void
  onRun(): void
  onStop(): void
  onDuplicate(): void
  onDelete(): void
}
```

---

### 可访问性（A11y）

- 节点外框可聚焦（`tabindex=0`），`aria-label="Chat node: {title}"`
- 操作按钮具名 `aria-label`；Run/Stop 使用 `aria-pressed` 表示切换
- 端口具备可视与文本提示：`aria-label="output port" / "input port"`
- 键盘：方向键移动焦点；`Enter` 打开标题编辑；`Esc` 退出
- 对比度：遵循 WCAG AA，错误/成功状态颜色满足文本对比
- 动画与动效：运行进度条动效 < 3/秒；提供“减少动效”媒体查询适配
- 文本缩放：布局在 200% 放大下仍可操作（最小可点击 24×24）
- 屏幕阅读顺序：Header → Body → Footer → Ports（逻辑顺序与视觉一致）

---

### 交付指引

1. 在 Figma 新建文件《Canvas System》并建立变量（颜色/圆角/阴影/间距）
2. 先搭建 `ChatNode` 组件与变体，再拼装画布模板（TopBar/LeftToolbar/Canvas/RightPanel）
3. 用 `canvas1.png`/`canvas2.png` 作为视觉参考，保持留白、圆角与卡片层级风格
4. 输出页面：
   - 画布模板（Desktop 1440×900）
   - 节点组件面板（展示全部变体）
   - 交互注释页（标注快捷键与状态切换）
5. Figma 导入与参考：见 `docs/figma/README.md`、`docs/figma/components.md`、`docs/figma/tokens.json`；高保真示例 `docs/figma/hifi-example.svg`

---

### 附录：节点状态示意（低保真）

```text
Idle:     ┌ Node ────────────────────────────┐
          │  Title [model]        ▷ ⎘ 🗑 ⋯   │
          └──────────────────────────────────┘

Running:  ┌ Node ────────────────────────────┐
          │▔▔▔▔ progress bar ▔▔▔▔▔▔▔▔▔▔▔▔  │
          │  Title [model]        ■ ⎘ 🗑 ⋯   │
          └──────────────────────────────────┘

Error:    ┌ Node ────────────────────────────┐
          │ Error • Rate limit. Retry        │
          │  Title [model]        ▷ ⎘ 🗑 ⋯   │
          └──────────────────────────────────┘
```
