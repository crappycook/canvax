import { type StateCreator } from 'zustand'
import {
  type Node,
  type NodeChange,
  applyNodeChanges,
} from '@xyflow/react'
import { type ChatNodeData, type ChatMessage, type BranchMetadata, type CustomEdgeData } from '@/types'
import { type EdgesSlice } from './createEdgesSlice'
import { calculateBranchNodePositions } from '@/lib/branchLayout'

export interface NodesSlice {
  nodes: Node[]
  selectedNodeId: string | null
  highlightedNodeIds: Set<string>
  highlightedEdgeIds: Set<string>

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

  // Branch operations
  createBranchFromNode: (nodeId: string) => void
  getBranchMetadata: (nodeId: string) => BranchMetadata | null
  getBranchPath: (nodeId: string) => Node[]
  getSiblingBranches: (nodeId: string) => Node[]
  deleteBranchCascade: (nodeId: string) => void

  // Selection
  selectNode: (nodeId: string | null) => void
  getSelectedNode: () => Node | null

  // Branch highlighting
  updateBranchHighlight: (nodeId: string | null) => void
  clearBranchHighlight: () => void
}

export const createNodesSlice: StateCreator<NodesSlice & EdgesSlice, [], [], NodesSlice> = (set, get) => ({
  nodes: [],
  selectedNodeId: null,
  highlightedNodeIds: new Set<string>(),
  highlightedEdgeIds: new Set<string>(),

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

  createBranchFromNode: (nodeId) => {
    const state = get()
    const sourceNode = state.nodes.find(n => n.id === nodeId)
    if (!sourceNode) return

    const sourceNodeData = sourceNode.data as ChatNodeData

    // Determine branch index:
    // - If source node already has a branchIndex, inherit it (continuing same branch)
    // - Otherwise, calculate new branch index from existing branches
    let branchIndex: number
    let branchId: string

    if (sourceNodeData.branchIndex !== undefined && sourceNodeData.branchId) {
      // Inherit branch index from parent (continuing in same branch)
      branchIndex = sourceNodeData.branchIndex
      branchId = sourceNodeData.branchId
    } else {
      // Creating a new branch from main trunk
      const existingBranches = state.edges.filter(e => e.source === nodeId)
      branchIndex = existingBranches.length
      branchId = `${nodeId}-branch-${branchIndex}-${Date.now()}`
    }

    // Calculate positions using layout utility
    const { inputPosition } = calculateBranchNodePositions(
      sourceNode.position,
      branchIndex
    )

    // Create Input node with branch metadata
    const inputNodeId = `node-${Date.now()}`
    const inputNode: Node = {
      id: inputNodeId,
      type: 'chat',
      position: inputPosition,
      data: {
        label: `Continue from ${sourceNode.data.label}`,
        model: (sourceNode.data as ChatNodeData).model,
        prompt: '',
        messages: [],
        status: 'idle' as const,
        createdAt: Date.now(),
        nodeType: 'input' as const,
        branchId,
        parentNodeId: nodeId,
        branchIndex,
      },
    }

    // Add input node only
    state.addNode(inputNode)

    // Add edge with branch metadata
    state.addEdge({
      id: `edge-${Date.now()}`,
      source: nodeId,
      target: inputNodeId,
      data: {
        branchIndex,
        isBranchEdge: true,
        createdAt: Date.now(),
      },
    })
  },

  getBranchMetadata: (nodeId) => {
    const state = get()
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) return null

    const nodeData = node.data as ChatNodeData

    // Check if node has branch metadata
    if (!nodeData.branchId || !nodeData.parentNodeId) {
      return null
    }

    // Calculate branch depth by traversing to root
    let depth = 0
    let currentId: string | null = nodeId
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) {
        // Circular reference detected
        break
      }
      visited.add(currentId)

      const parentEdge = state.edges.find(e => e.target === currentId)
      if (parentEdge) {
        depth++
        currentId = parentEdge.source
      } else {
        currentId = null
      }
    }

    // Count messages in branch path
    let messageCount = 0
    currentId = nodeId
    visited.clear()

    while (currentId) {
      if (visited.has(currentId)) {
        break
      }
      visited.add(currentId)

      const currentNode = state.nodes.find(n => n.id === currentId)
      if (currentNode) {
        const currentData = currentNode.data as ChatNodeData
        messageCount += currentData.messages?.length || 0
      }

      const parentEdge = state.edges.find(e => e.target === currentId)
      currentId = parentEdge?.source ?? null
    }

    return {
      branchId: nodeData.branchId,
      parentNodeId: nodeData.parentNodeId,
      depth,
      messageCount,
      createdAt: nodeData.createdAt,
    }
  },

  getBranchPath: (nodeId) => {
    const state = get()
    const path: Node[] = []
    let currentId: string | null = nodeId
    const visited = new Set<string>()

    // Traverse from current node to root following parent edges
    while (currentId) {
      // Circular reference protection
      if (visited.has(currentId)) {
        break
      }
      visited.add(currentId)

      const currentNode = state.nodes.find(n => n.id === currentId)
      if (currentNode) {
        path.unshift(currentNode) // Add to beginning for correct order
      }

      // Find parent edge
      const parentEdge = state.edges.find(e => e.target === currentId)
      currentId = parentEdge?.source ?? null
    }

    return path
  },

  getSiblingBranches: (nodeId) => {
    const state = get()
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) return []

    const nodeData = node.data as ChatNodeData

    // Find parent node from current node's metadata
    const parentNodeId = nodeData.parentNodeId
    if (!parentNodeId) return []

    // Get all edges from parent node
    const parentEdges = state.edges.filter(e => e.source === parentNodeId)

    // Filter to find sibling branch nodes
    const siblingNodeIds = parentEdges
      .map(e => e.target)
      .filter(targetId => targetId !== nodeId) // Exclude current node

    // Return the actual node objects
    return state.nodes.filter(n => siblingNodeIds.includes(n.id))
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
    // Update branch highlighting when selection changes
    get().updateBranchHighlight(nodeId)
  },

  getSelectedNode: () => {
    const state = get()
    return state.nodes.find((node) => node.id === state.selectedNodeId) || null
  },

  updateBranchHighlight: (nodeId) => {
    const state = get()

    // Clear previous highlights
    state.clearBranchHighlight()

    // If no node selected, nothing to highlight
    if (!nodeId) {
      return
    }

    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) {
      return
    }

    const nodeData = node.data as ChatNodeData

    // Only highlight if node is part of a branch
    if (!nodeData.branchId) {
      return
    }

    // Get all nodes in the branch path
    const branchPath = state.getBranchPath(nodeId)
    const highlightedNodeIds = new Set(branchPath.map(n => n.id))

    // Get all edges in the branch path
    const highlightedEdgeIds = new Set<string>()
    for (let i = 0; i < branchPath.length - 1; i++) {
      const sourceId = branchPath[i].id
      const targetId = branchPath[i + 1].id

      // Find the edge connecting these nodes
      const edge = state.edges.find(e => e.source === sourceId && e.target === targetId)
      if (edge) {
        highlightedEdgeIds.add(edge.id)
      }
    }

    set({
      highlightedNodeIds,
      highlightedEdgeIds
    })
  },

  clearBranchHighlight: () => {
    set({
      highlightedNodeIds: new Set<string>(),
      highlightedEdgeIds: new Set<string>()
    })
  },

  deleteBranchCascade: (nodeId) => {
    const state = get()
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node) return

    // Find all downstream nodes in branch using BFS
    const nodesToDelete = new Set<string>([nodeId])
    const edgesToDelete = new Set<string>()
    const queue = [nodeId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const currentId = queue.shift()!

      if (visited.has(currentId)) {
        continue
      }
      visited.add(currentId)

      // Find all edges where this node is the source
      const downstreamEdges = state.edges.filter(e => e.source === currentId)

      for (const edge of downstreamEdges) {
        edgesToDelete.add(edge.id)
        nodesToDelete.add(edge.target)
        queue.push(edge.target)
      }
    }

    // Capture state before deletion for undo/redo
    const deletedNodesData = state.nodes
      .filter(n => nodesToDelete.has(n.id))
      .map(n => ({
        id: n.id,
        type: n.type ?? 'chat',
        position: n.position,
        data: n.data as ChatNodeData,
      }))

    const deletedEdgesData = state.edges
      .filter(e => edgesToDelete.has(e.id))
      .map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data as CustomEdgeData | undefined,
      }))

    // Add to history
    const historyEntry = {
      type: 'branch_deletion' as const,
      timestamp: Date.now(),
      deletedNodes: deletedNodesData,
      deletedEdges: deletedEdgesData,
    }

    // Get addHistoryEntry from the store (it's in CanvasSlice)
    const fullState = get() as unknown as { addHistoryEntry?: (entry: typeof historyEntry) => void }
    if (fullState.addHistoryEntry) {
      fullState.addHistoryEntry(historyEntry)
    }

    // Remove all branch nodes and edges
    set((state) => ({
      nodes: state.nodes.filter(n => !nodesToDelete.has(n.id)),
      selectedNodeId: nodesToDelete.has(state.selectedNodeId ?? '') ? null : state.selectedNodeId
    }))

    // Remove edges
    state.edges.forEach(edge => {
      if (edgesToDelete.has(edge.id)) {
        state.removeEdge(edge.id)
      }
    })

    // Clear highlights if deleted node was highlighted
    if (nodesToDelete.has(state.selectedNodeId ?? '')) {
      state.clearBranchHighlight()
    }
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
