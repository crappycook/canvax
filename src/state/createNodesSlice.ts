import { type StateCreator } from 'zustand'
import { type Node } from '@xyflow/react'
import { type ChatNodeData, type ChatMessage } from '@/canvas/types'

export interface NodesSlice {
  nodes: Node<ChatNodeData>[]
  selectedNodeId: string | null
  
  // Node management
  addNode: (node: Node<ChatNodeData>) => void
  updateNode: (nodeId: string, updates: Partial<ChatNodeData>) => void
  removeNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  
  // Node operations
  setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'error' | 'success') => void
  addMessageToNode: (nodeId: string, message: ChatMessage) => void
  clearNodeMessages: (nodeId: string) => void
  
  // Selection
  selectNode: (nodeId: string | null) => void
  getSelectedNode: () => Node<ChatNodeData> | null
}

export const createNodesSlice: StateCreator<NodesSlice> = (set, get) => ({
  nodes: [],
  selectedNodeId: null,

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node]
    }))
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
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

    const newNode: Node<ChatNodeData> = {
      ...node,
      id: `node-${Date.now()}`,
      position: {
        x: node.position.x + 200,
        y: node.position.y
      },
      data: {
        ...node.data,
        title: `${node.data.title} (Copy)`,
        messages: []
      }
    }

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }))
  },

  setNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status } }
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
              data: {
                ...node.data,
                messages: [...node.data.messages, message]
              }
            }
          : node
      )
    }))
  },

  clearNodeMessages: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, messages: [] } }
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