# Implementation Plan

- [x] 1. 增强数据模型和类型定义
  - 更新 `ChatNodeData` 接口，添加 `createdAt`、`sourceNodeId` 和 `nodeType` 字段
  - 修改 `ChatMessage` 接口，将 `timestamp` 重命名为 `createdAt`，添加 `metadata` 字段
  - 创建 `NodeErrorType` 和 `NodeError` 类型定义
  - _Requirements: 1.1, 1.8, 3.2, 5.1_

- [x] 2. 实现节点类型判断逻辑
  - 在 `src/canvas/nodes/` 创建 `nodeTypeUtils.ts` 工具文件
  - 实现 `getNodeType` 函数，根据节点数据和边连接判断节点类型（input/response/hybrid）
  - 实现 `isInputNode`、`isResponseNode`、`isHybridNode` 辅助函数
  - 使用 `useMemo` 优化节点类型计算性能
  - _Requirements: 1.7, 1.8, 5.1, 5.2_

- [x] 3. 重构 ChatNode 组件架构
- [x] 3.1 拆分 ChatNode 为多个子组件
  - 创建 `InputNodeContent.tsx` 组件，包含 Prompt 编辑器、模型选择器和执行按钮
  - 创建 `ResponseNodeContent.tsx` 组件，包含只读消息展示和状态指示器
  - 创建 `HybridNodeContent.tsx` 组件，结合输入和响应功能
  - 创建 `NodeStatusBadge.tsx` 组件，显示节点状态（idle/running/success/error）
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 5.1_

- [x] 3.2 更新主 ChatNode 组件
  - 修改 `ChatNode.tsx`，使用 `getNodeType` 判断节点类型
  - 根据节点类型条件渲染对应的内容组件
  - 更新节点图标，输入节点显示 `Edit3`，响应节点显示 `MessageSquare`
  - 添加节点类型相关的 CSS 类名用于视觉区分
  - _Requirements: 1.7, 1.8, 5.5, 5.6_

- [x] 4. 增强 ExecutionManager 支持自动创建响应节点
- [x] 4.1 实现响应节点创建逻辑
  - 在 `useExecutionManager.ts` 中创建 `createResponseNode` 辅助函数
  - 实现自动计算响应节点位置（输入节点右侧 300px）
  - 实现自动生成响应节点标题（"Response from [输入节点标题]"）
  - 实现自动创建连接边
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 4.2 更新 executeNode 方法
  - 在执行前检查输入节点是否已有下游连接
  - 如果没有下游节点，调用 `createResponseNode` 创建新节点
  - 如果有下游节点，选择最近创建的节点作为响应目标
  - 将 LLM 响应写入响应节点而非输入节点
  - 执行成功后清空输入节点的 prompt 字段
  - _Requirements: 2.4, 2.5, 2.6, 4.1, 4.2_

- [x] 5. 实现 InputNodeContent 组件
  - 渲染模型选择器（ModelSelector）
  - 渲染 Prompt 编辑器（PromptEditor），支持 Enter 键快捷执行
  - 渲染执行/停止按钮，根据 `isRunning` 状态切换
  - 显示 API Key 缺失警告（当 `requiresApiKey` 为 true）
  - 禁用状态处理：运行时禁用编辑器和模型选择器
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6. 实现 ResponseNodeContent 组件
- [x] 6.1 实现基础响应展示
  - 创建消息展示区域，使用只读模式
  - 实现加载状态显示（Loader 动画 + "Generating..." 文本）
  - 实现成功状态显示（展示最新的 assistant 消息）
  - 实现错误状态显示（错误信息 + Retry 按钮）
  - _Requirements: 3.1, 3.2, 3.6, 3.7_

- [x] 6.2 集成 Markdown 渲染
  - 安装并配置 Markdown 渲染库（如 `react-markdown` 或 `marked`）
  - 实现代码块语法高亮（使用 `prism` 或 `highlight.js`）
  - 支持列表、链接、表格等常见 Markdown 元素
  - 添加自定义样式确保渲染内容与设计系统一致
  - _Requirements: 3.2_

- [x] 6.3 实现"Continue Conversation"功能
  - 添加"Continue Conversation"按钮到响应节点底部
  - 点击按钮时，将响应节点转换为输入节点（添加空 prompt 字段）
  - 保留原有的 assistant 消息作为上下文
  - 更新节点类型为 hybrid
  - _Requirements: 3.4, 3.5_

- [x] 7. 优化上下文传递机制
  - 更新 `collectUpstreamContext` 函数，确保按拓扑顺序收集消息
  - 实现消息去重逻辑，避免重复的上下文
  - 在构建 LLM 请求时，正确组合上游上下文和当前 prompt
  - 添加上下文完整性检查，如果上游节点有错误状态则警告用户
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. 实现节点状态视觉反馈
- [x] 8.1 创建状态样式系统
  - 在 `src/canvas/nodes/nodeStyles.css` 创建节点状态样式
  - 实现 idle 状态样式（灰色边框）
  - 实现 running 状态样式（蓝色脉冲动画边框）
  - 实现 success 状态样式（绿色边框）
  - 实现 error 状态样式（红色边框 + 红色背景）
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8.2 实现 NodeStatusBadge 组件
  - 创建状态徽章组件，显示当前节点状态
  - 为不同状态使用不同的图标和颜色
  - 添加 tooltip 显示状态详细信息
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

- [x] 8.3 更新节点图标系统
  - 为输入节点添加 `Edit3` 图标
  - 为响应节点添加 `MessageSquare` 图标
  - 在节点头部显示对应图标
  - _Requirements: 5.5, 5.6_

