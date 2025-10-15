import { useCallback, useRef } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { useStore } from '@/state/store'
import { type LLMClient } from '@/services/llmClient'
import { collectUpstreamContext } from '@/algorithms/collectUpstreamContext'
import { formatError } from '@/types/errors'
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

/**
 * Helper function to create a response node for a given input node
 * @param sourceNodeId - The ID of the input node that triggered execution
 * @param sourceNode - The input node object
 * @returns The ID of the newly created response node
 */
function createResponseNode(
  sourceNodeId: string,
  sourceNode: Node<ChatNodeData>
): string {
  const state = useStore.getState()

  const responseNodeId = `node-${Date.now()}`
  const responseNode: Node<ChatNodeData> = {
    id: responseNodeId,
    type: 'chat',
    position: {
      x: sourceNode.position.x,
      y: sourceNode.position.y + 350
    },
    data: {
      label: `Response from ${sourceNode.data.label}`,
      model: sourceNode.data.model,
      prompt: '',
      messages: [],
      status: 'idle',
      createdAt: Date.now(),
      sourceNodeId: sourceNodeId,
    }
  }

  // Add the response node
  state.addNode(responseNode)

  // Create edge connecting source to response
  const edge: Edge = {
    id: `edge-${Date.now()}`,
    source: sourceNodeId,
    target: responseNodeId,
    type: 'default'
  }
  state.addEdge(edge)

  return responseNodeId
}

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

    // 1. Collect upstream context with integrity checking
    const context = collectUpstreamContext(nodeId, nodes, edges)

    // 2. Check for context integrity issues
    if (context.hasErrors) {
      const errorNodeLabels = context.errorNodes
        .map(id => nodes.find(n => n.id === id)?.data.label || id)
        .join(', ')
      
      console.warn(
        `⚠️ Context integrity warning: Upstream nodes have errors: ${errorNodeLabels}. ` +
        `The context may be incomplete.`
      )
      
      // Set a warning on the node (non-blocking)
      state.updateNode(nodeId, { 
        error: `Warning: Upstream context incomplete (errors in: ${errorNodeLabels})` 
      })
    }

    if (!context.isComplete && context.upstreamNodes.length > 0) {
      console.warn(
        `⚠️ Context may be incomplete for node ${nodeId}. ` +
        `Some upstream nodes may not be properly connected.`
      )
    }

    // 3. Check if input node already has downstream connections
    const downstreamNodes = state.getDownstreamNodes(nodeId) as Node<ChatNodeData>[]
    let responseNodeId: string | null = null

    if (downstreamNodes.length > 0) {
      // Use existing response node (most recently created)
      const sortedDownstream = downstreamNodes
        .sort((a, b) => (b.data.createdAt ?? 0) - (a.data.createdAt ?? 0))

      responseNodeId = sortedDownstream[0]?.id ?? null
    }

    // 4. If no downstream node exists, create a new response node
    if (!responseNodeId) {
      responseNodeId = createResponseNode(nodeId, node)
    }

    state.startExecution(nodeId)
    state.setNodeStatus(nodeId, 'running')
    state.updateNode(nodeId, { error: undefined })

    // 5. Set response node to running state
    state.setNodeStatus(responseNodeId, 'running')
    state.updateNode(responseNodeId, { error: undefined })

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      createdAt: Date.now(),
    }

    // Add user message to input node for context preservation
    state.addMessageToNode(nodeId, userMessage)

    const abortController = new AbortController()
    abortControllersRef.current.set(nodeId, abortController)

    try {
      // 6. Build complete message array: upstream context + current prompt
      // Context messages are already deduplicated and in topological order
      const completeMessages = [
        ...context.messages,
        { role: 'user' as const, content: prompt },
      ]

      const response = await llmClient.generate(
        {
          model: nodeData.model || state.settings.defaultModel,
          messages: completeMessages,
          temperature: nodeData.temperature ?? state.settings.temperature,
          maxTokens: nodeData.maxTokens ?? state.settings.maxTokens,
        },
        { signal: abortController.signal }
      )

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
        metadata: {
          model: nodeData.model || state.settings.defaultModel,
        }
      }

      // 7. Write LLM response to response node (not input node)
      state.addMessageToNode(responseNodeId, assistantMessage)
      state.setNodeStatus(responseNodeId, 'success')
      state.setExecutionResult(responseNodeId, { success: true, output: response.content })

      // 8. Keep the prompt in input node (don't clear it)
      // User can manually clear or edit it for next execution
      state.setNodeStatus(nodeId, 'success')
      state.setExecutionResult(nodeId, { success: true, output: response.content })

      // 9. Auto-hide success status after 2 seconds
      setTimeout(() => {
        const currentState = useStore.getState()
        const currentNode = currentState.nodes.find(n => n.id === nodeId)
        if (currentNode?.data.status === 'success') {
          currentState.setNodeStatus(nodeId, 'idle')
        }
      }, 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        state.setNodeStatus(nodeId, 'idle')
        state.setNodeStatus(responseNodeId, 'idle')
        state.setExecutionResult(nodeId, { success: false, error: 'Request cancelled' })
        state.setExecutionResult(responseNodeId, { success: false, error: 'Request cancelled' })
        return
      }

      // Format error using the error formatting utility
      const formattedError = formatError(error, 'Execution failed')
      const errorMessage = formattedError.message

      // Set error on response node (not input node)
      state.setNodeStatus(responseNodeId, 'error')
      state.updateNode(responseNodeId, { error: errorMessage })
      state.setExecutionResult(responseNodeId, { success: false, error: errorMessage })

      state.setNodeStatus(nodeId, 'error')
      state.setExecutionResult(nodeId, { success: false, error: errorMessage })

      throw error
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