import { useEffect } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { unifiedStorageService } from '@/services/unifiedStorage'
import { useStore } from '@/state/store'
import ReactFlowCanvas from '@/canvas/ReactFlowCanvas'
import TopBar from '@/canvas/components/TopBar'

export default function CanvasPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const hydrateProject = useStore(state => state.hydrateProject)
  const currentProjectId = useStore(state => state.currentProjectId)
  const nodes = useStore(state => state.nodes)

  useEffect(() => {
    if (!projectId) return

    let cancelled = false

    void (async () => {
      try {
        const snapshot = await unifiedStorageService.loadProject(projectId)
        if (cancelled) return

        if (snapshot) {
          // Hydrate if:
          // 1. Project ID changed, OR
          // 2. Current project ID matches but nodes are empty (page refresh case)
          const shouldHydrate = currentProjectId !== projectId || !nodes || nodes.length === 0

          if (shouldHydrate) {
            hydrateProject(snapshot)
          }
        } else {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Failed to hydrate project from storage:', error)
        if (!cancelled) {
          navigate('/', { replace: true })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [projectId, currentProjectId, nodes, hydrateProject, navigate])

  return (
    <div className="flex h-screen flex-col">
      <TopBar projectId={projectId} />
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowCanvas projectId={projectId} />
      </div>
      <Outlet />
    </div>
  )
}
