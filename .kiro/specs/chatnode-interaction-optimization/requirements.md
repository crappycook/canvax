# Requirements Document

## Introduction

本功能优化 ChatNode 的交互模式，从传统的单节点对话界面转变为流程化的节点连接模式。在新模式下，用户在输入节点中编写 prompt 并选择模型，点击执行后，LLM 的响应将在下游的新节点中展示。这种设计更符合画布流程图的思维方式，使每个节点职责清晰，便于构建复杂的 AI 工作流。

## Requirements

### Requirement 1: 输入节点交互

**User Story:** 作为用户，我希望在节点中输入 prompt 并选择模型后，通过明确的执行按钮触发 LLM 请求，这样我可以清楚地控制何时发起对话。

#### Acceptance Criteria

1. WHEN 用户创建新的 ChatNode THEN 节点 SHALL 显示 prompt 输入框、模型选择器和执行按钮
2. WHEN 用户在 prompt 输入框中输入内容 THEN 系统 SHALL 实时保存到节点的 data.prompt 字段
3. WHEN 用户选择模型 THEN 系统 SHALL 更新节点的 data.modelId 字段
4. WHEN 用户点击执行按钮（Enter 图标）THEN 系统 SHALL 触发 LLM 请求
5. IF prompt 为空 THEN 执行按钮 SHALL 处于禁用状态
6. IF 节点正在执行 THEN 执行按钮 SHALL 变为停止按钮
7. WHEN 节点处于输入模式（无下游连接或未执行）THEN 节点 SHALL 不显示 LLM 响应内容
8. WHEN 节点已有下游连接 THEN 节点 SHALL 显示为"已执行"状态，但仍可编辑 prompt 和模型

### Requirement 2: 响应节点自动创建与连接

**User Story:** 作为用户，我希望执行节点后系统自动创建响应节点并连接，这样我可以专注于构建工作流而不是手动管理节点。

#### Acceptance Criteria

1. WHEN 用户点击输入节点的执行按钮 AND 该节点没有下游连接 THEN 系统 SHALL 自动创建新的响应节点
2. WHEN 响应节点创建时 THEN 系统 SHALL 自动创建从输入节点到响应节点的边
3. WHEN 响应节点创建时 THEN 新节点 SHALL 定位在输入节点右侧 200px 处
4. WHEN LLM 请求成功返回 THEN 系统 SHALL 将响应内容写入响应节点的 data.messages
5. WHEN 用户点击已有下游连接的输入节点执行按钮 THEN 系统 SHALL 更新现有下游节点的内容而不是创建新节点
6. IF 输入节点有多个下游节点 THEN 系统 SHALL 更新最近创建的下游节点
7. WHEN 响应节点创建时 THEN 其标题 SHALL 自动设置为 "Response from [输入节点标题]"

### Requirement 3: 响应节点展示

**User Story:** 作为用户，我希望响应节点清晰地展示 LLM 返回的内容，并且可以继续作为下一个输入节点使用，这样我可以构建多步骤的对话流程。

#### Acceptance Criteria

1. WHEN 响应节点接收到 LLM 响应 THEN 节点 SHALL 以只读模式显示响应内容
2. WHEN 响应节点显示内容时 THEN 内容 SHALL 支持 Markdown 渲染（代码块、列表、链接等）
3. WHEN 用户点击响应节点 THEN 节点 SHALL 显示完整的响应消息
4. WHEN 响应节点被选中 THEN 用户 SHALL 可以添加新的 prompt 输入框，将其转换为新的输入节点
5. WHEN 响应节点转换为输入节点 THEN 系统 SHALL 保留原有响应内容作为上下文
6. WHEN 响应节点处于加载状态 THEN 节点 SHALL 显示加载动画和"Generating..."提示
7. IF LLM 请求失败 THEN 响应节点 SHALL 显示错误信息和重试按钮

### Requirement 4: 上下文传递优化

**User Story:** 作为用户，我希望节点之间的连接能够自动传递对话上下文，这样我可以构建连续的多轮对话流程。

#### Acceptance Criteria

1. WHEN 输入节点执行时 THEN 系统 SHALL 通过 collectUpstreamContext 收集所有上游节点的消息
2. WHEN 构建 LLM 请求时 THEN 系统 SHALL 将上游上下文、当前 prompt 组合为完整的 messages 数组
3. WHEN 节点有多个上游连接 THEN 系统 SHALL 按拓扑顺序合并所有上游消息
4. WHEN 上游节点内容更新后重新执行 THEN 下游节点 SHALL 使用更新后的上下文
5. IF 上游节点包含错误状态 THEN 系统 SHALL 在执行前警告用户上下文不完整

### Requirement 5: 节点状态与视觉反馈

**User Story:** 作为用户，我希望通过节点的视觉状态快速了解工作流的执行情况，这样我可以及时发现问题并调整流程。

#### Acceptance Criteria

1. WHEN 节点处于 idle 状态 THEN 节点边框 SHALL 显示为默认颜色（灰色）
2. WHEN 节点处于 running 状态 THEN 节点边框 SHALL 显示为蓝色脉冲动画
3. WHEN 节点处于 success 状态 THEN 节点边框 SHALL 显示为绿色
4. WHEN 节点处于 error 状态 THEN 节点边框 SHALL 显示为红色
5. WHEN 节点类型为输入节点 THEN 节点 SHALL 显示输入图标（编辑图标）
6. WHEN 节点类型为响应节点 THEN 节点 SHALL 显示响应图标（消息气泡图标）
7. WHEN 用户悬停在执行按钮上 THEN 系统 SHALL 显示 tooltip 说明当前操作（"Run" 或 "Stop"）

### Requirement 6: 向后兼容与迁移

**User Story:** 作为用户，我希望现有的项目能够平滑迁移到新的交互模式，这样我不会丢失已有的工作成果。

#### Acceptance Criteria

1. WHEN 系统加载旧格式的项目 THEN 系统 SHALL 自动检测并迁移节点数据结构
2. WHEN 迁移旧节点时 THEN 系统 SHALL 将包含多条消息的节点拆分为输入-响应节点对
3. WHEN 迁移完成后 THEN 系统 SHALL 显示迁移报告，告知用户变更内容
4. IF 迁移失败 THEN 系统 SHALL 保留原始数据并提示用户手动处理
5. WHEN 用户保存迁移后的项目 THEN 系统 SHALL 使用新的数据格式
