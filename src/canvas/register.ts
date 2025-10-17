import { ChatNode } from './nodes/ChatNode'
import { BranchEdge } from './edges/BranchEdge'

export const nodeTypes = { chat: ChatNode } as const
export const edgeTypes = { default: BranchEdge } as const