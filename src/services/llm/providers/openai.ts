/**
 * OpenAI provider adapter implementation
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
 * OpenAI provider adapter
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 */
export class OpenAIAdapter extends BaseProviderAdapter {
  readonly providerId = 'openai'
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    toolUse: true,
    vision: true,
    maxTokens: 128000,
    supportsSystemMessages: true,
  }

  private clientCache: Map<string, OpenAI> = new Map()

  /**
   * Create OpenAI client with lazy initialization
   */
  protected createClient(apiKey: string): OpenAI {
    // Cache clients by API key to avoid recreating
    const cached = this.clientCache.get(apiKey)
    if (cached) {
      return cached
    }

    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for browser usage
    })

    this.clientCache.set(apiKey, client)
    return client
  }

  /**
   * Map unified request to OpenAI chat completion parameters
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
   * Map OpenAI response to unified format
   */
  protected mapResponse(response: OpenAI.Chat.ChatCompletion): LLMResponse {
    const choice = response.choices[0]
    if (!choice) {
      throw new LLMError(
        LLMErrorCode.INVALID_REQUEST,
        'No choices in OpenAI response',
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
   * Map OpenAI finish reason to unified format
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
   * Map OpenAI errors to unified LLMError
   */
  protected mapError(error: unknown): LLMError {
    const { statusCode, message, originalError } = extractErrorInfo(error)

    let code = LLMErrorCode.UNKNOWN
    if (statusCode) {
      code = mapStatusToErrorCode(statusCode, message)
    }

    // Check for specific OpenAI error types
    if (error instanceof Error) {
      const errorAny = error as any

      // OpenAI SDK specific error handling
      if (errorAny.type === 'invalid_request_error') {
        code = LLMErrorCode.INVALID_REQUEST
      } else if (errorAny.code === 'model_not_found') {
        code = LLMErrorCode.MODEL_NOT_FOUND
      } else if (errorAny.code === 'insufficient_quota') {
        code = LLMErrorCode.QUOTA_EXCEEDED
      }
    }

    const retryable = [
      LLMErrorCode.RATE_LIMIT,
      LLMErrorCode.NETWORK_ERROR,
      LLMErrorCode.TIMEOUT,
      LLMErrorCode.SERVER_ERROR,
    ].includes(code)

    return new LLMError(code, message, {
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

    return await openaiClient.chat.completions.create(
      {
        ...openaiRequest,
        stream: false,
      },
      {
        signal: options.signal,
      }
    )
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
      // Note: OpenAI streaming doesn't include usage in stream chunks
      // Usage would need to be calculated separately or omitted
    }
  }

  /**
   * Validate API key by listing models
   */
  protected async executeValidation(
    client: unknown,
    _apiKey: string
  ): Promise<void> {
    const openaiClient = client as OpenAI

    try {
      // Make a lightweight API call to verify the key
      await openaiClient.models.list()
    } catch (error) {
      // Re-throw to be handled by base class
      throw error
    }
  }
}
