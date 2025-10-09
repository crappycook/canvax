import { type StateCreator } from 'zustand'
import type { ProjectSnapshot } from '@/canvas/types'
import type { CanvasSlice } from './createCanvasSlice'
import type { NodesSlice } from './createNodesSlice'
import type { EdgesSlice } from './createEdgesSlice'
import type { SettingsSlice } from './createSettingsSlice'
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
        nodes,
        edges,
        viewport,
      },
      settings: {
        defaultModel: state.settings.defaultModel,
        language: state.settings.language,
      },
      history,
    }
  },

  hydrateProject: (snapshot: ProjectSnapshot) => {
    const history = (snapshot.history as CanvasSlice['history']) ?? createDefaultHistory()

    set(state => ({
      currentProjectId: snapshot.id,
      snapshot,
      nodes: snapshot.graph.nodes as NodesSlice['nodes'],
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
    const snapshot = createEmptySnapshot(state, projectId, title)
    const history = createDefaultHistory()

    set({
      currentProjectId: projectId,
      snapshot,
      nodes: [],
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
