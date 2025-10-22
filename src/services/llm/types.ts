/**
 * Core type definitions for LLM provider integration
 */

/**
 * Message content can be simple text or multimodal content array
 */
export type MessageContent = string | MultiPartContent[]

/**
 * Multi-part content for future multimodal support (images, etc.)
 */
export interface MultiPartContent {
  type: 'text' | 'image_url' | 'image_base64'
  text?: string
  imageUrl?: string
  imageData?: string
  mimeType?: string
}

/**
 * Unified message format across all providers
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: MessageContent
}

/**
 * Tool definition for function calling (future enhancement)
 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/**
 * Unified request format for LLM generation
 */
export interface LLMRequest {
  model: string
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  tools?: ToolDefinition[]
}

/**
 * Token usage information from LLM response
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Unified response format from LLM providers
 */
export interface LLMResponse {
  content: string
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error'
  usage?: TokenUsage
  metadata?: Record<string, unknown>
}

/**
 * Callback function for streaming chunks
 */
export type StreamCallback = (chunk: string) => void

/**
 * Options passed to LLM request methods
 */
export interface LLMRequestOptions {
  apiKey: string
  signal?: AbortSignal
  organizationId?: string
  baseUrl?: string
}

/**
 * Provider capability flags
 */
export interface ProviderCapabilities {
  streaming: boolean
  toolUse: boolean
  vision: boolean
  maxTokens: number
  supportsSystemMessages: boolean
}

/**
 * Result of API key validation
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Core adapter interface that all provider adapters must implement
 */
export interface LLMProviderAdapter {
  readonly providerId: string
  readonly capabilities: ProviderCapabilities

  /**
   * Generate a completion (non-streaming)
   */
  generate(
    request: LLMRequest,
    options: LLMRequestOptions
  ): Promise<LLMResponse>

  /**
   * Generate a completion with streaming
   */
  streamGenerate(
    request: LLMRequest,
    onChunk: StreamCallback,
    options: LLMRequestOptions
  ): Promise<LLMResponse>

  /**
   * Validate an API key for this provider
   */
  validateApiKey(apiKey: string): Promise<ValidationResult>
}

/**
 * Model configuration for custom providers
 */
export interface CustomModelConfig {
  id: string
  label: string
}

/**
 * Configuration for user-defined custom LLM providers
 */
export interface CustomProviderConfig {
  id: string
  name: string
  apiType: 'OpenAI' | 'Anthropic' | 'Google' | 'Custom'
  baseUrl: string
  apiKey: string
  models: CustomModelConfig[]
  enabled: boolean
  createdAt: number
  updatedAt: number
}

/**
 * State for predefined provider configuration (enabled status and API key)
 */
export interface PredefinedProviderState {
  [providerId: string]: {
    enabled: boolean
    apiKey?: string
  }
}
