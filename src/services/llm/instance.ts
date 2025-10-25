import { LLMClient } from './client'

/**
 * Shared LLM client instance used throughout the app.
 * The client auto-registers enabled providers and adapters.
 */
export const llmClient = new LLMClient()

export type { LLMClient }
