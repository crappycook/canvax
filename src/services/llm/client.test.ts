import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LLMClient } from './client'
import { useStore } from '@/state/store'
import * as llmProviders from '@/config/llmProviders'

// Mock the config module
vi.mock('@/config/llmProviders', () => ({
  getEnabledProviders: vi.fn(() => []),
}))

describe('LLMClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Registration', () => {
    it('should register enabled providers on initialization', () => {
      const mockProviders = [
        {
          id: 'openai',
          name: 'OpenAI',
          requiresApiKey: true,
          enabled: true,
          models: [{ id: 'gpt-4', label: 'GPT-4' }],
        },
      ]

      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(mockProviders)

      const client = new LLMClient()

      expect(llmProviders.getEnabledProviders).toHaveBeenCalled()
      expect(client.getAvailableProviders()).toHaveLength(1)
      expect(client.getProviderById('openai')).toBeDefined()
      expect(client.getProviderForModel('gpt-4')).toBeDefined()

      client.dispose()
    })

    it('should create CustomProviderAdapter for custom providers', () => {
      const mockProviders = [
        {
          id: 'custom-123',
          name: 'My Custom Provider',
          requiresApiKey: true,
          enabled: true,
          isCustom: true,
          baseUrl: 'https://api.example.com',
          models: [{ id: 'custom-model', label: 'Custom Model' }],
        },
      ]

      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(mockProviders)

      const client = new LLMClient()

      expect(client.getProviderById('custom-123')).toBeDefined()
      expect(client.getAdapter('custom-123')).toBeDefined()
      expect(client.getProviderForModel('custom-model')).toBeDefined()

      client.dispose()
    })

    it('should map models to providers correctly', () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'Provider 1',
          requiresApiKey: true,
          enabled: true,
          models: [
            { id: 'model-1', label: 'Model 1' },
            { id: 'model-2', label: 'Model 2' },
          ],
        },
      ]

      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(mockProviders)

      const client = new LLMClient()

      expect(client.getProviderForModel('model-1')?.id).toBe('provider-1')
      expect(client.getProviderForModel('model-2')?.id).toBe('provider-1')

      client.dispose()
    })
  })

  describe('Provider Refresh', () => {
    it('should refresh providers when refreshProviders is called', () => {
      const initialProviders = [
        {
          id: 'provider-1',
          name: 'Provider 1',
          requiresApiKey: true,
          enabled: true,
          models: [{ id: 'model-1', label: 'Model 1' }],
        },
      ]

      const updatedProviders = [
        {
          id: 'provider-2',
          name: 'Provider 2',
          requiresApiKey: true,
          enabled: true,
          models: [{ id: 'model-2', label: 'Model 2' }],
        },
      ]

      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(initialProviders)

      const client = new LLMClient()

      expect(client.getProviderById('provider-1')).toBeDefined()
      expect(client.getProviderById('provider-2')).toBeUndefined()

      // Update mock to return different providers
      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(updatedProviders)

      client.refreshProviders()

      expect(client.getProviderById('provider-1')).toBeUndefined()
      expect(client.getProviderById('provider-2')).toBeDefined()

      client.dispose()
    })

    it('should clear model mappings when refreshing', () => {
      const initialProviders = [
        {
          id: 'provider-1',
          name: 'Provider 1',
          requiresApiKey: true,
          enabled: true,
          models: [{ id: 'model-1', label: 'Model 1' }],
        },
      ]

      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue(initialProviders)

      const client = new LLMClient()

      expect(client.getProviderForModel('model-1')).toBeDefined()

      // Update to empty providers
      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue([])

      client.refreshProviders()

      expect(client.getProviderForModel('model-1')).toBeUndefined()

      client.dispose()
    })
  })

  describe('Settings Store Subscription', () => {
    it('should subscribe to settings changes on initialization', () => {
      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue([])

      const client = new LLMClient()

      // Verify that the client has subscribed (unsubscribe function exists)
      expect(client['unsubscribe']).toBeDefined()

      client.dispose()
    })

    it('should clean up subscription on dispose', () => {
      vi.mocked(llmProviders.getEnabledProviders).mockReturnValue([])

      const client = new LLMClient()

      expect(client['unsubscribe']).toBeDefined()

      client.dispose()

      expect(client['unsubscribe']).toBeNull()
    })
  })
})
