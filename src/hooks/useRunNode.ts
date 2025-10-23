import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '@/state/store'
import { useExecutionManager } from '@/hooks/useExecutionManager'
import { LLMClient } from '@/services/llmClient'
import type { ChatNodeData } from '@/types'
import { findProviderByModel } from '@/config/llmProviders'

export interface UseRunNodeReturn {
  // Execution status
  isRunning: boolean
  error: Error | null

  // Actions
  run: () => Promise<void>
  stop: () => void
  retry: () => Promise<void>

  // Status helpers
  canRun: boolean
  hasError: boolean
  requiresApiKey: boolean
  provider: ReturnType<typeof findProviderByModel>
}

const llmClient = new LLMClient()

export function useRunNode(nodeId: string | null): UseRunNodeReturn {
  const [lastError, setLastError] = useState<Error | null>(null)

  const settings = useStore(state => state.settings)

  const node = useStore(
    useCallback(
      state => (nodeId ? state.nodes.find(n => n.id === nodeId) ?? null : null),
      [nodeId]
    )
  )

  const nodeData = node?.data as ChatNodeData | undefined

  const executionManager = useExecutionManager(llmClient)

  useEffect(() => {
    llmClient.syncApiKeys(settings.apiKeys ?? {})
  }, [settings.apiKeys])

  const selectedModel = nodeData?.model || settings.defaultModel

  const provider = useMemo(() => findProviderByModel(selectedModel), [selectedModel])

  const requiresApiKey = useMemo(() => {
    if (!provider) return false
    if (!provider.requiresApiKey) return false
    const apiKey = settings.apiKeys?.[provider.id]
    return !apiKey || apiKey.trim().length === 0
  }, [provider, settings.apiKeys])

  const status = nodeData?.status ?? 'idle'
  const isRunning = status === 'running'
  const hasError = status === 'error'

  const prompt = typeof nodeData?.prompt === 'string' ? nodeData.prompt.trim() : ''
  const canRun = Boolean(provider && !requiresApiKey && prompt && selectedModel && !isRunning)

  const run = useCallback(async () => {
    if (!nodeId || !canRun) return

    setLastError(null)

    try {
      await executionManager.executeNode(nodeId)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const fallbackError =
        error instanceof Error ? error : new Error('Failed to run node')
      setLastError(fallbackError)
    }
  }, [nodeId, canRun, executionManager])

  const stop = useCallback(() => {
    if (!nodeId) return
    executionManager.stopExecution(nodeId)
  }, [nodeId, executionManager])

  const retry = useCallback(async () => {
    if (!nodeId) return

    const { setNodeStatus, updateNode } = useStore.getState()
    setNodeStatus(nodeId, 'idle')
    updateNode(nodeId, { error: undefined })
    setLastError(null)

    await run()
  }, [nodeId, run])

  const combinedError = useMemo(() => {
    if (lastError) return lastError
    if (hasError && nodeData?.error) {
      return new Error(nodeData.error)
    }
    return null
  }, [hasError, nodeData?.error, lastError])

  return {
    isRunning,
    error: combinedError,
    run,
    stop,
    retry,
    canRun,
    hasError,
    requiresApiKey,
    provider,
  }
}
