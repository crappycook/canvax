import { useCallback } from 'react'
import { useStore } from '@/state/store'
import { useExecutionManager } from './useExecutionManager'
import { LLMClient } from '@/services/llmClient'

export interface UseRunNodeReturn {
  // Execution status
  isRunning: boolean
  error: Error | null
  
  // Actions
  run: () => Promise<void>
  stop: () => void
  retry: () => void
  
  // Status helpers
  canRun: boolean
  hasError: boolean
  requiresApiKey: boolean
}

export function useRunNode(nodeId: string | null): UseRunNodeReturn {
  const { nodes, settings } = useStore()
  
  // Create LLM client instance (mock for now)
  const llmClient = new LLMClient()
  
  // Use execution manager
  const executionManager = useExecutionManager(llmClient)
  
  // Early return if no nodeId
  if (!nodeId) {
    return {
      isRunning: false,
      error: null,
      run: async () => {},
      stop: () => {},
      retry: async () => {},
      canRun: false,
      hasError: false,
      requiresApiKey: false
    }
  }
  
  // Get node data
  const node = nodes.find(n => n.id === nodeId)
  const nodeData = node?.data
  
  // Check if API key is available for the default provider
  const hasApiKey = settings.apiKeys && Object.keys(settings.apiKeys).length > 0
  
  // Check if node can be run
  const canRun = Boolean(
    node &&
    nodeData && 
    typeof nodeData === 'object' &&
    'prompt' in nodeData &&
    typeof (nodeData as any).prompt === 'string' &&
    (nodeData as any).prompt?.trim() &&
    'model' in nodeData &&
    typeof (nodeData as any).model === 'string' &&
    hasApiKey &&
    executionManager.getNodeStatus(nodeId) !== 'running'
  )
  
  // Check if node has error
  const hasError = executionManager.getNodeStatus(nodeId) === 'error'
  
  // Get execution status
  const isRunning = executionManager.getNodeStatus(nodeId) === 'running'
  
  // Run function
  const run = useCallback(async () => {
    if (!nodeId) return
    
    try {
      // Reset any previous errors
      if (hasError) {
        // Clear error state
        const { setNodeStatus } = useStore.getState()
        setNodeStatus(nodeId, 'idle')
      }
      
      await executionManager.executeNode(nodeId)
    } catch (err) {
      console.error('Failed to run node:', err)
    }
  }, [nodeId, hasError, executionManager])
  
  // Stop function
  const stop = useCallback(() => {
    executionManager.stopExecution()
  }, [executionManager])
  
  // Retry function
  const retry = useCallback(async () => {
    if (!nodeId) return
    
    // Clear error state before retry
    const { setNodeStatus } = useStore.getState()
    setNodeStatus(nodeId, 'idle')
    
    await executionManager.executeNode(nodeId)
  }, [nodeId, executionManager])
  
  return {
    isRunning,
    error: null, // Simplified for now
    run,
    stop,
    retry,
    canRun,
    hasError,
    requiresApiKey: !hasApiKey
  }
}