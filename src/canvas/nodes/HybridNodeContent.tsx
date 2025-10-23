import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Play, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ModelSelector } from '@/components/ModelSelector'
import { PromptEditor } from '@/components/PromptEditor'
import { NodeStatusBadge } from './NodeStatusBadge'
import { useRunNode } from '@/hooks/useRunNode'
import { useStore } from '@/state/store'
import { useDebounce } from '@/hooks/useDebounce'
import type { ChatNodeData } from '@/types'

interface HybridNodeContentProps {
  nodeId: string
  data: ChatNodeData
}

export const HybridNodeContent = memo(function HybridNodeContent({
  nodeId,
  data,
}: HybridNodeContentProps) {
  const promptEditorRef = useRef<HTMLTextAreaElement>(null)
  const updateNode = useStore(state => state.updateNode)
  const navigate = useNavigate()

  // Local state for immediate UI updates
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '')

  const { run, stop, isRunning, canRun, requiresApiKey, provider } = useRunNode(nodeId)

  const handleModelChange = useCallback(
    (newModel: string) => {
      updateNode(nodeId, { model: newModel })
    },
    [nodeId, updateNode]
  )

  // Debounced update to store (300ms delay)
  const debouncedUpdatePrompt = useDebounce(
    useCallback(
      (newPrompt: string) => {
        updateNode(nodeId, { prompt: newPrompt })
      },
      [nodeId, updateNode]
    ),
    300
  )

  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      // Update local state immediately for responsive UI
      setLocalPrompt(newPrompt)
      // Debounce the store update
      debouncedUpdatePrompt(newPrompt)
    },
    [debouncedUpdatePrompt]
  )

  const handleRun = useCallback(async () => {
    if (!canRun) return
    await run()
  }, [canRun, run])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  const handleOpenSettings = useCallback(() => {
    // Navigate to Project Hub where provider settings can be accessed
    navigate('/')
  }, [navigate])

  // Handle Escape key to cancel execution
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRunning) {
        event.preventDefault()
        stop()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRunning, stop])

  return (
    <div className="space-y-4 p-4">
      {/* Status Badge - Only show error state */}
      {data.status === 'error' && <NodeStatusBadge status={data.status} error={data.error} />}

      {/* Model Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium">Model</label>
        <ModelSelector
          value={data.model}
          onValueChange={handleModelChange}
          disabled={isRunning}
          onOpenSettings={handleOpenSettings}
        />
      </div>

      {/* Prompt Editor */}
      <div>
        <label className="mb-2 block text-sm font-medium">Prompt</label>
        <PromptEditor
          ref={promptEditorRef}
          value={localPrompt}
          onChange={handlePromptChange}
          placeholder="Enter your message..."
          disabled={isRunning}
          onEnter={canRun ? handleRun : undefined}
        />
      </div>

      {/* API Key Warning */}
      {requiresApiKey && (
        <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
          <AlertCircle className="mr-2 inline size-4" />
          {provider
            ? `${provider.name} API key required to run this node.`
            : 'API key required to run this node.'}{' '}
          Please check settings.
        </div>
      )}

      {/* Execute Button with Loading State */}
      <Button
        onClick={isRunning ? handleStop : handleRun}
        disabled={(!isRunning && !canRun) || data.status === 'running'}
        className="w-full"
        aria-label={isRunning ? 'Stop execution' : 'Execute node'}
        aria-describedby="execution-status-hybrid"
      >
        {isRunning ? (
          <>
            <Square className="mr-2 size-4 animate-pulse" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 size-4" />
            Execute
          </>
        )}
      </Button>

      {/* Screen reader status announcement */}
      <div id="execution-status-hybrid" className="sr-only" aria-live="assertive">
        {isRunning ? 'Node is running' : 'Node is idle'}
      </div>
    </div>
  )
})
