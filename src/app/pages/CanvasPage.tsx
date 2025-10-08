import { Outlet, useParams } from 'react-router-dom'
import ReactFlowCanvas from '@/canvas/ReactFlowCanvas'
import TopBar from '@/canvas/components/TopBar'

export default function CanvasPage() {
  const { projectId } = useParams()

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
