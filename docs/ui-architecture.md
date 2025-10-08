## UI 组件 / 路由 / 状态结构草图（React + Zustand + React Flow）

本草图基于 `prd.md` 与 `issues.md` 的里程碑与优先级，面向 MVP（里程碑 A 为主，B/C 预留）。

### 一、信息架构与主用户流（High-level）

```mermaid
flowchart LR
  A[项目入口 / ProjectHub] --> B[新建或打开项目]
  B --> C[/Canvas 画布/]
  C --> D[创建聊天节点]
  D --> E[连线与上下文传递]
  E --> F[运行节点 / LLM 请求]
  F --> G{结果满意?}
  G -- 是 --> H[保存/导出]
  G -- 否 --> D2[编辑提示/分叉新节点]
  D2 --> F
  C --> S[Settings 设置(API Key/模型)]
```

---

### 二、路由结构（React Router）

```tsx
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  { path: '/', element: <ProjectHubPage /> },
  {
    path: '/project/:projectId',
    element: <CanvasPage />,
    children: [
      // Modal 路由（覆盖层展示）
      { path: 'settings', element: <SettingsModal /> },
      // P1：模板与导出
      { path: 'templates', element: <TemplatesDrawer /> },
    ],
  },
])
```

- `/`：项目中心（最近项目、创建/导入）
- `/project/:projectId`：主画布
- `/project/:projectId/settings`：设置（API Key、默认模型等，Modal 路由）
- `/project/:projectId/templates`：模板抽屉（P1）

---

### 三、核心页面与组件树

```text
<AppShell>
  <TopBar>
    <ProjectTitle /> <SaveIndicator /> <GlobalActions>
      <ExportButton /> <SettingsButton />
    </GlobalActions>
  </TopBar>

  <CanvasLayout>
    <LeftToolbar>
      <NewNodeButton /> <ConnectHint /> <UndoRedo />
    </LeftToolbar>

    <ReactFlowCanvas>
      {GridBackground}
      {MiniMap (P1)}
      {Controls (P1)}
      {ChatNode as nodeTypes.chat}
      {SmartEdge as edgeTypes.default}
    </ReactFlowCanvas>

    <RightPanel>
      <Inspector />          // 选中节点/边属性
      <RunQueuePanel />      // P2 并发/队列
    </RightPanel>
  </CanvasLayout>

  <Toaster />                // 全局状态吐司
  <CommandPalette />          // P1

  <SettingsModal />           // 路由子节点渲染
</AppShell>
```

- 关键组件
  - `AppShell`：页面布局与主题容器
  - `TopBar`：项目名、保存状态、导出/设置入口
  - `ReactFlowCanvas`：包裹 React Flow，注册 `nodeTypes`/`edgeTypes`
  - `ChatNode`：自定义节点（标题、模型徽章、运行/停止、复制、删除、内容区）
  - `LeftToolbar`/`RightPanel`：工具与属性/状态面板
  - `SettingsModal`：API Key、默认模型、语言、代理等

---

### 四、React Flow 类型与集成

```ts
// src/canvas/types.ts
export type NodeStatus = 'idle' | 'running' | 'error' | 'success'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string // markdown
  createdAt: number
}

export interface ChatNodeData {
  title: string
  modelId: string
  prompt: string // 当前提示词
  messages: ChatMessage[] // 历史消息（P1 可虚拟化显示）
  status: NodeStatus
  error?: { code: string; message: string }
}
```

```ts
// src/canvas/register.ts
import { ChatNode } from './nodes/ChatNode'
import { SmartEdge } from './edges/SmartEdge'

export const nodeTypes = { chat: ChatNode } as const
export const edgeTypes = { default: SmartEdge } as const
```

```tsx
// src/pages/CanvasPage.tsx（核心事件桥接）
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  onNodesChange={handleNodesChange}
  onEdgesChange={handleEdgesChange}
  onConnect={handleConnect}
  fitView
/>
```

- 事件处理对接 `Zustand`：
  - `handleNodesChange` → `nodesSlice.applyChanges`
  - `handleEdgesChange` → `edgesSlice.applyChanges`
  - `handleConnect` → `edgesSlice.addEdge`（含循环校验）
  - `handleNodeRun` → `useRunNode(nodeId)`（收集上下游上下文并调度执行）

