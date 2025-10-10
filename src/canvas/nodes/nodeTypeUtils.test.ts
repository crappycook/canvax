import { describe, it, expect } from 'vitest'
import type { Edge } from '@xyflow/react'
import { getNodeType, isInputNode, isResponseNode, isHybridNode } from './nodeTypeUtils'
import type { ChatNodeData } from '@/canvas/types'

describe('nodeTypeUtils', () => {
  const createNodeData = (overrides?: Partial<ChatNodeData>): ChatNodeData => ({
    label: 'Test Node',
    model: 'gpt-4o',
    prompt: '',
    messages: [],
    status: 'idle',
    createdAt: Date.now(),
    ...overrides
  })

  describe('getNodeType', () => {
    it('should return input for new node without connections', () => {
      const nodeData = createNodeData()
      const edges: Edge[] = []
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('input')
    })

    it('should return input for node with prompt but no downstream', () => {
      const nodeData = createNodeData({ prompt: 'Hello' })
      const edges: Edge[] = []
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('input')
    })

    it('should return response for node with upstream and assistant messages but no prompt', () => {
      const nodeData = createNodeData({
        prompt: '',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello!',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' }
      ]
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('response')
    })

    it('should return hybrid for node with downstream, messages, and prompt', () => {
      const nodeData = createNodeData({
        prompt: 'Continue...',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Previous response',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' },
        { id: 'edge-2', source: 'node-1', target: 'node-2' }
      ]
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('hybrid')
    })

    it('should return hybrid for node with downstream and prompt', () => {
      const nodeData = createNodeData({ prompt: 'Hello' })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-1', target: 'node-2' }
      ]
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('hybrid')
    })

    it('should return hybrid for node with assistant messages but also has prompt', () => {
      const nodeData = createNodeData({
        prompt: 'New prompt',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Response',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' }
      ]
      
      const nodeType = getNodeType('node-1', nodeData, edges)
      
      expect(nodeType).toBe('hybrid')
    })
  })

  describe('isInputNode', () => {
    it('should return true for input nodes', () => {
      const nodeData = createNodeData()
      const edges: Edge[] = []
      
      expect(isInputNode('node-1', nodeData, edges)).toBe(true)
    })

    it('should return false for response nodes', () => {
      const nodeData = createNodeData({
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' }
      ]
      
      expect(isInputNode('node-1', nodeData, edges)).toBe(false)
    })
  })

  describe('isResponseNode', () => {
    it('should return true for response nodes', () => {
      const nodeData = createNodeData({
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' }
      ]
      
      expect(isResponseNode('node-1', nodeData, edges)).toBe(true)
    })

    it('should return false for input nodes', () => {
      const nodeData = createNodeData()
      const edges: Edge[] = []
      
      expect(isResponseNode('node-1', nodeData, edges)).toBe(false)
    })
  })

  describe('isHybridNode', () => {
    it('should return true for hybrid nodes', () => {
      const nodeData = createNodeData({
        prompt: 'Continue',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Previous',
            createdAt: Date.now()
          }
        ]
      })
      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-0', target: 'node-1' }
      ]
      
      expect(isHybridNode('node-1', nodeData, edges)).toBe(true)
    })

    it('should return false for input nodes', () => {
      const nodeData = createNodeData()
      const edges: Edge[] = []
      
      expect(isHybridNode('node-1', nodeData, edges)).toBe(false)
    })
  })
})
