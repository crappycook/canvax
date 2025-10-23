import { describe, it, expect } from 'vitest'

describe('CustomProviderDialog URL Validation', () => {
  // Test URL sanitization logic
  const sanitizeBaseUrl = (url: string): string => {
    let sanitized = url.trim()
    sanitized = sanitized.replace(/\/+$/, '')
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    return sanitized
  }

  const validateBaseUrl = (url: string): { valid: boolean; warnings: Array<{ type: string; message: string }> } => {
    const warnings: Array<{ type: string; message: string }> = []
    
    try {
      const parsedUrl = new URL(url)
      
      if (parsedUrl.protocol === 'http:') {
        warnings.push({
          type: 'https',
          message: 'Using HTTP instead of HTTPS. Your API key and data will be transmitted without encryption.',
        })
      }
      
      if (!parsedUrl.protocol.startsWith('http')) {
        return { valid: false, warnings: [] }
      }
      
      return { valid: true, warnings }
    } catch {
      return { valid: false, warnings: [] }
    }
  }

  describe('sanitizeBaseUrl', () => {
    it('should remove trailing slashes', () => {
      expect(sanitizeBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
      expect(sanitizeBaseUrl('https://api.example.com///')).toBe('https://api.example.com')
    })

    it('should trim whitespace', () => {
      expect(sanitizeBaseUrl('  https://api.example.com  ')).toBe('https://api.example.com')
    })

    it('should remove script tags', () => {
      const malicious = 'https://api.example.com<script>alert("xss")</script>'
      expect(sanitizeBaseUrl(malicious)).toBe('https://api.example.com')
    })

    it('should remove javascript: protocol', () => {
      const malicious = 'javascript:alert("xss")'
      expect(sanitizeBaseUrl(malicious)).toBe('alert("xss")')
    })

    it('should handle normal URLs without modification', () => {
      expect(sanitizeBaseUrl('https://api.example.com')).toBe('https://api.example.com')
    })
  })

  describe('validateBaseUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateBaseUrl('https://api.example.com')
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about HTTP URLs', () => {
      const result = validateBaseUrl('http://api.example.com')
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].type).toBe('https')
    })

    it('should reject invalid URLs', () => {
      const result = validateBaseUrl('not-a-url')
      expect(result.valid).toBe(false)
    })

    it('should reject non-HTTP protocols', () => {
      const result = validateBaseUrl('ftp://api.example.com')
      expect(result.valid).toBe(false)
    })

    it('should accept URLs with ports', () => {
      const result = validateBaseUrl('https://api.example.com:8080')
      expect(result.valid).toBe(true)
    })

    it('should accept URLs with paths', () => {
      const result = validateBaseUrl('https://api.example.com/v1')
      expect(result.valid).toBe(true)
    })
  })
})
