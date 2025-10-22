/**
 * Error handling for LLM provider integration
 */

/**
 * Unified error codes across all LLM providers
 */
export type LLMErrorCode =
  | 'api_key_invalid'
  | 'api_key_missing'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'model_not_found'
  | 'network_error'
  | 'timeout'
  | 'invalid_request'
  | 'server_error'
  | 'unknown'

export const LLMErrorCode = {
  API_KEY_INVALID: 'api_key_invalid' as LLMErrorCode,
  API_KEY_MISSING: 'api_key_missing' as LLMErrorCode,
  RATE_LIMIT: 'rate_limit' as LLMErrorCode,
  QUOTA_EXCEEDED: 'quota_exceeded' as LLMErrorCode,
  MODEL_NOT_FOUND: 'model_not_found' as LLMErrorCode,
  NETWORK_ERROR: 'network_error' as LLMErrorCode,
  TIMEOUT: 'timeout' as LLMErrorCode,
  INVALID_REQUEST: 'invalid_request' as LLMErrorCode,
  SERVER_ERROR: 'server_error' as LLMErrorCode,
  UNKNOWN: 'unknown' as LLMErrorCode,
}

/**
 * Options for creating an LLMError
 */
export interface LLMErrorOptions {
  retryable?: boolean
  statusCode?: number
  providerId?: string
  providerError?: unknown
}

/**
 * Unified error class for LLM operations
 */
export class LLMError extends Error {
  public readonly code: LLMErrorCode
  public readonly retryable: boolean
  public readonly statusCode?: number
  public readonly providerId?: string
  public readonly providerError?: unknown

  constructor(
    code: LLMErrorCode,
    message: string,
    options: LLMErrorOptions = {}
  ) {
    super(message)
    this.name = 'LLMError'
    this.code = code
    this.retryable = options.retryable ?? false
    this.statusCode = options.statusCode
    this.providerId = options.providerId
    this.providerError = options.providerError

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LLMError)
    }
  }

  /**
   * Get a user-friendly error message based on error code
   */
  getUserMessage(): string {
    switch (this.code) {
      case LLMErrorCode.API_KEY_INVALID:
        return 'Authentication failed. Please check your API key in settings.'
      case LLMErrorCode.API_KEY_MISSING:
        return 'API key is missing. Please add your API key in settings.'
      case LLMErrorCode.RATE_LIMIT:
        return 'Rate limit exceeded. Please wait before retrying.'
      case LLMErrorCode.QUOTA_EXCEEDED:
        return 'API quota exceeded. Please check your account limits.'
      case LLMErrorCode.MODEL_NOT_FOUND:
        return 'Model not found. Please select a different model.'
      case LLMErrorCode.NETWORK_ERROR:
        return 'Network error. Check your connection and try again.'
      case LLMErrorCode.TIMEOUT:
        return 'Request timed out. Please try again.'
      case LLMErrorCode.INVALID_REQUEST:
        return 'Invalid request. Please check your input and try again.'
      case LLMErrorCode.SERVER_ERROR:
        return 'Server error. Please try again later.'
      case LLMErrorCode.UNKNOWN:
      default:
        return this.message || 'An unknown error occurred.'
    }
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      providerId: this.providerId,
    }
  }
}

/**
 * Helper function to determine if an error code is retryable
 */
export function isRetryableError(code: LLMErrorCode): boolean {
  return [
    LLMErrorCode.RATE_LIMIT,
    LLMErrorCode.NETWORK_ERROR,
    LLMErrorCode.TIMEOUT,
    LLMErrorCode.SERVER_ERROR,
  ].includes(code)
}

/**
 * Helper function to map HTTP status codes to error codes
 */
export function mapStatusToErrorCode(
  statusCode: number,
  _message?: string
): LLMErrorCode {
  if (statusCode === 401 || statusCode === 403) {
    return LLMErrorCode.API_KEY_INVALID
  }
  if (statusCode === 429) {
    return LLMErrorCode.RATE_LIMIT
  }
  if (statusCode === 404) {
    return LLMErrorCode.MODEL_NOT_FOUND
  }
  if (statusCode === 400) {
    return LLMErrorCode.INVALID_REQUEST
  }
  if (statusCode >= 500 && statusCode < 600) {
    return LLMErrorCode.SERVER_ERROR
  }
  if (statusCode === 0 || !statusCode) {
    return LLMErrorCode.NETWORK_ERROR
  }
  return LLMErrorCode.UNKNOWN
}

/**
 * Helper function to create an LLMError from an unknown error
 */
export function createLLMError(
  error: unknown,
  providerId?: string
): LLMError {
  // If it's already an LLMError, return it
  if (error instanceof LLMError) {
    return error
  }

  // Extract information from the error
  let errorMessage = 'An unknown error occurred'
  let statusCode: number | undefined
  let code = LLMErrorCode.UNKNOWN

  if (error instanceof Error) {
    errorMessage = error.message
    // Try to extract status code from common error formats
    const errorAny = error as any
    statusCode = errorAny.status || errorAny.statusCode || errorAny.code
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  // Map status code to error code if available
  if (typeof statusCode === 'number') {
    code = mapStatusToErrorCode(statusCode, errorMessage)
  }

  // Check for network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    code = LLMErrorCode.NETWORK_ERROR
  }

  // Check for timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    code = LLMErrorCode.TIMEOUT
  }

  const retryable = isRetryableError(code)

  return new LLMError(code, errorMessage, {
    retryable,
    statusCode,
    providerId,
    providerError: error,
  })
}
