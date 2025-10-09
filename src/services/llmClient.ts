
export interface LLMProvider {
  id: string
  name: string
  models: string[]
}

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
  private providers: Map<string, LLMProvider> = new Map([
    ['openai', { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] }],
    ['anthropic', { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] }]
  ])
  private apiKeys: Map<string, string> = new Map()
  
  // Provider management
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider)
  }
  
  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId)
  }
  
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values())
  }
  
  // API key management
  setApiKey(providerId: string, key: string): void {
    this.apiKeys.set(providerId, key)
  }
  
  removeApiKey(providerId: string): void {
    this.apiKeys.delete(providerId)
  }
  
  hasApiKey(providerId: string): boolean {
    return this.apiKeys.has(providerId) && this.apiKeys.get(providerId) !== ''
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
    return !!key && key.length > 0
  }
  
  async getModels(providerId: string): Promise<string[]> {
    const provider = this.providers.get(providerId)
    return provider ? provider.models : []
  }
}