import { useCallback, useRef } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { useStore } from '@/state/store'
import { type LLMClient } from '@/services/llmClient'
import { collectUpstreamContext } from '@/algorithms/collectUpstreamContext'
import type { ChatMessage, ChatNodeData } from '@/types'

export interface ExecutionManager {
  isRunning: boolean
  currentExecution: string | null
  executionQueue: string[]

  // Execution control
  executeNode: (nodeId: string) => Promise<void>
  executeAll: () => Promise<void>
  stopExecution: (nodeId?: string) => void
  pauseExecution: () => void
  resumeExecution: () => void

  // Queue management
  enqueueNode: (nodeId: string) => void
  clearQueue: () => void

  // Status
  getNodeStatus: (nodeId: string) => 'idle' | 'running' | 'success' | 'error'
}

type ErrorWithStatus = Error & { status?: number }

export function useExecutionManager(llmClient: LLMClient): ExecutionManager {
  const isRunning = useStore(state => state.isRunning)
  const executionQueue = useStore(state => state.executionQueue)
  const currentExecution = useStore(state => state.currentExecution)

  const abortControllersRef = useRef(new Map<string, AbortController>())

  const executeNode = useCallback(async (nodeId: string): Promise<void> => {
    const state = useStore.getState()
    const nodes = state.nodes as Node<ChatNodeData>[]
    const edges = state.edges as Edge[]
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const nodeData = node.data as ChatNodeData
    const prompt = typeof nodeData.prompt === 'string' ? nodeData.prompt.trim() : ''
    if (!prompt) return

    state.startExecution(nodeId)
    state.setNodeStatus(nodeId, 'running')
    state.updateNode(nodeId, { error: undefined })

    const context = collectUpstreamContext(nodeId, nodes, edges)

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    }

    state.addMessageToNode(nodeId, userMessage)

    const abortController = new AbortController()
    abortControllersRef.current.set(nodeId, abortController)

    try {
      const response = await llmClient.generate(
        {
          model: nodeData.model || state.settings.defaultModel,
          messages: [
            ...context.messages,
            { role: 'user' as const, content: prompt },
          ],
          temperature: nodeData.temperature ?? state.settings.temperature,
          maxTokens: nodeData.maxTokens ?? state.settings.maxTokens,
        },
        { signal: abortController.signal }
      )

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      }

      state.addMessageToNode(nodeId, assistantMessage)
      state.setNodeStatus(nodeId, 'success')
      state.updateNode(nodeId, { prompt: '' })
      state.setExecutionResult(nodeId, { success: true, output: response.content })
    } catch (error) {
      const typedError = error as ErrorWithStatus

      if (typedError instanceof DOMException && typedError.name === 'AbortError') {
        state.setNodeStatus(nodeId, 'idle')
        state.setExecutionResult(nodeId, { success: false, error: 'Request cancelled' })
        return
      }

      const status = typedError.status
      let errorMessage = 'Unexpected error. Please retry.'

      if (status === 401) {
        errorMessage = 'Authentication failed. Please update your API key in settings.'
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before retrying.'
      } else if (typedError.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Check your connection and try again.'
      } else if (typedError.message) {
        errorMessage = typedError.message
      }

      state.setNodeStatus(nodeId, 'error')
      state.updateNode(nodeId, { error: errorMessage })
      state.setExecutionResult(nodeId, { success: false, error: errorMessage })

      throw typedError
    } finally {
      abortControllersRef.current.delete(nodeId)
      state.stopExecution(nodeId)
    }
  }, [llmClient])

  const executeAll = useCallback(async (): Promise<void> => {
    const state = useStore.getState()
    const nodes = state.nodes as Node<ChatNodeData>[]
    const edges = state.edges as Edge[]
    const rootNodes = nodes.filter((node) =>
      !edges.some(edge => edge.target === node.id)
    )

    await Promise.all(rootNodes.map(node => executeNode(node.id)))
  }, [executeNode])

  const stopExecution = useCallback((nodeId?: string): void => {
    const state = useStore.getState()

    if (nodeId) {
      const controller = abortControllersRef.current.get(nodeId)
      controller?.abort()
      abortControllersRef.current.delete(nodeId)
      state.stopExecution(nodeId)
      state.setNodeStatus(nodeId, 'idle')
      return
    }

    abortControllersRef.current.forEach(controller => controller.abort())
    abortControllersRef.current.clear()
    state.stopExecution()

    const nodes = state.nodes as Node<ChatNodeData>[]
    nodes.forEach(node => {
      if (node.data.status === 'running') {
        state.setNodeStatus(node.id, 'idle')
      }
    })
  }, [])

  const pauseExecution = useCallback((): void => {
    const state = useStore.getState()
    state.pauseExecution()
  }, [])

  const resumeExecution = useCallback((): void => {
    const state = useStore.getState()
    state.resumeExecution()
  }, [])

  const enqueueNode = useCallback((nodeId: string): void => {
    const state = useStore.getState()
    state.enqueueNode(nodeId)
  }, [])

  const clearQueue = useCallback((): void => {
    const state = useStore.getState()
    abortControllersRef.current.forEach(controller => controller.abort())
    abortControllersRef.current.clear()
    state.clearQueue()
  }, [])

  const getNodeStatus = useCallback((nodeId: string): 'idle' | 'running' | 'success' | 'error' => {
    const state = useStore.getState()
    const nodes = state.nodes as Node<ChatNodeData>[]
    const node = nodes.find(n => n.id === nodeId)
    return node?.data.status ?? 'idle'
  }, [])

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
    getNodeStatus,
  }
}