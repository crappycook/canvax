import { memo, useCallback, useMemo, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'
import { NodeStatusBadge } from './NodeStatusBadge'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { ErrorDisplay } from './ErrorDisplay'
import { useStore } from '@/state/store'
import { useRunNode } from '@/hooks/useRunNode'
import { parseError } from '@/types/errors'
import type { ChatNodeData } from '@/types'

// Threshold for enabling virtual scrolling (characters)
const VIRTUAL_SCROLL_THRESHOLD = 2000

interface ResponseNodeContentProps {
  nodeId: string
  data: ChatNodeData
}

export const ResponseNodeContent = memo(function ResponseNodeContent({
  nodeId,
  data,
}: ResponseNodeContentProps) {
  const createBranchFromNode = useStore(state => state.createBranchFromNode)
  const edges = useStore(state => state.edges)
  const nodes = useStore(state => state.nodes)
  const { retry } = useRunNode(nodeId)

  const parentRef = useRef<HTMLDivElement>(null)

  const assistantMessages = useMemo(
    () => data.messages.filter(m => m.role === 'assistant'),
    [data.messages]
  )

  const latestMessage = useMemo(
    () => (assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null),
    [assistantMessages]
  )

  // Check if content is long enough to benefit from virtual scrolling
  const isLongContent = useMemo(
    () => (latestMessage?.content.length ?? 0) > VIRTUAL_SCROLL_THRESHOLD,
    [latestMessage?.content.length]
  )

  // Split content into lines for virtual scrolling
  const contentLines = useMemo(
    () => (isLongContent && latestMessage ? latestMessage.content.split('\n') : []),
    [isLongContent, latestMessage]
  )

  // Setup virtualizer for long content
  const virtualizer = useVirtualizer({
    count: contentLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Estimated line height in pixels
    overscan: 5, // Number of items to render outside visible area
    enabled: isLongContent,
  })

  const handleRetry = useCallback(async () => {
    // Find upstream input node
    const upstreamEdge = edges.find(e => e.target === nodeId)
    if (!upstreamEdge) {
      console.warn('No upstream node found for retry')
      return
    }

    const upstreamNode = nodes.find(n => n.id === upstreamEdge.source)
    if (!upstreamNode) {
      console.warn('Upstream node not found')
      return
    }

    // Clear error state on this response node
    const { setNodeStatus, updateNode: updateNodeState } = useStore.getState()
    setNodeStatus(nodeId, 'idle')
    updateNodeState(nodeId, { error: undefined })

    // Retry execution by calling the upstream node's execution
    // The retry function from useRunNode will handle re-executing the upstream node
    try {
      await retry()
    } catch (error) {
      // Error will be handled by the execution manager
      console.error('Retry failed:', error)
    }
  }, [nodeId, edges, nodes, retry])

  const handleContinueConversation = useCallback(() => {
    // Create a new branch from this response node
    createBranchFromNode(nodeId)
  }, [nodeId, createBranchFromNode])

  // Get source node label for ARIA label
  const sourceNodeLabel = useMemo(() => {
    const upstreamEdge = edges.find(e => e.target === nodeId)
    if (upstreamEdge) {
      const upstreamNode = nodes.find(n => n.id === upstreamEdge.source)
      return upstreamNode?.data?.label || 'unknown node'
    }
    return 'unknown node'
  }, [edges, nodes, nodeId])

  return (
    <div className="space-y-3 p-3">
      {/* Status Indicator - Only show for running and error states */}
      {(data.status === 'running' || data.status === 'error') && (
        <NodeStatusBadge status={data.status} error={data.error} />
      )}

      {/* Message Display */}
      <div
        className="rounded-lg border bg-muted/30 p-3"
        role="article"
        aria-label={`Response from ${sourceNodeLabel}`}
        aria-busy={data.status === 'running'}
        aria-live="polite"
      >
        {data.status === 'running' && (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        )}

        {data.status === 'success' && latestMessage && (
          <>
            {isLongContent ? (
              // Virtual scrolling for long content
              <div
                ref={parentRef}
                className="max-h-96 overflow-auto"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="text-sm leading-relaxed">
                        {contentLines[virtualItem.index]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Regular rendering for short content
              <MarkdownRenderer
                content={latestMessage.content}
                className="max-w-none"
              />
            )}
          </>
        )}

        {data.status === 'error' && (
          <ErrorDisplay
            error={data.error ? parseError(data.error) : parseError('An error occurred')}
            onRetry={handleRetry}
          />
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
