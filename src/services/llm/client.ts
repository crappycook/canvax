/**
 * LLM Client Module
 * 
 * This module provides the main interface for interacting with LLM providers.
 * It manages provider registration, API key storage, and request routing.
 * 
 * Key responsibilities:
 * - Register and manage enabled providers (both predefined and custom)
 * - Route requests to appropriate provider adapters
 * - Manage API keys and authentication
 * - Handle provider refresh when settings change
 * - Provide backward-compatible API for existing code
 * 
 * The client automatically subscribes to settings changes and refreshes
 * the provider registry when providers are enabled/disabled or custom
 * providers are added/removed.
 * 
 * @module services/llm/client
 */

import { getEnabledProviders, type LLMProviderDefinition } from '@/config/llmProviders'
import type {
  LLMProviderAdapter,
  LLMRequest,
  LLMResponse,
  LLMRequestOptions,
  StreamCallback,
  ValidationResult,
} from '@/services/llm/types'
import { LLMError, LLMErrorCode } from '@/services/llm/errors'
import { CustomProviderAdapter } from '@/services/llm/providers/custom'
import { OpenAIAdapter } from '@/services/llm/providers/openai'
import { useStore } from '@/state/store'

export type LLMProvider = LLMProviderDefinition

/**
 * LLM Client orchestrates provider adapters and manages API keys.
 * 
 * This is the main entry point for making LLM API calls. It:
 * - Loads enabled providers from configuration
 * - Creates appropriate adapters for each provider
 * - Routes requests to the correct provider based on model ID
 * - Manages API keys and authentication
 * - Automatically refreshes when provider settings change
 * 
 * Usage:
 * ```typescript
 * const client = new LLMClient()
 * const response = await client.generate({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello' }]
 * })
 * ```
 */
export class LLMClient {
  // Provider configuration registry (from llmProviders.json)
  private providers: Map<string, LLMProvider> = new Map()

  // Provider adapter registry (actual implementation adapters)
  private adapters: Map<string, LLMProviderAdapter> = new Map()

  // Model to provider mapping
  private modelToProvider: Map<string, LLMProvider> = new Map()

  // API keys storage
  private apiKeys: Map<string, string> = new Map()

  // Store unsubscribe function
  private unsubscribe: (() => void) | null = null

  constructor() {
    // Register only enabled providers
    this.registerProviders()

    // Subscribe to settings changes to refresh providers
    this.subscribeToSettingsChanges()
  }

  // ============================================================================
  // Provider Configuration Management
  // ============================================================================

  /**
   * Register all enabled providers (both predefined and custom)
   * This method loads providers from getEnabledProviders() and creates adapters
   */
  private registerProviders(): void {
    const enabledProviders = getEnabledProviders()
    const state = useStore.getState()

    enabledProviders.forEach(provider => {
      // Register provider configuration
      this.providers.set(provider.id, provider)

      // Map models to provider
      provider.models.forEach(model => {
        this.modelToProvider.set(model.id, provider)
      })

      // Sync API keys from settings store
      if (provider.isCustom) {
        // For custom providers, get API key from the custom provider config
        const customProvider = state.settings.customProviders.find(cp => cp.id === provider.id)
        if (customProvider?.apiKey) {
          this.apiKeys.set(provider.id, customProvider.apiKey)
        }

        // Create and register adapter for custom providers
        if (provider.baseUrl) {
          const adapter = new CustomProviderAdapter(provider.id, provider.baseUrl)
          this.adapters.set(provider.id, adapter)
        }
      } else {
        // For predefined providers, get API key from predefinedProviders state
        const predefinedState = state.settings.predefinedProviders[provider.id]
        if (predefinedState?.apiKey) {
          this.apiKeys.set(provider.id, predefinedState.apiKey)
        }
        // Also check legacy apiKeys for backward compatibility
        else if (state.settings.apiKeys[provider.id]) {
          this.apiKeys.set(provider.id, state.settings.apiKeys[provider.id])
        }
      }

      // Register built-in adapters for known providers
      switch (provider.id) {
        case 'openai': {
          const adapter = new OpenAIAdapter()
          this.adapters.set(provider.id, adapter)
          break
        }
        default:
          break
      }
    })
  }

  /**
   * Refresh providers when settings change
   * Clears existing providers and re-registers from current enabled providers
   */
  refreshProviders(): void {
    // Clear existing providers and adapters
    this.providers.clear()
    this.adapters.clear()
    this.modelToProvider.clear()

    // Re-register enabled providers
    this.registerProviders()
  }

