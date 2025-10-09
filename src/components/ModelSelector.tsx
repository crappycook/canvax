import { memo, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { llmModels, findModelById } from '@/config/llmProviders'

interface ModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export const ModelSelector = memo(function ModelSelector({
  value,
  onValueChange,
  disabled = false,
}: ModelSelectorProps) {
  const options = llmModels

  const selectedModel = useMemo(() => {
    if (value) {
      return findModelById(value)
    }
    return options[0]
  }, [options, value])

  const buttonLabel = selectedModel
    ? `${selectedModel.label} · ${selectedModel.providerName}`
    : value || 'Select a model'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled || options.length === 0}
        >
          <span className="truncate text-left">{buttonLabel}</span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No models available</div>
        ) : (
          options.map(model => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onValueChange(model.id)}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{model.label}</span>
                <span className="text-xs text-muted-foreground">{model.providerName}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
