import { type StateCreator } from 'zustand'

export interface RuntimeSlice {
  isRunning: boolean
  executionQueue: string[]
  currentExecution: string | null
  executionResults: Map<string, { success: boolean; output?: string; error?: string }>
  
  // Execution control
  startExecution: (nodeId?: string) => void
  stopExecution: () => void
  pauseExecution: () => void
  resumeExecution: () => void
  
  // Queue management
  enqueueNode: (nodeId: string) => void
  dequeueNode: () => string | null
  clearQueue: () => void
  
  // Results
  getExecutionResult: (nodeId: string) => { success: boolean; output?: string; error?: string } | null
  setExecutionResult: (nodeId: string, result: { success: boolean; output?: string; error?: string }) => void
  clearResults: () => void
}

export const createRuntimeSlice: StateCreator<RuntimeSlice> = (set, get) => ({
  isRunning: false,
  executionQueue: [],
  currentExecution: null,
  executionResults: new Map(),

  startExecution: (nodeId) => {
    if (nodeId) {
      set({ executionQueue: [nodeId], isRunning: true })
    } else {
      set({ isRunning: true })
    }
  },

  stopExecution: () => {
    set({ 
      isRunning: false, 
      executionQueue: [], 
      currentExecution: null 
    })
  },

  pauseExecution: () => {
    set({ isRunning: false })
  },

  resumeExecution: () => {
    set({ isRunning: true })
  },

  enqueueNode: (nodeId) => {
    set((state) => ({
      executionQueue: [...state.executionQueue, nodeId]
    }))
  },

  dequeueNode: () => {
    const state = get()
    if (state.executionQueue.length === 0) return null
    
    const nextNodeId = state.executionQueue[0]
    set({
      executionQueue: state.executionQueue.slice(1),
      currentExecution: nextNodeId
    })
    
    return nextNodeId
  },

  clearQueue: () => {
    set({ executionQueue: [], currentExecution: null })
  },

  getExecutionResult: (nodeId) => {
    const state = get()
    return state.executionResults.get(nodeId) || null
  },

  setExecutionResult: (nodeId, result) => {
    set((state) => {
      const newResults = new Map(state.executionResults)
      newResults.set(nodeId, result)
      return { executionResults: newResults }
    })
  },

  clearResults: () => {
    set({ executionResults: new Map() })
  }
})