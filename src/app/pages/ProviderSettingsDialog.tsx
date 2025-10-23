import { useState } from 'react'
import { Plus, Settings2, Edit, Trash2, Eye, EyeOff, ShieldAlert, Server, Key, Link2 } from 'lucide-react'
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
import { AlertDialog } from '@/components/ui/alert-dialog'
import { CustomProviderDialog } from '@/components/CustomProviderDialog'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useStore } from '@/state/store'
import { llmProviders, findProviderByModel } from '@/config/llmProviders'
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

  const [showApiKey, setShowApiKey] = useState(false)
  const enabled = state?.enabled ?? provider.enabled ?? false
  const apiKey = state?.apiKey ?? ''

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">{provider.name}</h4>
            <p className="text-xs text-muted-foreground">
              {provider.models.length} {provider.models.length === 1 ? 'model' : 'models'} available
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked: boolean) =>
            setPredefinedProviderEnabled(provider.id, checked)
          }
        />
      </div>

      {provider.requiresApiKey && (
        <div className="space-y-2 pt-2">
          <Label htmlFor={`api-key-${provider.id}`} className="flex items-center gap-1.5 text-xs">
            <Key className="h-3.5 w-3.5" />
            API Key
          </Label>
          <div className="relative">
            <Input
              id={`api-key-${provider.id}`}
              type={showApiKey ? 'text' : 'password'}
              placeholder={`Enter your ${provider.name} API key`}
              value={apiKey}
              onChange={(e) => setPredefinedProviderApiKey(provider.id, e.target.value)}
              disabled={!enabled}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={!enabled}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
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
    <div className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Server className="h-5 w-5 text-secondary-foreground" />
          </div>
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
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit provider">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} title="Delete provider">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
        <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate" title={provider.baseUrl}>{provider.baseUrl}</span>
      </div>
    </div>
  )
}

export function ProviderSettingsDialog({ open, onClose }: ProviderSettingsDialogProps) {
  const predefinedProviders = llmProviders
  const customProviders = useStore((state) => state.settings.customProviders) ?? []
  const predefinedState = useStore((state) => state.settings.predefinedProviders) ?? {}
  const nodes = useStore((state) => state.nodes) ?? []
  const addCustomProvider = useStore((state) => state.addCustomProvider)
  const updateCustomProvider = useStore((state) => state.updateCustomProvider)
  const removeCustomProvider = useStore((state) => state.removeCustomProvider)

  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<CustomProviderConfig | undefined>()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<{
    id: string
    name: string
    usageCount: number
  } | null>(null)

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

  const checkProviderUsage = (providerId: string): number => {
    // Check how many nodes are using models from this provider
    let usageCount = 0

    for (const node of nodes) {
      const model = node.data?.model
      if (model && typeof model === 'string') {
        const provider = findProviderByModel(model)
        if (provider?.id === providerId) {
          usageCount++
        }
      }
    }

    return usageCount
  }

  const handleDeleteProvider = (provider: CustomProviderConfig) => {
    const usageCount = checkProviderUsage(provider.id)

    setProviderToDelete({
      id: provider.id,
      name: provider.name,
      usageCount,
    })
    setShowDeleteDialog(true)
  }

  const confirmDeleteProvider = () => {
    if (providerToDelete) {
      removeCustomProvider(providerToDelete.id)
      setProviderToDelete(null)
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
    ...(predefinedProviders?.map((p) => p.name) ?? []),
    ...(customProviders?.map((p) => p.name) ?? []),
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

          <TooltipProvider>
            <div className="space-y-6 py-4">
            {/* Security Warning Banner */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-amber-900">Security Notice</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    API keys are stored in your browser's local storage. Never share your API keys or use them on untrusted devices. For custom providers, always use HTTPS URLs to ensure your data is encrypted in transit.
                  </p>
                </div>
              </div>
            </div>
            {/* Predefined Providers Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold">Predefined Providers</h3>
                <Badge variant="outline" className="text-xs">
                  {predefinedProviders.length}
                </Badge>
              </div>
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Custom Providers</h3>
                  <Badge variant="outline" className="text-xs">
                    {customProviders.length}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddProvider} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Custom Provider
                </Button>
              </div>

              {customProviders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg border-dashed bg-muted/20">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No custom providers configured</p>
                  <p className="text-xs mt-1">Add a custom provider to use your own LLM endpoints</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customProviders.map((provider) => (
                    <CustomProviderCard
                      key={provider.id}
                      provider={provider}
                      onEdit={() => handleEditProvider(provider)}
                      onDelete={() => handleDeleteProvider(provider)}
                    />
                  ))}
                </div>
              )}
            </section>
            </div>
          </TooltipProvider>

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

      {/* Delete Confirmation Dialog */}
      {providerToDelete && (
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Custom Provider"
          description={
            providerToDelete.usageCount > 0
              ? `Are you sure you want to delete "${providerToDelete.name}"? This provider is currently being used by ${providerToDelete.usageCount} chat ${providerToDelete.usageCount === 1 ? 'node' : 'nodes'}. These nodes will show an error until you select a different model.`
              : `Are you sure you want to delete "${providerToDelete.name}"? This action cannot be undone.`
          }
          actionLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onAction={confirmDeleteProvider}
        />
      )}
    </>
  )
}
