import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, ProjectMetadata } from '@/types/storage'
import type { StorageAdapter, StorageInfo } from '../storageAdapter'

/**
 * Memory Adapter
 * 
 * In-memory storage for development and fallback.
 * Data is lost on page reload.
 */
export class MemoryAdapter implements StorageAdapter {
  private projects = new Map<string, ProjectSnapshot>()
  private templates = new Map<string, Template>()
  private settings: AppSettings | null = null

  async initialize(): Promise<void> {
    // No initialization needed
  }

  async testConnection(): Promise<void> {
    // Always available
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    this.projects.set(projectId, data)
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    return this.projects.get(projectId) || null
  }

  async deleteProject(projectId: string): Promise<void> {
    this.projects.delete(projectId)
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    return Array.from(this.projects.values()).map(p => ({
      id: p.id,
      title: p.metadata.title,
      updatedAt: p.metadata.updatedAt,
    }))
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    this.templates.set(templateId, data)
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    return this.templates.get(templateId) || null
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId)
  }

  async listTemplates(): Promise<string[]> {
    return Array.from(this.templates.keys())
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.settings = settings
  }

  async loadSettings(): Promise<AppSettings | null> {
    return this.settings
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'memory',
      available: true,
    }
  }
}
