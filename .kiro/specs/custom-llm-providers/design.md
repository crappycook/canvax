# Design Document

## Overview

This design document outlines the architecture for enabling users to add custom LLM providers to the Canvas application. The design extends the existing provider system to support user-defined providers with OpenAI-compatible APIs, while maintaining clear separation between predefined providers (configured in `llmProviders.json`) and custom providers (stored in user settings).

**Key Change**: Provider settings are moved from the canvas workspace to the Project Hub page, making provider configuration a global setting accessible before entering any project. Chat nodes can only select from enabled providers.

The core design principle is **extensibility without complexity**: custom providers integrate seamlessly with the existing provider adapter system, reusing the OpenAI adapter infrastructure while adding minimal new code.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  Project Hub Page                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Header with "Provider Settings" Button              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Project List                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (Click Provider Settings)
┌─────────────────────────────────────────────────────────────┐
│            Provider Settings Dialog                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Predefined Providers Section                        │   │
│  │  - OpenAI (toggle, API key input)                    │   │
│  │  - DeepSeek (toggle, API key input)                  │   │
│  │  - Google Gemini (toggle, API key input)             │   │
│  │  - Anthropic (toggle, API key input)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Custom Providers Section                            │   │
│  │  - Add Custom Provider Button                        │   │
│  │  - Custom Provider Cards (Edit/Delete)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (Click Add Custom Provider)
┌─────────────────────────────────────────────────────────────┐
│         Custom Provider Dialog                              │
│  - Provider Name                                            │
│  - API Type (dropdown)                                      │
│  - API Key                                                  │
│  - Base URL                                                 │
│  - Models Management                                        │
│  - Enable Provider Toggle                                  │
│  - Test Connection Button                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Settings Store (Zustand)                     │   │
│  │  - predefinedProviders: { [id]: { enabled, apiKey }}│   │
│  │  - customProviders: CustomProviderConfig[]          │   │
│  │  - addCustomProvider()                               │   │
│  │  - updateCustomProvider()                            │   │
│  │  - removeCustomProvider()                            │   │
│  │  - setPredefinedProviderEnabled()                    │   │
│  │  - setPredefinedProviderApiKey()                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LLM Client                                 │   │
│  │  - Loads predefined providers from JSON             │   │
│  │  - Loads custom providers from settings             │   │
│  │  - Filters to only enabled providers                │   │
│  │  - Creates adapters for enabled providers           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Canvas Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chat Node Model Selector                            │   │
│  │  - Shows only enabled providers' models              │   │
│  │  - Displays custom provider badge                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization

```
src/
├── app/pages/
│   ├── ProjectHubPage.tsx              # Add Provider Settings button
│   └── ProviderSettingsDialog.tsx      # New: Main provider settings dialog
├── components/
│   ├── CustomProviderDialog.tsx        # New: Dialog for add/edit custom provider
│   ├── PredefinedProviderCard.tsx      # New: Card for predefined provider config
│   └── CustomProviderCard.tsx          # New: Card for custom provider display
├── state/
│   └── createSettingsSlice.ts          # Extended with provider management
├── services/llm/
│   ├── client.ts                       # Extended to filter enabled providers
│   ├── types.ts                        # Add provider config interfaces
│   └── providers/
│       └── custom.ts                   # New: Custom provider adapter
└── config/
    ├── llmProviders.json               # Extended with enabled field
    └── llmProviders.ts                 # Extended to merge and filter providers
```

## Components and Interfaces

### Core Type Definitions

**Custom Provider Configuration**
```typescript
interface CustomProviderConfig {
  id: string                    // UUID or timestamp-based unique ID
  name: string                  // User-defined provider name
  apiType: 'OpenAI' | 'Anthropic' | 'Google' | 'Custom'
  baseUrl: string              // Base URL for API endpoint
  apiKey: string               // API key for authentication
  models: CustomModelConfig[]  // Available models
  enabled: boolean             // Whether provider is active
  createdAt: number            // Timestamp for sorting
  updatedAt: number            // Last modification timestamp
}

interface CustomModelConfig {
  id: string                   // Model identifier
  label: string                // Display name
}
```