运行流程要点：

1. 节点触发运行时，通过 `collectUpstreamContext` 获取所有上游节点最后 N 条消息，组装为请求上下文。
2. `useExecutionManager` 将节点加入运行队列，`RuntimeSlice.runNext` 负责调度并支持多节点并发。
3. LLM 请求挂载 `AbortController`，便于 Stop 按钮取消；成功与失败都会写回 `messages/status/error`。
4. 完成后 `RuntimeSlice` 清理 `inFlight`，触发下一任务，保持 UI 状态一致。

---

### 五、Zustand 状态切片（Slices）

目录建议：

```text
src/state/
  createProjectSlice.ts
  createCanvasSlice.ts
  createNodesSlice.ts
  createEdgesSlice.ts
  createRuntimeSlice.ts
  createSettingsSlice.ts
  createUiSlice.ts
  createTemplatesSlice.ts
  store.ts
```

统一 Store：

```ts
// src/state/store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
// 可选：自集成 immer（以 set(state => { ... }) 形式实现）

export interface RootState
  extends ProjectSlice,
    CanvasSlice,
    NodesSlice,
    EdgesSlice,
    RuntimeSlice,
    SettingsSlice,
    UiSlice,
    TemplatesSlice {}

export const useStore = create<RootState>()(
  devtools(
    persist(
      (set, get) => ({
        ...createProjectSlice(set, get),
        ...createCanvasSlice(set, get),
        ...createNodesSlice(set, get),
        ...createEdgesSlice(set, get),
        ...createRuntimeSlice(set, get),
        ...createSettingsSlice(set, get),
        ...createUiSlice(set, get),
        ...createTemplatesSlice(set, get),
      }),
      {
        name: 'canvas-app',
        partialize: s => ({ project: s.project, settings: s.settings }),
      }
    )
  )
)
```

各切片要点：

- `ProjectSlice`
  - `currentProjectId: string | null`
  - `snapshot: ProjectSnapshot | null`（仅持久化 metadata、settings、history、节点/边引用）
  - `deriveSnapshot()`：从 `nodes`、`edges`、`settings`、`canvas` 切片组合保存 payload
  - `hydrateProject(snapshot)`：重置 `nodes/edges/canvas/settings` 到导入状态
  - `newProject() / openProject(file) / saveProject()`（`save` 将写入 `snapshot` 并触发持久化）

- `CanvasSlice`
  - `viewport { x, y, zoom }`、`snapToGrid: boolean`、`selection: ids[]`
  - `history { past[], present, future[] }`、`undo()/redo()`

- `NodesSlice`
  - `nodes: Node<ChatNodeData>[]`
  - `createNode(type: 'chat', position)`、`updateNode(id, draft)`、`duplicateNode(id)`
  - `setNodePosition(id, position)`、`removeNode(id)`
  - `applyNodes(nodes)`：导入项目时批量写入节点数组

- `EdgesSlice`
  - `edges: Edge[]`
  - `addEdge(conn)`、`removeEdge(id)`、`validateNoCycle(source, target)`
  - `applyEdges(edges)`：导入项目时批量写入边数组

- `RuntimeSlice`
  - `queue: RunTask[]`、`inFlight: Record<string, RunTask>`
  - `maxConcurrent`（P0 默认 `Infinity`，P2 可配置）
  - `enqueue(nodeId)`、`dequeue()`、`cancel(taskId)`
  - `setNodeStatus(id, status)`、`setNodeError(id, error)`、`setNodeMessages(id, updater)`
  - `runNext()`：并发调度执行（尊重 `maxConcurrent`，空闲时自动出队）

- `SettingsSlice`
  - `apiKey(enc)`、`defaultModel`、`language`、`proxy`（P1）
  - `setApiKey(key)`（内部 WebCrypto 加密）

- `UiSlice`
  - `modals: { settings: boolean }`、`toasts: Toast[]`、`commandPalette: boolean`

- `TemplatesSlice`（P1）
  - `templates: Template[]`、`applyTemplate(templateId)`

核心类型：

