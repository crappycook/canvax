import type { Node, Edge } from '@xyflow/react'
import type { ChatNodeData, ChatMessage } from '@/types'
import { createMockNode, createMockEdge } from './testUtils'

// ============================================================================
// Mock Messages
// ============================================================================

export const mockMessages: Record<string, ChatMessage> = {
  userMessage1: {
    id: 'msg-user-1',
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: 1000,
  },
  assistantMessage1: {
    id: 'msg-assistant-1',
    role: 'assistant',
    content: 'I am doing well, thank you!',
    createdAt: 2000,
    metadata: {
      model: 'gpt-4o',
      tokens: 15,
    },
  },
  userMessage2: {
    id: 'msg-user-2',
    role: 'user',
    content: 'What is the weather like?',
    createdAt: 3000,
  },
  assistantMessage2: {
    id: 'msg-assistant-2',
    role: 'assistant',
    content: 'I cannot access real-time weather data.',
    createdAt: 4000,
  },
  systemMessage: {
    id: 'msg-system-1',
    role: 'system',
    content: 'You are a helpful assistant.',
    createdAt: 500,
  },
}

// ============================================================================
// Mock Nodes
// ============================================================================

export const mockNodes: Record<string, Node<ChatNodeData>> = {
  // Empty node with no messages
  empty: createMockNode({
    id: 'node-empty',
    data: {
      label: 'Empty Node',
      model: 'gpt-4o',
      prompt: '',
      messages: [],
      status: 'idle',
      createdAt: 1000,
    },
  }),

  // Node with messages
  withMessages: createMockNode({
    id: 'node-with-messages',
    data: {
      label: 'Node with Messages',
      model: 'gpt-4o',
      prompt: 'Test prompt',
      messages: [mockMessages.userMessage1, mockMessages.assistantMessage1],
      status: 'success',
      createdAt: 2000,
    },
  }),

  // Node with error
  withError: createMockNode({
    id: 'node-with-error',
    data: {
      label: 'Node with Error',
      model: 'gpt-4o',
      prompt: 'Test prompt',
      messages: [],
      status: 'error',
      error: 'API key is missing',
      createdAt: 3000,
    },
  }),

  // Running node
  running: createMockNode({
    id: 'node-running',
    data: {
      label: 'Running Node',
      model: 'gpt-4o',
      prompt: 'Test prompt',
      messages: [mockMessages.userMessage1],
      status: 'running',
      createdAt: 4000,
    },
  }),

  // Node with multiple messages
  withMultipleMessages: createMockNode({
    id: 'node-multiple-messages',
    data: {
      label: 'Node with Multiple Messages',
      model: 'gpt-4o',
      prompt: 'Test prompt',
      messages: [
        mockMessages.userMessage1,
        mockMessages.assistantMessage1,
        mockMessages.userMessage2,
        mockMessages.assistantMessage2,
      ],
      status: 'success',
      createdAt: 5000,
    },
  }),

  // Node at different position
  positioned: createMockNode({
    id: 'node-positioned',
    position: { x: 100, y: 200 },
    data: {
      label: 'Positioned Node',
      model: 'gpt-4o',
      prompt: '',
      messages: [],
      status: 'idle',
      createdAt: 6000,
    },
  }),
}

// ============================================================================
// Mock Edges
// ============================================================================

export const mockEdges: Record<string, Edge | Edge[]> = {
  // Simple edge connecting two nodes
  simple: createMockEdge({
    id: 'edge-simple',
    source: 'node-1',
    target: 'node-2',
  }),

  // Edge with custom data
  withData: createMockEdge({
    id: 'edge-with-data',
    source: 'node-1',
    target: 'node-2',
    data: { createdAt: 1000 },
  }),

  // Self-loop (cycle)
  selfLoop: createMockEdge({
    id: 'edge-self-loop',
    source: 'node-1',
    target: 'node-1',
  }),

  // Two-node cycle
  cycle: [
    createMockEdge({
      id: 'edge-cycle-1',
      source: 'node-1',
      target: 'node-2',
    }),
    createMockEdge({
      id: 'edge-cycle-2',
      source: 'node-2',
      target: 'node-1',
    }),
  ],

  // Three-node cycle
  threeCycle: [
    createMockEdge({
      id: 'edge-3cycle-1',
      source: 'node-1',
      target: 'node-2',
    }),
    createMockEdge({
      id: 'edge-3cycle-2',
      source: 'node-2',
      target: 'node-3',
    }),
    createMockEdge({
      id: 'edge-3cycle-3',
      source: 'node-3',
      target: 'node-1',
    }),
  ],

  // Linear chain (no cycle)
  chain: [
    createMockEdge({
      id: 'edge-chain-1',
      source: 'node-1',
      target: 'node-2',
    }),
    createMockEdge({
      id: 'edge-chain-2',
      source: 'node-2',
      target: 'node-3',
    }),
    createMockEdge({
      id: 'edge-chain-3',
      source: 'node-3',
      target: 'node-4',
    }),
  ],

  // Diamond structure (multiple paths, no cycle)
  diamond: [
    createMockEdge({
      id: 'edge-diamond-1',
      source: 'node-1',
      target: 'node-2',
    }),
    createMockEdge({
      id: 'edge-diamond-2',
      source: 'node-1',
      target: 'node-3',
    }),
    createMockEdge({
      id: 'edge-diamond-3',
      source: 'node-2',
      target: 'node-4',
    }),
    createMockEdge({
      id: 'edge-diamond-4',
      source: 'node-3',
      target: 'node-4',
    }),
  ],

  // Multiple upstream nodes converging
  multipleUpstream: [
    createMockEdge({
      id: 'edge-multi-1',
      source: 'node-1',
      target: 'node-4',
    }),
    createMockEdge({
      id: 'edge-multi-2',
      source: 'node-2',
      target: 'node-4',
    }),
    createMockEdge({
      id: 'edge-multi-3',
      source: 'node-3',
      target: 'node-4',
    }),
  ],
}

// ============================================================================
// Mock Graph Structures
// ============================================================================

/**
 * Creates a set of nodes for testing graph algorithms
 */
export function createGraphNodes(count: number): Node<ChatNodeData>[] {
  return Array.from({ length: count }, (_, i) =>
    createMockNode({
      id: `node-${i + 1}`,
      data: {
        label: `Node ${i + 1}`,
        model: 'gpt-4o',
        prompt: '',
        messages: [],
        status: 'idle',
        createdAt: 1000 + i,
      },
    })
  )
}

/**
 * Creates a linear chain of edges
 */
export function createChainEdges(nodeCount: number): Edge[] {
  return Array.from({ length: nodeCount - 1 }, (_, i) =>
    createMockEdge({
      id: `edge-${i + 1}`,
      source: `node-${i + 1}`,
      target: `node-${i + 2}`,
    })
  )
}

/**
 * Creates a complete graph (all nodes connected to all other nodes)
 */
export function createCompleteGraph(nodeCount: number): {
  nodes: Node<ChatNodeData>[]
  edges: Edge[]
} {
  const nodes = createGraphNodes(nodeCount)
  const edges: Edge[] = []

  for (let i = 1; i <= nodeCount; i++) {
    for (let j = 1; j <= nodeCount; j++) {
      if (i !== j) {
        edges.push(
          createMockEdge({
            id: `edge-${i}-${j}`,
            source: `node-${i}`,
            target: `node-${j}`,
          })
        )
      }
    }
  }

  return { nodes, edges }
}
