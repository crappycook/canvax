import { type StateCreator } from 'zustand'
import {
  type Node,
  type NodeChange,
  applyNodeChanges,
} from '@xyflow/react'
import { type ChatNodeData, type ChatMessage } from '@/types'
import { type EdgesSlice } from './createEdgesSlice'

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
  convertNodeToInput: (nodeId: string) => void

  // Node relationships
  getDownstreamNodes: (nodeId: string) => Node[]
  getUpstreamNodes: (nodeId: string) => Node[]

  // Selection
  selectNode: (nodeId: string | null) => void
  getSelectedNode: () => Node | null
}

export const createNodesSlice: StateCreator<NodesSlice & EdgesSlice, [], [], NodesSlice> = (set, get) => ({
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
    set((state) => {
      // Ensure createdAt is set if not provided
      const nodeWithTimestamp = {
        ...node,
        data: {
          ...(typeof node.data === 'object' && node.data !== null ? node.data : {}),
          createdAt: (node.data as ChatNodeData)?.createdAt ?? Date.now(),
        },
      }
      return {
        nodes: [...state.nodes, nodeWithTimestamp]
      }
    })
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

  convertNodeToInput: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: updateData(node.data, draft => {
              // Add empty prompt to convert response node to input node
              draft.prompt = ''
              // Keep existing messages as context
              // Update nodeType to hybrid if it has messages
              if (draft.messages.length > 0) {
                draft.nodeType = 'hybrid'
              } else {
                draft.nodeType = 'input'
              }
            }),
          }
          : node
      )
    }))
  },

  getDownstreamNodes: (nodeId) => {
    const state = get()
    // Get all edges where this node is the source
    const downstreamEdges = state.edges.filter((edge) => edge.source === nodeId)
    // Get the target nodes
    const downstreamNodeIds = downstreamEdges.map((edge) => edge.target)
    // Return the actual node objects
    return state.nodes.filter((node) => downstreamNodeIds.includes(node.id))
  },

  getUpstreamNodes: (nodeId) => {
    const state = get()
    // Get all edges where this node is the target
    const upstreamEdges = state.edges.filter((edge) => edge.target === nodeId)
    // Get the source nodes
    const upstreamNodeIds = upstreamEdges.map((edge) => edge.source)
    // Return the actual node objects
    return state.nodes.filter((node) => upstreamNodeIds.includes(node.id))
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
    model: typeof incoming.model === 'string' ? incoming.model : 'gpt-4o',
    prompt: typeof incoming.prompt === 'string' ? incoming.prompt : '',
    messages: Array.isArray(incoming.messages)
      ? (incoming.messages as ChatMessage[])
      : [],
    status: incoming.status ?? 'idle',
    error: incoming.error,
    createdAt: typeof incoming.createdAt === 'number' ? incoming.createdAt : Date.now(),
    nodeType: incoming.nodeType,
    sourceNodeId: incoming.sourceNodeId,
    ...incoming,
  }

  updater(draft)
  return draft
}
