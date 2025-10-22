import { useState, useEffect } from "react"
import { X, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Switch } from "./ui/switch"
import type { CustomProviderConfig, CustomModelConfig } from "@/services/llm/types"

interface CustomProviderDialogProps {
  open: boolean
  onClose: () => void
  provider?: CustomProviderConfig
  onSave: (config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  existingProviderNames?: string[]
}

interface FormData {
  name: string
  apiType: 'OpenAI' | 'Anthropic' | 'Google' | 'Custom'
  apiKey: string
  baseUrl: string
  models: CustomModelConfig[]
  enabled: boolean
}

interface FormErrors {
  name?: string
  apiKey?: string
  baseUrl?: string
  models?: string
}

interface TestResult {
  success: boolean
  message: string
}

interface ModelsManagerProps {
  models: CustomModelConfig[]
  onChange: (models: CustomModelConfig[]) => void
}

function ModelsManager({ models, onChange }: ModelsManagerProps) {
  const [newModel, setNewModel] = useState<CustomModelConfig>({ id: '', label: '' })

  const handleAddModel = () => {
    if (newModel.id.trim() && newModel.label.trim()) {
      onChange([...models, { id: newModel.id.trim(), label: newModel.label.trim() }])
      setNewModel({ id: '', label: '' })
    }
  }

  const handleRemoveModel = (index: number) => {
    onChange(models.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {/* Existing Models */}
      {models.length > 0 && (
        <div className="space-y-2">
          {models.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={model.id} disabled className="flex-1" />
              <Input value={model.label} disabled className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveModel(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Model */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Model ID (e.g., gpt-4)"
          value={newModel.id}
          onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
          className="flex-1"
        />
        <Input
          placeholder="Model Label (e.g., GPT-4)"
          value={newModel.label}
          onChange={(e) => setNewModel({ ...newModel, label: e.target.value })}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddModel}
          disabled={!newModel.id.trim() || !newModel.label.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {models.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least one model to continue
        </p>
      )}
    </div>
  )
}

export function CustomProviderDialog({
  open,
  onClose,
  provider,
  onSave,
  existingProviderNames = [],
}: CustomProviderDialogProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    apiType: 'OpenAI',
    apiKey: '',
    baseUrl: '',
    models: [],
    enabled: true,
  })

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({})

  // Connection testing state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // Initialize form data when provider prop changes
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        apiType: provider.apiType,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        models: [...provider.models],
        enabled: provider.enabled,
      })
    } else {
      setFormData({
        name: '',
        apiType: 'OpenAI',
        apiKey: '',
        baseUrl: '',
        models: [],
        enabled: true,
      })
    }
    setErrors({})
    setTestResult(null)
  }, [provider, open])

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate provider name
    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required'
    } else {
      // Check for uniqueness (exclude current provider when editing)
      const isDuplicate = existingProviderNames.some(
        (name) => name.toLowerCase() === formData.name.trim().toLowerCase() &&
                  name !== provider?.name
      )
      if (isDuplicate) {
        newErrors.name = 'A provider with this name already exists'
      }
    }

    // Validate API key
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API key is required'
    }

    // Validate base URL
    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required'
    } else {
      try {
        const url = new URL(formData.baseUrl)
        if (!url.protocol.startsWith('http')) {
          newErrors.baseUrl = 'Base URL must use HTTP or HTTPS protocol'
        }
      } catch {
        newErrors.baseUrl = 'Please enter a valid URL'
      }
    }

    // Validate models
    if (formData.models.length === 0) {
      newErrors.models = 'At least one model is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form is valid (for disabling buttons)
  const isFormValid = (): boolean => {
    return (
      formData.name.trim() !== '' &&
      formData.apiKey.trim() !== '' &&
      formData.baseUrl.trim() !== '' &&
      formData.models.length > 0
    )
  }

  // Handle save
  const handleSave = () => {
    // Validate form before saving
    if (!validateForm()) {
      return
    }

    // Call onSave with the form data
    onSave({
      name: formData.name.trim(),
      apiType: formData.apiType,
      apiKey: formData.apiKey.trim(),
      baseUrl: formData.baseUrl.trim(),
      models: formData.models,
      enabled: formData.enabled,
    })

    // Close the dialog
    onClose()
  }

  // Handle cancel
  const handleCancel = () => {
    // Clear form state
    setFormData({
      name: '',
      apiType: 'OpenAI',
      apiKey: '',
      baseUrl: '',
      models: [],
      enabled: true,
    })
    setErrors({})
    setTestResult(null)

    // Close the dialog
    onClose()
  }

  // Handle connection testing
  const handleTestConnection = async () => {
    // First validate the required fields for testing
    if (!formData.apiKey.trim() || !formData.baseUrl.trim() || formData.models.length === 0) {
      setTestResult({
        success: false,
        message: 'Please fill in API key, base URL, and add at least one model before testing',
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Import the CustomProviderAdapter dynamically
      const { CustomProviderAdapter } = await import('@/services/llm/providers/custom')
      
      // Create a temporary adapter instance with the model for testing
      const testModel = formData.models[0].id
      const adapter = new CustomProviderAdapter('test-provider', formData.baseUrl, testModel)
      
      // Validate the API key
      const result = await adapter.validateApiKey(formData.apiKey)
      
      if (result.valid) {
        setTestResult({
          success: true,
          message: 'Connection successful! Provider is working correctly.',
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Connection failed. Please check your configuration.',
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? 'Edit Custom Provider' : 'Add Custom Provider'}
          </DialogTitle>
          <DialogDescription>
            Configure a custom LLM provider with OpenAI-compatible API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Provider Name</Label>
            <Input
              id="name"
              placeholder="My Custom Provider"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) {
                  setErrors({ ...errors, name: undefined })
                }
              }}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* API Type */}
          <div className="space-y-2">
            <Label htmlFor="apiType">API Type</Label>
            <Select
              value={formData.apiType}
              onValueChange={(value: FormData['apiType']) =>
                setFormData({ ...formData, apiType: value })
              }
            >
              <SelectTrigger id="apiType">
                <SelectValue placeholder="Select API type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OpenAI">OpenAI</SelectItem>
                <SelectItem value="Anthropic">Anthropic</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={formData.apiKey}
              onChange={(e) => {
                setFormData({ ...formData, apiKey: e.target.value })
                if (errors.apiKey) {
                  setErrors({ ...errors, apiKey: undefined })
                }
              }}
            />
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey}</p>
            )}
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              placeholder="https://api.example.com"
              value={formData.baseUrl}
              onChange={(e) => {
                setFormData({ ...formData, baseUrl: e.target.value })
                if (errors.baseUrl) {
                  setErrors({ ...errors, baseUrl: undefined })
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Endpoint path: /v1/chat/completions
            </p>
            {errors.baseUrl && (
              <p className="text-sm text-destructive">{errors.baseUrl}</p>
            )}
          </div>

          {/* Models Management */}
          <div className="space-y-2">
            <Label>Models</Label>
            <ModelsManager
              models={formData.models}
              onChange={(models) => {
                setFormData({ ...formData, models })
                if (errors.models) {
                  setErrors({ ...errors, models: undefined })
                }
              }}
            />
            {errors.models && (
              <p className="text-sm text-destructive">{errors.models}</p>
            )}
          </div>

          {/* Enable Provider Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
            <Label htmlFor="enabled">Enable Provider</Label>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !formData.apiKey.trim() || !formData.baseUrl.trim() || formData.models.length === 0}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Failed</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {testResult && (
              <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                {testResult.message}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid()}>
            {provider ? 'Update' : 'Add Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
