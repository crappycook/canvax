import { type StateCreator } from 'zustand'
import type { CustomProviderConfig, PredefinedProviderState } from '@/services/llm/types'
import type { LLMProviderDefinition } from '@/config/llmProviders'

export interface SettingsSlice {
  settings: {
    defaultModel: string
    language: 'zh' | 'en'
    autoSave: boolean
    theme: 'light' | 'dark' | 'system'
    apiKeys: Record<string, string>
    maxTokens: number
    temperature: number
    predefinedProviders: PredefinedProviderState
    customProviders: CustomProviderConfig[]
  }
  
  updateSettings: (updates: Partial<SettingsSlice['settings']>) => void
  setApiKey: (provider: string, key: string) => void
  removeApiKey: (provider: string) => void
  resetSettings: () => void
  
  // Predefined provider methods
  setPredefinedProviderEnabled: (providerId: string, enabled: boolean) => void
  setPredefinedProviderApiKey: (providerId: string, apiKey: string) => void
  removePredefinedProviderApiKey: (providerId: string) => void
  
  // Custom provider methods
  addCustomProvider: (config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomProvider: (id: string, updates: Partial<CustomProviderConfig>) => void
  removeCustomProvider: (id: string) => void
  getCustomProvider: (id: string) => CustomProviderConfig | undefined
  getEnabledProviders: () => LLMProviderDefinition[]
}

/**
 * Generate a unique ID for custom providers
 * Format: custom-${timestamp}-${random}
 */
function generateUniqueId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `custom-${timestamp}-${random}`
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: {
    defaultModel: 'gpt-4o',
    language: 'en',
    autoSave: true,
    theme: 'system',
    apiKeys: {},
    maxTokens: 1000,
    temperature: 0.7,
    predefinedProviders: {},
    customProviders: []
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }))
  },

  setApiKey: (provider, key) => {
    set((state) => ({
      settings: {
        ...state.settings,
        apiKeys: { ...state.settings.apiKeys, [provider]: key }
      }
    }))
  },

  removeApiKey: (provider) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [provider]: _, ...apiKeys } = state.settings.apiKeys
      return {
        settings: { ...state.settings, apiKeys }
      }
    })
  },

  resetSettings: () => {
    set({
      settings: {
        defaultModel: 'gpt-4o',
        language: 'en',
        autoSave: true,
        theme: 'system',
        apiKeys: {},
        maxTokens: 1000,
        temperature: 0.7,
        predefinedProviders: {},
        customProviders: []
      }
    })
  },

  // Predefined provider methods
  setPredefinedProviderEnabled: (providerId, enabled) => {
    set((state) => ({
      settings: {
        ...state.settings,
        predefinedProviders: {
          ...state.settings.predefinedProviders,
          [providerId]: {
            ...state.settings.predefinedProviders[providerId],
            enabled
          }
        }
      }
    }))
  },

  setPredefinedProviderApiKey: (providerId, apiKey) => {
    set((state) => ({
      settings: {
        ...state.settings,
        predefinedProviders: {
          ...state.settings.predefinedProviders,
          [providerId]: {
            ...state.settings.predefinedProviders[providerId],
            apiKey
          }
        }
      }
    }))
  },

  removePredefinedProviderApiKey: (providerId) => {
    set((state) => {
      const providerState = state.settings.predefinedProviders[providerId]
      if (!providerState) return state

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { apiKey: _, ...restProviderState } = providerState
      return {
        settings: {
          ...state.settings,
          predefinedProviders: {
            ...state.settings.predefinedProviders,
            [providerId]: restProviderState
          }
        }
      }
    })
  },

  // Custom provider methods
  addCustomProvider: (config) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customProviders: [
          ...state.settings.customProviders,
          {
            ...config,
            id: generateUniqueId(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ]
      }
    }))
  },

  updateCustomProvider: (id, updates) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customProviders: state.settings.customProviders.map(provider =>
          provider.id === id
            ? { ...provider, ...updates, updatedAt: Date.now() }
            : provider
        )
      }
    }))
  },

  removeCustomProvider: (id) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customProviders: state.settings.customProviders.filter(p => p.id !== id)
      }
    }))
  },

  getCustomProvider: (id) => {
    const state = get()
    return state.settings.customProviders.find(p => p.id === id)
  },

  getEnabledProviders: () => {
    // Import dynamically to avoid circular dependency
    // This delegates to the llmProviders module which has the full implementation
    const { getEnabledProviders } = require('@/config/llmProviders')
    return getEnabledProviders()
  }
})