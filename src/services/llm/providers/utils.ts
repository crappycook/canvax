/**
 * Shared utility functions for LLM provider adapters
 */

import { LLMError, LLMErrorCode, createLLMError } from '../errors'

/**
 * Parse Server-Sent Events (SSE) stream
 * Used by providers that use SSE format for streaming
 */
export interface SSEMessage {
  event?: string
  data?: string
  id?: string
  retry?: number
}

/**
 * Parse a single SSE message from a line
 */
export function parseSSEMessage(line: string): Partial<SSEMessage> | null {
  if (!line || line.startsWith(':')) {
    // Empty line or comment
    return null
  }

  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    return null
  }

  const field = line.slice(0, colonIndex)
  let value = line.slice(colonIndex + 1)

  // Remove leading space if present
  if (value.startsWith(' ')) {
    value = value.slice(1)
  }

  return { [field]: value }
}

/**
 * Parse SSE stream from text chunks
 * Accumulates partial lines and yields complete messages
 */
export class SSEParser {
  private buffer = ''

  /**
   * Process a chunk of text and yield complete SSE messages
   */
  parse(chunk: string): SSEMessage[] {
    this.buffer += chunk
    const lines = this.buffer.split('\n')

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || ''

    const messages: SSEMessage[] = []
    let currentMessage: Partial<SSEMessage> = {}

    for (const line of lines) {
      if (line === '') {
        // Empty line signals end of message
        if (Object.keys(currentMessage).length > 0) {
          messages.push(currentMessage as SSEMessage)
          currentMessage = {}
        }
        continue
      }

      const parsed = parseSSEMessage(line)
      if (parsed) {
        Object.assign(currentMessage, parsed)
      }
    }

    return messages
  }

  /**
   * Flush any remaining buffered message
   */
  flush(): SSEMessage[] {
    const messages: SSEMessage[] = []
    if (this.buffer) {
      const parsed = parseSSEMessage(this.buffer)
      if (parsed && Object.keys(parsed).length > 0) {
        messages.push(parsed as SSEMessage)
      }
      this.buffer = ''
    }
    return messages
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Add jitter to delay to avoid thundering herd
 */
export function addJitter(delay: number, jitterFactor = 0.1): number {
  const jitter = delay * jitterFactor * Math.random()
  return delay + jitter
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Determine if an error is retryable based on status code
 */
export function isRetryableStatusCode(
  statusCode: number | undefined,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (!statusCode) return false
  return config.retryableStatusCodes.includes(statusCode)
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  providerId?: string
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if we've exhausted attempts
      if (attempt > config.maxRetries) {
        break
      }

      // Check if error is retryable
      const llmError = createLLMError(error, providerId)
      if (!llmError.retryable && !isRetryableStatusCode(llmError.statusCode)) {
        throw llmError
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, config)
      await sleep(delay)
    }
  }

  // All retries exhausted
  throw createLLMError(lastError, providerId)
}

/**
 * Extract error information from various error formats
 */
export interface ErrorInfo {
  statusCode?: number
  message: string
  originalError: unknown
}

/**
 * Extract error information from common error formats
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  let statusCode: number | undefined
  let message = 'An unknown error occurred'
  const originalError = error

  if (error instanceof Error) {
    message = error.message
    const errorAny = error as any

    // Try various common status code properties
    statusCode =
      errorAny.status ||
      errorAny.statusCode ||
      errorAny.response?.status ||
      errorAny.response?.statusCode

    // Try to get more detailed message from response
    if (errorAny.response?.data?.error?.message) {
      message = errorAny.response.data.error.message
    } else if (errorAny.response?.data?.message) {
      message = errorAny.response.data.message
    } else if (errorAny.error?.message) {
      message = errorAny.error.message
    }
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object') {
    const errorObj = error as any
    message = errorObj.message || errorObj.error || JSON.stringify(error)
    statusCode = errorObj.status || errorObj.statusCode
  }

  return { statusCode, message, originalError }
}

/**
 * Validate that required fields are present in a request
 */
export function validateRequest(
  request: any,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (!(field in request) || request[field] === undefined) {
      throw new LLMError(
        LLMErrorCode.INVALID_REQUEST,
        `Missing required field: ${field}`,
        { retryable: false }
      )
    }
  }
}

/**
 * Truncate API key for safe logging (show only last 4 characters)
 */
export function truncateApiKey(apiKey: string): string {
  if (apiKey.length <= 4) {
    return '****'
  }
  return '****' + apiKey.slice(-4)
}

/**
 * Check if AbortSignal is aborted and throw appropriate error
 */
export function checkAbortSignal(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new LLMError(
      LLMErrorCode.UNKNOWN,
      'Request was aborted',
      { retryable: false }
    )
  }
}
