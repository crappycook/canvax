import { type Edge, type Node, type Viewport } from '@xyflow/react'

export type NodeStatus = 'idle' | 'running' | 'error' | 'success'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string // markdown
  createdAt: number
}

export interface ChatNodeData {
  title: string
  modelId: string
  prompt: string // current prompt
  messages: ChatMessage[] // history messages
  status: NodeStatus
  error?: { code: string; message: string }
}

export interface ProjectSnapshot {
  id: string
  version: number
  metadata: {
    title: string
    updatedAt: number
  }
  graph: {
    nodes: Array<Node<ChatNodeData>>
    edges: Array<Edge>
    viewport: Viewport
  }
  settings: {
    defaultModel: string
    language: 'zh' | 'en'
  }
  history: unknown // specific implementation in CanvasSlice
}
