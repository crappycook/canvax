import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ModelSelector } from './ModelSelector'
import { useStore } from '@/state/store'
import * as llmProviders from '@/config/llmProviders'

// Mock the llmProviders module
vi.mock('@/config/llmProviders', async () => {
  const actual = await vi.importActual('@/config/llmProviders')
  return {
    ...actual,
    getLLMModels: vi.fn(),
    getEnabledProviders: vi.fn(),
    findModelById: vi.fn(),
  }
})

describe('ModelSelector - Provider Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.getState().resetSettings()
  })

  it('should re-render when predefined provider is enabled', () => {
    const initialModels: any[] = []
    const updatedModels = [
      {
        id: 'gpt-4',
        label: 'GPT-4',
        providerId: 'openai',
        providerName: 'OpenAI',
        isCustom: false
      }
    ]

    vi.mocked(llmProviders.getLLMModels)
      .mockReturnValueOnce(initialModels)
      .mockReturnValue(updatedModels)
    
    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce([])
      .mockReturnValue([
        {
          id: 'openai',
          name: 'OpenAI',
          requiresApiKey: true,
          enabled: true,
          models: [{ id: 'gpt-4', label: 'GPT-4' }]
        }
      ])

    const onValueChange = vi.fn()
    const { rerender } = render(
      <ModelSelector value="" onValueChange={onValueChange} />
    )

    // Initially button should be disabled (no models)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Select a model')).toBeInTheDocument()

    // Enable a provider
    useStore.getState().setPredefinedProviderEnabled('openai', true)

    // Force re-render to pick up the store change
    rerender(<ModelSelector value="" onValueChange={onValueChange} />)

    // Button should now be enabled (has models)
    expect(button).not.toBeDisabled()
  })

  it('should re-render when custom provider is added', () => {
    const initialModels: any[] = []
    const updatedModels = [
      {
        id: 'custom-model',
        label: 'Custom Model',
        providerId: 'custom-123',
        providerName: 'My Provider',
        isCustom: true
      }
    ]

    vi.mocked(llmProviders.getLLMModels)
      .mockReturnValueOnce(initialModels)
      .mockReturnValue(updatedModels)
    
    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce([])
      .mockReturnValue([
        {
          id: 'custom-123',
          name: 'My Provider',
          requiresApiKey: true,
          enabled: true,
          isCustom: true,
          baseUrl: 'https://api.example.com',
          models: [{ id: 'custom-model', label: 'Custom Model' }]
        }
      ])

    const onValueChange = vi.fn()
    const { rerender } = render(
      <ModelSelector value="" onValueChange={onValueChange} />
    )

    // Initially button should be disabled (no models)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    // Add a custom provider
    useStore.getState().addCustomProvider({
      name: 'My Provider',
      apiType: 'OpenAI',
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      models: [{ id: 'custom-model', label: 'Custom Model' }],
      enabled: true
    })

    // Force re-render to pick up the store change
    rerender(<ModelSelector value="" onValueChange={onValueChange} />)

    // Button should now be enabled (has models)
    expect(button).not.toBeDisabled()
  })

  it('should re-render when custom provider is removed', () => {
    const initialModels = [
      {
        id: 'custom-model',
        label: 'Custom Model',
        providerId: 'custom-123',
        providerName: 'My Provider',
        isCustom: true
      }
    ]
    const updatedModels: any[] = []

    vi.mocked(llmProviders.getLLMModels)
      .mockReturnValueOnce(initialModels)
      .mockReturnValue(updatedModels)
    
    vi.mocked(llmProviders.getEnabledProviders)
      .mockReturnValueOnce([
        {
          id: 'custom-123',
          name: 'My Provider',
          requiresApiKey: true,
          enabled: true,
          isCustom: true,
          baseUrl: 'https://api.example.com',
          models: [{ id: 'custom-model', label: 'Custom Model' }]
        }
      ])
      .mockReturnValue([])

    const onValueChange = vi.fn()
    const { rerender } = render(
      <ModelSelector value="" onValueChange={onValueChange} />
    )

    // Initially button should be enabled (has models)
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()

    // Remove the custom provider
    useStore.getState().removeCustomProvider('custom-123')

    // Force re-render to pick up the store change
    rerender(<ModelSelector value="" onValueChange={onValueChange} />)

    // Button should now be disabled (no models)
    expect(button).toBeDisabled()
  })
})
