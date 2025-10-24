import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/app/AppShell'
import ProjectHubPage from '@/app/pages/ProjectHubPage'
import CanvasPage from '@/app/pages/CanvasPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ProjectHubPage />,
      },
      {
        path: 'project/:projectId',
        element: <CanvasPage />,
      },
    ],
  },
])

export type AppRouter = typeof router