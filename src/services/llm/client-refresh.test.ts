import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LLMClient } from './client'
import { useStore } from '@/state/store'
import * as llmProviders from '@/config/llmProviders'
import type { LLMProviderDefinition } from '@/config/llmProviders'

// Mock the llmProviders module
vi.mock('@/config/llmProviders', async () => {
  const actual = await vi.importActual('@/config/llmProviders')
  return {
    ...actual,
    getEnabledProviders: vi.fn(),
  }
})

describe('LLMClient - Provider Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useStore.getState().resetSettings()
  })

  it('should subscribe to settings changes on initialization', () => {
    const mockProviders: LLMProviderDefinition[] = []
    vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(mockProviders)

    const client = new LLMClient()

    // Verify that the client has subscribed (unsubscribe function exists)
    expect(client['unsubscribe']).toBeDefined()
    expect(client['unsubscribe']).not.toBeNull()

    // Clean up
    client.dispose()
  })

  it('should refresh providers when predefined provider is enabled', () => {
    const initialProviders: LLMProviderDefinition[] = []
    const updatedProviders: LLMProviderDefinition[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        requiresApiKey: true,
        enabled: true,
        models: [{ id: 'gpt-4', label: 'GPT-4' }]
      }
    ]

    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce(initialProviders)
      .mockReturnValueOnce(updatedProviders)

    const client = new LLMClient()

    // Initially no providers
    expect(client.getAvailableProviders()).toHaveLength(0)

    // Enable a predefined provider
    useStore.getState().setPredefinedProviderEnabled('openai', true)

    // Providers should be refreshed
    expect(client.getAvailableProviders()).toHaveLength(1)
    expect(client.getProviderById('openai')).toBeDefined()

    // Clean up
    client.dispose()
  })

  it('should refresh providers when custom provider is added', () => {
    const initialProviders: LLMProviderDefinition[] = []
    const updatedProviders: LLMProviderDefinition[] = [
      {
        id: 'custom-123',
        name: 'My Custom Provider',
        requiresApiKey: true,
        enabled: true,
        isCustom: true,
        baseUrl: 'https://api.example.com',
        models: [{ id: 'model-1', label: 'Model 1' }]
      }
    ]

    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce(initialProviders)
      .mockReturnValueOnce(updatedProviders)

    const client = new LLMClient()

    // Initially no providers
    expect(client.getAvailableProviders()).toHaveLength(0)

    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'My Custom Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Providers should be refreshed
    expect(client.getAvailableProviders()).toHaveLength(1)
    expect(client.getProviderById('custom-123')).toBeDefined()

    // Clean up
    client.dispose()
  })

  it('should refresh providers when custom provider is removed', () => {
    const initialProviders: LLMProviderDefinition[] = [
      {
        id: 'custom-123',
        name: 'My Custom Provider',
        requiresApiKey: true,
        enabled: true,
        isCustom: true,
        baseUrl: 'https://api.example.com',
        models: [{ id: 'model-1', label: 'Model 1' }]
      }
    ]
    const updatedProviders: LLMProviderDefinition[] = []

    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce(initialProviders)
      .mockReturnValueOnce(updatedProviders)

    const client = new LLMClient()

    // Initially has one provider
    expect(client.getAvailableProviders()).toHaveLength(1)

    // Remove the custom provider
    useStore.getState().removeCustomProvider('custom-123')

    // Providers should be refreshed
    expect(client.getAvailableProviders()).toHaveLength(0)

    // Clean up
    client.dispose()
  })

  it('should update model mappings when providers are refreshed', () => {
    const initialProviders: LLMProviderDefinition[] = [
      {
        id: 'provider-1',
        name: 'Provider 1',
        requiresApiKey: true,
        enabled: true,
        models: [{ id: 'model-1', label: 'Model 1' }]
      }
    ]
    const updatedProviders: LLMProviderDefinition[] = [
      {
        id: 'provider-1',
        name: 'Provider 1',
        requiresApiKey: true,
        enabled: true,
        models: [{ id: 'model-1', label: 'Model 1' }]
      },
      {
        id: 'provider-2',
        name: 'Provider 2',
        requiresApiKey: true,
        enabled: true,
        models: [{ id: 'model-2', label: 'Model 2' }]
      }
    ]

    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce(initialProviders)
      .mockReturnValueOnce(updatedProviders)

    const client = new LLMClient()

    // Initially only model-1 is available
    expect(client.getProviderForModel('model-1')).toBeDefined()
    expect(client.getProviderForModel('model-2')).toBeUndefined()

    // Enable another provider
    useStore.getState().setPredefinedProviderEnabled('provider-2', true)

    // Both models should now be available
    expect(client.getProviderForModel('model-1')).toBeDefined()
    expect(client.getProviderForModel('model-2')).toBeDefined()

    // Clean up
    client.dispose()
  })

  it('should properly dispose and unsubscribe', () => {
    const mockProviders: LLMProviderDefinition[] = []
    vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(mockProviders)

    const client = new LLMClient()

    expect(client['unsubscribe']).not.toBeNull()

    client.dispose()

    expect(client['unsubscribe']).toBeNull()
  })
})
