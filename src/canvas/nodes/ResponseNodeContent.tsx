import { memo, useCallback, useMemo } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NodeStatusBadge } from './NodeStatusBadge'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { useStore } from '@/state/store'
import { useRunNode } from '@/hooks/useRunNode'
import type { ChatNodeData } from '@/types'

interface ResponseNodeContentProps {
  nodeId: string
  data: ChatNodeData
}

export const ResponseNodeContent = memo(function ResponseNodeContent({
  nodeId,
  data,
}: ResponseNodeContentProps) {
  const updateNode = useStore(state => state.updateNode)
  const edges = useStore(state => state.edges)
  const nodes = useStore(state => state.nodes)
  const { retry } = useRunNode(nodeId)

  const assistantMessages = useMemo(
    () => data.messages.filter(m => m.role === 'assistant'),
    [data.messages]
  )

  const latestMessage = useMemo(
    () => (assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null),
    [assistantMessages]
  )

  const handleRetry = useCallback(async () => {
    // Find upstream input node and retry it
    const upstreamEdge = edges.find(e => e.target === nodeId)
    if (upstreamEdge) {
      const upstreamNode = nodes.find(n => n.id === upstreamEdge.source)
      if (upstreamNode) {
        // Clear error state on this node
        const { setNodeStatus, updateNode: updateNodeState } = useStore.getState()
        setNodeStatus(nodeId, 'idle')
        updateNodeState(nodeId, { error: undefined })
        
        // Retry the upstream node
        await retry()
      }
    }
  }, [nodeId, edges, nodes, retry])

  const handleContinueConversation = useCallback(() => {
    // Convert response node to input node by adding an empty prompt
    updateNode(nodeId, { prompt: '' })
  }, [nodeId, updateNode])

  return (
    <div className="space-y-2 p-4">
      {/* Status Indicator - Only show for running and error states */}
      {(data.status === 'running' || data.status === 'error') && (
        <NodeStatusBadge status={data.status} error={data.error} />
      )}

      {/* Message Display */}
      <div className="rounded-lg border bg-muted/30 p-3">
        {data.status === 'running' && (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        )}

        {data.status === 'success' && latestMessage && (
          <MarkdownRenderer 
            content={latestMessage.content}
            className="max-w-none"
          />
        )}

        {data.status === 'error' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-700">{data.error || 'An error occurred'}</p>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Continue Conversation Button */}
      {data.status === 'success' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleContinueConversation}
          className="w-full"
        >
          <Plus className="mr-2 size-4" />
          Continue Conversation
        </Button>
      )}
    </div>
  )
})
