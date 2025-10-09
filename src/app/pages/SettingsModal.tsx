import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useStore } from '@/state/store'
import { llmModels, llmProviders } from '@/config/llmProviders'

export function SettingsModal() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const dismissPath = projectId ? `/project/${projectId}` : '/'

  const { settings, updateSettings, setApiKey, removeApiKey } = useStore(state => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    setApiKey: state.setApiKey,
    removeApiKey: state.removeApiKey,
  }))

  const [defaultModel, setDefaultModel] = useState(() => {
    const current = settings.defaultModel
    const hasCurrent = llmModels.some(model => model.id === current)
    return hasCurrent ? current : llmModels[0]?.id ?? ''
  })
  const [language, setLanguage] = useState(settings.language)
  const createApiKeyDraft = useCallback(() => {
    const draft: Record<string, string> = {}
    llmProviders.forEach(provider => {
      draft[provider.id] = settings.apiKeys?.[provider.id] ?? ''
    })
    return draft
  }, [settings.apiKeys])

  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => createApiKeyDraft())
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const hasCurrent = llmModels.some(model => model.id === settings.defaultModel)
    setDefaultModel(hasCurrent ? settings.defaultModel : llmModels[0]?.id ?? '')
  }, [settings.defaultModel])

  useEffect(() => {
    setLanguage(settings.language)
  }, [settings.language])

  useEffect(() => {
    const next = createApiKeyDraft()
    setApiKeys(prev => {
      const nextEntries = Object.entries(next)
      const hasDifference =
        nextEntries.length !== Object.keys(prev).length ||
        nextEntries.some(([providerId, key]) => (prev[providerId] ?? '') !== key)

      return hasDifference ? next : prev
    })
  }, [createApiKeyDraft])

  const handleClose = useCallback(() => {
    navigate(dismissPath, { replace: true })
  }, [navigate, dismissPath])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleClose])

  const handleApiKeyChange = useCallback((providerId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: value }))
  }, [])

  const modelOptions = useMemo(() => {
    return llmModels.map(model => ({
      id: model.id,
      label: `${model.label} · ${model.providerName}`,
    }))
  }, [])

  const handleSubmit = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault()
      if (isSaving) return

      setIsSaving(true)
      try {
        const resolvedModel = llmModels.some(model => model.id === defaultModel)
          ? defaultModel
          : llmModels[0]?.id ?? settings.defaultModel

        updateSettings({
          defaultModel: resolvedModel,
          language,
        })

        llmProviders.forEach(provider => {
          const key = apiKeys[provider.id]?.trim() ?? ''
          if (key) {
            setApiKey(provider.id, key)
          } else {
            removeApiKey(provider.id)
          }
        })
      } finally {
        setIsSaving(false)
        handleClose()
      }
    },
    [
      apiKeys,
      defaultModel,
      handleClose,
      isSaving,
      language,
      removeApiKey,
      setApiKey,
      settings.defaultModel,
      updateSettings,
    ]
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        className="bg-background rounded-lg shadow-lg w-full max-w-xl mx-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Providers</h3>
              <p className="text-xs text-muted-foreground">
                Manage API keys for each provider. Keys are stored locally in your browser.
              </p>
            </div>

            <div className="space-y-4">
              {llmProviders.map(provider => (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor={`api-key-${provider.id}`}>
                      {provider.name}
                    </label>
                    {provider.requiresApiKey && (
                      <span className="text-xs text-muted-foreground">API key required</span>
                    )}
                  </div>
                  <input
                    id={`api-key-${provider.id}`}
                    type="password"
                    placeholder={`Enter your ${provider.name} API key`}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={apiKeys[provider.id] ?? ''}
                    onChange={event => handleApiKeyChange(provider.id, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="default-model">
                Default Model
              </label>
              <select
                id="default-model"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={defaultModel}
                onChange={event => setDefaultModel(event.target.value)}
              >
                {modelOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="language">
                Language
              </label>
              <select
                id="language"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={language}
                onChange={event => setLanguage(event.target.value as 'en' | 'zh')}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
