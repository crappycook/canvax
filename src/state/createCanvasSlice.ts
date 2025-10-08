import { type StateCreator } from 'zustand'
import { type Viewport } from '@xyflow/react'

export interface CanvasSlice {
  viewport: Viewport
  snapToGrid: boolean
  selection: string[]
  history: {
    past: unknown[]
    present: unknown
    future: unknown[]
  }
  setViewport: (viewport: Viewport) => void
  setSnapToGrid: (snapToGrid: boolean) => void
  setSelection: (selection: string[]) => void
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
  
  undo: () => {
    const { history } = get()
    if (history.past.length === 0) return
    
    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    
    set({
      history: {
        past: newPast,
        present: previous,
        future: [history.present, ...history.future]
      }
    })
  },
  
  redo: () => {
    const { history } = get()
    if (history.future.length === 0) return
    
    const next = history.future[0]
    const newFuture = history.future.slice(1)
    
    set({
      history: {
        past: [...history.past, history.present],
        present: next,
        future: newFuture
      }
    })
  }
})