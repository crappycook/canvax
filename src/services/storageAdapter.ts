/**
 * Storage Adapter Interface
 * 
 * This abstraction layer allows switching between different storage backends
 * without changing application code. Supports:
 * - IndexedDB (current browser-based solution)
 * - SQLite (future local database)
 * - Remote API (future server-side storage)
 */

import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, ProjectMetadata } from '@/types/storage'

export interface StorageAdapter {
  // Lifecycle
  initialize(): Promise<void>
  testConnection(): Promise<void>
  close?(): Promise<void>

  // Project operations
  saveProject(projectId: string, data: ProjectSnapshot): Promise<void>
  loadProject(projectId: string): Promise<ProjectSnapshot | null>
  deleteProject(projectId: string): Promise<void>
  listProjects(): Promise<ProjectMetadata[]>

  // Template operations
  saveTemplate(templateId: string, data: Template): Promise<void>
  loadTemplate(templateId: string): Promise<Template | null>
  deleteTemplate(templateId: string): Promise<void>
  listTemplates(): Promise<string[]>

  // Settings
  saveSettings(settings: AppSettings): Promise<void>
  loadSettings(): Promise<AppSettings | null>

  // Metadata
  getStorageInfo(): StorageInfo
}

export interface StorageInfo {
  type: 'indexeddb' | 'sqlite' | 'remote' | 'memory'
  available: boolean
  quota?: { used: number; total: number }
  latency?: number
}

/**
 * Storage Manager
 * 
 * Manages multiple storage adapters with fallback strategy:
 * 1. Try primary adapter (e.g., SQLite)
 * 2. Fall back to secondary (e.g., IndexedDB)
 * 3. Fall back to memory (last resort)
 */
export class StorageManager {
  private adapters: StorageAdapter[] = []
  private activeAdapter: StorageAdapter | null = null

  constructor(adapters: StorageAdapter[]) {
    this.adapters = adapters
  }

  async initialize(): Promise<void> {
    for (const adapter of this.adapters) {
      try {
        await adapter.initialize()
        await adapter.testConnection()
        this.activeAdapter = adapter
        console.log(`Storage initialized: ${adapter.getStorageInfo().type}`)
        return
      } catch (error) {
        console.warn(`Failed to initialize ${adapter.getStorageInfo().type}:`, error)
      }
    }

    throw new Error('No storage adapter available')
  }

  private ensureAdapter(): StorageAdapter {
    if (!this.activeAdapter) {
      throw new Error('Storage not initialized')
    }
    return this.activeAdapter
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    return this.ensureAdapter().saveProject(projectId, data)
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    return this.ensureAdapter().loadProject(projectId)
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.ensureAdapter().deleteProject(projectId)
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    return this.ensureAdapter().listProjects()
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    return this.ensureAdapter().saveTemplate(templateId, data)
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    return this.ensureAdapter().loadTemplate(templateId)
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.ensureAdapter().deleteTemplate(templateId)
  }

  async listTemplates(): Promise<string[]> {
    return this.ensureAdapter().listTemplates()
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return this.ensureAdapter().saveSettings(settings)
  }

  async loadSettings(): Promise<AppSettings | null> {
    return this.ensureAdapter().loadSettings()
  }

  getStorageInfo(): StorageInfo {
    return this.ensureAdapter().getStorageInfo()
  }

  async switchAdapter(adapterType: StorageInfo['type']): Promise<void> {
    const adapter = this.adapters.find(a => a.getStorageInfo().type === adapterType)
    if (!adapter) {
      throw new Error(`Adapter ${adapterType} not found`)
    }

    await adapter.initialize()
    await adapter.testConnection()
    this.activeAdapter = adapter
  }
}
