import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'

export default function ProjectHubPage() {
  const navigate = useNavigate()
  const newProject = useStore(state => state.newProject)

  const handleCreateProject = useCallback(() => {
    const projectId = newProject()
    navigate(`/project/${projectId}`)
  }, [navigate, newProject])

  return (
    <div className={cn(
      "flex min-h-screen flex-col items-center justify-center p-8",
      "bg-gradient-to-br from-background to-muted/20"
    )}>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Canvas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage your AI workflow projects
          </p>
        </div>
        
        <div className="space-y-4">
          <Button className="w-full" size="lg" onClick={handleCreateProject}>
            Create New Project
          </Button>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Recent Projects
            </h3>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No recent projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
