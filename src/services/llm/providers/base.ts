/**
 * Base provider adapter with common utilities
 */

import type {
  LLMProviderAdapter,
  LLMRequest,
  LLMResponse,
  LLMRequestOptions,
  StreamCallback,
  ValidationResult,
  ProviderCapabilities,
} from '../types'
import { LLMError, LLMErrorCode, createLLMError } from '../errors'
import {
  validateRequest,
  checkAbortSignal,
  sleep,
} from './utils'

/**
 * Abstract base class for provider adapters
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseProviderAdapter implements LLMProviderAdapter {
  abstract readonly providerId: string
  abstract readonly capabilities: ProviderCapabilities

  /**
   * Create the provider-specific client instance
   * Should be implemented by each provider adapter
   */
  protected abstract createClient(apiKey: string): unknown

  /**
   * Map unified request to provider-specific format
   * Should be implemented by each provider adapter
   */
  protected abstract mapRequest(request: LLMRequest): unknown

  /**
   * Map provider-specific response to unified format
   * Should be implemented by each provider adapter
   */
  protected abstract mapResponse(response: unknown): LLMResponse

  /**
   * Map provider-specific error to unified LLMError
   * Should be implemented by each provider adapter
   */
  protected abstract mapError(error: unknown): LLMError

  /**
   * Execute the actual API call for non-streaming generation
   * Should be implemented by each provider adapter
   */
  protected abstract executeGenerate(
    client: unknown,
    request: unknown,
    options: LLMRequestOptions
  ): Promise<unknown>

  /**
   * Execute the actual API call for streaming generation
   * Should be implemented by each provider adapter
   */
  protected abstract executeStreamGenerate(
    client: unknown,
    request: unknown,
    onChunk: StreamCallback,
    options: LLMRequestOptions
  ): Promise<LLMResponse>

  /**
   * Execute API key validation
   * Should be implemented by each provider adapter
   */
  protected abstract executeValidation(
    client: unknown,
    apiKey: string
  ): Promise<void>

  /**
   * Generate a completion (non-streaming)
   */
  async generate(
    request: LLMRequest,
    options: LLMRequestOptions
  ): Promise<LLMResponse> {
    try {
      // Validate request
      this.validateGenerateRequest(request, options)

      // Check if request was aborted
      checkAbortSignal(options.signal)

      // Create client and map request
      const client = this.createClient(options.apiKey)
      const providerRequest = this.mapRequest(request)

      // Execute the API call
      const response = await this.executeGenerate(
        client,
        providerRequest,
        options
      )

      // Check if request was aborted during execution
      checkAbortSignal(options.signal)

      // Map response to unified format
      return this.mapResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Generate a completion with streaming
   */
  async streamGenerate(
    request: LLMRequest,
    onChunk: StreamCallback,
    options: LLMRequestOptions
  ): Promise<LLMResponse> {
    // If provider doesn't support streaming, fall back to chunked non-streaming
    if (!this.capabilities.streaming) {
      return this.fallbackStreamGenerate(request, onChunk, options)
    }

    try {
      // Validate request
      this.validateGenerateRequest(request, options)

      // Check if request was aborted
      checkAbortSignal(options.signal)

      // Create client and map request
      const client = this.createClient(options.apiKey)
      const providerRequest = this.mapRequest(request)

      // Execute streaming API call
      const response = await this.executeStreamGenerate(
        client,
        providerRequest,
        onChunk,
        options
      )

      // Check if request was aborted after completion
      checkAbortSignal(options.signal)

      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Fallback streaming implementation for providers that don't support native streaming
   * Generates full response and chunks it word-by-word
   */
  protected async fallbackStreamGenerate(
    request: LLMRequest,
    onChunk: StreamCallback,
    options: LLMRequestOptions
  ): Promise<LLMResponse> {
    // Generate full response
    const response = await this.generate(request, options)

    // Chunk the response word by word
    const words = response.content.split(' ')
    for (let i = 0; i < words.length; i++) {
      checkAbortSignal(options.signal)

      const chunk = i === words.length - 1 ? words[i] : words[i] + ' '
      onChunk(chunk)

      // Small delay to simulate streaming
      await sleep(50)
    }

    return response
  }

  /**
   * Validate an API key for this provider
   */
  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    try {
      if (!apiKey || apiKey.trim() === '') {
        return {
          valid: false,
          error: 'API key is empty',
        }
      }

      const client = this.createClient(apiKey)
      await this.executeValidation(client, apiKey)

      return { valid: true }
    } catch (error) {
      const llmError = this.handleError(error)
      return {
        valid: false,
        error: llmError.getUserMessage(),
      }
    }
  }

  /**
   * Validate generate request has required fields
   */
  protected validateGenerateRequest(
    request: LLMRequest,
    options: LLMRequestOptions
  ): void {
    validateRequest(request, ['model', 'messages'])

    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new LLMError(
        LLMErrorCode.API_KEY_MISSING,
        'API key is required',
        {
          retryable: false,
          providerId: this.providerId,
        }
      )
    }

    if (!request.messages || request.messages.length === 0) {
      throw new LLMError(
        LLMErrorCode.INVALID_REQUEST,
        'At least one message is required',
        {
          retryable: false,
          providerId: this.providerId,
        }
      )
    }
  }

  /**
   * Handle errors and convert to LLMError
   */
  protected handleError(error: unknown): LLMError {
    // If already an LLMError, ensure it has the provider ID
    if (error instanceof LLMError) {
      if (!error.providerId) {
        return new LLMError(error.code, error.message, {
          retryable: error.retryable,
          statusCode: error.statusCode,
          providerId: this.providerId,
          providerError: error.providerError,
        })
      }
      return error
    }

    // Use provider-specific error mapping
    try {
      return this.mapError(error)
    } catch (mappingError) {
      // If mapping fails, use generic error creation
      return createLLMError(error, this.providerId)
    }
  }

  /**
   * Helper to extract system messages from message array
   */
  protected extractSystemMessages(
    request: LLMRequest
  ): { systemMessages: string[]; otherMessages: typeof request.messages } {
    const systemMessages: string[] = []
    const otherMessages = request.messages.filter((msg) => {
      if (msg.role === 'system') {
        systemMessages.push(
          typeof msg.content === 'string' ? msg.content : ''
        )
        return false
      }
      return true
    })

    return { systemMessages, otherMessages }
  }

  /**
   * Helper to ensure message content is a string
   */
  protected getMessageContentAsString(
    content: string | Array<{ type: string; text?: string }>
  ): string {
    if (typeof content === 'string') {
      return content
    }

    // Extract text from multipart content
    return content
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text)
      .join('\n')
  }
}
