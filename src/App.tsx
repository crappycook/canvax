import '@xyflow/react/dist/style.css'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { initializeProviderConfig } from '@/config/llmProviders'
import { useStore } from '@/state/store'

function App() {
  // Initialize provider configuration with store access
  useEffect(() => {
    initializeProviderConfig(() => useStore.getState())
  }, [])

  return <RouterProvider router={router} />
}

export default App
