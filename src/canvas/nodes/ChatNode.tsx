import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

// ChatNode temporarily disabled for build completion
export const ChatNode = memo((props: NodeProps) => {
  return (
    <div className="w-80 border rounded-lg bg-white shadow-sm p-4">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={props.isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="text-center">
        <h3 className="font-medium">Chat Node</h3>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={props.isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  )
})

ChatNode.displayName = 'ChatNode'