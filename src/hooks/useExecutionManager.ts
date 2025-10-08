import { useCallback, useRef } from 'react'
import { useStore } from '@/state/store'
import { LLMClient } from '@/services/llmClient'
import { collectUpstreamContext } from '@/algorithms/collectUpstreamContext'

export interface ExecutionManager {
  isRunning: boolean
  currentExecution: string | null
  executionQueue: string[]
  
  // Execution control
  executeNode: (nodeId: string) => Promise<void>
  executeAll: () => Promise<void>
  stopExecution: () => void
  pauseExecution: () => void
  resumeExecution: () => void
  
  // Queue management
  enqueueNode: (nodeId: string) => void
  clearQueue: () => void
  
  // Status
  getNodeStatus: (nodeId: string) => 'idle' | 'running' | 'success' | 'error'
}

export function useExecutionManager(llmClient: LLMClient): ExecutionManager {
  const {
    nodes,
    edges,
    isRunning,
    executionQueue,
    currentExecution,
    setNodeStatus,
    addMessageToNode,
    enqueueNode: storeEnqueueNode,
    clearQueue: storeClearQueue
  } = useStore()
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const executeNode = useCallback(async (nodeId: string): Promise<void> => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    try {
      setNodeStatus(nodeId, 'running')
      
      // Collect context from upstream nodes
      const context = collectUpstreamContext(nodeId, nodes, edges)
      
      // Prepare LLM request
      const request = {
        model: node.data.modelId,
        messages: [
          ...context.messages,
          { role: 'user' as const, content: node.data.prompt }
        ],
        temperature: 0.7,
        maxTokens: 1000
      }
      
      abortControllerRef.current = new AbortController()
      const response = await llmClient.generate(request)
      
      // Add response as assistant message
      const newMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: response.content,
        createdAt: Date.now()
      }
      
      addMessageToNode(nodeId, newMessage)
      setNodeStatus(nodeId, 'success')
      
    } catch (error) {
      setNodeStatus(nodeId, 'error')
      console.error('Execution failed:', error)
    }
  }, [nodes, edges, llmClient, setNodeStatus, addMessageToNode])
  
  const executeAll = useCallback(async (): Promise<void> => {
    // Get all nodes that have no incoming edges (root nodes)
    const rootNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    )
    
    // Execute root nodes first
    for (const node of rootNodes) {
      await executeNode(node.id)
    }
  }, [nodes, edges, executeNode])
  
  const stopExecution = useCallback((): void => {
    abortControllerRef.current?.abort()
    storeClearQueue()
    
    // Reset all running nodes to idle
    nodes.forEach(node => {
      if (node.data.status === 'running') {
        setNodeStatus(node.id, 'idle')
      }
    })
  }, [nodes, storeClearQueue, setNodeStatus])
  
  const pauseExecution = useCallback((): void => {
    abortControllerRef.current?.abort()
    // Implementation for pausing execution
  }, [])
  
  const resumeExecution = useCallback((): void => {
    // Implementation for resuming execution
  }, [])
  
  const enqueueNode = useCallback((nodeId: string): void => {
    storeEnqueueNode(nodeId)
  }, [storeEnqueueNode])
  
  const clearQueue = useCallback((): void => {
    storeClearQueue()
  }, [storeClearQueue])
  
  const getNodeStatus = useCallback((nodeId: string): 'idle' | 'running' | 'success' | 'error' => {
    const node = nodes.find(n => n.id === nodeId)
    return node?.data.status || 'idle'
  }, [nodes])
  
  return {
    isRunning,
    currentExecution,
    executionQueue,
    executeNode,
    executeAll,
    stopExecution,
    pauseExecution,
    resumeExecution,
    enqueueNode,
    clearQueue,
    getNodeStatus
  }
}