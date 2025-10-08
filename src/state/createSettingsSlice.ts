import { type StateCreator } from 'zustand'

export interface SettingsSlice {
  settings: {
    defaultModel: string
    language: 'zh' | 'en'
    autoSave: boolean
    theme: 'light' | 'dark' | 'system'
    apiKeys: Record<string, string>
    maxTokens: number
    temperature: number
  }
  
  updateSettings: (updates: Partial<SettingsSlice['settings']>) => void
  setApiKey: (provider: string, key: string) => void
  removeApiKey: (provider: string) => void
  resetSettings: () => void
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: {
    defaultModel: 'gpt-4',
    language: 'en',
    autoSave: true,
    theme: 'system',
    apiKeys: {},
    maxTokens: 1000,
    temperature: 0.7
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
        defaultModel: 'gpt-4',
        language: 'en',
        autoSave: true,
        theme: 'system',
        apiKeys: {},
        maxTokens: 1000,
        temperature: 0.7
      }
    })
  }
})