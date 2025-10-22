import { useState } from 'react'
import { Plus, Settings2, Edit, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CustomProviderDialog } from '@/components/CustomProviderDialog'
import { useStore } from '@/state/store'
import { llmProviders } from '@/config/llmProviders'
import type { LLMProviderDefinition } from '@/config/llmProviders'
import type { CustomProviderConfig } from '@/services/llm/types'

interface ProviderSettingsDialogProps {
  open: boolean
  onClose: () => void
}

interface PredefinedProviderCardProps {
  provider: LLMProviderDefinition
  state?: { enabled: boolean; apiKey?: string }
}

function PredefinedProviderCard({ provider, state }: PredefinedProviderCardProps) {
  const setPredefinedProviderEnabled = useStore(
    (state) => state.setPredefinedProviderEnabled
  )
  const setPredefinedProviderApiKey = useStore(
    (state) => state.setPredefinedProviderApiKey
  )

  const enabled = state?.enabled ?? provider.enabled ?? false
  const apiKey = state?.apiKey ?? ''

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{provider.name}</h4>
          <p className="text-xs text-muted-foreground">
            {provider.models.length} {provider.models.length === 1 ? 'model' : 'models'} available
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked: boolean) =>
            setPredefinedProviderEnabled(provider.id, checked)
          }
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

interface CustomProviderCardProps {
  provider: CustomProviderConfig
  onEdit: () => void
  onDelete: () => void
}

function CustomProviderCard({ provider, onEdit, onDelete }: CustomProviderCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{provider.name}</h4>
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
            {!provider.enabled && (
              <Badge variant="outline" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {provider.apiType} • {provider.models.length}{' '}
            {provider.models.length === 1 ? 'model' : 'models'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground truncate" title={provider.baseUrl}>
        {provider.baseUrl}
      </div>
    </div>
  )
}

export function ProviderSettingsDialog({ open, onClose }: ProviderSettingsDialogProps) {
  const predefinedProviders = llmProviders
  const customProviders = useStore((state) => state.settings.customProviders)
  const predefinedState = useStore((state) => state.settings.predefinedProviders)
  const addCustomProvider = useStore((state) => state.addCustomProvider)
  const updateCustomProvider = useStore((state) => state.updateCustomProvider)
  const removeCustomProvider = useStore((state) => state.removeCustomProvider)

  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<CustomProviderConfig | undefined>()

  const handleSaveCustomProvider = (
    config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingProvider) {
      // Update existing provider
      updateCustomProvider(editingProvider.id, config)
    } else {
      // Add new provider
      addCustomProvider(config)
    }
    setShowCustomDialog(false)
    setEditingProvider(undefined)
  }

  const handleDeleteProvider = (id: string) => {
    // TODO: Add confirmation dialog in task 10
    if (confirm('Are you sure you want to delete this provider?')) {
      removeCustomProvider(id)
    }
  }

  const handleEditProvider = (provider: CustomProviderConfig) => {
    setEditingProvider(provider)
    setShowCustomDialog(true)
  }

  const handleAddProvider = () => {
    setEditingProvider(undefined)
    setShowCustomDialog(true)
  }

  // Get existing provider names for validation
  const existingProviderNames = [
    ...predefinedProviders.map((p) => p.name),
    ...customProviders.map((p) => p.name),
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Provider Settings
            </DialogTitle>
            <DialogDescription>
              Configure LLM providers and API keys. Only enabled providers will be available in
              chat nodes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Predefined Providers Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">Predefined Providers</h3>
              <div className="space-y-3">
                {predefinedProviders.map((provider) => (
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
                <Button variant="outline" size="sm" onClick={handleAddProvider}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Provider
                </Button>
              </div>

              {customProviders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                  No custom providers configured
                </div>
              ) : (
                <div className="space-y-3">
                  {customProviders.map((provider) => (
                    <CustomProviderCard
                      key={provider.id}
                      provider={provider}
                      onEdit={() => handleEditProvider(provider)}
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
      </Dialog>

      {/* Custom Provider Dialog */}
      <CustomProviderDialog
        open={showCustomDialog}
        onClose={() => {
          setShowCustomDialog(false)
          setEditingProvider(undefined)
        }}
        provider={editingProvider}
        onSave={handleSaveCustomProvider}
        existingProviderNames={existingProviderNames}
      />
    </>
  )
}
