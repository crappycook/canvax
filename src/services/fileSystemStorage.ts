import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, StorageService } from '@/types/storage'

export class FileSystemStorage implements StorageService {
  private projects: Map<string, ProjectSnapshot> = new Map()
  private templates: Map<string, Template> = new Map()
  private settings: AppSettings | null = null

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    this.projects.set(projectId, data)
    // Trigger download of project file for backup
    this.exportProject(data)
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    return this.projects.get(projectId) || null
  }

  async deleteProject(projectId: string): Promise<void> {
    this.projects.delete(projectId)
  }

  async listProjects(): Promise<Array<{ id: string; title: string; updatedAt: number }>> {
    return Array.from(this.projects.values()).map(project => ({
      id: project.id,
      title: project.metadata.title,
      updatedAt: project.metadata.updatedAt
    }))
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    this.templates.set(templateId, data)
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    return this.templates.get(templateId) || null
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

  async importProject(file: File): Promise<ProjectSnapshot> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string) as ProjectSnapshot
          this.projects.set(project.id, project)
          resolve(project)
        } catch {
          reject(new Error('Invalid project file'))
        }
      }
      reader.onerror = () => reject(new Error('File reading failed'))
      reader.readAsText(file)
    })
  }

  private exportProject(project: ProjectSnapshot): void {
    const dataStr = JSON.stringify(project, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const exportFileDefaultName = `${project.metadata.title.replace(/[^a-z0-9]/gi, '_')}.canvax`
    
    if (typeof document === 'undefined') {
      return
    }

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.style.display = 'none'
    document.body.appendChild(linkElement)
    linkElement.click()
    document.body.removeChild(linkElement)
  }

  async testConnection(): Promise<boolean> {
    // FileSystemStorage is always available
    return true
  }
}
