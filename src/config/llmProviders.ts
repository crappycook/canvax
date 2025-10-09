import rawProviders from './llmProviders.json' with { type: 'json' }

export interface LLMModelDefinition {
  id: string
  label: string
}

export interface LLMProviderDefinition {
  id: string
  name: string
  requiresApiKey?: boolean
  models: LLMModelDefinition[]
}

export interface FlattenedModelDefinition extends LLMModelDefinition {
  providerId: string
  providerName: string
}

const providers = rawProviders as LLMProviderDefinition[]

export const llmProviders: readonly LLMProviderDefinition[] = providers

export const llmModels: readonly FlattenedModelDefinition[] = providers.flatMap(provider =>
  provider.models.map(model => ({
    ...model,
    providerId: provider.id,
    providerName: provider.name,
  }))
)

export function findProviderById(providerId: string | null | undefined): LLMProviderDefinition | undefined {
  if (!providerId) return undefined
  return providers.find(provider => provider.id === providerId)
}

export function findProviderByModel(modelId: string | null | undefined): LLMProviderDefinition | undefined {
  if (!modelId) return undefined
  return providers.find(provider => provider.models.some(model => model.id === modelId))
}

export function findModelById(modelId: string | null | undefined): FlattenedModelDefinition | undefined {
  if (!modelId) return undefined
  return llmModels.find(model => model.id === modelId)
}
