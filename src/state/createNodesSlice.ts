import { type StateCreator } from 'zustand'
import {
  type Node,
  type NodeChange,
  applyNodeChanges,
} from '@xyflow/react'
import { type ChatNodeData, type ChatMessage } from '@/types'

export interface NodesSlice {
  nodes: Node[]
  selectedNodeId: string | null

  // Node management
  setNodes: (nodes: Node[]) => void
  applyNodeChanges: (changes: NodeChange[]) => void
  addNode: (node: Node) => void
  updateNode: (nodeId: string, updates: Partial<ChatNodeData>) => void
  removeNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void

  // Node operations
  setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'error' | 'success') => void
  addMessageToNode: (nodeId: string, message: ChatMessage) => void
  clearNodeMessages: (nodeId: string) => void

  // Selection
  selectNode: (nodeId: string | null) => void
  getSelectedNode: () => Node | null
}

export const createNodesSlice: StateCreator<NodesSlice> = (set, get) => ({
  nodes: [],
  selectedNodeId: null,

  setNodes: (nodes) => {
    set({ nodes })
  },

  applyNodeChanges: (changes) => {
    set(state => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node]
    }))
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...(typeof node.data === 'object' && node.data !== null ? node.data : {}),
              ...updates,
            },
          }
          : node
      )
    }))
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    }))
  },

  duplicateNode: (nodeId) => {
    const state = get()
    const node = state.nodes.find((n) => n.id === nodeId)
    if (!node) return

    const baseData =
      typeof node.data === 'object' && node.data !== null
        ? { ...node.data }
        : node.data

    if (baseData && typeof baseData === 'object' && 'title' in baseData && typeof baseData.title === 'string') {
      baseData.title = `${baseData.title} (Copy)`
    }

    const newNode: Node = {
      ...node,
      id: `node-${Date.now()}`,
      position: {
        x: node.position.x + 200,
        y: node.position.y
      },
      data: baseData,
    }

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }))
  },

  setNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: updateData(node.data, draft => {
              draft.status = status
            }),
          }
          : node
      )
    }))
  },

  addMessageToNode: (nodeId, message) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: updateData(node.data, draft => {
              if (!Array.isArray(draft.messages)) {
                draft.messages = []
              }
              draft.messages = [...draft.messages, message]
            }),
          }
          : node
      )
    }))
  },

  clearNodeMessages: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: updateData(node.data, draft => {
              draft.messages = []
            }),
          }
          : node
      )
    }))
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  getSelectedNode: () => {
    const state = get()
    return state.nodes.find((node) => node.id === state.selectedNodeId) || null
  }
})

type MutableChatNodeData = ChatNodeData & Record<string, unknown>

function updateData(
  data: Node['data'],
  updater: (draft: MutableChatNodeData) => void,
) {
  const incoming = (typeof data === 'object' && data !== null
    ? data
    : {}) as Partial<ChatNodeData> & Record<string, unknown>

  const draft: MutableChatNodeData = {
    label: typeof incoming.label === 'string' ? incoming.label : 'Untitled',
    model: typeof incoming.model === 'string' ? incoming.model : 'gpt-4',
    prompt: typeof incoming.prompt === 'string' ? incoming.prompt : '',
    messages: Array.isArray(incoming.messages)
      ? (incoming.messages as ChatMessage[])
      : [],
    status: incoming.status ?? 'idle',
    error: incoming.error,
    ...incoming,
  }

  updater(draft)
  return draft
}
