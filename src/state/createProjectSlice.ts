import { type StateCreator } from 'zustand'
import type { ProjectSnapshot, ChatNodeData, CustomEdgeData } from '@/types'
import type { CanvasSlice } from '@/state/createCanvasSlice'
import type { NodesSlice } from '@/state/createNodesSlice'
import type { EdgesSlice } from '@/state/createEdgesSlice'
import type { SettingsSlice } from '@/state/createSettingsSlice'
import { unifiedStorageService } from '@/services/unifiedStorage'

type RootStateForProject = ProjectSlice & CanvasSlice & NodesSlice & EdgesSlice & SettingsSlice

export interface ProjectSlice {
  currentProjectId: string | null
  snapshot: ProjectSnapshot | null

  deriveSnapshot: () => ProjectSnapshot
  hydrateProject: (snapshot: ProjectSnapshot) => void
  newProject: (title?: string) => string
  openProject: (file: File) => Promise<void>
  saveProject: (title?: string) => Promise<ProjectSnapshot>
  autoSaveProject: () => Promise<void>
}

const createDefaultHistory = (): CanvasSlice['history'] => ({
  past: [],
  present: null,
  future: [],
})

const DEFAULT_VIEWPORT: CanvasSlice['viewport'] = { x: 0, y: 0, zoom: 1 }

function createEmptySnapshot(state: RootStateForProject, projectId: string, title?: string): ProjectSnapshot {
  const now = Date.now()

  return {
    id: projectId,
    version: 1,
    metadata: {
      title: title?.trim() || 'Untitled Project',
      updatedAt: now,
    },
    graph: {
      nodes: [],
      edges: [],
      viewport: DEFAULT_VIEWPORT,
    },
    settings: {
      defaultModel: state.settings.defaultModel,
      language: state.settings.language,
      autoSave: state.settings.autoSave ?? true,
      theme: state.settings.theme ?? 'system',
      apiKeys: state.settings.apiKeys ?? {},
      maxTokens: state.settings.maxTokens ?? 2048,
      temperature: state.settings.temperature ?? 0.7,
    },
    history: createDefaultHistory(),
  }
}

export const createProjectSlice: StateCreator<ProjectSlice & CanvasSlice & NodesSlice & EdgesSlice & SettingsSlice, [], [], ProjectSlice> = (set, get) => ({
  currentProjectId: null,
  snapshot: null,

  deriveSnapshot: () => {
    const state = get() as RootStateForProject
    const now = Date.now()
    const projectId =
      state.currentProjectId ??
      state.snapshot?.id ??
      `project-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : now}`

    const nodes = (state.nodes ?? []) as NodesSlice['nodes']
    const edges = state.edges ?? []
    const viewport = state.viewport ?? DEFAULT_VIEWPORT
    const history = state.history ?? createDefaultHistory()

    return {
      id: projectId,
      version: state.snapshot?.version ?? 1,
      metadata: {
        title: state.snapshot?.metadata.title ?? 'Untitled Project',
        updatedAt: now,
      },
      graph: {
        nodes: nodes.map(node => ({
          id: node.id,
          position: node.position,
          data: node.data as ChatNodeData,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data as CustomEdgeData | undefined,
        })),
        viewport,
      },
      settings: {
        defaultModel: state.settings.defaultModel,
        language: state.settings.language,
        autoSave: state.settings.autoSave ?? true,
        theme: state.settings.theme ?? 'system',
        apiKeys: state.settings.apiKeys ?? {},
        maxTokens: state.settings.maxTokens ?? 2048,
        temperature: state.settings.temperature ?? 0.7,
      },
      history,
    }
  },

  hydrateProject: (snapshot: ProjectSnapshot) => {
    const history = (snapshot.history as CanvasSlice['history']) ?? createDefaultHistory()

    // Migrate nodes to ensure all required fields exist
    const migratedNodes = snapshot.graph.nodes.map(node => ({
      id: node.id,
      type: 'chat' as const,
      position: node.position,
      data: {
        // Preserve all fields from snapshot
        ...node.data,
        // Ensure all required fields have default values (only if missing)
        label: node.data.label ?? 'Untitled',
        model: node.data.model ?? 'gpt-4o',
        prompt: node.data.prompt ?? '',
        messages: node.data.messages ?? [],
        status: node.data.status ?? 'idle',
        createdAt: node.data.createdAt ?? Date.now(),
      } as ChatNodeData,
    }))

    set(state => ({
      currentProjectId: snapshot.id,
      snapshot,
      nodes: migratedNodes as NodesSlice['nodes'],
      edges: snapshot.graph.edges as EdgesSlice['edges'],
      viewport: snapshot.graph.viewport,
      selection: [],
      history,
      settings: {
        ...state.settings,
        defaultModel: snapshot.settings.defaultModel,
        language: snapshot.settings.language,
      },
    }))
  },

  newProject: (title?: string) => {
    const state = get() as RootStateForProject
    const projectId =
      `project-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now()}`

    // Create default chat node with unique ID
    const nodeId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `node-${crypto.randomUUID()}`
      : `node-${Date.now()}`

    // Position node near center of typical viewport (considering node width ~400px)
    const defaultNode = {
      id: nodeId,
      type: 'chat' as const,
      position: { x: 400, y: 300 },
      data: {
        label: 'Chat Node',
        description: 'Welcome to Canvax',
        model: state.settings.defaultModel || 'gpt-4o',
        prompt: '',
        messages: [],
        status: 'idle' as const,
        createdAt: Date.now(),
      } as ChatNodeData,
    }

    const snapshot = createEmptySnapshot(state, projectId, title)
    const history = createDefaultHistory()

    set({
      currentProjectId: projectId,
      snapshot,
      nodes: [defaultNode] as NodesSlice['nodes'],
      edges: [],
      viewport: DEFAULT_VIEWPORT,
      selection: [],
      history,
    })

    // Auto-save the new project
    unifiedStorageService.saveProject(projectId, snapshot).catch(error => {
      console.error('Failed to auto-save new project:', error)
    })

    return projectId
  },

  openProject: async (file: File) => {
    try {
      const snapshot = await unifiedStorageService.importProject(file)
      get().hydrateProject(snapshot)
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  },

  saveProject: async (title?: string) => {
    const snapshot = get().deriveSnapshot()
    const nextTitle = title?.trim()
    const updatedSnapshot: ProjectSnapshot = nextTitle
      ? {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          title: nextTitle.length > 0 ? nextTitle : 'Untitled Project',
          updatedAt: Date.now(),
        },
      }
      : {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          updatedAt: Date.now(),
        },
      }

    set({ snapshot: updatedSnapshot })

    if (updatedSnapshot.id) {
      try {
        await unifiedStorageService.saveProject(updatedSnapshot.id, updatedSnapshot)
      } catch (error) {
        console.error('Failed to save project:', error)
        throw error
      }
    }

    return updatedSnapshot
  },

  autoSaveProject: async () => {
    await get().saveProject()
  },
})