```ts
// src/types/project.ts
export interface ProjectSnapshot {
  id: string
  version: number
  metadata: {
    title: string
    updatedAt: number
  }
  graph: {
    nodes: Array<Node<ChatNodeData>>
    edges: Array<Edge>
    viewport: Viewport
  }
  settings: {
    defaultModel: string
    language: 'zh' | 'en'
  }
  history: unknown // 具体实现见 CanvasSlice（撤销/重做）
}
```

> 保存时只记录 `ProjectSnapshot`；运行时状态仍由各 Slice 管理，避免重复持久化。

---

### 六、服务层与 Hooks（隔离外部能力）

目录建议：

```text
src/services/
  llmClient.ts       // OpenAI 兼容封装（超时/中断/错误分类）
  storage.ts         // IndexedDB + 文件导入导出
  crypto.ts          // WebCrypto API Key 加密/解密
  export.ts          // PNG/Markdown/JSON 导出

src/hooks/
  useRunNode.ts          // 将节点数据 -> 请求参数；写回 messages/status
  useHotkeys.ts          // 快捷键集中处理
  useExecutionManager.ts // 调度并发运行 + 取消

src/lib/
  graph.ts               // collectUpstreamContext、拓扑排序、graph utils
```

示例：

```ts
// src/services/llmClient.ts
export async function createChatCompletion({
  apiKey,
  model,
  messages,
  signal,
}: {
  apiKey: string
  model: string
  messages: { role: string; content: string }[]
  signal?: AbortSignal
}) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
    signal,
  })
  if (!res.ok) throw new Error(`LLM_ERROR_${res.status}`)
  return res.json()
}
```

```ts
// src/lib/graph.ts
export function collectUpstreamContext({
  nodeId,
  nodes,
  edges,
  limit = 4,
}: CollectContextParams): ChatMessage[] {
  const visited = new Set<string>()
  const stack = [nodeId]
  const result: ChatMessage[] = []

  while (stack.length) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)

    const upstreamIds = edges
      .filter(edge => edge.target === current)
      .map(edge => edge.source)

    upstreamIds.forEach(id => {
      const upstream = nodes.find(n => n.id === id)
      if (upstream?.data.messages.length) {
        result.push(...upstream.data.messages.slice(-limit))
      }
      stack.push(id)
    })
  }

  return result.reverse()
}
```

```ts
// src/hooks/useExecutionManager.ts
export function useExecutionManager() {
  const { enqueue, dequeue, inFlight, maxConcurrent, runNext } = useStore(state => ({
    enqueue: state.enqueue,
    dequeue: state.dequeue,
    inFlight: state.inFlight,
    maxConcurrent: state.maxConcurrent,
    runNext: state.runNext,
  }))

  const execute = useCallback(
    async (nodeId: string) => {
      enqueue(nodeId)
      runNext()
    },
    [enqueue, runNext]
  )

  return { execute, inFlight, maxConcurrent }
}
```

---

### 七、可访问性与快捷键

- 焦点管理：节点卡片可聚焦；操作按钮有 `aria-label` 与键盘可达
- 快捷键（P0）：
  - `N` 新建节点、`⌘/Ctrl + Enter` 运行、`⌘/Ctrl + D` 复制、`Delete` 删除
  - `⌘/Ctrl + Z / Shift + Z` 撤销/重做
- 文本与对比度：遵循 WCAG AA，对暗色模式预留变量

---

### 八、性能策略（与 P1/P2 对齐）

- 渲染虚拟化：长消息列表虚拟滚动（P1）
- Store 选择器：使用 `useStore(selector, shallow)` 减少重渲染
- 事件去抖：拖拽/缩放/输入变更去抖与批量更新
- 节点内容分层：节点外框与消息内容分层渲染，降低 Flow 重绘压力

---

### 九、测试建议

- 单元测试：切片 reducer、`validateNoCycle`、`useRunNode` 成功/失败分支
- E2E：创建节点→连线→运行→保存→重开还原完整

---

### 十、落地顺序映射里程碑

- 里程碑 A（P0）：`AppShell`/`TopBar`/`ReactFlowCanvas`/`ChatNode`/`SettingsModal`/Zustand 核心切片/保存打开/运行请求
- 里程碑 B（P1）：`MiniMap`/`Controls`/模板/Markdown 渲染/导出/全文搜索/虚拟化
- 里程碑 C（P2）：主题切换/并发队列/中断/版本快照/命令面板
