import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, Settings, Save } from 'lucide-react'
import { useStore } from '@/state/store'

interface TopBarProps {
  projectId?: string
}

export default function TopBar({ projectId }: TopBarProps) {
  const saveProject = useStore(state => state.saveProject)
  const projectTitle = useStore(state => state.snapshot?.metadata.title ?? 'Untitled Project')
  const navigate = useNavigate()
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [titleInput, setTitleInput] = useState(projectTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleSave = useCallback(() => {
    setTitleInput(projectTitle)
    setDialogOpen(true)
  }, [projectTitle])

  const handleDialogClose = useCallback(() => {
    if (isSaving) return
    setDialogOpen(false)
  }, [isSaving])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setTitleInput(event.target.value)
    },
    []
  )

  const isConfirmDisabled = useMemo(() => {
    return titleInput.trim().length === 0 || isSaving
  }, [titleInput, isSaving])

  const handleConfirmSave = useCallback(async () => {
    if (isConfirmDisabled) return
    setIsSaving(true)
    try {
      await saveProject(titleInput)
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }, [isConfirmDisabled, saveProject, titleInput])

  const handleGoHome = useCallback(async () => {
    if (isLeaving) return
    setIsLeaving(true)
    try {
      await saveProject()
      navigate('/')
    } catch (error) {
      console.error(error)
      if (typeof window !== 'undefined') {
        window.alert('保存项目失败，请先解决保存问题后再返回主页。')
      }
    } finally {
      setIsLeaving(false)
    }
  }, [isLeaving, saveProject, navigate])

  return (
    <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-start gap-4">
        <Button
          onClick={handleGoHome}
          aria-label="Back to homepage"
          disabled={isLeaving || isSaving}
          size="lg"
          className="flex items-center gap-2 px-5 font-semibold"
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Button>

        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{projectTitle}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {projectId && <span>ID: {projectId}</span>}
            <span>All changes saved</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={handleSave} aria-label="Save project">
          <Save className="h-4 w-4" />
        </Button>

        {projectId ? (
          <Button variant="outline" size="icon" asChild>
            <Link
              to={`/project/${projectId}/settings`}
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" disabled aria-label="Settings unavailable">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form
            className="w-full max-w-sm rounded-lg border bg-background shadow-lg"
            onSubmit={event => {
              event.preventDefault()
              void handleConfirmSave()
            }}
          >
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Save Project</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a title for your project before saving.
              </p>
            </div>
            <div className="px-4 py-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground" htmlFor="project-title">
                  Project Title
                </label>
                <input
                  id="project-title"
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={titleInput}
                  onChange={handleTitleChange}
                  placeholder="Untitled Project"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isConfirmDisabled}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
