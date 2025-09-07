## Components — 列表与命名（Figma）

命名规范：`ComponentName/prop=value,prop=value`；使用 `.` 表示子部件，如 `ChatNode.Header`。

---

### 基础（Atoms）

- Icon/24
- Button
  - variant[primary/secondary/ghost]
  - state[default/hover/pressed/disabled]
- Input
- TextArea
- Badge（含 `ModelBadge`）
- Port
  - type[in/out]
  - state[default/hover/connected]

### 布局（Molecules）

- TopBar
  - density[comfortable/compact]
- LeftToolbar
- RightPanel
- ReactFlowCanvas（仅为容器与网格样式占位）
- Edge（曲线+箭头，hover 加粗）
- MiniMap（P1）
- Toast

### 复合（Organisms）

- ChatNode
  - size[S/M/L]
  - status[idle/running/success/error]
  - selected[true/false]
  - focused[true/false]
  - footer[visible/hidden]
  - 子部件：
    - ChatNode.Header（标题、ModelBadge、Actions）
    - ChatNode.Body（消息区/空态）
    - ChatNode.Footer（Prompt 输入 + 运行按钮）

### 模板（Templates）

- Canvas Template 1440×900
  - TopBar + LeftToolbar + Canvas + 两个 ChatNode（含一条 Edge）

---

### 变量绑定（建议）

- Colors: `--bg`、`--surface`、`--border`、`--primary`、`--success`、`--error`、`--running`
- Radii: `r-xs/sm/md/lg`
- Spacing: `s-4/8/12/16/24/32`
- Shadows: `e1/e2`
- Typography: `label`, `body`, `mono`
