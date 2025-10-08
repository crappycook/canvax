import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function AppShell() {
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      "font-sans antialiased"
    )}>
      <div className="relative flex min-h-screen flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}