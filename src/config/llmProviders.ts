import rawProviders from './llmProviders.json' with { type: 'json' }

export interface LLMModelDefinition {
  id: string
  label: string
}

export interface LLMProviderDefinition {
  id: string
  name: string
  requiresApiKey?: boolean
  enabled?: boolean
  isCustom?: boolean
  baseUrl?: string
  models: LLMModelDefinition[]
}

export interface FlattenedModelDefinition extends LLMModelDefinition {
  providerId: string
  providerName: string
  isCustom?: boolean
}

// Store reference to the store getter function
let getStoreState: (() => { settings: { predefinedProviders: any; customProviders: any[] } }) | null = null

/**
 * Initialize the provider configuration with store access
 * This should be called once during app initialization
 */
export function initializeProviderConfig(storeGetter: () => { settings: { predefinedProviders: any; customProviders: any[] } }) {
  getStoreState = storeGetter
}

/**
 * Get all enabled providers (both predefined and custom)
 * Filters predefined providers by enabled status and merges with enabled custom providers
 */
export function getEnabledProviders(): LLMProviderDefinition[] {
  const predefinedProviders = rawProviders as LLMProviderDefinition[]
  
  // If store is not initialized, return predefined providers with default enabled status
  if (!getStoreState) {
    return predefinedProviders.filter(p => p.enabled ?? false)
  }
  
  const state = getStoreState()
  const predefinedState = state.settings.predefinedProviders || {}
  const customProviders = state.settings.customProviders || []
  
  // Filter predefined providers by enabled status
  // Use state.enabled if available, otherwise fall back to JSON default
  const enabledPredefined = predefinedProviders
    .filter(p => {
      const stateConfig = predefinedState[p.id]
      return stateConfig?.enabled ?? p.enabled ?? false
    })
    .map(p => ({
      ...p,
      enabled: true, // Mark as enabled since we filtered
      apiKey: predefinedState[p.id]?.apiKey
    }))
  
  // Filter custom providers by enabled status and convert to provider definition format
  const enabledCustom = customProviders
    .filter(p => p.enabled)
    .map(c => ({
      id: c.id,
      name: c.name,
      requiresApiKey: true,
      enabled: true,
      models: c.models,
      isCustom: true,
      baseUrl: c.baseUrl
    }))
  
  return [...enabledPredefined, ...enabledCustom]
}

/**
 * Get all enabled providers
 * Components should call this function to get the current list of enabled providers
 */
export function getLLMProviders(): readonly LLMProviderDefinition[] {
  return getEnabledProviders()
}

/**
 * Get all models from enabled providers with isCustom flag
 * Components should call this function to get the current list of models
 */
export function getLLMModels(): readonly FlattenedModelDefinition[] {
  return getEnabledProviders().flatMap(provider =>
    provider.models.map(model => ({
      ...model,
      providerId: provider.id,
      providerName: provider.name,
      isCustom: provider.isCustom ?? false
    }))
  )
}

/**
 * Legacy constant exports for backward compatibility
 * Note: These are evaluated at module load time and won't reflect runtime changes
 * Use getLLMProviders() and getLLMModels() for dynamic access
 */
export const llmProviders: readonly LLMProviderDefinition[] = rawProviders as LLMProviderDefinition[]
export const llmModels: readonly FlattenedModelDefinition[] = (rawProviders as LLMProviderDefinition[]).flatMap(provider =>
  provider.models.map(model => ({
    ...model,
    providerId: provider.id,
    providerName: provider.name,
    isCustom: false
  }))
)

/**
 * Find a provider by ID from enabled providers
 */
export function findProviderById(providerId: string | null | undefined): LLMProviderDefinition | undefined {
  if (!providerId) return undefined
  return getEnabledProviders().find(provider => provider.id === providerId)
}

/**
 * Find a provider by model ID from enabled providers
 */
export function findProviderByModel(modelId: string | null | undefined): LLMProviderDefinition | undefined {
  if (!modelId) return undefined
  return getEnabledProviders().find(provider => provider.models.some(model => model.id === modelId))
}

/**
 * Find a model by ID from enabled providers
 */
export function findModelById(modelId: string | null | undefined): FlattenedModelDefinition | undefined {
  if (!modelId) return undefined
  const enabledModels = getEnabledProviders().flatMap(provider =>
    provider.models.map(model => ({
      ...model,
      providerId: provider.id,
      providerName: provider.name,
      isCustom: provider.isCustom ?? false
    }))
  )
  return enabledModels.find(model => model.id === modelId)
}

/**
 * Refresh providers - forces re-evaluation of enabled providers
 * This should be called when provider settings change
 * Note: Since we're using getEnabledProviders() dynamically, this is mainly
 * for triggering any side effects or cache invalidation if needed
 */
export function refreshProviders(): void {
  // The getEnabledProviders() function already reads fresh state
  // This function exists for API compatibility and future enhancements
  // Components using llmProviders/llmModels should re-read them after calling this
}
