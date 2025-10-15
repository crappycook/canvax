import { memo, useCallback } from 'react'
import { 
  AlertCircle, 
  Key, 
  WifiOff, 
  Clock, 
  FileQuestion,
  AlertTriangle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'
import { formatError, type NodeError } from '@/types/errors'

interface ErrorDisplayProps {
  error: string | NodeError
  onRetry?: () => void
  className?: string
}

/**
 * Maps error types to appropriate icons
 */
function getErrorIcon(errorType: NodeError['type']) {
  switch (errorType) {
    case 'api_key_missing':
    case 'api_key_invalid':
      return <Key className="size-5 text-red-600" />
    case 'network_error':
      return <WifiOff className="size-5 text-red-600" />
    case 'rate_limit':
      return <Clock className="size-5 text-orange-600" />
    case 'model_not_found':
      return <FileQuestion className="size-5 text-red-600" />
    case 'context_incomplete':
      return <AlertTriangle className="size-5 text-yellow-600" />
    default:
      return <AlertCircle className="size-5 text-red-600" />
  }
}

/**
 * Maps error types to display labels
 */
function getErrorTypeLabel(errorType: NodeError['type']): string {
  switch (errorType) {
    case 'api_key_missing':
      return 'API Key Missing'
    case 'api_key_invalid':
      return 'Authentication Failed'
    case 'network_error':
      return 'Network Error'
    case 'rate_limit':
      return 'Rate Limit Exceeded'
    case 'model_not_found':
      return 'Model Not Found'
    case 'context_incomplete':
      return 'Context Warning'
    default:
      return 'Error'
  }
}

/**
 * ErrorDisplay component shows structured error information with appropriate actions
 */
export const ErrorDisplay = memo(function ErrorDisplay({
  error,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  const toggleSettings = useStore(state => state.toggleSettings)

  // Convert string errors to NodeError format
  const nodeError: NodeError = typeof error === 'string' 
    ? formatError(error) 
    : error

  const handleActionClick = useCallback(() => {
    if (nodeError.actionHandler) {
      nodeError.actionHandler()
    } else if (
      nodeError.type === 'api_key_missing' || 
      nodeError.type === 'api_key_invalid'
    ) {
      // Open settings for API key errors
      toggleSettings()
    }
  }, [nodeError, toggleSettings])

  const showActionButton = 
    nodeError.actionLabel || 
    nodeError.type === 'api_key_missing' || 
    nodeError.type === 'api_key_invalid'

  const actionLabel = nodeError.actionLabel || 'Go to Settings'

  return (
    <div 
      className={`flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Header */}
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon(nodeError.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-red-900">
            {getErrorTypeLabel(nodeError.type)}
          </div>
          <div className="mt-1 text-sm text-red-700">
            {nodeError.message}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(nodeError.retryable || showActionButton) && (
        <div className="flex gap-2">
          {nodeError.retryable && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="flex-1 border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              Retry
            </Button>
          )}
          {showActionButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleActionClick}
              className="flex-1 border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
})
