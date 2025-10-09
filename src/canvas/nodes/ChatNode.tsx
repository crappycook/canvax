import { memo, useCallback, useEffect, useRef } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNode, BaseNodeContent, BaseNodeFooter, CustomHeader } from '@/components/base-node'
import { Button } from '@/components/ui/button'
import { ModelSelector } from '@/components/ModelSelector'
import { PromptEditor } from '@/components/PromptEditor'
import { MessageHistory } from '@/components/MessageHistory'
import { useRunNode } from '@/hooks/useRunNode'
import { useStore } from '@/state/store'
import type { ChatNodeData } from '@/types'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Copy, Play, Square, Trash2 } from 'lucide-react'

interface ChatNodeProps extends NodeProps {
  data: ChatNodeData
}

export const ChatNode = memo(({ id, data }: ChatNodeProps) => {
  const nodeId = id!
  const promptEditorRef = useRef<HTMLTextAreaElement>(null)

  const nodeData = data as ChatNodeData

  const updateNode = useStore(state => state.updateNode)
  const clearNodeMessages = useStore(state => state.clearNodeMessages)
  const setNodeStatus = useStore(state => state.setNodeStatus)

  const { run, stop, retry, isRunning, canRun, requiresApiKey, provider } = useRunNode(nodeId)

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

  const handleCopy = useCallback(() => {
    if (!nodeData.messages?.length) return
    const lastMessage = nodeData.messages[nodeData.messages.length - 1]
    navigator.clipboard.writeText(lastMessage.content)
  }, [nodeData.messages])

  const handleClear = useCallback(() => {
    clearNodeMessages(nodeId)
    setNodeStatus(nodeId, 'idle')
    updateNode(nodeId, { error: undefined })
  }, [clearNodeMessages, nodeId, setNodeStatus, updateNode])

  const handleRetry = useCallback(async () => {
    await retry()
  }, [retry])

  useEffect(() => {
    if (nodeData.status === 'success' && promptEditorRef.current) {
      promptEditorRef.current.focus()
    }
  }, [nodeData.status])

  const canCopyActual = Boolean(nodeData.messages?.length)

  return (
    <BaseNode>
      <CustomHeader title={nodeData.label} description={nodeData.description} />
      <Handle type="target" position={Position.Top} />

      <BaseNodeContent>
        <div className="p-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Model</label>
            <ModelSelector
              value={nodeData.model}
              onValueChange={handleModelChange}
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Prompt</label>
            <PromptEditor
              ref={promptEditorRef}
              value={nodeData.prompt || ''}
              onChange={handlePromptChange}
              placeholder="Enter your message..."
              disabled={isRunning}
            />
          </div>

          {requiresApiKey && (
            <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
              <AlertCircle className="mr-2 inline size-4" />
              {provider ? `${provider.name} API key required to run this node.` : 'API key required to run this node.'}{' '}
              Please check settings.
            </div>
          )}

          {nodeData.status !== 'idle' && (
            <div
              className={cn(
                'flex items-center gap-2 rounded p-2 text-sm',
                nodeData.status === 'running' && 'bg-blue-50 text-blue-700',
                nodeData.status === 'success' && 'bg-green-50 text-green-700',
                nodeData.status === 'error' && 'bg-red-50 text-red-700'
              )}
            >
              {nodeData.status === 'running' && (
                <>
                  <div className="size-2 animate-pulse rounded-full bg-blue-600" />
                  <span>Running...</span>
                </>
              )}
              {nodeData.status === 'success' && (
                <>
                  <CheckCircle className="size-4" />
                  <span>Completed</span>
                </>
              )}
              {nodeData.status === 'error' && (
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    <span>{nodeData.error || 'Error occurred'}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border">
            <div className="border-b bg-muted/50 p-2">
              <h3 className="text-sm font-medium">Conversation</h3>
            </div>
            <MessageHistory messages={nodeData.messages || []} className="max-h-40 overflow-y-auto" />
          </div>
        </div>
      </BaseNodeContent>

      <Handle type="source" position={Position.Bottom} />

      <BaseNodeFooter>
        <div className="flex items-center justify-between gap-2 p-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={isRunning ? handleStop : handleRun}
              disabled={!isRunning && !canRun}
              variant={isRunning ? 'outline' : 'default'}
            >
              {isRunning ? (
                <>
                  <Square className="mr-1 size-3" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="mr-1 size-3" />
                  Run
                </>
              )}
            </Button>

            <Button size="sm" variant="outline" onClick={handleCopy} disabled={!canCopyActual}>
              <Copy className="mr-1 size-3" />
              Copy
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={!nodeData.messages || nodeData.messages.length === 0 || isRunning}
            >
              <Trash2 className="mr-1 size-3" />
              Clear
            </Button>
          </div>

          <span className="text-xs text-muted-foreground">{(nodeData.messages || []).length} messages</span>
        </div>
      </BaseNodeFooter>
    </BaseNode>
  )
})

ChatNode.displayName = 'ChatNode'
