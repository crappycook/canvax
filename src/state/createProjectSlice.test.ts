import { describe, test, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createProjectSlice, type ProjectSlice } from './createProjectSlice'
import { createCanvasSlice, type CanvasSlice } from './createCanvasSlice'
import { createNodesSlice, type NodesSlice } from './createNodesSlice'
import { createEdgesSlice, type EdgesSlice } from './createEdgesSlice'
import { createSettingsSlice, type SettingsSlice } from './createSettingsSlice'
import { createMockNode, createMockEdge, createMockProjectSnapshot } from '@/test/testUtils'

// Mock unifiedStorageService
vi.mock('@/services/unifiedStorage', () => ({
  unifiedStorageService: {
    saveProject: vi.fn().mockResolvedValue(undefined),
    loadProject: vi.fn(),
    importProject: vi.fn(),
    exportProject: vi.fn(),
  },
}))

type TestStore = ProjectSlice & CanvasSlice & NodesSlice & EdgesSlice & SettingsSlice

function createTestStore() {
  return create<TestStore>()((set, get, api) => ({
    ...createProjectSlice(set, get, api),
    ...createCanvasSlice(set, get, api),
    ...createNodesSlice(set, get, api),
    ...createEdgesSlice(set, get, api),
    ...createSettingsSlice(set, get, api),
  }))
}

