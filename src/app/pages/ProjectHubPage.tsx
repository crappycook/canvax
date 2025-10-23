import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'
import { unifiedStorageService } from '@/services/unifiedStorage'
import type { ProjectMetadata } from '@/types/storage'
import { Trash2, FolderOpen, Download, Upload, FileText, Settings } from 'lucide-react'
import { ProviderSettingsDialog } from '@/app/pages/ProviderSettingsDialog'

export default function ProjectHubPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const newProject = useStore(state => state.newProject)
  const hydrateProject = useStore(state => state.hydrateProject)
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [storageType, setStorageType] = useState<string>('indexedDB')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showProviderSettings, setShowProviderSettings] = useState(false)

  // Check if we should open provider settings from navigation state
  useEffect(() => {
    const state = location.state as { openProviderSettings?: boolean } | null
    if (state?.openProviderSettings) {
      setShowProviderSettings(true)
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const projectList = await unifiedStorageService.listProjects()
      setProjects(projectList)
      setStorageType(unifiedStorageService.getStorageType())
    } catch (error) {
      console.error('Failed to load projects:', error)
      setLoadError('无法加载本地项目，已切换到文件导入/导出模式。')
      setProjects([])
      setStorageType(unifiedStorageService.getStorageType())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const handleCreateProject = useCallback(() => {
    const projectId = newProject()
    navigate(`/project/${projectId}`)
  }, [navigate, newProject])

  const handleOpenProject = async (projectId: string) => {
    try {
      const snapshot = await unifiedStorageService.loadProject(projectId)
      if (snapshot) {
        hydrateProject(snapshot)
        navigate(`/project/${projectId}`)
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await unifiedStorageService.deleteProject(projectId)
        await loadProjects()
      } catch (error) {
        console.error('Failed to delete project:', error)
      }
    }
  }

  const handleExportProject = async (projectId: string) => {
    try {
      const snapshot = await unifiedStorageService.loadProject(projectId)
      if (snapshot) {
        const dataStr = JSON.stringify(snapshot, null, 2)
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

        const exportFileDefaultName = `${snapshot.metadata.title}.canvax`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
      }
    } catch (error) {
      console.error('Failed to export project:', error)
    }
  }

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const snapshot = await unifiedStorageService.importProject(file)
      if (unifiedStorageService.getStorageType() === 'indexedDB') {
        await unifiedStorageService.saveProject(snapshot.id, snapshot)
      }
      hydrateProject(snapshot)
      navigate(`/project/${snapshot.id}`)
    } catch (error) {
      console.error('Failed to import project:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={cn(
      "flex min-h-screen flex-col items-center justify-center p-8",
      "bg-gradient-to-br from-background to-muted/20"
    )}>
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Canvax
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage your AI workflow projects
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            Storage: {storageType === 'indexedDB' ? 'IndexedDB' : storageType === 'memory' ? 'Memory' : storageType}
          </div>
          {loadError && (
            <p className="mt-1 text-xs text-destructive">
              {loadError}
            </p>
          )}

          {/* Provider Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProviderSettings(true)}
            className="mt-4"
          >
            <Settings className="h-4 w-4 mr-2" />
            Provider Settings
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Button className="flex-1" size="lg" onClick={handleCreateProject}>
              Create New Project
            </Button>
            <Button className="flex gap-2" variant="outline" size="lg" asChild>
              <label>
                <Upload className="size-4" />
                Import Project
                <input
                  type="file"
                  accept=".canvax,.json"
                  onChange={handleImportProject}
                  className="hidden"
                />
              </label>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Recent Projects
            </h3>

            {isLoading ? (
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border bg-card p-4 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent projects</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a new project or import an existing one to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleOpenProject(project.id)
                      if (e.key === 'Delete') handleDeleteProject(project.id)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{project.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(project.updatedAt)}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenProject(project.id)}
                        title="Open project"
                      >
                        <FolderOpen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportProject(project.id)}
                        title="Export project"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Settings Dialog */}
      <ProviderSettingsDialog
        open={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
      />
    </div>
  )
}
