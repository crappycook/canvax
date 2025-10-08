import { BaseNodeCustom } from './custom-nodes'
import { ChatNode } from '@/canvas/nodes/ChatNode'

// 导出节点类型映射
export const nodeTypes = {
  baseNodeCustom: BaseNodeCustom,
  chat: ChatNode,
}

export type CustomNodeTypes = typeof nodeTypes
