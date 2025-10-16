import { describe, it, expect } from 'vitest'
import { createMockNode, createMockEdge, createMockProjectSnapshot } from './testUtils'
import { mockNodes, mockEdges, mockMessages, createGraphNodes, createChainEdges } from './mockData'

describe('testUtils', () => {
  describe('createMockNode', () => {
    it('should create a node with default values', () => {
      const node = createMockNode()
      
      expect(node.id).toBe('test-node-1')
      expect(node.type).toBe('chat')
      expect(node.position).toEqual({ x: 0, y: 0 })
      expect(node.data.label).toBe('Test Node')
      expect(node.data.status).toBe('idle')
      expect(node.data.messages).toEqual([])
    })

    it('should override default values', () => {
      const node = createMockNode({
        id: 'custom-node',
        position: { x: 100, y: 200 },
        data: {
          label: 'Custom Node',
          model: 'gpt-4o',
          prompt: 'Custom prompt',
          messages: [],
          status: 'running',
          createdAt: 5000,
        },
      })

      expect(node.id).toBe('custom-node')
      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(node.data.label).toBe('Custom Node')
      expect(node.data.status).toBe('running')
    })
  })

  describe('createMockEdge', () => {
    it('should create an edge with default values', () => {
      const edge = createMockEdge()
      
      expect(edge.id).toBe('test-edge-1')
      expect(edge.source).toBe('node-1')
      expect(edge.target).toBe('node-2')
    })

    it('should override default values', () => {
      const edge = createMockEdge({
        id: 'custom-edge',
        source: 'node-a',
        target: 'node-b',
      })

      expect(edge.id).toBe('custom-edge')
      expect(edge.source).toBe('node-a')
      expect(edge.target).toBe('node-b')
    })
  })

  describe('createMockProjectSnapshot', () => {
    it('should create a project snapshot with default values', () => {
      const snapshot = createMockProjectSnapshot()
      
      expect(snapshot.id).toBe('test-project-1')
      expect(snapshot.version).toBe(1)
      expect(snapshot.metadata.title).toBe('Test Project')
      expect(snapshot.graph.nodes).toEqual([])
      expect(snapshot.graph.edges).toEqual([])
      expect(snapshot.settings.defaultModel).toBe('gpt-4o')
    })

    it('should override default values', () => {
      const snapshot = createMockProjectSnapshot({
        id: 'custom-project',
        metadata: {
          title: 'Custom Project',
          updatedAt: 9999,
        },
      })

      expect(snapshot.id).toBe('custom-project')
      expect(snapshot.metadata.title).toBe('Custom Project')
      expect(snapshot.metadata.updatedAt).toBe(9999)
    })
  })
})

describe('mockData', () => {
  describe('mockMessages', () => {
    it('should have user and assistant messages', () => {
      expect(mockMessages.userMessage1.role).toBe('user')
      expect(mockMessages.assistantMessage1.role).toBe('assistant')
      expect(mockMessages.systemMessage.role).toBe('system')
    })
  })

  describe('mockNodes', () => {
    it('should have empty node', () => {
      expect(mockNodes.empty.data.messages).toEqual([])
      expect(mockNodes.empty.data.status).toBe('idle')
    })

    it('should have node with messages', () => {
      expect(mockNodes.withMessages.data.messages.length).toBe(2)
      expect(mockNodes.withMessages.data.status).toBe('success')
    })

    it('should have node with error', () => {
      expect(mockNodes.withError.data.status).toBe('error')
      expect(mockNodes.withError.data.error).toBeDefined()
    })
  })

  describe('mockEdges', () => {
    it('should have simple edge', () => {
      const edge = mockEdges.simple as any
      expect(edge.source).toBe('node-1')
      expect(edge.target).toBe('node-2')
    })

    it('should have cycle edges', () => {
      const edges = mockEdges.cycle as any[]
      expect(edges).toHaveLength(2)
      expect(edges[0].source).toBe('node-1')
      expect(edges[0].target).toBe('node-2')
      expect(edges[1].source).toBe('node-2')
      expect(edges[1].target).toBe('node-1')
    })
  })

  describe('createGraphNodes', () => {
    it('should create specified number of nodes', () => {
      const nodes = createGraphNodes(5)
      expect(nodes).toHaveLength(5)
      expect(nodes[0].id).toBe('node-1')
      expect(nodes[4].id).toBe('node-5')
    })
  })

  describe('createChainEdges', () => {
    it('should create chain of edges', () => {
      const edges = createChainEdges(4)
      expect(edges).toHaveLength(3)
      expect(edges[0].source).toBe('node-1')
      expect(edges[0].target).toBe('node-2')
      expect(edges[2].source).toBe('node-3')
      expect(edges[2].target).toBe('node-4')
    })
  })
})
