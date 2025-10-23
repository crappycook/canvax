import { useState, useEffect } from "react"
import { X, Plus, Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, HelpCircle, Server, Key, Link2, Layers, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

interface SecurityWarning {
  type: 'https' | 'storage'
  message: string
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
    <div className="space-y-3">
      {/* Existing Models */}
      {models.length > 0 && (
        <div className="space-y-2">
          {models.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input value={model.id} disabled className="flex-1 text-sm" />
              </div>
              <Input value={model.label} disabled className="flex-1 text-sm" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveModel(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove this model</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}

      {/* Add New Model */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Model ID (e.g., gpt-4-turbo)"
          value={newModel.id}
          onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
          className="flex-1"
        />
        <Input
          placeholder="Display name (e.g., GPT-4 Turbo)"
          value={newModel.label}
          onChange={(e) => setNewModel({ ...newModel, label: e.target.value })}
          className="flex-1"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModel}
                disabled={!newModel.id.trim() || !newModel.label.trim()}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add model to provider</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {models.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          <p>Add at least one model to continue. The model ID should match the identifier used by your provider's API.</p>
        </div>
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

  // Security warnings state
  const [securityWarnings, setSecurityWarnings] = useState<SecurityWarning[]>([])

  // Connection testing state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // API key visibility state
  const [showApiKey, setShowApiKey] = useState(false)

  // Sanitize and validate base URL
  const sanitizeBaseUrl = (url: string): string => {
    // Trim whitespace
    let sanitized = url.trim()

    // Remove trailing slashes
    sanitized = sanitized.replace(/\/+$/, '')

    // Remove any script tags or javascript: protocols (basic XSS prevention)
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')

    return sanitized
  }

  const validateBaseUrl = (url: string): { valid: boolean; warnings: SecurityWarning[] } => {
    const warnings: SecurityWarning[] = []

    try {
      const parsedUrl = new URL(url)

      // Check if URL uses HTTPS
      if (parsedUrl.protocol === 'http:') {
        warnings.push({
          type: 'https',
          message: 'Using HTTP instead of HTTPS. Your API key and data will be transmitted without encryption. We strongly recommend using HTTPS for security.',
        })
      }

      // Check for valid protocols
      if (!parsedUrl.protocol.startsWith('http')) {
        return { valid: false, warnings: [] }
      }

      return { valid: true, warnings }
    } catch {
      return { valid: false, warnings: [] }
    }
  }

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
    setSecurityWarnings([])
    setTestResult(null)
  }, [provider, open])

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const warnings: SecurityWarning[] = []

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
      const sanitized = sanitizeBaseUrl(formData.baseUrl)
      const validation = validateBaseUrl(sanitized)

      if (!validation.valid) {
        newErrors.baseUrl = 'Please enter a valid URL'
      } else {
        // Add security warnings
        warnings.push(...validation.warnings)
      }
    }

    // Validate models
    if (formData.models.length === 0) {
      newErrors.models = 'At least one model is required'
    }

    setErrors(newErrors)
    setSecurityWarnings(warnings)
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

    // Sanitize base URL before saving
    const sanitizedBaseUrl = sanitizeBaseUrl(formData.baseUrl)

    // Call onSave with the form data
    onSave({
      name: formData.name.trim(),
      apiType: formData.apiType,
      apiKey: formData.apiKey.trim(),
      baseUrl: sanitizedBaseUrl,
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

      // Create a temporary adapter instance for testing
      const adapter = new CustomProviderAdapter('test-provider', formData.baseUrl)

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
          {/* Security Warning Banner */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-amber-900">Security Notice</h4>
                <p className="text-xs text-amber-800 mt-1">
                  API keys are stored in your browser's local storage. For production use, consider using environment variables or a secure key management system. Never share your API keys or commit them to version control.
                </p>
              </div>
            </div>
          </div>
          {/* Provider Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <Server className="h-4 w-4" />
                Provider Name
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>A friendly name to identify this provider in your workspace. Choose something descriptive like "My Ollama Server" or "Company LLM API".</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="name"
              placeholder="e.g., My Ollama Server, Company LLM API"
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
            <div className="flex items-center gap-2">
              <Label htmlFor="apiType">API Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select the API format your provider uses. Most custom providers use OpenAI-compatible format. This helps format requests correctly.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                <SelectItem value="OpenAI">OpenAI (Most compatible)</SelectItem>
                <SelectItem value="Anthropic">Anthropic</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="apiKey" className="flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                API Key
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your authentication key for the provider's API. This is stored locally in your browser and never shared. Keep it secure and never commit it to version control.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-... or your provider's API key format"
                value={formData.apiKey}
                onChange={(e) => {
                  setFormData({ ...formData, apiKey: e.target.value })
                  if (errors.apiKey) {
                    setErrors({ ...errors, apiKey: undefined })
                  }
                }}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey}</p>
            )}
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="baseUrl" className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4" />
                Base URL
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The base URL of your provider's API endpoint (without the path). For example: https://api.openai.com or http://localhost:11434 for local Ollama. Always use HTTPS for remote servers.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="baseUrl"
              placeholder="https://api.example.com or http://localhost:11434"
              value={formData.baseUrl}
              onChange={(e) => {
                const newUrl = e.target.value
                setFormData({ ...formData, baseUrl: newUrl })
                if (errors.baseUrl) {
                  setErrors({ ...errors, baseUrl: undefined })
                }

                // Check for HTTPS warning in real-time
                if (newUrl.trim()) {
                  const sanitized = sanitizeBaseUrl(newUrl)
                  const validation = validateBaseUrl(sanitized)
                  setSecurityWarnings(validation.warnings)
                } else {
                  setSecurityWarnings([])
                }
              }}
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
              <span className="font-medium">API endpoint:</span>
              <code className="text-xs">/v1/chat/completions</code>
            </div>
            {errors.baseUrl && (
              <p className="text-sm text-destructive">{errors.baseUrl}</p>
            )}

            {/* HTTPS Warning */}
            {securityWarnings.length > 0 && (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {securityWarnings.map((warning, index) => (
                      <p key={index} className="text-xs text-orange-800">
                        {warning.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Models Management */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Models
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Define the models available from this provider. The Model ID must match exactly what the API expects (e.g., "gpt-4-turbo", "llama2"). The display name is what you'll see in the model selector.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled" className="cursor-pointer">Enable Provider</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>When enabled, this provider's models will be available in chat nodes. You can disable it temporarily without deleting the configuration.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
          </div>

          {/* Test Connection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testing || !formData.apiKey.trim() || !formData.baseUrl.trim() || formData.models.length === 0}
                      className="gap-2"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Verify that your provider configuration is correct by making a test API call. This helps catch issues before saving.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Failed</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {testResult && (
              <div className={`rounded-md border p-3 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
              </div>
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
