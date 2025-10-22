/**
 * Custom provider adapter implementation
 * Supports OpenAI-compatible APIs with custom base URLs
 */

import OpenAI from 'openai'
import type {
  LLMRequest,
  LLMResponse,
  LLMRequestOptions,
  StreamCallback,
  ProviderCapabilities,
} from '../types'
import { BaseProviderAdapter } from './base'
import { LLMError, LLMErrorCode, mapStatusToErrorCode } from '../errors'
import { extractErrorInfo } from './utils'

/**
 * Custom provider adapter for OpenAI-compatible APIs
 * Extends OpenAI adapter logic but allows custom base URLs
 */
export class CustomProviderAdapter extends BaseProviderAdapter {
  readonly providerId: string
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    toolUse: true,
    vision: false, // Conservative default for custom providers
    maxTokens: 128000,
    supportsSystemMessages: true,
  }

  private readonly baseUrl: string
  private clientCache: Map<string, OpenAI> = new Map()

  /**
   * Create a custom provider adapter
   * @param providerId - Unique identifier for this custom provider
   * @param baseUrl - Base URL for the API endpoint (e.g., "https://api.example.com/v1")
   */
  constructor(providerId: string, baseUrl: string) {
    super()
    this.providerId = providerId
    this.baseUrl = baseUrl
  }

  /**
   * Create OpenAI client with custom base URL
   */
  protected createClient(apiKey: string): OpenAI {
    // Cache clients by API key to avoid recreating
    const cached = this.clientCache.get(apiKey)
    if (cached) {
      return cached
    }

    const client = new OpenAI({
      apiKey,
      baseURL: this.baseUrl,
      dangerouslyAllowBrowser: true, // Required for browser usage
    })

    this.clientCache.set(apiKey, client)
    return client
  }

  /**
   * Map unified request to OpenAI chat completion parameters
   * Reuses OpenAI format since custom providers are OpenAI-compatible
   */
  protected mapRequest(request: LLMRequest): OpenAI.Chat.ChatCompletionCreateParams {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = request.messages.map(
      (msg) => ({
        role: msg.role,
        content: this.getMessageContentAsString(msg.content),
      })
    )

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: request.model,
      messages,
    }

    // Add optional parameters if provided
    if (request.temperature !== undefined) {
      params.temperature = request.temperature
    }
    if (request.maxTokens !== undefined) {
      params.max_tokens = request.maxTokens
    }
    if (request.topP !== undefined) {
      params.top_p = request.topP
    }
    if (request.stop !== undefined && request.stop.length > 0) {
      params.stop = request.stop
    }

    return params
  }

  /**
   * Map OpenAI-compatible response to unified format
   * Reuses OpenAI response format
   */
  protected mapResponse(response: OpenAI.Chat.ChatCompletion): LLMResponse {
    const choice = response.choices[0]
    if (!choice) {
      throw new LLMError(
        LLMErrorCode.INVALID_REQUEST,
        'No choices in response from custom provider',
        {
          retryable: false,
          providerId: this.providerId,
        }
      )
    }

    const content = choice.message.content || ''
    const finishReason = this.mapFinishReason(choice.finish_reason)

    const llmResponse: LLMResponse = {
      content,
      finishReason,
    }

    // Add usage information if available
    if (response.usage) {
      llmResponse.usage = {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      }
    }

    return llmResponse
  }

  /**
   * Map finish reason to unified format
   */
  private mapFinishReason(
    reason: string | null
  ): 'stop' | 'length' | 'tool_calls' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls'
      default:
        return 'stop'
    }
  }

  /**
   * Map errors to unified LLMError with custom provider context
   */
  protected mapError(error: unknown): LLMError {
    const { statusCode, message, originalError } = extractErrorInfo(error)

    let code = LLMErrorCode.UNKNOWN
    if (statusCode) {
      code = mapStatusToErrorCode(statusCode, message)
    }

    // Check for specific error types
    if (error instanceof Error) {
      const errorAny = error as any

      // OpenAI SDK specific error handling (works for compatible APIs)
      if (errorAny.type === 'invalid_request_error') {
        code = LLMErrorCode.INVALID_REQUEST
      } else if (errorAny.code === 'model_not_found') {
        code = LLMErrorCode.MODEL_NOT_FOUND
      } else if (errorAny.code === 'insufficient_quota') {
        code = LLMErrorCode.QUOTA_EXCEEDED
      }

      // Network errors specific to custom providers
      if (
        message.includes('ECONNREFUSED') ||
        message.includes('ENOTFOUND') ||
        message.includes('Failed to fetch')
      ) {
        code = LLMErrorCode.NETWORK_ERROR
      }
    }

    const retryable = [
      LLMErrorCode.RATE_LIMIT,
      LLMErrorCode.NETWORK_ERROR,
      LLMErrorCode.TIMEOUT,
      LLMErrorCode.SERVER_ERROR,
    ].includes(code)

    // Include custom provider context in error message
    const enhancedMessage = `Custom provider (${this.providerId}): ${message}`

    return new LLMError(code, enhancedMessage, {
      retryable,
      statusCode,
      providerId: this.providerId,
      providerError: originalError,
    })
  }

  /**
   * Execute non-streaming generation
   */
  protected async executeGenerate(
    client: unknown,
    request: unknown,
    options: LLMRequestOptions
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const openaiClient = client as OpenAI
    const openaiRequest = request as OpenAI.Chat.ChatCompletionCreateParams

    try {
      return await openaiClient.chat.completions.create(
        {
          ...openaiRequest,
          stream: false,
        },
        {
          signal: options.signal,
        }
      )
    } catch (error) {
      // Add context about custom provider in error
      throw this.enhanceErrorWithContext(error)
    }
  }

  /**
   * Execute streaming generation
   */
  protected async executeStreamGenerate(
    client: unknown,
    request: unknown,
    onChunk: StreamCallback,
    options: LLMRequestOptions
  ): Promise<LLMResponse> {
    const openaiClient = client as OpenAI
    const openaiRequest = request as OpenAI.Chat.ChatCompletionCreateParams

    try {
      const stream = await openaiClient.chat.completions.create(
        {
          ...openaiRequest,
          stream: true,
        },
        {
          signal: options.signal,
        }
      )

      let fullContent = ''
      let finishReason: 'stop' | 'length' | 'tool_calls' | 'error' = 'stop'

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (delta?.content) {
          fullContent += delta.content
          onChunk(delta.content)
        }

        // Capture finish reason from the last chunk
        if (chunk.choices[0]?.finish_reason) {
          finishReason = this.mapFinishReason(chunk.choices[0].finish_reason)
        }
      }

      return {
        content: fullContent,
        finishReason,
        // Note: Streaming doesn't always include usage in stream chunks
      }
    } catch (error) {
      // Add context about custom provider in error
      throw this.enhanceErrorWithContext(error)
    }
  }

  /**
   * Validate API key by making a test request
   * Uses a lightweight models list call or a minimal completion request
   */
  protected async executeValidation(
    client: unknown,
    _apiKey: string
  ): Promise<void> {
    const openaiClient = client as OpenAI

    try {
      // Try to list models first (lightweight operation)
      await openaiClient.models.list()
    } catch (error) {
      // If models.list is not supported, try a minimal completion request
      // Some custom providers may not implement the models endpoint
      const errorAny = error as any
      if (errorAny.status === 404 || errorAny.statusCode === 404) {
        // Fallback: try a minimal completion request
        try {
          await openaiClient.chat.completions.create({
            model: 'test',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
          })
        } catch (completionError) {
          // If we get a model_not_found error, the API key is valid
          const completionErrorAny = completionError as any
          if (
            completionErrorAny.code === 'model_not_found' ||
            completionErrorAny.type === 'invalid_request_error'
          ) {
            // API key is valid, just the model doesn't exist
            return
          }
          // Otherwise, re-throw the error
          throw completionError
        }
      } else {
        // Re-throw other errors
        throw error
      }
    }
  }

  /**
   * Enhance error with custom provider context
   */
  private enhanceErrorWithContext(error: unknown): Error {
    if (error instanceof Error) {
      const enhancedError = new Error(
        `Custom provider (${this.providerId}) at ${this.baseUrl}: ${error.message}`
      )
      enhancedError.stack = error.stack
      // Preserve any additional properties
      Object.assign(enhancedError, error)
      return enhancedError
    }
    return error as Error
  }
}
