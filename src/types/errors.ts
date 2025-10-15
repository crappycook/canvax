/**
 * Error types for node execution failures
 */
export type NodeErrorType =
  | 'api_key_missing'
  | 'api_key_invalid'
  | 'rate_limit'
  | 'network_error'
  | 'model_not_found'
  | 'context_incomplete'
  | 'unknown'

/**
 * Structured error information for node failures
 */
export interface NodeError {
  type: NodeErrorType
  message: string
  retryable: boolean
  actionLabel?: string
  actionHandler?: () => void
}

/**
 * Error with HTTP status code
 */
type ErrorWithStatus = Error & { status?: number }

/**
 * Formats various error types into a structured NodeError format
 * @param error - The error to format (can be Error, string, or unknown)
 * @param context - Optional context about where the error occurred
 * @returns A structured NodeError object
 */
export function formatError(error: unknown, context?: string): NodeError {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: true,
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const typedError = error as ErrorWithStatus
    const status = typedError.status
    const message = typedError.message || 'An unexpected error occurred'

    // API Key errors (401)
    if (status === 401 || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('api key')) {
      return {
        type: 'api_key_invalid',
        message: 'Authentication failed. Please check your API key in settings.',
        retryable: false,
        actionLabel: 'Go to Settings',
      }
    }

    // Rate limit errors (429)
    if (status === 429 || message.toLowerCase().includes('rate limit')) {
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded. Please wait a moment before retrying.',
        retryable: true,
      }
    }

    // Model not found errors (404)
    if (status === 404 || message.toLowerCase().includes('model not found')) {
      return {
        type: 'model_not_found',
        message: 'The selected model was not found. Please choose a different model.',
        retryable: false,
      }
    }

    // Network errors
    if (
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('fetch') ||
      message.toLowerCase().includes('connection') ||
      message.toLowerCase().includes('timeout')
    ) {
      return {
        type: 'network_error',
        message: 'Network error. Check your connection and try again.',
        retryable: true,
      }
    }

    // Context incomplete errors
    if (message.toLowerCase().includes('context') || message.toLowerCase().includes('upstream')) {
      return {
        type: 'context_incomplete',
        message: message,
        retryable: true,
      }
    }

    // Generic error with message
    return {
      type: 'unknown',
      message: context ? `${context}: ${message}` : message,
      retryable: true,
    }
  }

  // Handle unknown error types
  return {
    type: 'unknown',
    message: context ? `${context}: An unexpected error occurred` : 'An unexpected error occurred',
    retryable: true,
  }
}

/**
 * Checks if an API key is missing for a given provider
 * @param provider - The LLM provider name
 * @param apiKeys - The API keys object from settings
 * @returns A NodeError if the key is missing, null otherwise
 */
export function checkApiKeyMissing(
  provider: string,
  apiKeys: Record<string, string>
): NodeError | null {
  const key = apiKeys[provider]
  
  if (!key || key.trim() === '') {
    return {
      type: 'api_key_missing',
      message: `API key for ${provider} is missing. Please add it in settings.`,
      retryable: false,
      actionLabel: 'Go to Settings',
    }
  }
  
  return null
}
