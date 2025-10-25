# Task · LLM Provider 接入准备

## 背景
- 目标：在画布的 ChatNode 中打通真实 LLM 请求链路，并复用现有系统的 provider。
- 当前状态：Hooks 已改为共用 `src/services/llm/client.ts` 单例，默认注册 OpenAI 适配器并支持自定义 provider；仍需完成端到端校验。

## 待办事项
- [x] **统一客户端接入**
  - 任务：用 `src/services/llm/client.ts` 作为唯一入口，替换 `@/services/llmClient`；在初始化阶段注册默认适配器（至少 `OpenAIAdapter`，必要时新增自定义适配器）。
  - 影响：`src/hooks/useRunNode.ts`, `src/hooks/useExecutionManager.ts`, `src/services/llm/client.ts`.
- [x] **Provider 注册与配置同步**
  - 任务：在应用启动时调用新的客户端实例，加载 `settings.predefinedProviders` / `settings.customProviders`; 确保 API Key、baseUrl、模型列表实时同步。
  - 影响：`src/App.tsx`, `src/services/llm/client.ts`, Zustand Settings Slice。
- [x] **目标 Provider 适配器**
  - 任务：现有系统使用 OpenAI 兼容接口，已通过 `OpenAIAdapter` 默认注册；如需其他协议（Anthropic/DeepSeek 等）再新增 adapter。
  - 影响：`src/services/llm/providers/openai.ts`, `src/config/llmProviders.json`.
- [x] **API Key 管理**
  - 任务：校验密钥加密与存储流程；补齐 Settings UI 与客户端之间的同步逻辑，避免仅依赖 legacy `settings.apiKeys`.
  - 影响：`src/state/createSettingsSlice.ts`, `src/components/ModelSelector.tsx`, 设置面板组件。
- [x] **请求参数与错误映射**
  - 任务：对齐消息格式、温度/最大 token 等参数；完善 `formatError` / `parseError` 以处理新 provider 的错误码和提示文案。
  - 影响：`src/hooks/useExecutionManager.ts`, `src/types/errors.ts`, 新增测试覆盖。
- [ ] **端到端验证**
  - 任务：在真实或沙盒环境下测试运行/停止/重试链路；补充 Vitest 集成测试或契约测试，记录预期行为。（当前 `pnpm lint` 受既有 lint issue 阻塞，待清理后补跑 E2E/集成验证）

> 完成以上准备后，再进行聊天节点与现有系统 LLM provider 的正式集成。