describe('ProjectSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
    vi.clearAllMocks()
  })

  describe('deriveSnapshot', () => {
    test('generates snapshot from empty state', () => {
      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot).toBeDefined()
      expect(snapshot.id).toMatch(/^project-/)
      expect(snapshot.version).toBe(1)
      expect(snapshot.metadata.title).toBe('Untitled Project')
      expect(snapshot.metadata.updatedAt).toBeGreaterThan(0)
      expect(snapshot.graph.nodes).toEqual([])
      expect(snapshot.graph.edges).toEqual([])
      expect(snapshot.graph.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
      expect(snapshot.settings.defaultModel).toBe('gpt-4o')
      expect(snapshot.settings.language).toBe('en')
    })

    test('includes nodes and edges in snapshot', () => {
      const node1 = createMockNode({ id: 'node-1' })
      const node2 = createMockNode({ id: 'node-2' })
      const edge1 = createMockEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })

      store.getState().setNodes([node1, node2])
      store.getState().setEdges([edge1])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.nodes).toHaveLength(2)
      expect(snapshot.graph.edges).toHaveLength(1)
      expect(snapshot.graph.nodes[0].id).toBe('node-1')
      expect(snapshot.graph.nodes[1].id).toBe('node-2')
      expect(snapshot.graph.edges[0].id).toBe('edge-1')
    })

    test('preserves viewport state', () => {
      const customViewport = { x: 100, y: 200, zoom: 1.5 }
      store.getState().setViewport(customViewport)

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.viewport).toEqual(customViewport)
    })

    test('includes settings information', () => {
      store.getState().updateSettings({
        defaultModel: 'gpt-3.5-turbo',
        language: 'zh',
      })

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.settings.defaultModel).toBe('gpt-3.5-turbo')
      expect(snapshot.settings.language).toBe('zh')
    })

    test('generates unique project ID when none exists', () => {
      const snapshot1 = store.getState().deriveSnapshot()

      // Create new store for second snapshot
      const store2 = createTestStore()
      const snapshot2 = store2.getState().deriveSnapshot()

      expect(snapshot1.id).toBeDefined()
      expect(snapshot2.id).toBeDefined()
      expect(snapshot1.id).not.toBe(snapshot2.id)
    })

    test('updates timestamp on each call', () => {
      const snapshot1 = store.getState().deriveSnapshot()

      // Wait a bit to ensure different timestamp
      const snapshot2 = store.getState().deriveSnapshot()

      expect(snapshot2.metadata.updatedAt).toBeGreaterThanOrEqual(snapshot1.metadata.updatedAt)
    })

    test('preserves existing project ID', () => {
      const existingSnapshot = createMockProjectSnapshot({ id: 'existing-project-123' })
      store.getState().hydrateProject(existingSnapshot)

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.id).toBe('existing-project-123')
    })

    test('includes history in snapshot', () => {
      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.history).toBeDefined()
      expect(snapshot.history).toHaveProperty('past')
      expect(snapshot.history).toHaveProperty('present')
      expect(snapshot.history).toHaveProperty('future')
    })
  })

  describe('hydrateProject', () => {
    test('restores nodes and edges from snapshot', () => {
      const node1 = createMockNode({ id: 'node-1' })
      const node2 = createMockNode({ id: 'node-2' })
      const edge1 = createMockEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })

      const snapshot = createMockProjectSnapshot({
        graph: {
          nodes: [
            { id: node1.id, position: node1.position, data: node1.data },
            { id: node2.id, position: node2.position, data: node2.data },
          ],
          edges: [
            { id: edge1.id, source: edge1.source, target: edge1.target, data: edge1.data as any },
          ],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      })

      store.getState().hydrateProject(snapshot)

      const state = store.getState()
      expect(state.nodes).toHaveLength(2)
      expect(state.edges).toHaveLength(1)
      expect(state.nodes[0].id).toBe('node-1')
      expect(state.nodes[1].id).toBe('node-2')
      expect(state.edges[0].id).toBe('edge-1')
    })

    test('restores viewport position', () => {
      const customViewport = { x: 150, y: 250, zoom: 2.0 }
      const snapshot = createMockProjectSnapshot({
        graph: {
          nodes: [],
          edges: [],
          viewport: customViewport,
        },
      })

      store.getState().hydrateProject(snapshot)

      expect(store.getState().viewport).toEqual(customViewport)
    })

    test('restores settings', () => {
      const snapshot = createMockProjectSnapshot({
        settings: {
          defaultModel: 'claude-3-opus',
          language: 'zh',
          autoSave: true,
          theme: 'system',
          apiKeys: {},
          maxTokens: 1000,
          temperature: 0.7,
        },
      })

      store.getState().hydrateProject(snapshot)

      const state = store.getState()
      expect(state.settings.defaultModel).toBe('claude-3-opus')
      expect(state.settings.language).toBe('zh')
      // hydrateProject only restores defaultModel and language, other settings are preserved
      expect(state.settings.autoSave).toBe(true)
      expect(state.settings.theme).toBe('system')
    })

    test('clears selection state', () => {
      // Set some selection first
      store.getState().setSelection(['node-1', 'node-2'])
      expect(store.getState().selection).toHaveLength(2)

      const snapshot = createMockProjectSnapshot()
      store.getState().hydrateProject(snapshot)

      expect(store.getState().selection).toEqual([])
    })

    test('restores history', () => {
      const mockHistory = {
        past: [{ test: 'past1' }, { test: 'past2' }],
        present: { test: 'present' },
        future: [{ test: 'future1' }],
      }

      const snapshot = createMockProjectSnapshot({
        history: mockHistory,
      })

      store.getState().hydrateProject(snapshot)

      const state = store.getState()
      expect(state.history.past).toHaveLength(2)
      expect(state.history.present).toEqual({ test: 'present' })
      expect(state.history.future).toHaveLength(1)
    })

    test('sets current project ID', () => {
      const snapshot = createMockProjectSnapshot({ id: 'project-abc-123' })

      store.getState().hydrateProject(snapshot)

      expect(store.getState().currentProjectId).toBe('project-abc-123')
    })

    test('stores snapshot reference', () => {
      const snapshot = createMockProjectSnapshot({ id: 'project-xyz' })

      store.getState().hydrateProject(snapshot)

      expect(store.getState().snapshot).toEqual(snapshot)
    })

    test('handles snapshot with no history', () => {
      const snapshot = createMockProjectSnapshot({
        history: null,
      })

      store.getState().hydrateProject(snapshot)

      const state = store.getState()
      expect(state.history).toBeDefined()
      expect(state.history.past).toEqual([])
      expect(state.history.present).toBeNull()
      expect(state.history.future).toEqual([])
    })
  })

  describe('branch metadata persistence', () => {
    test('preserves branch metadata in node data when deriving snapshot', () => {
      const branchNode = createMockNode({
        id: 'branch-node-1',
        data: {
          label: 'Branch Node',
          model: 'gpt-4o',
          prompt: 'Branch prompt',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-123',
          parentNodeId: 'parent-node-1',
          branchIndex: 0,
        },
      })

      store.getState().setNodes([branchNode])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.nodes).toHaveLength(1)
      expect(snapshot.graph.nodes[0].data.branchId).toBe('branch-123')
      expect(snapshot.graph.nodes[0].data.parentNodeId).toBe('parent-node-1')
      expect(snapshot.graph.nodes[0].data.branchIndex).toBe(0)
    })

    test('preserves edge branch metadata when deriving snapshot', () => {
      const branchEdge = createMockEdge({
        id: 'branch-edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {
          createdAt: Date.now(),
          branchIndex: 1,
          isBranchEdge: true,
        },
      })

      store.getState().setEdges([branchEdge])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.edges).toHaveLength(1)
      expect(snapshot.graph.edges[0].data).toBeDefined()
      expect(snapshot.graph.edges[0].data?.branchIndex).toBe(1)
      expect(snapshot.graph.edges[0].data?.isBranchEdge).toBe(true)
      expect(snapshot.graph.edges[0].data?.createdAt).toBeDefined()
    })

    test('restores branch metadata from snapshot when hydrating', () => {
      const branchNode = createMockNode({
        id: 'branch-node-1',
        data: {
          label: 'Branch Node',
          model: 'gpt-4o',
          prompt: 'Branch prompt',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-456',
          parentNodeId: 'parent-node-2',
          branchIndex: 2,
        },
      })

      const branchEdge = createMockEdge({
        id: 'branch-edge-1',
        source: 'parent-node-2',
        target: 'branch-node-1',
        data: {
          createdAt: Date.now(),
          branchIndex: 2,
          isBranchEdge: true,
        },
      })

      const snapshot = createMockProjectSnapshot({
        graph: {
          nodes: [
            { id: branchNode.id, position: branchNode.position, data: branchNode.data },
          ],
          edges: [
            { id: branchEdge.id, source: branchEdge.source, target: branchEdge.target, data: branchEdge.data as any },
          ],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      })

      store.getState().hydrateProject(snapshot)

      const state = store.getState()
      expect(state.nodes).toHaveLength(1)
      expect(state.nodes[0].data.branchId).toBe('branch-456')
      expect(state.nodes[0].data.parentNodeId).toBe('parent-node-2')
      expect(state.nodes[0].data.branchIndex).toBe(2)

      expect(state.edges).toHaveLength(1)
      expect(state.edges[0].data?.branchIndex).toBe(2)
      expect(state.edges[0].data?.isBranchEdge).toBe(true)
    })

    test('preserves multiple branches with different metadata', () => {
      const parentNode = createMockNode({ id: 'parent-1' })
      const branch1Node = createMockNode({
        id: 'branch-1',
        data: {
          label: 'Branch 1',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-1-id',
          parentNodeId: 'parent-1',
          branchIndex: 0,
        },
      })
      const branch2Node = createMockNode({
        id: 'branch-2',
        data: {
          label: 'Branch 2',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-2-id',
          parentNodeId: 'parent-1',
          branchIndex: 1,
        },
      })

      const edge1 = createMockEdge({
        id: 'edge-1',
        source: 'parent-1',
        target: 'branch-1',
        data: {
          createdAt: Date.now(),
          branchIndex: 0,
          isBranchEdge: true,
        },
      })
      const edge2 = createMockEdge({
        id: 'edge-2',
        source: 'parent-1',
        target: 'branch-2',
        data: {
          createdAt: Date.now(),
          branchIndex: 1,
          isBranchEdge: true,
        },
      })

      store.getState().setNodes([parentNode, branch1Node, branch2Node])
      store.getState().setEdges([edge1, edge2])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.nodes).toHaveLength(3)
      expect(snapshot.graph.edges).toHaveLength(2)

      // Verify branch 1
      const savedBranch1 = snapshot.graph.nodes.find(n => n.id === 'branch-1')
      expect(savedBranch1?.data.branchId).toBe('branch-1-id')
      expect(savedBranch1?.data.branchIndex).toBe(0)

      // Verify branch 2
      const savedBranch2 = snapshot.graph.nodes.find(n => n.id === 'branch-2')
      expect(savedBranch2?.data.branchId).toBe('branch-2-id')
      expect(savedBranch2?.data.branchIndex).toBe(1)

      // Verify edges
      const savedEdge1 = snapshot.graph.edges.find(e => e.id === 'edge-1')
      expect(savedEdge1?.data?.branchIndex).toBe(0)
      expect(savedEdge1?.data?.isBranchEdge).toBe(true)

      const savedEdge2 = snapshot.graph.edges.find(e => e.id === 'edge-2')
      expect(savedEdge2?.data?.branchIndex).toBe(1)
      expect(savedEdge2?.data?.isBranchEdge).toBe(true)
    })

    test('handles nodes without branch metadata', () => {
      const regularNode = createMockNode({
        id: 'regular-node',
        data: {
          label: 'Regular Node',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
        },
      })

      store.getState().setNodes([regularNode])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.nodes).toHaveLength(1)
      expect(snapshot.graph.nodes[0].data.branchId).toBeUndefined()
      expect(snapshot.graph.nodes[0].data.parentNodeId).toBeUndefined()
      expect(snapshot.graph.nodes[0].data.branchIndex).toBeUndefined()
    })

    test('handles edges without branch metadata', () => {
      const regularEdge = createMockEdge({
        id: 'regular-edge',
        source: 'node-1',
        target: 'node-2',
        data: {
          createdAt: Date.now(),
        },
      })

      store.getState().setEdges([regularEdge])

      const snapshot = store.getState().deriveSnapshot()

      expect(snapshot.graph.edges).toHaveLength(1)
      expect(snapshot.graph.edges[0].data?.branchIndex).toBeUndefined()
      expect(snapshot.graph.edges[0].data?.isBranchEdge).toBeUndefined()
      expect(snapshot.graph.edges[0].data?.createdAt).toBeDefined()
    })
  })

  describe('newProject', () => {
    test('creates empty project', () => {
      const projectId = store.getState().newProject()

      const state = store.getState()
      expect(projectId).toMatch(/^project-/)
      expect(state.currentProjectId).toBe(projectId)
      expect(state.nodes).toHaveLength(1)
      expect(state.nodes[0].type).toBe('chat')
      expect(state.nodes[0].data.label).toBe('Chat Node')
      expect(state.edges).toEqual([])
      expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
      expect(state.selection).toEqual([])
    })

    test('uses custom title', () => {
      store.getState().newProject('My Custom Project')

      const state = store.getState()
      expect(state.snapshot?.metadata.title).toBe('My Custom Project')
    })

    test('uses default title when not provided', () => {
      store.getState().newProject()

      const state = store.getState()
      expect(state.snapshot?.metadata.title).toBe('Untitled Project')
    })

    test('trims whitespace from title', () => {
      store.getState().newProject('  Spaced Title  ')

      const state = store.getState()
      expect(state.snapshot?.metadata.title).toBe('Spaced Title')
    })

    test('generates unique ID for each project', () => {
      const projectId1 = store.getState().newProject()
      const projectId2 = store.getState().newProject()

      expect(projectId1).not.toBe(projectId2)
    })

    test('initializes default viewport', () => {
      store.getState().newProject()

      expect(store.getState().viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    })

    test('initializes empty history', () => {
      store.getState().newProject()

      const state = store.getState()
      expect(state.history.past).toEqual([])
      expect(state.history.present).toBeNull()
      expect(state.history.future).toEqual([])
    })

    test('creates snapshot with current settings', () => {
      store.getState().updateSettings({
        defaultModel: 'gpt-4-turbo',
        language: 'zh',
      })

      store.getState().newProject('Test Project')

      const state = store.getState()
      expect(state.snapshot?.settings.defaultModel).toBe('gpt-4-turbo')
      expect(state.snapshot?.settings.language).toBe('zh')
    })
  })

  describe('JSON export/import with branches', () => {
    test('exports project with branch metadata to JSON', () => {
      const parentNode = createMockNode({ id: 'parent-1' })
      const branchNode = createMockNode({
        id: 'branch-1',
        data: {
          label: 'Branch Node',
          model: 'gpt-4o',
          prompt: 'Branch prompt',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-123',
          parentNodeId: 'parent-1',
          branchIndex: 0,
        },
      })
      const branchEdge = createMockEdge({
        id: 'branch-edge-1',
        source: 'parent-1',
        target: 'branch-1',
        data: {
          createdAt: Date.now(),
          branchIndex: 0,
          isBranchEdge: true,
        },
      })

      store.getState().setNodes([parentNode, branchNode])
      store.getState().setEdges([branchEdge])

      const snapshot = store.getState().deriveSnapshot()
      const jsonString = JSON.stringify(snapshot, null, 2)
      const parsed = JSON.parse(jsonString)

      // Verify branch node metadata is in JSON
      const exportedBranchNode = parsed.graph.nodes.find((n: { id: string }) => n.id === 'branch-1')
      expect(exportedBranchNode.data.branchId).toBe('branch-123')
      expect(exportedBranchNode.data.parentNodeId).toBe('parent-1')
      expect(exportedBranchNode.data.branchIndex).toBe(0)

      // Verify branch edge metadata is in JSON
      const exportedBranchEdge = parsed.graph.edges.find((e: { id: string }) => e.id === 'branch-edge-1')
      expect(exportedBranchEdge.data.branchIndex).toBe(0)
      expect(exportedBranchEdge.data.isBranchEdge).toBe(true)
    })

    test('imports project with branch metadata from JSON', () => {
      const jsonData = {
        id: 'imported-project',
        version: 1,
        metadata: {
          title: 'Imported Project',
          updatedAt: Date.now(),
        },
        graph: {
          nodes: [
            {
              id: 'parent-1',
              position: { x: 0, y: 0 },
              data: {
                label: 'Parent Node',
                model: 'gpt-4o',
                prompt: '',
                messages: [],
                status: 'idle' as const,
                createdAt: Date.now(),
              },
            },
            {
              id: 'branch-1',
              position: { x: 350, y: 200 },
              data: {
                label: 'Branch Node',
                model: 'gpt-4o',
                prompt: 'Branch prompt',
                messages: [],
                status: 'idle' as const,
                createdAt: Date.now(),
                branchId: 'branch-imported-123',
                parentNodeId: 'parent-1',
                branchIndex: 0,
              },
            },
          ],
          edges: [
            {
              id: 'branch-edge-1',
              source: 'parent-1',
              target: 'branch-1',
              data: {
                createdAt: Date.now(),
                branchIndex: 0,
                isBranchEdge: true,
              },
            },
          ],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
        settings: {
          defaultModel: 'gpt-4o',
          language: 'en' as const,
          autoSave: true,
          theme: 'system' as const,
          apiKeys: {},
          maxTokens: 2000,
          temperature: 0.7,
        },
        history: null,
      }

      store.getState().hydrateProject(jsonData)

      const state = store.getState()

      // Verify branch node was imported correctly
      const importedBranchNode = state.nodes.find(n => n.id === 'branch-1')
      expect(importedBranchNode).toBeDefined()
      expect(importedBranchNode?.data.branchId).toBe('branch-imported-123')
      expect(importedBranchNode?.data.parentNodeId).toBe('parent-1')
      expect(importedBranchNode?.data.branchIndex).toBe(0)

      // Verify branch edge was imported correctly
      const importedBranchEdge = state.edges.find(e => e.id === 'branch-edge-1')
      expect(importedBranchEdge).toBeDefined()
      expect(importedBranchEdge?.data?.branchIndex).toBe(0)
      expect(importedBranchEdge?.data?.isBranchEdge).toBe(true)
    })

    test('preserves branch relationships after export/import cycle', () => {
      // Create a complex branch structure
      const parentNode = createMockNode({ id: 'parent-1' })
      const branch1Input = createMockNode({
        id: 'branch-1-input',
        data: {
          label: 'Branch 1 Input',
          model: 'gpt-4o',
          prompt: 'First branch',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-1',
          parentNodeId: 'parent-1',
          branchIndex: 0,
        },
      })
      const branch1Response = createMockNode({
        id: 'branch-1-response',
        data: {
          label: 'Branch 1 Response',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'success',
          createdAt: Date.now(),
          branchId: 'branch-1',
          parentNodeId: 'branch-1-input',
          branchIndex: 0,
        },
      })
      const branch2Input = createMockNode({
        id: 'branch-2-input',
        data: {
          label: 'Branch 2 Input',
          model: 'gpt-4o',
          prompt: 'Second branch',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-2',
          parentNodeId: 'parent-1',
          branchIndex: 1,
        },
      })

      const edge1 = createMockEdge({
        id: 'edge-1',
        source: 'parent-1',
        target: 'branch-1-input',
        data: { createdAt: Date.now(), branchIndex: 0, isBranchEdge: true },
      })
      const edge2 = createMockEdge({
        id: 'edge-2',
        source: 'branch-1-input',
        target: 'branch-1-response',
        data: { createdAt: Date.now(), branchIndex: 0, isBranchEdge: true },
      })
      const edge3 = createMockEdge({
        id: 'edge-3',
        source: 'parent-1',
        target: 'branch-2-input',
        data: { createdAt: Date.now(), branchIndex: 1, isBranchEdge: true },
      })

      store.getState().setNodes([parentNode, branch1Input, branch1Response, branch2Input])
      store.getState().setEdges([edge1, edge2, edge3])

      // Export to JSON
      const snapshot = store.getState().deriveSnapshot()
      const jsonString = JSON.stringify(snapshot)
      const parsed = JSON.parse(jsonString)

      // Create new store and import
      const newStore = createTestStore()
      newStore.getState().hydrateProject(parsed)

      const newState = newStore.getState()

      // Verify all nodes preserved
      expect(newState.nodes).toHaveLength(4)

      // Verify branch 1 relationships
      const b1Input = newState.nodes.find(n => n.id === 'branch-1-input')
      expect(b1Input?.data.branchId).toBe('branch-1')
      expect(b1Input?.data.parentNodeId).toBe('parent-1')
      expect(b1Input?.data.branchIndex).toBe(0)

      const b1Response = newState.nodes.find(n => n.id === 'branch-1-response')
      expect(b1Response?.data.branchId).toBe('branch-1')
      expect(b1Response?.data.parentNodeId).toBe('branch-1-input')
      expect(b1Response?.data.branchIndex).toBe(0)

      // Verify branch 2 relationships
      const b2Input = newState.nodes.find(n => n.id === 'branch-2-input')
      expect(b2Input?.data.branchId).toBe('branch-2')
      expect(b2Input?.data.parentNodeId).toBe('parent-1')
      expect(b2Input?.data.branchIndex).toBe(1)

      // Verify all edges preserved
      expect(newState.edges).toHaveLength(3)

      // Verify edge metadata
      const e1 = newState.edges.find(e => e.id === 'edge-1')
      expect(e1?.data?.branchIndex).toBe(0)
      expect(e1?.data?.isBranchEdge).toBe(true)

      const e2 = newState.edges.find(e => e.id === 'edge-2')
      expect(e2?.data?.branchIndex).toBe(0)
      expect(e2?.data?.isBranchEdge).toBe(true)

      const e3 = newState.edges.find(e => e.id === 'edge-3')
      expect(e3?.data?.branchIndex).toBe(1)
      expect(e3?.data?.isBranchEdge).toBe(true)
    })

    test('preserves branch visual styling after import', () => {
      const branchNode = createMockNode({
        id: 'branch-1',
        position: { x: 350, y: 200 },
        data: {
          label: 'Branch Node',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-123',
          parentNodeId: 'parent-1',
          branchIndex: 2,
        },
      })

      const branchEdge = createMockEdge({
        id: 'branch-edge-1',
        source: 'parent-1',
        target: 'branch-1',
        data: {
          createdAt: Date.now(),
          branchIndex: 2,
          isBranchEdge: true,
        },
      })

      store.getState().setNodes([branchNode])
      store.getState().setEdges([branchEdge])

      // Export and re-import
      const snapshot = store.getState().deriveSnapshot()
      const jsonString = JSON.stringify(snapshot)
      const parsed = JSON.parse(jsonString)

      const newStore = createTestStore()
      newStore.getState().hydrateProject(parsed)

      const newState = newStore.getState()

      // Verify position preserved (for layout)
      const importedNode = newState.nodes.find(n => n.id === 'branch-1')
      expect(importedNode?.position).toEqual({ x: 350, y: 200 })

      // Verify branch index preserved (for styling)
      expect(importedNode?.data.branchIndex).toBe(2)

      const importedEdge = newState.edges.find(e => e.id === 'branch-edge-1')
      expect(importedEdge?.data?.branchIndex).toBe(2)
      expect(importedEdge?.data?.isBranchEdge).toBe(true)
    })

    test('handles mixed branch and non-branch nodes in export/import', () => {
      const regularNode = createMockNode({ id: 'regular-1' })
      const branchNode = createMockNode({
        id: 'branch-1',
        data: {
          label: 'Branch Node',
          model: 'gpt-4o',
          prompt: '',
          messages: [],
          status: 'idle',
          createdAt: Date.now(),
          branchId: 'branch-123',
          parentNodeId: 'regular-1',
          branchIndex: 0,
        },
      })

      const regularEdge = createMockEdge({
        id: 'regular-edge',
        source: 'regular-1',
        target: 'regular-2',
        data: { createdAt: Date.now() },
      })
      const branchEdge = createMockEdge({
        id: 'branch-edge',
        source: 'regular-1',
        target: 'branch-1',
        data: {
          createdAt: Date.now(),
          branchIndex: 0,
          isBranchEdge: true,
        },
      })

      store.getState().setNodes([regularNode, branchNode])
      store.getState().setEdges([regularEdge, branchEdge])

      // Export and import
      const snapshot = store.getState().deriveSnapshot()
      const jsonString = JSON.stringify(snapshot)
      const parsed = JSON.parse(jsonString)

      const newStore = createTestStore()
      newStore.getState().hydrateProject(parsed)

      const newState = newStore.getState()

      // Verify regular node has no branch metadata
      const importedRegular = newState.nodes.find(n => n.id === 'regular-1')
      expect(importedRegular?.data.branchId).toBeUndefined()

      // Verify branch node has metadata
      const importedBranch = newState.nodes.find(n => n.id === 'branch-1')
      expect(importedBranch?.data.branchId).toBe('branch-123')

      // Verify regular edge has no branch metadata
      const importedRegularEdge = newState.edges.find(e => e.id === 'regular-edge')
      expect(importedRegularEdge?.data?.isBranchEdge).toBeUndefined()

      // Verify branch edge has metadata
      const importedBranchEdge = newState.edges.find(e => e.id === 'branch-edge')
      expect(importedBranchEdge?.data?.isBranchEdge).toBe(true)
    })
  })
})
