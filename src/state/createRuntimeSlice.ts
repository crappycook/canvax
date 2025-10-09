import { type StateCreator } from 'zustand'

export interface RuntimeSlice {
  isRunning: boolean
  executionQueue: string[]
  currentExecution: string | null
  executionResults: Map<string, { success: boolean; output?: string; error?: string }>

  // Execution control
  startExecution: (nodeId?: string) => void
  stopExecution: (nodeId?: string) => void
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
    set((state) => {
      const alreadyQueued = nodeId ? state.executionQueue.includes(nodeId) : false
      const executionQueue = nodeId
        ? alreadyQueued
          ? state.executionQueue
          : [...state.executionQueue, nodeId]
        : state.executionQueue

      const currentExecution = state.currentExecution ?? nodeId ?? null

      return {
        isRunning: true,
        executionQueue,
        currentExecution,
      }
    })
  },

  stopExecution: (nodeId) => {
    if (!nodeId) {
      set({
        isRunning: false,
        executionQueue: [],
        currentExecution: null,
      })
      return
    }

    set((state) => {
      const executionQueue = state.executionQueue.filter((queuedId) => queuedId !== nodeId)
      const currentExecution = state.currentExecution === nodeId
        ? executionQueue[0] ?? null
        : state.currentExecution

      return {
        isRunning: executionQueue.length > 0,
        executionQueue,
        currentExecution,
      }
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
      executionQueue: state.executionQueue.includes(nodeId)
        ? state.executionQueue
        : [...state.executionQueue, nodeId],
    }))
  },

  dequeueNode: () => {
    const state = get()
    if (state.executionQueue.length === 0) return null

    const [nextNodeId, ...rest] = state.executionQueue
    set({
      executionQueue: rest,
      currentExecution: nextNodeId,
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
  },
})