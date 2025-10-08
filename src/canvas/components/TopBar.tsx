import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Settings, Save } from 'lucide-react'

interface TopBarProps {
  projectId?: string
}

export default function TopBar({ projectId }: TopBarProps) {
  return (
    <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">
          {projectId ? `Project ${projectId}` : 'Untitled Project'}
        </h1>
        <span className="text-sm text-muted-foreground">
          All changes saved
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon">
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
    </header>
  )
}
