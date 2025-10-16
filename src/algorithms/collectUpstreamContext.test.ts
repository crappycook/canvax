import { describe, test, expect } from 'vitest'
import type { Edge } from '@xyflow/react'
import { validateNoCycle, collectUpstreamContext } from './collectUpstreamContext'
import { createMockNode, createMockEdge } from '@/test/testUtils'
import { mockEdges, createChainEdges } from '@/test/mockData'

describe('validateNoCycle', () => {
  // ============================================================================
  // Basic Scenarios
  // ============================================================================

  describe('Basic Scenarios', () => {
    test('empty graph returns true', () => {
      const nodes: string[] = []
      const edges: Edge[] = []
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })

    test('single node with no edges returns true', () => {
      const nodes = ['node-1']
      const edges: Edge[] = []
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })

    test('simple chain graph returns true', () => {
      const nodes = ['node-1', 'node-2', 'node-3']
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
      ]
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })
  })

  // ============================================================================
  // Cycle Detection
  // ============================================================================

  describe('Cycle Detection', () => {
    test('self-loop returns false', () => {
      const nodes = ['node-1']
      const edges = [mockEdges.selfLoop as Edge]
      
      expect(validateNoCycle(nodes, edges)).toBe(false)
    })

    test('two-node cycle returns false', () => {
      const nodes = ['node-1', 'node-2']
      const edges = mockEdges.cycle as Edge[]
      
      expect(validateNoCycle(nodes, edges)).toBe(false)
    })

    test('three-node cycle returns false', () => {
      const nodes = ['node-1', 'node-2', 'node-3']
      const edges = mockEdges.threeCycle as Edge[]
      
      expect(validateNoCycle(nodes, edges)).toBe(false)
    })

    test('complex cycle in larger graph returns false', () => {
      const nodes = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5']
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
        createMockEdge({ id: 'e3', source: 'node-3', target: 'node-4' }),
        createMockEdge({ id: 'e4', source: 'node-4', target: 'node-5' }),
        createMockEdge({ id: 'e5', source: 'node-5', target: 'node-2' }), // Creates cycle
      ]
      
      expect(validateNoCycle(nodes, edges)).toBe(false)
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    test('multiple independent subgraphs returns true', () => {
      const nodes = ['node-1', 'node-2', 'node-3', 'node-4']
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
        createMockEdge({ id: 'e2', source: 'node-3', target: 'node-4' }),
      ]
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })

    test('diamond structure (non-cyclic) returns true', () => {
      const nodes = ['node-1', 'node-2', 'node-3', 'node-4']
      const edges = mockEdges.diamond as Edge[]
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })

    test('long chain without cycle returns true', () => {
      const nodes = Array.from({ length: 10 }, (_, i) => `node-${i + 1}`)
      const edges = createChainEdges(10)
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })

    test('nodes with no outgoing edges returns true', () => {
      const nodes = ['node-1', 'node-2', 'node-3']
      const edges: Edge[] = []
      
      expect(validateNoCycle(nodes, edges)).toBe(true)
    })
  })
})


