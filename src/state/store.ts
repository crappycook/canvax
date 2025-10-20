import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { type ProjectSlice, createProjectSlice } from './createProjectSlice'
import { type CanvasSlice, createCanvasSlice } from './createCanvasSlice'
import { type NodesSlice, createNodesSlice } from './createNodesSlice'
import { type EdgesSlice, createEdgesSlice } from './createEdgesSlice'
import { type RuntimeSlice, createRuntimeSlice } from './createRuntimeSlice'
import { type SettingsSlice, createSettingsSlice } from './createSettingsSlice'
import { type UiSlice, createUiSlice } from './createUiSlice'
import { type TemplatesSlice, createTemplatesSlice } from './createTemplatesSlice'

export interface RootState
  extends ProjectSlice,
    CanvasSlice,
    NodesSlice,
    EdgesSlice,
    RuntimeSlice,
    SettingsSlice,
    UiSlice,
    TemplatesSlice {}

export const useStore = create<RootState>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createProjectSlice(set, get, api),
        ...createCanvasSlice(set, get, api),
        ...createNodesSlice(set, get, api),
        ...createEdgesSlice(set, get, api),
        ...createRuntimeSlice(set, get, api),
        ...createSettingsSlice(set, get, api),
        ...createUiSlice(set, get, api),
        ...createTemplatesSlice(set, get, api),
      }),
      {
        name: 'canvas-app',
        partialize: s => ({ 
          currentProjectId: s.currentProjectId, 
          settings: s.settings
        }),
      }
    )
  )
)