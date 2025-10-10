import { memo, useCallback, useRef } from 'react'
import { AlertCircle, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModelSelector } from '@/components/ModelSelector'
import { PromptEditor } from '@/components/PromptEditor'
import { NodeStatusBadge } from './NodeStatusBadge'
import { useRunNode } from '@/hooks/useRunNode'
import { useStore } from '@/state/store'
import type { ChatNodeData } from '@/types'

interface InputNodeContentProps {
  nodeId: string
  data: ChatNodeData
}

export const InputNodeContent = memo(function InputNodeContent({
  nodeId,
  data,
}: InputNodeContentProps) {
  const promptEditorRef = useRef<HTMLTextAreaElement>(null)
  const updateNode = useStore(state => state.updateNode)

  const { run, stop, isRunning, canRun, requiresApiKey, provider } = useRunNode(nodeId)

  const handleModelChange = useCallback(
    (newModel: string) => {
      updateNode(nodeId, { model: newModel })
    },
    [nodeId, updateNode]
  )

  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      updateNode(nodeId, { prompt: newPrompt })
    },
    [nodeId, updateNode]
  )

  const handleRun = useCallback(async () => {
    if (!canRun) return
    await run()
  }, [canRun, run])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  return (
    <div className="space-y-4 p-4">
      {/* Status Badge - Only show error state */}
      {data.status === 'error' && (
        <NodeStatusBadge status={data.status} error={data.error} />
      )}

      {/* Model Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium">Model</label>
        <ModelSelector
          value={data.model}
          onValueChange={handleModelChange}
          disabled={isRunning}
        />
      </div>

      {/* Prompt Editor */}
      <div>
        <label className="mb-2 block text-sm font-medium">Prompt</label>
        <PromptEditor
          ref={promptEditorRef}
          value={data.prompt || ''}
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
    </div>
  )
})