**Predefined Provider State**
```typescript
interface PredefinedProviderState {
  [providerId: string]: {
    enabled: boolean           // Whether provider is enabled
    apiKey?: string           // API key if configured
  }
}
```

**Extended Provider Definition**
```typescript
interface LLMProviderDefinition {
  id: string
  name: string
  requiresApiKey?: boolean
  enabled: boolean             // Default enabled status from JSON
  models: LLMModelDefinition[]
  isCustom?: boolean           // Flag to identify custom providers
  baseUrl?: string             // Custom base URL for custom providers
}
```

### Settings Store Extension

The existing `SettingsSlice` will be extended to manage both predefined and custom providers:

```typescript
export interface SettingsSlice {
  settings: {
    // ... existing fields
    predefinedProviders: PredefinedProviderState
    customProviders: CustomProviderConfig[]
  }
  
  // ... existing methods
  
  // Predefined provider methods
  setPredefinedProviderEnabled: (providerId: string, enabled: boolean) => void
  setPredefinedProviderApiKey: (providerId: string, apiKey: string) => void
  removePredefinedProviderApiKey: (providerId: string) => void
  
  // Custom provider methods
  addCustomProvider: (config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomProvider: (id: string, updates: Partial<CustomProviderConfig>) => void
  removeCustomProvider: (id: string) => void
  getCustomProvider: (id: string) => CustomProviderConfig | undefined
  
  // Helper to get all enabled providers
  getEnabledProviders: () => LLMProviderDefinition[]
}
```

**Implementation Strategy:**
```typescript
export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: {
    // ... existing settings
    predefinedProviders: {},
    customProviders: []
  },

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

  getEnabledProviders: () => {
    const state = get()
    const predefined = llmProviders.filter(p => 
      state.settings.predefinedProviders[p.id]?.enabled ?? p.enabled
    )
    const custom = state.settings.customProviders.filter(p => p.enabled)
    return [...predefined, ...custom.map(c => ({
      id: c.id,
      name: c.name,
      requiresApiKey: true,
      enabled: true,
      models: c.models,
      isCustom: true,
      baseUrl: c.baseUrl
    }))]
  }
})
```

## UI Components Design

### Project Hub Page Extension

The `ProjectHubPage` will be extended to include a Provider Settings button:

```tsx
export default function ProjectHubPage() {
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  
  return (
    <div className="...">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Canvax</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage your AI workflow projects
          </p>
          
          {/* Provider Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProviderSettings(true)}
            className="mt-4"
          >
            <Settings className="h-4 w-4 mr-2" />
            Provider Settings
          </Button>
        </div>
        
        {/* ... existing project list ... */}
      </div>
      
      {/* Provider Settings Dialog */}
      <ProviderSettingsDialog
        open={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
      />
    </div>
  )
}
```

### Provider Settings Dialog Component

A new dialog component for managing all providers:

```tsx
interface ProviderSettingsDialogProps {
  open: boolean
  onClose: () => void
}

function ProviderSettingsDialog({ open, onClose }: ProviderSettingsDialogProps) {
  const predefinedProviders = llmProviders
  const customProviders = useStore(state => state.settings.customProviders)
  const predefinedState = useStore(state => state.settings.predefinedProviders)
  
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<CustomProviderConfig | undefined>()
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provider Settings</DialogTitle>
          <DialogDescription>
            Configure LLM providers and API keys. Only enabled providers will be available in chat nodes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Predefined Providers Section */}
          <section>
            <h3 className="text-sm font-medium mb-3">Predefined Providers</h3>
            <div className="space-y-3">
              {predefinedProviders.map(provider => (
                <PredefinedProviderCard
                  key={provider.id}
                  provider={provider}
                  state={predefinedState[provider.id]}
                />
              ))}
            </div>
          </section>
          
          {/* Custom Providers Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Custom Providers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingProvider(undefined)
                  setShowCustomDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Provider
              </Button>
            </div>
            
            {customProviders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No custom providers configured
              </div>
            ) : (
              <div className="space-y-3">
                {customProviders.map(provider => (
                  <CustomProviderCard
                    key={provider.id}
                    provider={provider}
                    onEdit={() => {
                      setEditingProvider(provider)
                      setShowCustomDialog(true)
                    }}
                    onDelete={() => handleDeleteProvider(provider.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Custom Provider Dialog */}
      <CustomProviderDialog
        open={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        provider={editingProvider}
        onSave={handleSaveCustomProvider}
      />
    </Dialog>
  )
}
```

