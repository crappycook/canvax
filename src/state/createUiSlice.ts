import { type StateCreator } from 'zustand'

export interface UiSlice {
  ui: {
    sidebarOpen: boolean
    settingsOpen: boolean
    nodePanelOpen: boolean
    zoomLevel: number
    gridVisible: boolean
    minimapVisible: boolean
  }
  
  toggleSidebar: () => void
  toggleSettings: () => void
  toggleNodePanel: () => void
  setZoomLevel: (zoom: number) => void
  toggleGrid: () => void
  toggleMinimap: () => void
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  ui: {
    sidebarOpen: false,
    settingsOpen: false,
    nodePanelOpen: false,
    zoomLevel: 1,
    gridVisible: true,
    minimapVisible: true
  },

  toggleSidebar: () => {
    set((state) => ({
      ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
    }))
  },

  toggleSettings: () => {
    set((state) => ({
      ui: { ...state.ui, settingsOpen: !state.ui.settingsOpen }
    }))
  },

  toggleNodePanel: () => {
    set((state) => ({
      ui: { ...state.ui, nodePanelOpen: !state.ui.nodePanelOpen }
    }))
  },

  setZoomLevel: (zoom) => {
    set((state) => ({
      ui: { ...state.ui, zoomLevel: zoom }
    }))
  },

  toggleGrid: () => {
    set((state) => ({
      ui: { ...state.ui, gridVisible: !state.ui.gridVisible }
    }))
  },

  toggleMinimap: () => {
    set((state) => ({
      ui: { ...state.ui, minimapVisible: !state.ui.minimapVisible }
    }))
  }
})