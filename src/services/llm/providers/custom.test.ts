import { describe, it, expect } from 'vitest'
import { CustomProviderAdapter } from './custom'

describe('CustomProviderAdapter Security', () => {
  describe('sanitizeErrorMessage', () => {
    it('should mask OpenAI-style API keys in error messages', () => {
      const adapter = new CustomProviderAdapter('test-provider', 'https://api.test.com')
      // Access private method through any cast for testing
      const sanitize = (adapter as any).sanitizeErrorMessage.bind(adapter)
      
      const message = 'Authentication failed with key sk-1234567890abcdefghij'
      const sanitized = sanitize(message)
      
      expect(sanitized).not.toContain('sk-1234567890abcdefghij')
      expect(sanitized).toContain('sk-***')
    })

    it('should mask Bearer tokens in error messages', () => {
      const adapter = new CustomProviderAdapter('test-provider', 'https://api.test.com')
      const sanitize = (adapter as any).sanitizeErrorMessage.bind(adapter)
      
      const message = 'Request failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const sanitized = sanitize(message)
      
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      expect(sanitized).toContain('Bearer ***')
    })

    it('should mask API key parameters', () => {
      const adapter = new CustomProviderAdapter('test-provider', 'https://api.test.com')
      const sanitize = (adapter as any).sanitizeErrorMessage.bind(adapter)
      
      const message = 'Failed to connect: apikey=sk-proj-1234567890abcdefghij'
      const sanitized = sanitize(message)
      
      expect(sanitized).not.toContain('sk-proj-1234567890abcdefghij')
      expect(sanitized).toContain('apikey=***')
    })

    it('should not modify messages without API keys', () => {
      const adapter = new CustomProviderAdapter('test-provider', 'https://api.test.com')
      const sanitize = (adapter as any).sanitizeErrorMessage.bind(adapter)
      
      const message = 'Connection timeout after 30 seconds'
      const sanitized = sanitize(message)
      
      expect(sanitized).toBe(message)
    })

    it('should mask multiple API keys in the same message', () => {
      const adapter = new CustomProviderAdapter('test-provider', 'https://api.test.com')
      const sanitize = (adapter as any).sanitizeErrorMessage.bind(adapter)
      
      const message = 'Failed with sk-1234567890abcdefghij and token=abcdefghij1234567890'
      const sanitized = sanitize(message)
      
      expect(sanitized).not.toContain('sk-1234567890abcdefghij')
      expect(sanitized).not.toContain('abcdefghij1234567890')
      expect(sanitized).toContain('sk-***')
      expect(sanitized).toContain('token=***')
    })
  })
})
