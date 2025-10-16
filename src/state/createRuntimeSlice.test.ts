import { describe, test, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createRuntimeSlice, type RuntimeSlice } from './createRuntimeSlice'

function createTestStore() {
  return create<RuntimeSlice>()((...args) => ({
    ...createRuntimeSlice(...args),
  }))
}

describe('RuntimeSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  describe('enqueueNode', () => {
    test('adds node to queue', () => {
      store.getState().enqueueNode('node-1')

      expect(store.getState().executionQueue).toEqual(['node-1'])
    })

    test('avoids duplicate nodes', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-1')

      expect(store.getState().executionQueue).toEqual(['node-1'])
    })

    test('maintains queue order', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().enqueueNode('node-3')

      expect(store.getState().executionQueue).toEqual(['node-1', 'node-2', 'node-3'])
    })

    test('allows adding different nodes', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')

      expect(store.getState().executionQueue).toHaveLength(2)
      expect(store.getState().executionQueue).toContain('node-1')
      expect(store.getState().executionQueue).toContain('node-2')
    })
  })

  describe('dequeueNode', () => {
    test('returns null for empty queue', () => {
      const result = store.getState().dequeueNode()

      expect(result).toBeNull()
      expect(store.getState().currentExecution).toBeNull()
    })

    test('removes and returns first node from queue', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')

      const result = store.getState().dequeueNode()

      expect(result).toBe('node-1')
      expect(store.getState().executionQueue).toEqual(['node-2'])
    })

    test('updates currentExecution', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')

      store.getState().dequeueNode()

      expect(store.getState().currentExecution).toBe('node-1')
    })

    test('processes queue in FIFO order', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().enqueueNode('node-3')

      const first = store.getState().dequeueNode()
      const second = store.getState().dequeueNode()
      const third = store.getState().dequeueNode()

      expect(first).toBe('node-1')
      expect(second).toBe('node-2')
      expect(third).toBe('node-3')
    })

    test('leaves queue empty after dequeueing all nodes', () => {
      store.getState().enqueueNode('node-1')
      store.getState().dequeueNode()

      expect(store.getState().executionQueue).toEqual([])
    })
  })

  describe('startExecution', () => {
    test('sets isRunning to true', () => {
      store.getState().startExecution()

      expect(store.getState().isRunning).toBe(true)
    })

    test('adds specified node to queue', () => {
      store.getState().startExecution('node-1')

      expect(store.getState().executionQueue).toContain('node-1')
    })

    test('sets currentExecution when provided', () => {
      store.getState().startExecution('node-1')

      expect(store.getState().currentExecution).toBe('node-1')
    })

    test('does not add duplicate node to queue', () => {
      store.getState().enqueueNode('node-1')
      store.getState().startExecution('node-1')

      expect(store.getState().executionQueue).toEqual(['node-1'])
    })

    test('preserves existing currentExecution if already set', () => {
      store.getState().startExecution('node-1')
      store.getState().startExecution('node-2')

      expect(store.getState().currentExecution).toBe('node-1')
      expect(store.getState().executionQueue).toEqual(['node-1', 'node-2'])
    })

    test('starts without specific node', () => {
      store.getState().enqueueNode('node-1')
      store.getState().startExecution()

      expect(store.getState().isRunning).toBe(true)
      expect(store.getState().executionQueue).toEqual(['node-1'])
    })
  })

  describe('stopExecution', () => {
    test('stops all execution when no nodeId provided', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().startExecution()

      store.getState().stopExecution()

      expect(store.getState().isRunning).toBe(false)
      expect(store.getState().executionQueue).toEqual([])
      expect(store.getState().currentExecution).toBeNull()
    })

    test('removes specific node from queue', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().enqueueNode('node-3')

      store.getState().stopExecution('node-2')

      expect(store.getState().executionQueue).toEqual(['node-1', 'node-3'])
    })

    test('updates currentExecution when stopping current node', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().startExecution()
      store.getState().dequeueNode() // Set node-1 as current

      store.getState().stopExecution('node-1')

      expect(store.getState().currentExecution).toBe('node-2')
    })

    test('sets isRunning to false when queue becomes empty', () => {
      store.getState().startExecution('node-1')

      store.getState().stopExecution('node-1')

      expect(store.getState().isRunning).toBe(false)
    })

    test('keeps isRunning true when queue still has nodes', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().startExecution()

      store.getState().stopExecution('node-1')

      expect(store.getState().isRunning).toBe(true)
      expect(store.getState().executionQueue).toEqual(['node-2'])
    })

    test('does not change state when stopping non-existent node', () => {
      store.getState().enqueueNode('node-1')
      store.getState().startExecution()

      store.getState().stopExecution('node-999')

      expect(store.getState().executionQueue).toEqual(['node-1'])
      expect(store.getState().isRunning).toBe(true)
    })
  })

  describe('executionResults', () => {
    test('sets execution result', () => {
      const result = { success: true, output: 'Test output' }
      store.getState().setExecutionResult('node-1', result)

      const retrieved = store.getState().getExecutionResult('node-1')
      expect(retrieved).toEqual(result)
    })

    test('gets execution result', () => {
      store.getState().setExecutionResult('node-1', { success: true })

      const result = store.getState().getExecutionResult('node-1')

      expect(result).toEqual({ success: true })
    })

    test('returns null for non-existent result', () => {
      const result = store.getState().getExecutionResult('non-existent')

      expect(result).toBeNull()
    })

    test('stores multiple results', () => {
      store.getState().setExecutionResult('node-1', { success: true, output: 'Output 1' })
      store.getState().setExecutionResult('node-2', { success: false, error: 'Error 2' })

      const result1 = store.getState().getExecutionResult('node-1')
      const result2 = store.getState().getExecutionResult('node-2')

      expect(result1).toEqual({ success: true, output: 'Output 1' })
      expect(result2).toEqual({ success: false, error: 'Error 2' })
    })

    test('overwrites existing result', () => {
      store.getState().setExecutionResult('node-1', { success: true })
      store.getState().setExecutionResult('node-1', { success: false, error: 'Failed' })

      const result = store.getState().getExecutionResult('node-1')

      expect(result).toEqual({ success: false, error: 'Failed' })
    })

    test('clears all results', () => {
      store.getState().setExecutionResult('node-1', { success: true })
      store.getState().setExecutionResult('node-2', { success: false })

      store.getState().clearResults()

      expect(store.getState().getExecutionResult('node-1')).toBeNull()
      expect(store.getState().getExecutionResult('node-2')).toBeNull()
      expect(store.getState().executionResults.size).toBe(0)
    })

    test('stores result with both output and error', () => {
      const result = { success: false, output: 'Partial output', error: 'Error occurred' }
      store.getState().setExecutionResult('node-1', result)

      const retrieved = store.getState().getExecutionResult('node-1')
      expect(retrieved).toEqual(result)
    })
  })

  describe('clearQueue', () => {
    test('clears execution queue', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')

      store.getState().clearQueue()

      expect(store.getState().executionQueue).toEqual([])
    })

    test('clears currentExecution', () => {
      store.getState().startExecution('node-1')

      store.getState().clearQueue()

      expect(store.getState().currentExecution).toBeNull()
    })
  })

  describe('pauseExecution', () => {
    test('sets isRunning to false', () => {
      store.getState().startExecution('node-1')

      store.getState().pauseExecution()

      expect(store.getState().isRunning).toBe(false)
    })

    test('preserves queue when pausing', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().startExecution()

      store.getState().pauseExecution()

      expect(store.getState().executionQueue).toEqual(['node-1', 'node-2'])
    })
  })

  describe('resumeExecution', () => {
    test('sets isRunning to true', () => {
      store.getState().pauseExecution()

      store.getState().resumeExecution()

      expect(store.getState().isRunning).toBe(true)
    })

    test('preserves queue when resuming', () => {
      store.getState().enqueueNode('node-1')
      store.getState().enqueueNode('node-2')
      store.getState().pauseExecution()

      store.getState().resumeExecution()

      expect(store.getState().executionQueue).toEqual(['node-1', 'node-2'])
    })
  })
})
