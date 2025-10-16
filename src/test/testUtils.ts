import type { Node, Edge } from '@xyflow/react'
import type { ChatNodeData, ProjectSnapshot } from '@/types'

/**
 * Creates a mock ChatNode with default values that can be overridden
 */
export function createMockNode(
  overrides?: Partial<Node<ChatNodeData>>
): Node<ChatNodeData> {
  const defaultNode: Node<ChatNodeData> = {
    id: 'test-node-1',
    type: 'chat',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Node',
      model: 'gpt-4o',
      prompt: '',
      messages: [],
      status: 'idle',
      createdAt: Date.now(),
    },
  }

  return {
    ...defaultNode,
    ...overrides,
    data: {
      ...defaultNode.data,
      ...overrides?.data,
    },
  }
}

/**
 * Creates a mock Edge with default values that can be overridden
 */
export function createMockEdge(overrides?: Partial<Edge>): Edge {
  const defaultEdge: Edge = {
    id: 'test-edge-1',
    source: 'node-1',
    target: 'node-2',
  }

  return {
    ...defaultEdge,
    ...overrides,
  }
}

/**
 * Creates a mock ProjectSnapshot with default values that can be overridden
 */
export function createMockProjectSnapshot(
  overrides?: Partial<ProjectSnapshot>
): ProjectSnapshot {
  const defaultSnapshot: ProjectSnapshot = {
    id: 'test-project-1',
    version: 1,
    metadata: {
      title: 'Test Project',
      updatedAt: Date.now(),
    },
    graph: {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    settings: {
      defaultModel: 'gpt-4o',
      language: 'zh',
      autoSave: true,
      theme: 'system',
      apiKeys: {},
      maxTokens: 2000,
      temperature: 0.7,
    },
    history: null,
  }

  return {
    ...defaultSnapshot,
    ...overrides,
    metadata: {
      ...defaultSnapshot.metadata,
      ...overrides?.metadata,
    },
    graph: {
      ...defaultSnapshot.graph,
      ...overrides?.graph,
    },
    settings: {
      ...defaultSnapshot.settings,
      ...overrides?.settings,
    },
  }
}