- [x] 9. 实现错误处理和重试机制
- [x] 9.1 创建错误类型系统
  - 在 `src/types/errors.ts` 定义 `NodeErrorType` 枚举
  - 定义 `NodeError` 接口，包含 type、message、retryable 等字段
  - 实现 `formatError` 函数，将各种错误转换为 `NodeError` 格式
  - _Requirements: 3.7_

- [x] 9.2 实现错误显示组件
  - 创建 `ErrorDisplay.tsx` 组件
  - 显示错误图标、错误消息和错误类型
  - 为可重试的错误显示 Retry 按钮
  - 为 API Key 错误提供"Go to Settings"快捷链接
  - _Requirements: 3.7_

- [x] 9.3 实现重试逻辑
  - 在响应节点的 Retry 按钮点击时，重新执行上游输入节点
  - 清除响应节点的错误状态
  - 保留原有的用户消息作为上下文
  - _Requirements: 3.7_

- [ ] 10. 实现项目迁移系统
- [ ] 10.1 创建迁移逻辑
  - 在 `src/services/migration.ts` 创建迁移服务
  - 实现 `migrateProjectToV2` 函数，检测旧格式项目
  - 实现节点拆分逻辑：将包含多条消息的节点拆分为输入-响应节点对
  - 保留原有的边连接，创建新的输入-响应连接边
  - 生成迁移报告，记录迁移的节点数量和变更
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 10.2 创建迁移 UI
  - 创建 `MigrationDialog.tsx` 组件
  - 显示迁移报告和变更摘要
  - 提供"Migrate"和"Cancel"按钮
  - 显示迁移警告和错误信息（如果有）
  - _Requirements: 6.3_

- [ ] 10.3 集成迁移流程
  - 在项目加载时检测版本号
  - 如果版本号 < 2，触发迁移对话框
  - 用户确认后执行迁移并保存新格式
  - 迁移失败时保留原始数据并提示用户
  - _Requirements: 6.1, 6.4_

- [x] 11. 更新 NodesSlice 状态管理
  - 在 `createNodesSlice.ts` 中添加 `convertNodeToInput` 方法
  - 添加 `getDownstreamNodes` 方法，获取节点的所有下游节点
  - 添加 `getUpstreamNodes` 方法，获取节点的所有上游节点
  - 更新 `addNode` 方法，自动设置 `createdAt` 时间戳
  - _Requirements: 2.1, 2.2, 3.4, 4.1_

- [x] 12. 更新 EdgesSlice 状态管理
  - 在 `createEdgesSlice.ts` 中添加 `addEdge` 方法的自动 ID 生成
  - 确保边创建时包含时间戳
  - 添加 `getEdgesBySource` 和 `getEdgesByTarget` 辅助方法
  - _Requirements: 2.2, 2.3_

- [x] 13. 性能优化
  - 在 `getNodeType` 函数中使用 `useMemo` 缓存计算结果
  - 在 `InputNodeContent` 中对 prompt 更新使用防抖（300ms）
  - 为 `ResponseNodeContent` 的长消息实现虚拟滚动（使用 `@tanstack/react-virtual`）
  - 使用 `React.memo` 包裹所有节点子组件
  - _Requirements: 3.2_

- [x] 14. 可访问性增强
- [x] 14.1 实现键盘导航
  - 在 PromptEditor 中支持 Enter 键执行（Shift+Enter 换行）
  - 在节点内实现 Tab 键导航
  - 在运行时支持 Escape 键取消执行
  - _Requirements: 1.3_

- [x] 14.2 添加 ARIA 标签
  - 为响应节点添加 `role="article"` 和 `aria-label`
  - 为执行按钮添加 `aria-label` 和 `aria-describedby`
  - 为加载状态添加 `aria-busy` 属性
  - 为状态变化添加 `aria-live` 区域
  - _Requirements: 3.1, 3.6_

- [x] 15. 更新现有组件以支持新交互
  - 更新 `PromptEditor.tsx`，添加 `onEnter` 回调支持
  - 更新 `MessageHistory.tsx`，支持只读模式
  - 更新 `useRunNode.ts` hook，适配新的执行流程
  - 确保所有组件与新的数据模型兼容
  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ] 16. 文档和示例更新
  - 更新 `docs/ui-architecture.md`，反映新的节点交互模式
  - 创建 `docs/node-types.md`，说明三种节点类型的区别
  - 更新 README，添加新功能的使用说明
  - 创建示例项目展示输入-响应节点流程
  - _Requirements: 所有需求_

- [ ]* 17. 测试覆盖
- [ ]* 17.1 单元测试
  - 测试 `getNodeType` 函数的各种场景
  - 测试 `createResponseNode` 函数的节点创建和定位
  - 测试 `collectUpstreamContext` 的上下文收集和排序
  - 测试 `migrateProjectToV2` 的迁移逻辑
  - _Requirements: 所有需求_

- [ ]* 17.2 集成测试
  - 测试完整的执行流程：输入 → 执行 → 响应节点创建
  - 测试多步骤对话流程：A → B → C 的上下文传递
  - 测试错误恢复流程：错误 → Retry → 成功
  - 测试节点类型转换：响应节点 → 输入节点
  - _Requirements: 所有需求_

- [ ]* 17.3 E2E 测试
  - 测试用户创建节点、输入 prompt、执行、查看响应的完整流程
  - 测试多节点连接和上下文传递
  - 测试项目保存和加载后节点状态保持
  - 测试旧项目的自动迁移流程
  - _Requirements: 所有需求_
