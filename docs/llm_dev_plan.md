# LLM Integration Development Plan

## Phase 1 – Abstractions & Skeleton
1. Create `src/services/llm/types.ts` with adapter interfaces, request/response types, feature flags, and error enums.
2. Refactor `LLMClient` into `src/services/llm/client.ts`, injecting a provider registry and exposing `generate`, `streamGenerate`, `validateApiKey`.
3. Wire the updated client into existing hooks/stores (`useExecutionManager`, `useRunNode`).

## Phase 2 – Provider Adapters
1. **OpenAI**
   - Install official `openai` SDK.
   - Implement `generate` via `client.responses.create`.
   - Map streaming to `responses.stream`.
   - Translate usage/finish reasons.
2. **Anthropic**
   - Use `@anthropic-ai/sdk` messages API.
   - Handle system/instruction separation and optional “thinking” config.
3. **Google (Gemini)**
   - Integrate `@google/generative-ai`.
   - Normalize candidate responses, handle multi-part content.
4. **DeepSeek**
   - Prefer official JS SDK if available; otherwise create fetch-based adapter (SSE parsing for streaming).
5. Ensure each adapter implements `validateKey` using a lightweight endpoint.
6. Add unit tests per adapter with SDK mocks verifying parameter mapping and error translation.

## Phase 3 – Configuration & UI Adjustments
1. Extend `llmProviders.json` with capability metadata and optional settings schema.
2. Update settings modal to render provider-specific fields dynamically and expose the “Verify API Key” action.
3. Reflect capability flags in model selector and run controls (e.g., disable streaming toggle when unsupported).

## Phase 4 – Execution Pipeline Integration
1. Update `useExecutionManager` to prefer `streamGenerate` when available, appending chunks to node content.
2. Capture usage metrics in execution results and propagate to UI.
3. Ensure AbortController cancels active SDK calls cleanly.

## Phase 5 – Error Handling & Telemetry
1. Implement centralized error mapper translating SDK errors into `LLMError` objects.
2. Display contextual error messages in response nodes with retry guidance.
3. Add optional telemetry hooks recording latency and token usage for analytics.

## Phase 6 – Testing & QA
1. Unit tests:
   - `LLMClient` with mocked adapters (model→provider resolution, error propagation, fallback).
   - Adapter-specific tests using mocked SDK clients.
2. Integration tests for `useExecutionManager` to confirm node lifecycle, streaming updates, and error states.
3. Manual smoke test checklist:
   - Configure each provider key.
   - Send prompt, verify response text, token usage display.
   - Trigger error scenarios (invalid key, rate limit) to confirm UI messaging.

## Phase 7 – Documentation & Rollout
1. Add troubleshooting section covering common HTTP status codes, quota issues, and timeout guidance.
2. Document environment variable requirements and example `.env` configuration.
3. Prepare release notes summarizing new provider support and any user-facing changes.
