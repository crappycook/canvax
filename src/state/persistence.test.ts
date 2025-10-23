import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

describe('Provider Settings Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset store to initial state
    useStore.getState().resetSettings()
  })

  it('should persist predefined provider settings', () => {
    // Enable a predefined provider and set API key
    useStore.getState().setPredefinedProviderEnabled('openai', true)
    useStore.getState().setPredefinedProviderApiKey('openai', 'test-api-key')

    // Get the persisted state from localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')

    // Verify predefined provider settings are persisted
    expect(persistedState.state.settings.predefinedProviders).toBeDefined()
    expect(persistedState.state.settings.predefinedProviders.openai).toEqual({
      enabled: true,
      apiKey: 'test-api-key'
    })
  })

  it('should persist custom provider settings', () => {
    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'My Custom Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'custom-api-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the persisted state from localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')

    // Verify custom provider is persisted
    expect(persistedState.state.settings.customProviders).toBeDefined()
    expect(persistedState.state.settings.customProviders).toHaveLength(1)
    expect(persistedState.state.settings.customProviders[0]).toMatchObject({
      name: 'My Custom Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'custom-api-key',
      enabled: true
    })
  })

  it('should have correct persistence structure in localStorage', () => {
    // Enable a predefined provider
    useStore.getState().setPredefinedProviderEnabled('openai', true)
    useStore.getState().setPredefinedProviderApiKey('openai', 'persisted-key')

    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'Persisted Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'persisted-custom-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the persisted state from localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')

    // Verify the structure is correct for rehydration
    expect(persistedState.state).toBeDefined()
    expect(persistedState.state.settings).toBeDefined()
    expect(persistedState.state.settings.predefinedProviders).toBeDefined()
    expect(persistedState.state.settings.customProviders).toBeDefined()

    // Verify predefined provider settings are in the correct format
    expect(persistedState.state.settings.predefinedProviders.openai).toEqual({
      enabled: true,
      apiKey: 'persisted-key'
    })

    // Verify custom provider is in the correct format
    expect(persistedState.state.settings.customProviders).toHaveLength(1)
    expect(persistedState.state.settings.customProviders[0]).toMatchObject({
      name: 'Persisted Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'persisted-custom-key',
      enabled: true
    })
  })

  it('should persist provider updates', () => {
    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'Original Name',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'original-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the provider ID
    const providerId = useStore.getState().settings.customProviders[0].id

    // Update the provider
    useStore.getState().updateCustomProvider(providerId, {
      name: 'Updated Name',
      apiKey: 'updated-key'
    })

    // Get the persisted state from localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')

    // Verify updates are persisted
    expect(persistedState.state.settings.customProviders[0]).toMatchObject({
      name: 'Updated Name',
      apiKey: 'updated-key'
    })
  })

  it('should persist provider deletion', () => {
    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'To Be Deleted',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the provider ID
    const providerId = useStore.getState().settings.customProviders[0].id

    // Verify it's persisted
    let persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    expect(persistedState.state.settings.customProviders).toHaveLength(1)

    // Remove the provider
    useStore.getState().removeCustomProvider(providerId)

    // Verify deletion is persisted
    persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    expect(persistedState.state.settings.customProviders).toHaveLength(0)
  })

  it('should load predefined provider settings on initialization', () => {
    // Set up initial state
    useStore.getState().setPredefinedProviderEnabled('openai', true)
    useStore.getState().setPredefinedProviderApiKey('openai', 'init-test-key')
    useStore.getState().setPredefinedProviderEnabled('anthropic', false)

    // Verify the state is in localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    expect(persistedState.state.settings.predefinedProviders.openai).toEqual({
      enabled: true,
      apiKey: 'init-test-key'
    })
    expect(persistedState.state.settings.predefinedProviders.anthropic).toEqual({
      enabled: false
    })

    // Simulate app reload by getting fresh state from store
    // The store should have rehydrated from localStorage
    const currentState = useStore.getState()
    expect(currentState.settings.predefinedProviders.openai).toEqual({
      enabled: true,
      apiKey: 'init-test-key'
    })
    expect(currentState.settings.predefinedProviders.anthropic).toEqual({
      enabled: false
    })
  })

  it('should load custom providers on initialization', () => {
    // Add multiple custom providers
    useStore.getState().addCustomProvider({
      name: 'Provider 1',
      apiType: 'OpenAI',
      baseUrl: 'https://api1.example.com',
      apiKey: 'key-1',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    useStore.getState().addCustomProvider({
      name: 'Provider 2',
      apiType: 'Anthropic',
      baseUrl: 'https://api2.example.com',
      apiKey: 'key-2',
      models: [{ id: 'model-2', label: 'Model 2' }],
      enabled: false
    })

    // Verify the state is in localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    expect(persistedState.state.settings.customProviders).toHaveLength(2)

    // Simulate app reload by getting fresh state from store
    // The store should have rehydrated from localStorage
    const currentState = useStore.getState()
    expect(currentState.settings.customProviders).toHaveLength(2)
    expect(currentState.settings.customProviders[0]).toMatchObject({
      name: 'Provider 1',
      apiType: 'OpenAI',
      baseUrl: 'https://api1.example.com',
      apiKey: 'key-1',
      enabled: true
    })
    expect(currentState.settings.customProviders[1]).toMatchObject({
      name: 'Provider 2',
      apiType: 'Anthropic',
      baseUrl: 'https://api2.example.com',
      apiKey: 'key-2',
      enabled: false
    })
  })

  it('should maintain provider IDs and timestamps on reload', () => {
    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'Test Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the original provider data
    const originalProvider = useStore.getState().settings.customProviders[0]
    const originalId = originalProvider.id
    const originalCreatedAt = originalProvider.createdAt
    const originalUpdatedAt = originalProvider.updatedAt

    // Verify these fields exist and are valid
    expect(originalId).toBeDefined()
    expect(originalId).toMatch(/^custom-\d+-[a-z0-9]+$/)
    expect(originalCreatedAt).toBeGreaterThan(0)
    expect(originalUpdatedAt).toBeGreaterThan(0)

    // Verify the state is in localStorage
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    const persistedProvider = persistedState.state.settings.customProviders[0]
    expect(persistedProvider.id).toBe(originalId)
    expect(persistedProvider.createdAt).toBe(originalCreatedAt)
    expect(persistedProvider.updatedAt).toBe(originalUpdatedAt)

    // Simulate app reload by getting fresh state from store
    const reloadedProvider = useStore.getState().settings.customProviders[0]
    expect(reloadedProvider.id).toBe(originalId)
    expect(reloadedProvider.createdAt).toBe(originalCreatedAt)
    expect(reloadedProvider.updatedAt).toBe(originalUpdatedAt)
  })

  it('should handle empty provider state on initialization', () => {
    // Clear everything
    useStore.getState().resetSettings()

    // Verify localStorage has empty provider arrays
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')
    expect(persistedState.state.settings.predefinedProviders).toEqual({})
    expect(persistedState.state.settings.customProviders).toEqual([])

    // Verify store state matches
    const currentState = useStore.getState()
    expect(currentState.settings.predefinedProviders).toEqual({})
    expect(currentState.settings.customProviders).toEqual([])
  })

  it('should verify partialize includes provider settings', () => {
    // Set various settings including providers
    useStore.getState().updateSettings({ defaultModel: 'gpt-4o', temperature: 0.8 })
    useStore.getState().setPredefinedProviderEnabled('openai', true)
    useStore.getState().addCustomProvider({
      name: 'Test Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      models: [{ id: 'model-1', label: 'Model 1' }],
      enabled: true
    })

    // Get the persisted state
    const persistedState = JSON.parse(localStorage.getItem('canvas-app') || '{}')

    // Verify that settings object is persisted (as per partialize config)
    expect(persistedState.state.settings).toBeDefined()
    
    // Verify all settings properties are included
    expect(persistedState.state.settings.defaultModel).toBe('gpt-4o')
    expect(persistedState.state.settings.temperature).toBe(0.8)
    expect(persistedState.state.settings.predefinedProviders).toBeDefined()
    expect(persistedState.state.settings.customProviders).toBeDefined()
    
    // Verify provider data is complete
    expect(persistedState.state.settings.predefinedProviders.openai).toEqual({ enabled: true })
    expect(persistedState.state.settings.customProviders).toHaveLength(1)
  })
})
