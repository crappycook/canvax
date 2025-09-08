import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNodeFullDemo } from '@/components/demo'

// 自定义节点数据类型 - 扩展 Record<string, unknown> 以符合 ReactFlow 要求
export interface CustomNodeData extends Record<string, unknown> {
  label: string
}

// 将 BaseNodeFullDemo 包装为 ReactFlow 自定义节点
export const BaseNodeCustom = memo(({ isConnectable }: NodeProps) => {
  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* 使用 BaseNodeFullDemo 作为节点内容 */}
      <BaseNodeFullDemo />

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!size-3 !bg-blue-500 !border-2 !border-white"
      />
    </>
  )
})

BaseNodeCustom.displayName = 'BaseNodeCustom'