  /**
   * Subscribe to settings store changes to trigger provider refresh
   */
  private subscribeToSettingsChanges(): void {
    // Track previous state to detect changes
    let previousPredefinedProviders = useStore.getState().settings.predefinedProviders
    let previousCustomProviders = useStore.getState().settings.customProviders

    // Subscribe to the entire store and check for provider changes
    this.unsubscribe = useStore.subscribe((state) => {
      const currentPredefinedProviders = state.settings.predefinedProviders
      const currentCustomProviders = state.settings.customProviders

      // Check if predefined or custom providers have changed
      if (
        currentPredefinedProviders !== previousPredefinedProviders ||
        currentCustomProviders !== previousCustomProviders
      ) {
        previousPredefinedProviders = currentPredefinedProviders
        previousCustomProviders = currentCustomProviders
        this.refreshProviders()
      }
    })
  }

  /**
   * Clean up subscriptions (call when disposing the client)
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  unregisterProvider(providerId: string): void {
    const provider = this.providers.get(providerId)
    if (provider) {
      provider.models.forEach(model => {
        this.modelToProvider.delete(model.id)
      })
    }
    this.providers.delete(providerId)
    this.adapters.delete(providerId)
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values())
  }

  getProviderById(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId)
  }

  getProviderForModel(modelId: string): LLMProvider | undefined {
    return this.modelToProvider.get(modelId)
  }

  // ============================================================================
  // Provider Adapter Management
  // ============================================================================

  /**
   * Register a provider adapter implementation
   */
  registerAdapter(adapter: LLMProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter)
  }

  /**
   * Get the adapter for a specific provider
   */
  getAdapter(providerId: string): LLMProviderAdapter | undefined {
    return this.adapters.get(providerId)
  }

  /**
   * Get the adapter for a specific model
   */
  getAdapterForModel(modelId: string): LLMProviderAdapter | undefined {
    const provider = this.getProviderForModel(modelId)
    if (!provider) return undefined
    return this.adapters.get(provider.id)
  }

  // ============================================================================
  // API Key Management
  // ============================================================================

  setApiKey(providerId: string, key: string): void {
    const trimmedKey = key.trim()
    if (!trimmedKey) {
      this.apiKeys.delete(providerId)
      return
    }
    this.apiKeys.set(providerId, trimmedKey)
  }

  removeApiKey(providerId: string): void {
    this.apiKeys.delete(providerId)
  }

  hasApiKey(providerId: string): boolean {
    return this.apiKeys.has(providerId) && (this.apiKeys.get(providerId) ?? '').trim() !== ''
  }

  syncApiKeys(apiKeys: Record<string, string>): void {
    this.apiKeys.clear()
    Object.entries(apiKeys).forEach(([providerId, key]) => {
      const trimmedKey = key.trim()
      if (trimmedKey) {
        this.apiKeys.set(providerId, trimmedKey)
      }
    })
  }

  // ============================================================================
  // Core LLM Operations
  // ============================================================================

  /**
   * Generate a completion (non-streaming)
   * Delegates to provider adapter if available, otherwise uses mock implementation
   */
  async generate(
    request: LLMRequest,
    options: Partial<LLMRequestOptions> = {}
  ): Promise<LLMResponse> {
    const { signal } = options

    // Check for abort before starting
    if (signal?.aborted) {
      throw new DOMException('The request was aborted before it started', 'AbortError')
    }

    // Resolve provider and adapter
    const provider = this.getProviderForModel(request.model)
    if (!provider) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        `Model ${request.model} not found in any registered provider`,
        { retryable: false, providerId: undefined }
      )
    }

    const adapter = this.getAdapter(provider.id)

    // If adapter is registered, use it
    if (adapter) {
      // Get API key for provider
      const apiKey = this.apiKeys.get(provider.id)
      if (!apiKey && provider.requiresApiKey) {
        throw new LLMError(
          LLMErrorCode.API_KEY_MISSING,
          `API key required for provider ${provider.name}`,
          { retryable: false, providerId: provider.id }
        )
      }

      // Build complete options with API key
      const completeOptions: LLMRequestOptions = {
        apiKey: apiKey || '',
        signal,
        ...options,
      }

      try {
        return await adapter.generate(request, completeOptions)
      } catch (error) {
        // If it's already an LLMError, ensure it has provider context
        if (error instanceof LLMError) {
          // Add provider ID if not already set
          if (!error.providerId) {
            throw new LLMError(
              error.code,
              error.message,
              {
                ...error,
                providerId: provider.id,
              }
            )
          }
          throw error
        }

        // Otherwise wrap it with provider context
        throw new LLMError(
          LLMErrorCode.UNKNOWN,
          error instanceof Error ? error.message : 'Unknown error occurred',
          { retryable: false, providerId: provider.id, providerError: error }
        )
      }
    }

    // Fallback to mock implementation for backward compatibility
    return this.mockGenerate(request, { signal })
  }

  /**
   * Generate a completion with streaming
   * Delegates to provider adapter if available, otherwise uses mock implementation
   */
  async streamGenerate(
    request: LLMRequest,
    onChunk: StreamCallback,
    options: Partial<LLMRequestOptions> = {}
  ): Promise<LLMResponse> {
    const { signal } = options

    // Check for abort before starting
    if (signal?.aborted) {
      throw new DOMException('The request was aborted before it started', 'AbortError')
    }

    // Resolve provider and adapter
    const provider = this.getProviderForModel(request.model)
    if (!provider) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        `Model ${request.model} not found in any registered provider`,
        { retryable: false, providerId: undefined }
      )
    }

    const adapter = this.getAdapter(provider.id)

    // If adapter is registered, use it
    if (adapter) {
      // Get API key for provider
      const apiKey = this.apiKeys.get(provider.id)
      if (!apiKey && provider.requiresApiKey) {
        throw new LLMError(
          LLMErrorCode.API_KEY_MISSING,
          `API key required for provider ${provider.name}`,
          { retryable: false, providerId: provider.id }
        )
      }

      // Build complete options with API key
      const completeOptions: LLMRequestOptions = {
        apiKey: apiKey || '',
        signal,
        ...options,
      }

      try {
        return await adapter.streamGenerate(request, onChunk, completeOptions)
      } catch (error) {
        // If it's already an LLMError, ensure it has provider context
        if (error instanceof LLMError) {
          // Add provider ID if not already set
          if (!error.providerId) {
            throw new LLMError(
              error.code,
              error.message,
              {
                ...error,
                providerId: provider.id,
              }
            )
          }
          throw error
        }

        // Otherwise wrap it with provider context
        throw new LLMError(
          LLMErrorCode.UNKNOWN,
          error instanceof Error ? error.message : 'Unknown error occurred',
          { retryable: false, providerId: provider.id, providerError: error }
        )
      }
    }

    // Fallback to mock implementation for backward compatibility
    return this.mockStreamGenerate(request, onChunk, { signal })
  }

  /**
   * Validate an API key for a provider
   * Delegates to provider adapter if available
   */
  async validateApiKey(providerId: string): Promise<ValidationResult> {
    const adapter = this.getAdapter(providerId)

    if (adapter) {
      const apiKey = this.apiKeys.get(providerId)
      if (!apiKey) {
        return { valid: false, error: 'API key not set' }
      }

      try {
        return await adapter.validateApiKey(apiKey)
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Validation failed'
        }
      }
    }

    // Fallback to simple check for backward compatibility
    const key = this.apiKeys.get(providerId)
    return { valid: !!key && key.trim().length > 0 }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async getModels(providerId: string): Promise<string[]> {
    const provider = this.providers.get(providerId)
    if (!provider) return []
    return provider.models.map(model => model.id)
  }

  // ============================================================================
  // Mock Implementation (for backward compatibility)
  // ============================================================================

  private async mockGenerate(
    request: LLMRequest,
    options: { signal?: AbortSignal } = {}
  ): Promise<LLMResponse> {
    const { signal } = options

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (signal) {
          signal.removeEventListener('abort', abortHandler)
        }
        resolve()
      }, 1000)

      const abortHandler = () => {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', abortHandler)
        reject(new DOMException('The request was aborted', 'AbortError'))
      }

      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true })
      }
    })

    const mockResponse = `Mock response for ${request.model}. Messages received: ${request.messages.length}`

    return {
      content: mockResponse,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    }
  }

  private async mockStreamGenerate(
    request: LLMRequest,
    onChunk: StreamCallback,
    options: { signal?: AbortSignal } = {}
  ): Promise<LLMResponse> {
    const response = await this.mockGenerate(request, options)

    // Simulate streaming by breaking response into chunks
    const words = response.content.split(' ')
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onChunk(word + ' ')
    }

    return response
  }
}
