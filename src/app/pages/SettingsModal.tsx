import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function SettingsModal() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const dismissPath = projectId ? `/project/${projectId}` : '/'

  const handleClose = useCallback(() => {
    navigate(dismissPath, { replace: true })
  }, [navigate, dismissPath])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <input
              type="password"
              placeholder="Enter your API key"
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Default Model</label>
            <select className="w-full p-2 border rounded mt-1">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Language</label>
            <select className="w-full p-2 border rounded mt-1">
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t">
          <Button onClick={handleClose}>Save</Button>
        </div>
      </div>
    </div>
  )
}
