import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
  BaseNodeFooter,
} from '@/components/base-node'
import { Play, Square, Copy, Trash2 } from 'lucide-react'
import { type ChatNodeData } from '../types'

export const ChatNode = memo(({ data, isConnectable }: NodeProps<ChatNodeData>) => {
  const { title = 'Chat Node', status = 'idle', messages = [] } = data || {}

  return (
    <BaseNode className="w-80">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Node Header */}
      <BaseNodeHeader className="border-b">
        <BaseNodeHeaderTitle>{title}</BaseNodeHeaderTitle>
        <div className="flex items-center space-x-1">
          <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
            GPT-4
          </span>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Play className="h-3 w-3" />
          </Button>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Square className="h-3 w-3" />
          </Button>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Copy className="h-3 w-3" />
          </Button>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </BaseNodeHeader>

      {/* Node Content */}
      <BaseNodeContent>
        <textarea
          placeholder="Enter your prompt..."
          className="w-full h-20 p-2 border rounded text-sm resize-none"
          value={data?.prompt || ''}
          onChange={() => { }} // Will be implemented with state
        />

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {messages.map(message => (
            <div key={message.id} className="text-xs p-2 bg-muted rounded">
              <div className="font-medium">{message.role}</div>
              <div>{message.content}</div>
            </div>
          ))}
        </div>
      </BaseNodeContent>

      {/* Node Footer */}
      <BaseNodeFooter>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Status: {status}</span>
          <span>{messages.length} messages</span>
        </div>
      </BaseNodeFooter>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />
    </BaseNode>
  )
})

ChatNode.displayName = 'ChatNode'