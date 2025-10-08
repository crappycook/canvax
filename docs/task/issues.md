# Milestone A · Canvas MVP

## Phase 1 · App Skeleton & State
- [x] 初始化应用外壳与路由结构\
      创建 `AppShell`, `ProjectHubPage`, `CanvasPage`, `SettingsModal` 框架，配置 `createBrowserRouter`（`/`, `/project/:projectId`, `/project/:projectId/settings`）。\
      ✅ 验证：在开发环境访问三个路由，确保 modal 路由可以在同一路径下覆盖渲染。
- [x] 实现统一 Zustand Store 与切片\
      按 `docs/ui-architecture.md` 定义完成 `createProjectSlice` 等切片，支持 `deriveSnapshot`、`hydrateProject`、`applyNodes/Edges`。\
      ✅ 验证：在 devtools 中看到各切片的初始状态；调用 `hydrateProject` 后节点/边与视图同步更新。
- [x] 封装基础服务层\
      实现 `llmClient`, `storage`, `crypto`, `export` 空壳（仅 MVP 必需方法）、`collectUpstreamContext` 图算法与 `useExecutionManager` 调度 hook。\
      ✅ 验证：单元测试覆盖 `collectUpstreamContext`（拓扑遍历 & 去重）与 `storage` fallback 逻辑。

## Phase 2 · Project Hub & Persistence
- [x] IndexedDB 项目存储与回退方案\
      在 `storage` 内实现 IndexedDB 读写，失败时降级为 File System 导入/导出；注入到 ProjectStore。\
      ✅ 验证：新建项目→保存→刷新→自动恢复；关闭 IndexedDB（DevTools）后仍可导出/导入 JSON。
- [x] Project Hub UI\
      完成最近项目列表、创建、打开、删除入口，显示 `snapshot.metadata`。\
      ✅ 验证：交互均可通过键盘操作，空状态展示引导。

## Phase 3 · Canvas Runtime Loop
- [ ] React Flow Canvas 基础集成\
      搭建 `ReactFlowCanvas` 组件，注册 `nodeTypes/edgeTypes`，实现 `handleNodesChange/EdgesChange/Connect` 与 `validateNoCycle`。\
      ✅ 验证：新增节点、连线、撤销、重做；检测自环时弹出 toast。
- [ ] ChatNode UI 与动作\
      构建节点标题区、模型选择、Prompt 编辑器、消息区、运行/停止/复制/删除按钮，处理焦点与快捷键。\
      ✅ 验证：节点缩放时布局不破坏；键盘可聚焦控制条。
- [ ] 上下文收集 + LLM 调度链路\
      将 `useRunNode` 与 `useExecutionManager` 接入：运行节点前调用 `collectUpstreamContext`，生成 LLM 请求（含 Abort 支持），写回 `messages/status/error`。\
      ✅ 验证：并行运行两个节点不会互相阻塞；Stop 能即时终止请求并恢复 `idle`。
- [ ] 错误态与重试\
      统一处理 401/429/网络错误，节点内展示错误条并支持一键 Retry。\
      ✅ 验证：mock 失败响应时，错误信息可读、retry 后恢复正常。

## Phase 4 · Settings, Persistence & UX Polish
- [ ] 设置 Modal + WebCrypto\
      实现 API Key 加密存储、默认模型/语言配置，缺省时阻止运行并提示。\
      ✅ 验证：保存后密钥以密文写入存储；清除设置会同步画布状态。
- [ ] 自动保存与状态指示器\
      在 `TopBar` 添加保存按钮、自动保存（节流）、`SaveIndicator`。\
      ✅ 验证：手动保存触发 toast；有未保存更改时显示 `dirty` 状态。
- [ ] 快捷键与 A11y 巡检\
      使用 `useHotkeys` 集中监听 N/⌘↵/⌘D/Delete/撤销/重做，补全 aria-label 与焦点样式。\
      ✅ 验证：通过键盘完成创建→连线→运行→保存环节；对比度达到 WCAG AA。

## Phase 5 · Quality Gates
- [ ] 编写关键逻辑单元测试\
      覆盖 `validateNoCycle`, `collectUpstreamContext`, `RuntimeSlice.runNext`, `ProjectSlice.deriveSnapshot/hydrateProject`。\
      ✅ 验证：`pnpm test`（Vitest）在 CI & 本地通过。
- [ ] MVP 手动验证清单\
      输出并执行「创建→连线→运行→停止→保存→重开」流程 checklist，记录发现的问题。\
      ✅ 验证：Checklist 文档存放在 `docs/task/milestone-a-checklist.md`。

---

# Milestone B · P1 Enhancements

## Phase 1 · Canvas UX
- [ ] Markdown 渲染与消息虚拟化\
      引入 `@tanstack/react-virtual`（或同等库）渲染长列表，整合 `remark`/`rehype` 处理 Markdown。\
      ✅ 验证：100 条消息仍保持 >55 FPS；代码块高亮正确。
- [ ] MiniMap & Controls\
      启用 React Flow `MiniMap`、`Controls`，尊重当前主题颜色，支持缩放按钮。\
      ✅ 验证：迷你地图节点位置同步；快捷键缩放与控件缩放一致。

## Phase 2 · 内容导出
- [ ] PNG 导出服务\
      使用 `html-to-image`（或 canvas API）将当前视图导出为 PNG，含背景网格。\
      ✅ 验证：导出图片在 4K 画布下仍清晰；文件下载命名含项目名与时间戳。
- [ ] Markdown & JSON 导出/导入\
      将节点消息生成为 Markdown；JSON 导入调用 `hydrateProject`。\
      ✅ 验证：导出 Markdown 段落与节点标题对应；导入 JSON 后画布完全还原。

## Phase 3 · 模板与快速操作
- [ ] 模板抽屉\
      设计模板数据结构，支持创建/应用模板（将模板节点合并到当前画布）。\
      ✅ 验证：应用模板不会覆盖现有节点 ID；撤销可恢复应用前状态。
- [ ] Command Palette\
      集成命令面板（基于 `cmdk` 或自研），暴露创建节点、运行所选节点、打开设置等动作。\
      ✅ 验证：⌘K 打开面板；输入关键词可筛选并执行命令。

---

# Milestone C · P2 Roadmap Prep
- [ ] 并发限制与运行队列 UI\
      在 `RuntimeSlice` 新增 `maxConcurrent` 配置与队列可视化列表。\
      ✅ 验证：设置 `maxConcurrent=1` 时，其余运行任务进入排队状态。
- [ ] 中断恢复与版本快照\
      支持节点运行中断记录；实现项目版本快照（保存时追加历史版本）。\
      ✅ 验证：选择旧快照可回滚画布；中断节点提示可继续/放弃。
- [ ] 主题切换与全局样式\
      实装亮/暗主题切换，抽象 Tailwind 主题变量。\
      ✅ 验证：切换主题不闪烁，保存后记住选择。
- [ ] 全文搜索与节点定位\
      提供搜索框，支持按标题/消息内容匹配并聚焦对应节点。\
      ✅ 验证：搜索命中时 canvas 自动平滑定位；未命中给出提示。
