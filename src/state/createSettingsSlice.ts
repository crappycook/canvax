import { type StateCreator } from 'zustand'
import type { CustomProviderConfig, PredefinedProviderState } from '@/services/llm/types'
import type { LLMProviderDefinition } from '@/config/llmProviders'

/**
 * Settings slice for managing application preferences and provider configurations
 */
export interface SettingsSlice {
  settings: {
    defaultModel: string
    language: 'zh' | 'en'
    autoSave: boolean
    theme: 'light' | 'dark' | 'system'
    apiKeys: Record<string, string>
    maxTokens: number
    temperature: number
    /** State for predefined providers (enabled status and API keys) */
    predefinedProviders: PredefinedProviderState
    /** User-defined custom provider configurations */
    customProviders: CustomProviderConfig[]
  }

  /** Update multiple settings at once */
  updateSettings: (updates: Partial<SettingsSlice['settings']>) => void

  /** Set API key for a provider (legacy method, use setPredefinedProviderApiKey instead) */
  setApiKey: (provider: string, key: string) => void

  /** Remove API key for a provider (legacy method, use removePredefinedProviderApiKey instead) */
  removeApiKey: (provider: string) => void

  /** Reset all settings to default values */
  resetSettings: () => void

  // Predefined provider methods

  /**
   * Enable or disable a predefined provider
   * @param providerId - The ID of the predefined provider (e.g., 'openai', 'anthropic')
   * @param enabled - Whether the provider should be enabled
   */
  setPredefinedProviderEnabled: (providerId: string, enabled: boolean) => void

  /**
   * Set the API key for a predefined provider
   * @param providerId - The ID of the predefined provider
   * @param apiKey - The API key to store
   */
  setPredefinedProviderApiKey: (providerId: string, apiKey: string) => void

  /**
   * Remove the API key for a predefined provider
   * @param providerId - The ID of the predefined provider
   */
  removePredefinedProviderApiKey: (providerId: string) => void

  // Custom provider methods

  /**
   * Add a new custom provider configuration
   * @param config - Provider configuration without id, createdAt, and updatedAt (auto-generated)
   */
  addCustomProvider: (config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => void

  /**
   * Update an existing custom provider configuration
   * @param id - The unique ID of the custom provider
   * @param updates - Partial configuration updates (updatedAt is auto-updated)
   */
  updateCustomProvider: (id: string, updates: Partial<CustomProviderConfig>) => void

  /**
   * Remove a custom provider configuration
   * @param id - The unique ID of the custom provider to remove
   */
  removeCustomProvider: (id: string) => void

  /**
   * Get a custom provider by ID
   * @param id - The unique ID of the custom provider
   * @returns The custom provider configuration or undefined if not found
   */
  getCustomProvider: (id: string) => CustomProviderConfig | undefined

  /**
   * Get all enabled providers (both predefined and custom)
   * @returns Array of enabled provider definitions
   */
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

  /**
   * Enable or disable a predefined provider.
   * Only enabled providers will be available in chat nodes.
   */
  setPredefinedProviderEnabled: (providerId, enabled) => {
    set((state) => {
      const predefinedProviders = state.settings.predefinedProviders || {}
      const currentProvider = predefinedProviders[providerId] || {}
      return {
        settings: {
          ...state.settings,
          predefinedProviders: {
            ...predefinedProviders,
            [providerId]: {
              ...currentProvider,
              enabled
            }
          }
        }
      }
    })
  },

  /**
   * Set the API key for a predefined provider.
   * The API key is stored in browser localStorage.
   */
  setPredefinedProviderApiKey: (providerId, apiKey) => {
    set((state) => {
      const predefinedProviders = state.settings.predefinedProviders || {}
      const currentProvider = predefinedProviders[providerId] || {}
      return {
        settings: {
          ...state.settings,
          predefinedProviders: {
            ...predefinedProviders,
            [providerId]: {
              ...currentProvider,
              apiKey
            }
          }
        }
      }
    })
  },

  /**
   * Remove the API key for a predefined provider.
   * The provider will remain enabled but without an API key.
   */
  removePredefinedProviderApiKey: (providerId) => {
    set((state) => {
      const predefinedProviders = state.settings.predefinedProviders || {}
      const providerState = predefinedProviders[providerId]
      if (!providerState) return state

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { apiKey: _, ...restProviderState } = providerState
      return {
        settings: {
          ...state.settings,
          predefinedProviders: {
            ...predefinedProviders,
            [providerId]: restProviderState
          }
        }
      }
    })
  },

  /**
   * Add a new custom provider.
   * Automatically generates a unique ID and timestamps.
   */
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