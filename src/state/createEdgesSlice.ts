import { type StateCreator } from 'zustand'
import { type Edge } from '@xyflow/react'

export interface EdgesSlice {
  edges: Edge[]
  
  // Edge management
  addEdge: (edge: Edge) => void
  removeEdge: (edgeId: string) => void
  removeEdgesConnectedToNode: (nodeId: string) => void
  
  // Edge operations
  getIncomingEdges: (nodeId: string) => Edge[]
  getOutgoingEdges: (nodeId: string) => Edge[]
  getConnectedNodes: (nodeId: string) => string[]
}

export const createEdgesSlice: StateCreator<EdgesSlice> = (set, get) => ({
  edges: [],

  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge]
    }))
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
  }
})