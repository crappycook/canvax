import { memo, useMemo } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getLLMModels, findModelById, getEnabledProviders } from '@/config/llmProviders'
import type { FlattenedModelDefinition } from '@/config/llmProviders'
import { useStore } from '@/state/store'

interface ModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  onOpenSettings?: () => void
}

export const ModelSelector = memo(function ModelSelector({
  value,
  onValueChange,
  disabled = false,
  onOpenSettings,
}: ModelSelectorProps) {
  // Subscribe to provider changes to trigger re-render
  const predefinedProviders = useStore(state => state.settings.predefinedProviders)
  const customProviders = useStore(state => state.settings.customProviders)

  // Use dynamic function to get enabled providers' models
  // Re-compute when provider settings change
  const options = useMemo(() => getLLMModels(), [predefinedProviders, customProviders])
  const enabledProviders = useMemo(() => getEnabledProviders(), [predefinedProviders, customProviders])

  const selectedModel = useMemo(() => {
    if (value) {
      return findModelById(value)
    }
    return options[0]
  }, [options, value])

  // Group models by provider for better organization
  const groupedModels = useMemo(() => {
    const groups = new Map<string, FlattenedModelDefinition[]>()

    options.forEach(model => {
      const providerModels = groups.get(model.providerId) || []
      providerModels.push(model)
      groups.set(model.providerId, providerModels)
    })

    return groups
  }, [options])

  const buttonLabel = selectedModel
    ? `${selectedModel.label} · ${selectedModel.providerName}`
    : value || 'Select a model'

  const hasNoProviders = enabledProviders.length === 0
  const hasNoModels = options.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled || hasNoModels}
        >
          <span className="truncate text-left">{buttonLabel}</span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto">
        {hasNoProviders ? (
          <div className="px-3 py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No providers are enabled. Please configure providers in Project Hub settings.
            </p>
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="w-full"
              >
                <Settings className="mr-2 h-4 w-4" />
                Open Provider Settings
              </Button>
            )}
          </div>
        ) : hasNoModels ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No models available from enabled providers.
            </p>
          </div>
        ) : (
          <>
            {Array.from(groupedModels.entries()).map(([providerId, models], index) => {
              const provider = enabledProviders.find(p => p.id === providerId)
              if (!provider) return null

              return (
                <div key={providerId}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {provider.name}
                    </span>
                    {provider.isCustom && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Custom
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  {models.map(model => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => onValueChange(model.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-sm font-medium truncate">{model.label}</span>
                        {model.isCustom && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 flex-shrink-0">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
