import { type StateCreator } from 'zustand'
import {
  type Edge,
  type EdgeChange,
  type Connection,
  addEdge as reactFlowAddEdge,
  applyEdgeChanges,
} from '@xyflow/react'

export interface EdgesSlice {
  edges: Edge[]

  // Edge management
  setEdges: (edges: Edge[]) => void
  applyEdgeChanges: (changes: EdgeChange[]) => void
  connectEdge: (connection: Connection) => void
  addEdge: (edge: Edge) => void
  removeEdge: (edgeId: string) => void
  removeEdgesConnectedToNode: (nodeId: string) => void

  // Edge operations
  getIncomingEdges: (nodeId: string) => Edge[]
  getOutgoingEdges: (nodeId: string) => Edge[]
  getConnectedNodes: (nodeId: string) => string[]
  getEdgesBySource: (nodeId: string) => Edge[]
  getEdgesByTarget: (nodeId: string) => Edge[]
}

export const createEdgesSlice: StateCreator<EdgesSlice> = (set, get) => ({
  edges: [],

  setEdges: (edges) => {
    set({ edges })
  },

  applyEdgeChanges: (changes) => {
    set(state => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  connectEdge: (connection) => {
    set(state => {
      // Create edge with timestamp
      const newEdge = reactFlowAddEdge(connection, state.edges)
      
      // Add timestamp to the newly created edge
      const edgesWithTimestamp = newEdge.map(edge => {
        // Only add timestamp to the new edge (the last one)
        if (edge === newEdge[newEdge.length - 1]) {
          return {
            ...edge,
            data: {
              ...edge.data,
              createdAt: Date.now()
            }
          }
        }
        return edge
      })
      
      return {
        edges: edgesWithTimestamp
      }
    })
  },

  addEdge: (edge) => {
    set((state) => {
      // Auto-generate ID if not provided
      const edgeWithId = {
        ...edge,
        id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: {
          ...edge.data,
          createdAt: edge.data?.createdAt || Date.now()
        }
      }
      
      return {
        edges: [...state.edges, edgeWithId]
      }
    })
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId)
    }))
  },

  removeEdgesConnectedToNode: (nodeId) => {
    set((state) => ({
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
    }))
  },

  getIncomingEdges: (nodeId) => {
    const state = get()
    return state.edges.filter((edge) => edge.target === nodeId)
  },

  getOutgoingEdges: (nodeId) => {
    const state = get()
    return state.edges.filter((edge) => edge.source === nodeId)
  },

  getConnectedNodes: (nodeId) => {
    const state = get()
    const connected = new Set<string>()

    state.edges.forEach((edge) => {
      if (edge.source === nodeId) connected.add(edge.target)
      if (edge.target === nodeId) connected.add(edge.source)
    })

    return Array.from(connected)
  },

  getEdgesBySource: (nodeId) => {
    const state = get()
    return state.edges.filter((edge) => edge.source === nodeId)
  },

  getEdgesByTarget: (nodeId) => {
    const state = get()
    return state.edges.filter((edge) => edge.target === nodeId)
  }
})
