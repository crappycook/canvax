import type { ProjectSnapshot } from '@/canvas/types'
import type { AppSettings, Template, ProjectMetadata } from '@/types/storage'
import type { StorageAdapter, StorageInfo } from '../storageAdapter'

export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'canvas-app'
  private version = 1
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    this.db = await this.openDB()
  }

  async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }
  }

  async close(): Promise<void> {
    this.db?.close()
    this.db = null
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }
      }
    })
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }
    return this.db
  }

  async saveProject(projectId: string, data: ProjectSnapshot): Promise<void> {
    const db = this.ensureDB()
    const transaction = db.transaction(['projects'], 'readwrite')
    const store = transaction.objectStore('projects')

    return new Promise((resolve, reject) => {
      const request = store.put({ ...data, id: projectId })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    const db = this.ensureDB()
    const transaction = db.transaction(['projects'], 'readonly')
    const store = transaction.objectStore('projects')

    return new Promise((resolve, reject) => {
      const request = store.get(projectId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteProject(projectId: string): Promise<void> {
    const db = this.ensureDB()
    const transaction = db.transaction(['projects'], 'readwrite')
    const store = transaction.objectStore('projects')

    return new Promise((resolve, reject) => {
      const request = store.delete(projectId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    const db = this.ensureDB()
    const transaction = db.transaction(['projects'], 'readonly')
    const store = transaction.objectStore('projects')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const projects = request.result.map((p: ProjectSnapshot) => ({
          id: p.id,
          title: p.metadata.title,
          updatedAt: p.metadata.updatedAt,
        }))
        resolve(projects)
      }
    })
  }

  async saveTemplate(templateId: string, data: Template): Promise<void> {
    const db = this.ensureDB()
    const transaction = db.transaction(['templates'], 'readwrite')
    const store = transaction.objectStore('templates')

    return new Promise((resolve, reject) => {
      const request = store.put({ ...data, id: templateId })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadTemplate(templateId: string): Promise<Template | null> {
    const db = this.ensureDB()
    const transaction = db.transaction(['templates'], 'readonly')
    const store = transaction.objectStore('templates')

    return new Promise((resolve, reject) => {
      const request = store.get(templateId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const db = this.ensureDB()
    const transaction = db.transaction(['templates'], 'readwrite')
    const store = transaction.objectStore('templates')

    return new Promise((resolve, reject) => {
      const request = store.delete(templateId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async listTemplates(): Promise<string[]> {
    const db = this.ensureDB()
    const transaction = db.transaction(['templates'], 'readonly')
    const store = transaction.objectStore('templates')

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result.map(String))
    })
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = this.ensureDB()
    const transaction = db.transaction(['settings'], 'readwrite')
    const store = transaction.objectStore('settings')

    return new Promise((resolve, reject) => {
      const request = store.put({ ...settings, id: 'app-settings' })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadSettings(): Promise<AppSettings | null> {
    const db = this.ensureDB()
    const transaction = db.transaction(['settings'], 'readonly')
    const store = transaction.objectStore('settings')

    return new Promise((resolve, reject) => {
      const request = store.get('app-settings')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'indexeddb',
      available: this.db !== null,
    }
  }
}
