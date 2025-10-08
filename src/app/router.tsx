import { createBrowserRouter } from 'react-router-dom'
import AppShell from './AppShell'
import ProjectHubPage from './pages/ProjectHubPage'
import CanvasPage from './pages/CanvasPage'
import { SettingsModal } from './pages/SettingsModal'

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
        children: [
          {
            path: 'settings',
            element: <SettingsModal />,
          },
        ],
      },
    ],
  },
])

export type AppRouter = typeof router