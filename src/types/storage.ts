import { type ProjectSnapshot } from '@/canvas/types'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: unknown // Flexible template content
}

export interface AppSettings {
  defaultModel: string
  language: 'zh' | 'en'
  autoSave: boolean
  theme: 'light' | 'dark' | 'system'
  apiKeys: Record<string, string>
  maxTokens: number
  temperature: number
}

export interface StorageService {
  // Project operations
  saveProject(projectId: string, data: ProjectSnapshot): Promise<void>
  loadProject(projectId: string): Promise<ProjectSnapshot | null>
  deleteProject(projectId: string): Promise<void>
  listProjects(): Promise<Array<{ id: string; title: string; updatedAt: number }>>
  
  // Template operations
  saveTemplate(templateId: string, data: Template): Promise<void>
  loadTemplate(templateId: string): Promise<Template | null>
  listTemplates(): Promise<string[]>
  
  // Settings
  saveSettings(settings: AppSettings): Promise<void>
  loadSettings(): Promise<AppSettings | null>
}