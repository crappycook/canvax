import { memo, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatNodeData } from '@/types'

interface NodeStatusBadgeProps {
  status: ChatNodeData['status']
  error?: string
  className?: string
}

// Get status details for tooltip and display
function getStatusDetails(status: ChatNodeData['status'], error?: string) {
  switch (status) {
    case 'idle':
      return {
        icon: Circle,
        label: 'Idle',
        tooltip: 'Node is ready to execute',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
      }
    case 'running':
      return {
        icon: Loader2,
        label: 'Running',
        tooltip: 'Node is currently executing',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        animate: true,
      }
    case 'success':
      return {
        icon: CheckCircle,
        label: 'Success',
        tooltip: 'Node executed successfully',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
      }
    case 'error':
      return {
        icon: AlertCircle,
        label: 'Error',
        tooltip: error || 'An error occurred during execution',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
      }
  }
}

export const NodeStatusBadge = memo(function NodeStatusBadge({
  status,
  error,
  className,
}: NodeStatusBadgeProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (status === 'success') {
      // Start fade out animation after 1.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [status])

  if (status === 'idle') {
    return null
  }

  const details = getStatusDetails(status, error)
  const Icon = details.icon

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded p-2 text-sm transition-opacity duration-500',
        details.bgColor,
        details.color,
        status === 'success' && !isVisible && 'opacity-0',
        className
      )}
      title={details.tooltip}
      role="status"
      aria-label={details.tooltip}
    >
      <Icon className={cn('size-4', details.animate && 'animate-spin')} />
      <span>{details.label}</span>
    </div>
  )
})
