import { describe, it, expect } from 'vitest'

describe('Test Environment', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true)
  })

  it('should have access to globals', () => {
    expect(expect).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
  })

  it('should have crypto.randomUUID mocked', () => {
    const uuid = crypto.randomUUID()
    expect(uuid).toMatch(/^test-uuid-/)
  })

  it('should support jest-dom matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)
    expect(element).toBeInTheDocument()
    document.body.removeChild(element)
  })
})
