import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, ProjectMetadata } from '@/types/storage'
import type { StorageAdapter, StorageInfo } from '../storageAdapter'

/**
 * Remote Adapter
 * 
 * Future implementation for server-side storage.
 * Communicates with backend API for data persistence.
 */
export class RemoteAdapter implements StorageAdapter {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async initialize(): Promise<void> {
    // TODO: Initialize connection, authenticate
    // For now, just check if the server is reachable
    await this.testConnection()
  }

  async testConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        throw new Error('Server not available')
      }
    } catch (error) {
      throw new Error(`Remote storage unavailable: ${error}`)
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    return headers
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to save project: ${response.statusText}`)
    }
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to load project: ${response.statusText}`)
    }
    return response.json()
  }

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.statusText}`)
    }
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.statusText}`)
    }
    return response.json()
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to save template: ${response.statusText}`)
    }
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`)
    }
    return response.json()
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`)
    }
  }

  async listTemplates(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to list templates: ${response.statusText}`)
    }
    return response.json()
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    })
    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`)
    }
  }

  async loadSettings(): Promise<AppSettings | null> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.statusText}`)
    }
    return response.json()
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'remote',
      available: true,
    }
  }

  setAuthToken(token: string): void {
    this.authToken = token
  }
}
