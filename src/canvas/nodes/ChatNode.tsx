import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNode, BaseNodeContent, CustomHeader } from '@/components/base-node'
import { useStore } from '@/state/store'
import type { ChatNodeData } from '@/types'
import { cn } from '@/lib/utils'
import { Edit3, MessageSquare } from 'lucide-react'
import { useNodeType } from '@/canvas/nodes/nodeTypeUtils'
import { InputNodeContent } from '@/canvas/nodes/InputNodeContent'
import { ResponseNodeContent } from '@/canvas/nodes/ResponseNodeContent'
import { HybridNodeContent } from '@/canvas/nodes/HybridNodeContent'
import { BranchBadge } from '@/canvas/components/BranchBadge'
import './nodeStyles.css'

interface ChatNodeProps extends NodeProps {
  data: ChatNodeData
}

export const ChatNode = memo(({ id, data }: ChatNodeProps) => {
  const nodeId = id!
  const nodeData = data as ChatNodeData

  const edges = useStore(state => state.edges)
  const highlightedNodeIds = useStore(state => state.highlightedNodeIds)

  // Determine node type based on connections and data
  const nodeType = useNodeType(nodeId, nodeData, edges)

  // Select icon based on node type
  const nodeIcon = nodeType === 'response' ? <MessageSquare /> : <Edit3 />

  // Check if this node is highlighted
  const isHighlighted = highlightedNodeIds.has(nodeId)

  const sizeClass =
    nodeType === 'response'
      ? 'w-[520px] max-w-[520px]'
      : nodeType === 'hybrid'
        ? 'w-[400px] max-w-[420px]'
        : 'w-[340px] max-w-[360px]'

  return (
    <BaseNode
      className={cn(
        'node-chat',
        sizeClass,
        `node-${nodeType}`,
        `node-${nodeData.status}`,
        isHighlighted && 'node-branch-highlighted'
      )}
    >
      {/* Render branch badge if node is part of a branch */}
      {nodeData.branchId && nodeData.branchIndex !== undefined && (
        <BranchBadge branchIndex={nodeData.branchIndex} branchId={nodeData.branchId} />
      )}
      
      <CustomHeader
        title={nodeData.label}
        description={nodeData.description}
        icon={nodeIcon}
      />
      <Handle type="target" position={Position.Top} />

      <BaseNodeContent>
        {/* Render content based on node type */}
        {nodeType === 'input' && <InputNodeContent nodeId={nodeId} data={nodeData} />}
        {nodeType === 'response' && <ResponseNodeContent nodeId={nodeId} data={nodeData} />}
        {nodeType === 'hybrid' && <HybridNodeContent nodeId={nodeId} data={nodeData} />}
      </BaseNodeContent>

      <Handle type="source" position={Position.Bottom} />
    </BaseNode>
  )
})

ChatNode.displayName = 'ChatNode'