### Predefined Provider Card Component

```tsx
interface PredefinedProviderCardProps {
  provider: LLMProviderDefinition
  state?: { enabled: boolean; apiKey?: string }
}

function PredefinedProviderCard({ provider, state }: PredefinedProviderCardProps) {
  const setPredefinedProviderEnabled = useStore(state => state.setPredefinedProviderEnabled)
  const setPredefinedProviderApiKey = useStore(state => state.setPredefinedProviderApiKey)
  
  const enabled = state?.enabled ?? provider.enabled
  const apiKey = state?.apiKey ?? ''
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{provider.name}</h4>
          <p className="text-xs text-muted-foreground">
            {provider.models.length} models available
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => setPredefinedProviderEnabled(provider.id, checked)}
        />
      </div>
      
      {provider.requiresApiKey && (
        <div className="space-y-2">
          <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
          <Input
            id={`api-key-${provider.id}`}
            type="password"
            placeholder={`Enter your ${provider.name} API key`}
            value={apiKey}
            onChange={(e) => setPredefinedProviderApiKey(provider.id, e.target.value)}
            disabled={!enabled}
          />
        </div>
      )}
    </div>
  )
}
```

### Custom Provider Card Component

```tsx
interface CustomProviderCardProps {
  provider: CustomProviderConfig
  onEdit: () => void
  onDelete: () => void
}

function CustomProviderCard({ provider, onEdit, onDelete }: CustomProviderCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{provider.name}</h4>
            <Badge variant="secondary" className="text-xs">Custom</Badge>
            {!provider.enabled && <Badge variant="outline">Disabled</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {provider.apiType} • {provider.models.length} models
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground truncate">
        {provider.baseUrl}
      </div>
    </div>
  )
}
```

### Custom Provider Dialog Component

(Same as previous design, no changes needed)

## Service Layer Design

### Provider Configuration Merging

The `llmProviders.ts` module will be extended to merge and filter providers:

```typescript
import rawProviders from './llmProviders.json' with { type: 'json' }
import { useStore } from '@/state/store'

// ... existing interfaces

// Get only enabled providers
export function getEnabledProviders(): LLMProviderDefinition[] {
  const state = useStore.getState()
  const predefinedState = state.settings.predefinedProviders
  const customProviders = state.settings.customProviders
  
  // Filter predefined providers by enabled status
  const enabledPredefined = (rawProviders as LLMProviderDefinition[])
    .filter(p => predefinedState[p.id]?.enabled ?? p.enabled)
    .map(p => ({
      ...p,
      apiKey: predefinedState[p.id]?.apiKey
    }))
  
  // Filter custom providers by enabled status
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

// Export enabled providers and models
export const llmProviders: readonly LLMProviderDefinition[] = getEnabledProviders()

export const llmModels: readonly FlattenedModelDefinition[] = getEnabledProviders().flatMap(provider =>
  provider.models.map(model => ({
    ...model,
    providerId: provider.id,
    providerName: provider.name,
    isCustom: provider.isCustom ?? false
  }))
)

// Refresh function to be called when settings change
export function refreshProviders() {
  // This will be called by the LLM Client when provider settings change
}
```

