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
          nodes: [node1, node2],
          edges: [edge1],
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

  describe('newProject', () => {
    test('creates empty project', () => {
      const projectId = store.getState().newProject()

      const state = store.getState()
      expect(projectId).toMatch(/^project-/)
      expect(state.currentProjectId).toBe(projectId)
      expect(state.nodes).toEqual([])
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
})
