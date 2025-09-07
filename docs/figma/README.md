## Canvas System — Figma 组件库草图（可导入说明）

目标：基于 `docs/wireframes/flowith-wireframe.md` 搭建一份可发布的 Figma 组件库草图，包含变量（Tokens）、核心组件与模板，以及一页高保真示例。

---

### 目录与页面结构（建议）

Figma 文件页（Pages）：

1. 00 Variables & Styles（导入 tokens、生成变量与样式）
2. 01 Components（所有基础与复合组件）
3. 02 Templates（画布模板、示例组合）
4. 03 Hi‑Fi Example（高保真示例页面）

---

### 导入设计 Tokens（Figma Variables）

文件：`tokens.json`

步骤：

1. 打开 Figma → Variables 面板 → 在 Collection 中创建「Canvas System」
2. 选择 `Import variables` → 选择本仓库 `docs/figma/tokens.json`
3. Colors / Radii / Spacing / Shadows / Typography 将导入为变量；发布到 Team Library

备注：若插件要求 W3C Design Tokens 结构，可使用 Style Dictionary 或 Figma Tokens 插件按需转换；本文件字段与 `wireframe` 文档对齐。

---

### 组件库结构（Components）

详见 `components.md`，核心组件包含：

- TopBar、LeftToolbar、RightPanel、ReactFlowCanvas（容器）
- ChatNode（变体：size/status/selected/focused/footer）
- Port、Edge、MiniMap、Toast
- Button、Icon、Badge、Input/TextArea、ModelBadge

发布建议：

- 使用 Auto Layout + 约束完成自适应
- 变量驱动颜色/圆角/阴影/间距
- 统一命名：`Component/variant=value,...`，如 `ChatNode/size=M,status=running`

---

### 模板与示例

- 画布模板（1440×900）：TopBar + LeftToolbar + ReactFlowCanvas + 两个 `ChatNode` + Edge
- 高保真示例：参见 `hifi-example.svg`（可直接拖入 Figma 作为参考）

---

### 发布为团队库（Library）

1. 在 Assets 面板启用 `Publish`，勾选 Components 与 Styles/Variables
2. 命名库为「Canvas System」并发布；其他文件可通过 `Assets → Libraries` 启用引用

---

### 与前端实现的映射

- ChatNode 的变体状态映射到 React props：`status`、`selected`、`footerVisible`
- Port / Edge 样式与 React Flow 中的 `Handle`/`EdgeTypes` 映射一致
- Tokens → Tailwind/样式变量：建议导出 CSS 变量或 Style Dictionary 编译
