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
      (set, get) => ({
        ...createProjectSlice(set, get),
        ...createCanvasSlice(set, get),
        ...createNodesSlice(set, get),
        ...createEdgesSlice(set, get),
        ...createRuntimeSlice(set, get),
        ...createSettingsSlice(set, get),
        ...createUiSlice(set, get),
        ...createTemplatesSlice(set, get),
      }),
      {
        name: 'canvas-app',
        partialize: s => ({ project: s.project, settings: s.settings }),
      }
    )
  )
)