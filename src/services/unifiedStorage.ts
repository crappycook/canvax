import { StorageManager } from './storageAdapter'
import { IndexedDBAdapter } from './adapters/indexedDBAdapter'
import { MemoryAdapter } from './adapters/memoryAdapter'
import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, ProjectMetadata } from '@/types/storage'

/**
 * Unified Storage Service
 * 
 * Provides a single interface for all storage operations.
 * Automatically selects the best available storage backend.
 */
class UnifiedStorageService {
  private manager: StorageManager
  private initialized = false

  constructor() {
    // Initialize with fallback chain: IndexedDB -> Memory
    // Future: Add SQLite and Remote adapters
    this.manager = new StorageManager([
      new IndexedDBAdapter(),
      new MemoryAdapter(),
    ])
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.manager.initialize()
      this.initialized = true
    }
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    await this.ensureInitialized()
    return this.manager.saveProject(projectId, data)
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    await this.ensureInitialized()
    return this.manager.loadProject(projectId)
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.ensureInitialized()
    return this.manager.deleteProject(projectId)
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    await this.ensureInitialized()
    return this.manager.listProjects()
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    await this.ensureInitialized()
    return this.manager.saveTemplate(templateId, data)
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    await this.ensureInitialized()
    return this.manager.loadTemplate(templateId)
  }

  async listTemplates(): Promise<string[]> {
    await this.ensureInitialized()
    return this.manager.listTemplates()
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInitialized()
    return this.manager.saveSettings(settings)
  }

  async loadSettings(): Promise<AppSettings | null> {
    await this.ensureInitialized()
    return this.manager.loadSettings()
  }

  getStorageInfo() {
    return this.manager.getStorageInfo()
  }

  getStorageType(): 'indexeddb' | 'sqlite' | 'remote' | 'memory' | 'indexedDB' | 'fileSystem' {
    const info = this.manager.getStorageInfo()
    // Map new types to legacy types for backward compatibility
    if (info.type === 'indexeddb') return 'indexedDB'
    if (info.type === 'memory') return 'fileSystem'
    return info.type
  }

  async exportProject(projectId: string): Promise<void> {
    const project = await this.loadProject(projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    const dataStr = JSON.stringify(project, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `${project.metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.canvax`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  async importProject(file: File): Promise<ProjectSnapshot> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string) as ProjectSnapshot
          resolve(project)
        } catch {
          reject(new Error('Invalid project file'))
        }
      }
      reader.onerror = () => reject(new Error('File reading failed'))
      reader.readAsText(file)
    })
  }
}

export const unifiedStorageService = new UnifiedStorageService()