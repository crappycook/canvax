/**
 * Error types for node execution failures
 */
export type NodeErrorType =
  | 'api_key_missing'
  | 'api_key_invalid'
  | 'rate_limit'
  | 'network_error'
  | 'model_not_found'
  | 'provider_disabled'
  | 'provider_not_found'
  | 'invalid_response'
  | 'connection_failed'
  | 'context_incomplete'
  | 'unknown'

/**
 * Structured error information for node failures
 */
export interface NodeError {
  type: NodeErrorType
  message: string
  retryable: boolean
  providerId?: string
  providerName?: string
  isCustomProvider?: boolean
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
 * @param providerId - Optional provider ID for provider-specific errors
 * @param providerName - Optional provider name for display
 * @param isCustomProvider - Whether this is a custom provider
 * @returns A structured NodeError object
 */
export function formatError(
  error: unknown,
  context?: string,
  providerId?: string,
  providerName?: string,
  isCustomProvider?: boolean
): NodeError {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: true,
      providerId,
      providerName,
      isCustomProvider,
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const typedError = error as ErrorWithStatus
    const status = typedError.status
    const message = typedError.message || 'An unexpected error occurred'

    // Provider not found or disabled
    if (message.toLowerCase().includes('provider') && message.toLowerCase().includes('not found')) {
      return {
        type: 'provider_not_found',
        message: providerName
          ? `Provider "${providerName}" is not available. It may have been disabled or removed.`
          : 'The selected provider is not available. Please configure providers in settings.',
        retryable: false,
        providerId,
        providerName,
        isCustomProvider,
        actionLabel: 'Open Provider Settings',
      }
    }

    // API Key errors (401, 403)
    if (status === 401 || status === 403 || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('api key')) {
      const providerContext = providerName ? ` for ${providerName}` : ''
      return {
        type: 'api_key_invalid',
        message: `Authentication failed${providerContext}. Please check your API key in provider settings.`,
        retryable: false,
        providerId,
        providerName,
        isCustomProvider,
        actionLabel: 'Open Provider Settings',
      }
    }

    // Rate limit errors (429)
    if (status === 429 || message.toLowerCase().includes('rate limit')) {
      const providerContext = providerName ? ` (${providerName})` : ''
      return {
        type: 'rate_limit',
        message: `Rate limit exceeded${providerContext}. Please wait a moment before retrying.`,
        retryable: true,
        providerId,
        providerName,
        isCustomProvider,
      }
    }

    // Model not found errors (404)
    if (status === 404 || message.toLowerCase().includes('model not found')) {
      const providerContext = providerName ? ` on ${providerName}` : ''
      return {
        type: 'model_not_found',
        message: `The selected model was not found${providerContext}. Please choose a different model.`,
        retryable: false,
        providerId,
        providerName,
        isCustomProvider,
      }
    }

    // Connection errors (specific to custom providers)
    if (
      message.toLowerCase().includes('econnrefused') ||
      message.toLowerCase().includes('enotfound') ||
      message.toLowerCase().includes('failed to fetch')
    ) {
      const providerContext = providerName ? ` to ${providerName}` : ''
      const customProviderHint = isCustomProvider
        ? ' Please verify the base URL is correct and the service is running.'
        : ''
      return {
        type: 'connection_failed',
        message: `Failed to connect${providerContext}.${customProviderHint}`,
        retryable: true,
        providerId,
        providerName,
        isCustomProvider,
        actionLabel: isCustomProvider ? 'Open Provider Settings' : undefined,
      }
    }

    // Network errors (general)
    if (
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('timeout')
    ) {
      const providerContext = providerName ? ` (${providerName})` : ''
      return {
        type: 'network_error',
        message: `Network error${providerContext}. Check your connection and try again.`,
        retryable: true,
        providerId,
        providerName,
        isCustomProvider,
      }
    }

    // Invalid response errors
    if (
      message.toLowerCase().includes('invalid') &&
      (message.toLowerCase().includes('response') || message.toLowerCase().includes('format'))
    ) {
      const providerContext = providerName ? ` from ${providerName}` : ''
      const customProviderHint = isCustomProvider
        ? ' The API may not be fully OpenAI-compatible.'
        : ''
      return {
        type: 'invalid_response',
        message: `Received invalid response${providerContext}.${customProviderHint}`,
        retryable: false,
        providerId,
        providerName,
        isCustomProvider,
        actionLabel: isCustomProvider ? 'Open Provider Settings' : undefined,
      }
    }

    // Context incomplete errors
    if (message.toLowerCase().includes('context') || message.toLowerCase().includes('upstream')) {
      return {
        type: 'context_incomplete',
        message: message,
        retryable: true,
        providerId,
        providerName,
        isCustomProvider,
      }
    }

    // Generic error with message
    const providerContext = providerName ? ` (${providerName})` : ''
    return {
      type: 'unknown',
      message: context ? `${context}${providerContext}: ${message}` : `${message}${providerContext}`,
      retryable: true,
      providerId,
      providerName,
      isCustomProvider,
    }
  }

  // Handle unknown error types
  const providerContext = providerName ? ` (${providerName})` : ''
  return {
    type: 'unknown',
    message: context ? `${context}${providerContext}: An unexpected error occurred` : `An unexpected error occurred${providerContext}`,
    retryable: true,
    providerId,
    providerName,
    isCustomProvider,
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
      message: `API key for ${provider} is missing. Please add it in provider settings.`,
      retryable: false,
      actionLabel: 'Open Provider Settings',
    }
  }

  return null
}

/**
 * Creates an error for a missing or disabled provider
 * @param modelId - The model ID that was requested
 * @param providerName - Optional provider name for context
 * @returns A NodeError for the missing provider
 */
export function createProviderNotFoundError(
  modelId: string,
  providerName?: string
): NodeError {
  const providerContext = providerName ? ` (${providerName})` : ''
  return {
    type: 'provider_not_found',
    message: `Provider for model "${modelId}"${providerContext} is not available. It may be disabled or removed. Please configure providers in settings.`,
    retryable: false,
    providerName,
    actionLabel: 'Open Provider Settings',
  }
}

/**
 * Creates an error for a disabled provider
 * @param providerName - The provider name
 * @param providerId - The provider ID
 * @param isCustomProvider - Whether this is a custom provider
 * @returns A NodeError for the disabled provider
 */
export function createProviderDisabledError(
  providerName: string,
  providerId: string,
  isCustomProvider: boolean = false
): NodeError {
  return {
    type: 'provider_disabled',
    message: `Provider "${providerName}" is currently disabled. Please enable it in provider settings to use it.`,
    retryable: false,
    providerId,
    providerName,
    isCustomProvider,
    actionLabel: 'Open Provider Settings',
  }
}

/**
 * Parses an error that might be a JSON string or a plain string
 * @param error - The error to parse (can be string, NodeError, or unknown)
 * @returns A NodeError object
 */
export function parseError(error: string | NodeError | unknown): NodeError {
  // If it's already a NodeError object, return it
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as NodeError
  }

  // If it's a string, try to parse as JSON
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error)
      // Validate it's a NodeError
      if (parsed && typeof parsed === 'object' && 'type' in parsed && 'message' in parsed) {
        return parsed as NodeError
      }
    } catch {
      // Not JSON, treat as plain string error
    }
    // Fall back to formatting the string
    return formatError(error)
  }

  // For any other type, format it
  return formatError(error)
}
