import { llmProviders, type LLMProviderDefinition } from '@/config/llmProviders'

export type LLMProvider = LLMProviderDefinition

export interface LLMRequest {
  model: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  temperature?: number
  maxTokens?: number
}

export interface LLMRequestOptions {
  signal?: AbortSignal
}

export interface LLMResponse {
  content: string
  usage?: { promptTokens: number; completionTokens: number }
}

export class LLMClient {
  private providers: Map<string, LLMProvider> = new Map()
  private modelToProvider: Map<string, LLMProvider> = new Map()
  private apiKeys: Map<string, string> = new Map()

  constructor(initialProviders: LLMProvider[] = llmProviders) {
    initialProviders.forEach(provider => {
      this.registerProvider(provider)
    })
  }

  // Provider management
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider)
    provider.models.forEach(model => {
      this.modelToProvider.set(model.id, provider)
    })
  }

  unregisterProvider(providerId: string): void {
    const provider = this.providers.get(providerId)
    if (provider) {
      provider.models.forEach(model => {
        this.modelToProvider.delete(model.id)
      })
    }
    this.providers.delete(providerId)
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

  // API key management
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

  // Core LLM operations (mock implementation for MVP)
  async generate(request: LLMRequest, options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const { signal } = options

    if (signal?.aborted) {
      throw new DOMException('The request was aborted before it started', 'AbortError')
    }

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
      usage: { promptTokens: 100, completionTokens: 50 }
    }
  }

  async streamGenerate(request: LLMRequest, onChunk: (chunk: string) => void, options: LLMRequestOptions = {}): Promise<void> {
    // Mock implementation for MVP
    const response = await this.generate(request, options)
    
    // Simulate streaming by breaking response into chunks
    const words = response.content.split(' ')
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onChunk(word + ' ')
    }
  }
  
  // Utility methods
  async validateApiKey(providerId: string): Promise<boolean> {
    // Mock implementation for MVP
    const key = this.apiKeys.get(providerId)
    return !!key && key.trim().length > 0
  }

  async getModels(providerId: string): Promise<string[]> {
    const provider = this.providers.get(providerId)
    if (!provider) return []
    return provider.models.map(model => model.id)
  }
}