describe('collectUpstreamContext', () => {
  // ============================================================================
  // Basic Scenarios
  // ============================================================================

  describe('Basic Scenarios', () => {
    test('no upstream nodes returns empty context', () => {
      const nodes = [
        createMockNode({ id: 'node-1' }),
      ]
      const edges: Edge[] = []
      
      const context = collectUpstreamContext('node-1', nodes, edges)
      
      expect(context.nodeId).toBe('node-1')
      expect(context.upstreamNodes).toHaveLength(0)
      expect(context.messages).toHaveLength(0)
      expect(context.executionOrder).toHaveLength(0)
      expect(context.hasErrors).toBe(false)
      expect(context.errorNodes).toHaveLength(0)
      expect(context.isComplete).toBe(true)
    })

    test('single upstream node returns its messages', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Hello', createdAt: 1000 },
              { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({ id: 'node-2' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
      ]
      
      const context = collectUpstreamContext('node-2', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(1)
      expect(context.upstreamNodes[0].id).toBe('node-1')
      expect(context.messages).toHaveLength(2)
      expect(context.messages[0].content).toBe('Hello')
      expect(context.messages[1].content).toBe('Hi')
      expect(context.executionOrder).toEqual(['node-1'])
      expect(context.hasErrors).toBe(false)
    })

    test('multiple upstream nodes in topological order', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'First', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-2', role: 'user', content: 'Second', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({ id: 'node-3' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
      ]
      
      const context = collectUpstreamContext('node-3', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(2)
      expect(context.executionOrder).toEqual(['node-1', 'node-2'])
      expect(context.messages).toHaveLength(2)
      expect(context.messages[0].content).toBe('First')
      expect(context.messages[1].content).toBe('Second')
    })
  })

  // ============================================================================
  // Complex Graph Structures
  // ============================================================================

  describe('Complex Graph Structures', () => {
    test('deep nested upstream nodes', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Level 1', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-2', role: 'user', content: 'Level 2', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({
          id: 'node-3',
          data: {
            label: 'Node 3',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-3', role: 'user', content: 'Level 3', createdAt: 3000 },
            ],
            status: 'success',
            createdAt: 3000,
          },
        }),
        createMockNode({ id: 'node-4' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
        createMockEdge({ id: 'e3', source: 'node-3', target: 'node-4' }),
      ]
      
      const context = collectUpstreamContext('node-4', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(3)
      expect(context.executionOrder).toEqual(['node-1', 'node-2', 'node-3'])
      expect(context.messages).toHaveLength(3)
    })

    test('multiple paths converging to target node', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Path A', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-2', role: 'user', content: 'Path B', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({ id: 'node-3' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-3' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
      ]
      
      const context = collectUpstreamContext('node-3', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(2)
      expect(context.messages).toHaveLength(2)
      expect(context.hasErrors).toBe(false)
    })

    test('diamond dependency structure', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Start', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-2', role: 'user', content: 'Left', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({
          id: 'node-3',
          data: {
            label: 'Node 3',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-3', role: 'user', content: 'Right', createdAt: 3000 },
            ],
            status: 'success',
            createdAt: 3000,
          },
        }),
        createMockNode({ id: 'node-4' }),
      ]
      const edges = mockEdges.diamond as Edge[]
      
      const context = collectUpstreamContext('node-4', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(3)
      expect(context.messages).toHaveLength(3)
      // node-1 should come before node-2 and node-3
      expect(context.executionOrder[0]).toBe('node-1')
    })
  })

  // ============================================================================
  // Message Processing
  // ============================================================================

  describe('Message Processing', () => {
    test('messages deduplicated by content and timestamp', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Hello', createdAt: 1000 },
              { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-3', role: 'user', content: 'Hello', createdAt: 1000 }, // Duplicate
              { id: 'msg-4', role: 'user', content: 'World', createdAt: 3000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({ id: 'node-3' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-3' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
      ]
      
      const context = collectUpstreamContext('node-3', nodes, edges)
      
      // Should have 3 unique messages (duplicate 'Hello' removed)
      expect(context.messages).toHaveLength(3)
      expect(context.messages.map(m => m.content)).toEqual(['Hello', 'Hi', 'World'])
    })

    test('messages sorted by timestamp', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'user', content: 'Third', createdAt: 3000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-2', role: 'user', content: 'First', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({
          id: 'node-3',
          data: {
            label: 'Node 3',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-3', role: 'user', content: 'Second', createdAt: 2000 },
            ],
            status: 'success',
            createdAt: 3000,
          },
        }),
        createMockNode({ id: 'node-4' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-4' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-4' }),
        createMockEdge({ id: 'e3', source: 'node-3', target: 'node-4' }),
      ]
      
      const context = collectUpstreamContext('node-4', nodes, edges)
      
      expect(context.messages.map(m => m.content)).toEqual(['First', 'Second', 'Third'])
    })

    test('error nodes marked in context', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [],
            status: 'error',
            error: 'API Error',
            createdAt: 1000,
          },
        }),
        createMockNode({
          id: 'node-2',
          data: {
            label: 'Node 2',
            model: 'gpt-4o',
            prompt: '',
            messages: [],
            status: 'success',
            createdAt: 2000,
          },
        }),
        createMockNode({ id: 'node-3' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-3' }),
        createMockEdge({ id: 'e2', source: 'node-2', target: 'node-3' }),
      ]
      
      const context = collectUpstreamContext('node-3', nodes, edges)
      
      expect(context.hasErrors).toBe(true)
      expect(context.errorNodes).toContain('node-1')
      expect(context.isComplete).toBe(false)
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    test('upstream nodes with no messages', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [],
            status: 'idle',
            createdAt: 1000,
          },
        }),
        createMockNode({ id: 'node-2' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
      ]
      
      const context = collectUpstreamContext('node-2', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(1)
      expect(context.messages).toHaveLength(0)
    })

    test('empty messages array', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({ id: 'node-2' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
      ]
      
      const context = collectUpstreamContext('node-2', nodes, edges)
      
      expect(context.messages).toHaveLength(0)
      expect(context.hasErrors).toBe(false)
    })

    test('node with only system messages', () => {
      const nodes = [
        createMockNode({
          id: 'node-1',
          data: {
            label: 'Node 1',
            model: 'gpt-4o',
            prompt: '',
            messages: [
              { id: 'msg-1', role: 'system', content: 'System prompt', createdAt: 1000 },
            ],
            status: 'success',
            createdAt: 1000,
          },
        }),
        createMockNode({ id: 'node-2' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
      ]
      
      const context = collectUpstreamContext('node-2', nodes, edges)
      
      expect(context.messages).toHaveLength(1)
      expect(context.messages[0].role).toBe('system')
    })

    test('isolated target node with no connections', () => {
      const nodes = [
        createMockNode({ id: 'node-1' }),
        createMockNode({ id: 'node-2' }),
        createMockNode({ id: 'node-3' }),
      ]
      const edges = [
        createMockEdge({ id: 'e1', source: 'node-1', target: 'node-2' }),
      ]
      
      const context = collectUpstreamContext('node-3', nodes, edges)
      
      expect(context.upstreamNodes).toHaveLength(0)
      expect(context.messages).toHaveLength(0)
      expect(context.executionOrder).toHaveLength(0)
    })
  })
})
