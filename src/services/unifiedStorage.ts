import { IndexedDBStorage } from './storage'
import { FileSystemStorage } from './fileSystemStorage'
import type { StorageService, AppSettings, Template } from '@/types/storage'
import type { ProjectSnapshot } from '@/canvas/types'

export class UnifiedStorageService implements StorageService {
  private preferredStorage: 'indexedDB' | 'fileSystem' = 'indexedDB'
  private indexedDBStorage: IndexedDBStorage
  private fileSystemStorage: FileSystemStorage

  constructor() {
    this.indexedDBStorage = new IndexedDBStorage()
    this.fileSystemStorage = new FileSystemStorage()
    this.detectStorageCapability()
  }

  private async detectStorageCapability(): Promise<void> {
    try {
      await this.indexedDBStorage.testConnection()
      this.preferredStorage = 'indexedDB'
    } catch {
      this.preferredStorage = 'fileSystem'
    }
  }

  async testConnection(): Promise<void> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        await this.indexedDBStorage.testConnection()
      } catch {
        this.preferredStorage = 'fileSystem'
        await this.fileSystemStorage.testConnection()
      }
    } else {
      await this.fileSystemStorage.testConnection()
    }
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        await this.indexedDBStorage.saveProject(projectId, data)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        await this.fileSystemStorage.saveProject(projectId, data)
      }
    } else {
      await this.fileSystemStorage.saveProject(projectId, data)
    }
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        return await this.indexedDBStorage.loadProject(projectId)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        return await this.fileSystemStorage.loadProject(projectId)
      }
    } else {
      return await this.fileSystemStorage.loadProject(projectId)
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        await this.indexedDBStorage.deleteProject(projectId)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        await this.fileSystemStorage.deleteProject(projectId)
      }
    } else {
      await this.fileSystemStorage.deleteProject(projectId)
    }
  }

  async listProjects(): Promise<Array<{ id: string; title: string; updatedAt: number }>> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        return await this.indexedDBStorage.listProjects()
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        return await this.fileSystemStorage.listProjects()
      }
    } else {
      return await this.fileSystemStorage.listProjects()
    }
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        await this.indexedDBStorage.saveTemplate(templateId, data)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        await this.fileSystemStorage.saveTemplate(templateId, data)
      }
    } else {
      await this.fileSystemStorage.saveTemplate(templateId, data)
    }
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        return await this.indexedDBStorage.loadTemplate(templateId)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        return await this.fileSystemStorage.loadTemplate(templateId)
      }
    } else {
      return await this.fileSystemStorage.loadTemplate(templateId)
    }
  }

  async listTemplates(): Promise<string[]> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        return await this.indexedDBStorage.listTemplates()
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        return await this.fileSystemStorage.listTemplates()
      }
    } else {
      return await this.fileSystemStorage.listTemplates()
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        await this.indexedDBStorage.saveSettings(settings)
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        await this.fileSystemStorage.saveSettings(settings)
      }
    } else {
      await this.fileSystemStorage.saveSettings(settings)
    }
  }

  async loadSettings(): Promise<AppSettings | null> {
    if (this.preferredStorage === 'indexedDB') {
      try {
        return await this.indexedDBStorage.loadSettings()
      } catch (error) {
        console.warn('IndexedDB failed, falling back to File System:', error)
        this.preferredStorage = 'fileSystem'
        return await this.fileSystemStorage.loadSettings()
      }
    } else {
      return await this.fileSystemStorage.loadSettings()
    }
  }

  getStorageType(): 'indexedDB' | 'fileSystem' {
    return this.preferredStorage
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