### LLM Client Integration

The LLM Client will be updated to only register enabled providers:

```typescript
export class LLMClient {
  private providers: Map<string, LLMProviderAdapter>
  private modelToProvider: Map<string, string>
  
  constructor() {
    this.providers = new Map()
    this.modelToProvider = new Map()
    
    // Register only enabled providers
    this.registerEnabledProviders()
  }
  
  private registerEnabledProviders() {
    const enabledProviders = getEnabledProviders()
    
    enabledProviders.forEach(provider => {
      if (provider.isCustom) {
        // Register custom provider
        const adapter = new CustomProviderAdapter(provider.id, provider.baseUrl!)
        this.registerProvider(adapter)
      } else {
        // Register predefined provider (existing logic)
        // ...
      }
      
      // Map models to provider
      provider.models.forEach(model => {
        this.modelToProvider.set(model.id, provider.id)
      })
    })
  }
  
  // Method to refresh providers when settings change
  refreshProviders() {
    // Clear existing providers
    this.providers.clear()
    this.modelToProvider.clear()
    
    // Re-register enabled providers
    this.registerEnabledProviders()
  }
  
  // ... rest of existing methods
}
```

## Data Flow

### Configuring Providers from Project Hub

1. User clicks "Provider Settings" button on Project Hub page
2. `ProviderSettingsDialog` opens showing all providers
3. User enables/disables predefined providers and enters API keys
4. User adds/edits/deletes custom providers
5. Changes are saved to Settings Store
6. Zustand persist middleware saves to localStorage
7. LLM Client refreshes provider registry
8. Chat nodes now show only enabled providers

### Selecting Provider in Chat Node

1. User opens model selector in chat node
2. Model selector calls `getEnabledProviders()` to get available providers
3. Only enabled providers' models are displayed
4. Custom provider models show "Custom" badge
5. User selects a model
6. Chat node stores selected model ID
7. On execution, LLM Client resolves model to enabled provider

## Error Handling

### Missing Provider Configuration

If a chat node references a provider that is no longer enabled:

```typescript
function handleMissingProvider(modelId: string) {
  const provider = findProviderByModel(modelId)
  
  if (!provider) {
    return {
      error: 'Provider not found or disabled',
      message: 'The selected provider is no longer available. Please configure providers in Project Hub settings.',
      action: 'Open Provider Settings'
    }
  }
}
```

## Security Considerations

Same as previous design, with additional consideration:
- Provider settings are global and persist across all projects
- API keys are stored in localStorage (same as before)
- Users should be warned about browser storage security

## Testing Strategy

### Unit Tests
- Test `getEnabledProviders()` filtering logic
- Test predefined provider state management
- Test custom provider CRUD operations
- Test provider refresh logic

### Integration Tests
- Test complete flow: configure provider in Project Hub → use in chat node
- Test enabling/disabling providers
- Test custom provider with chat node execution
- Test persistence across page reloads

## Implementation Considerations

### Provider Refresh Strategy

Providers need to be refreshed when:
- Provider settings dialog is closed
- Custom provider is added/updated/deleted
- Predefined provider is enabled/disabled
- Application initializes

Implement a subscription to settings store changes:

```typescript
useStore.subscribe(
  (state) => state.settings.predefinedProviders,
  () => llmClient.refreshProviders()
)

useStore.subscribe(
  (state) => state.settings.customProviders,
  () => llmClient.refreshProviders()
)
```

### Backward Compatibility

Existing projects may have chat nodes with models from disabled providers. Handle gracefully:
- Show warning in chat node if provider is disabled
- Provide link to enable provider in settings
- Don't break execution, just show clear error message

## Future Enhancements

- Provider templates for popular services (Ollama, LM Studio, etc.)
- Bulk import/export of provider configurations
- Provider health monitoring and status indicators
- Per-project provider overrides
- Provider usage statistics and cost tracking
