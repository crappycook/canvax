import { type StateCreator } from 'zustand'
import { type Viewport } from '@xyflow/react'
import { type HistoryEntry } from '@/types'

export interface CanvasSlice {
  viewport: Viewport
  snapToGrid: boolean
  selection: string[]
  history: {
    past: HistoryEntry[]
    present: HistoryEntry | null
    future: HistoryEntry[]
  }
  setViewport: (viewport: Viewport) => void
  setSnapToGrid: (snapToGrid: boolean) => void
  setSelection: (selection: string[]) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  undo: () => void
  redo: () => void
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, get) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  snapToGrid: true,
  selection: [],
  history: {
    past: [],
    present: null,
    future: []
  },

  setViewport: (viewport) => set({ viewport }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setSelection: (selection) => set({ selection }),

  addHistoryEntry: (entry) => {
    const { history } = get()
    set({
      history: {
        past: history.present ? [...history.past, history.present] : history.past,
        present: entry,
        future: [] // Clear future when new action is performed
      }
    })
  },

  undo: () => {
    const state = get() as unknown as {
      history: CanvasSlice['history']
      addNode: (node: { id: string; type: string; position: { x: number; y: number }; data: unknown }) => void
      addEdge: (edge: { id: string; source: string; target: string; data?: unknown }) => void
    }
    
    const { history } = state
    if (history.past.length === 0 || !history.present) return

    const current = history.present
    
    // Handle branch deletion undo - restore deleted nodes and edges
    if (current.type === 'branch_deletion') {
      // Restore nodes
      current.deletedNodes.forEach(node => {
        state.addNode({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })
      })
      
      // Restore edges
      current.deletedEdges.forEach(edge => {
        state.addEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data,
        })
      })
    }

    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)

    set({
      history: {
        past: newPast,
        present: previous,
        future: [current, ...history.future]
      }
    })
  },

  redo: () => {
    const state = get() as unknown as {
      history: CanvasSlice['history']
      deleteBranchCascade: (nodeId: string) => void
    }
    
    const { history } = state
    if (history.future.length === 0) return

    const next = history.future[0]
    
    // Handle branch deletion redo - delete nodes again
    if (next.type === 'branch_deletion' && next.deletedNodes.length > 0) {
      // Delete the root node, which will cascade delete all downstream nodes
      const rootNodeId = next.deletedNodes[0].id
      state.deleteBranchCascade(rootNodeId)
    }

    const newFuture = history.future.slice(1)

    set({
      history: {
        past: history.present ? [...history.past, history.present] : history.past,
        present: next,
        future: newFuture
      }
    })
  }
})