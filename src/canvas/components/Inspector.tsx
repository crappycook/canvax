import { Fragment, useCallback } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { ChevronRight, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'
import type { ChatNodeData } from '@/types'

interface InspectorProps {
  selectedNodeId: string | null
}

export function Inspector({ selectedNodeId }: InspectorProps) {
  const reactFlowInstance = useReactFlow()
  const node = useStore(state => 
    state.nodes.find(n => n.id === selectedNodeId)
  ) as Node<ChatNodeData> | undefined
  
  const getBranchPath = useStore(state => state.getBranchPath)
  const getSiblingBranches = useStore(state => state.getSiblingBranches)
  const getBranchMetadata = useStore(state => state.getBranchMetadata)

  const focusNode = useCallback((nodeId: string) => {
    const targetNode = useStore.getState().nodes.find(n => n.id === nodeId)
    if (targetNode && reactFlowInstance) {
      reactFlowInstance.setCenter(
        targetNode.position.x + 150, // Offset to center of node
        targetNode.position.y + 100,
        { zoom: 1, duration: 300 }
      )
    }
  }, [reactFlowInstance])

  if (!node) return null

  const branchPath = node.data.branchId ? getBranchPath(node.id) : []
  const siblings = node.data.branchId ? getSiblingBranches(node.id) : []
  const branchMetadata = node.data.branchId ? getBranchMetadata(node.id) : null

  return (
    <div className="absolute right-4 top-20 w-80 rounded-lg border bg-background shadow-lg">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Inspector</h2>
      </div>
      
      <div className="space-y-4 p-4">
        {/* Node Info */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Node</h3>
          <div className="text-sm">
            <div className="font-medium">{node.data.label}</div>
            <div className="text-xs text-muted-foreground">
              {node.data.nodeType || 'chat'} • {node.data.model}
            </div>
          </div>
        </div>

        {/* Branch Path Section */}
        {node.data.branchId && branchPath.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Branch Path</h3>
            <div className="flex flex-wrap items-center gap-1">
              {branchPath.map((pathNode, index) => (
                <Fragment key={pathNode.id}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => focusNode(pathNode.id)}
                    className="h-7 px-2 text-xs"
                    title={`Focus on ${(pathNode.data as ChatNodeData).label}`}
                  >
                    {(pathNode.data as ChatNodeData).label}
                  </Button>
                  {index < branchPath.length - 1 && (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Sibling Branches Section */}
        {siblings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Sibling Branches</h3>
            <div className="space-y-1">
              {siblings.map(sibling => {
                const siblingData = sibling.data as ChatNodeData
                return (
                  <Button
                    key={sibling.id}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start px-2 text-xs"
                    onClick={() => focusNode(sibling.id)}
                    title={`Focus on ${siblingData.label}`}
                  >
                    <GitBranch className="mr-2 size-3" />
                    {siblingData.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Branch Metadata Section */}
        {branchMetadata && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Branch Metadata</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth:</span>
                <span className="font-medium">{branchMetadata.depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">{branchMetadata.messageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(branchMetadata.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
