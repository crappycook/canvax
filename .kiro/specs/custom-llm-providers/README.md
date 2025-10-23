# Custom LLM Providers Feature

## Overview

This feature enables users to configure and use both predefined LLM providers (OpenAI, Anthropic, Google Gemini, DeepSeek) and custom user-defined providers with OpenAI-compatible APIs. Provider settings are managed from the Project Hub page and persist across sessions.

## Key Features

- ✅ Enable/disable predefined providers (OpenAI, Anthropic, Google, DeepSeek)
- ✅ Configure API keys for predefined providers
- ✅ Add custom providers with OpenAI-compatible APIs
- ✅ Define custom models for each provider
- ✅ Test provider connections before saving
- ✅ Edit and delete custom providers
- ✅ Only enabled providers appear in chat nodes
- ✅ Persistent configuration (stored in localStorage)
- ✅ Security warnings for API key storage
- ✅ Visual indicators for custom providers

## Documentation

### For Users

- **[User Guide](./USER_GUIDE.md)** - Complete guide to configuring and using providers
  - How to access provider settings
  - Configuring predefined providers
  - Adding custom providers
  - Using providers in chat nodes
  - Common use cases (Ollama, LM Studio, etc.)

- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Solutions to common issues
  - Provider not appearing in model selector
  - Authentication failures
  - Connection errors
  - CORS issues
  - Performance problems
  - Provider-specific troubleshooting

- **[API Compatibility Guide](./API_COMPATIBILITY.md)** - Understanding compatible APIs
  - OpenAI API format specification
  - List of compatible providers
  - Testing compatibility
  - Configuration examples
  - Model ID formats

### For Developers

- **[Requirements](./requirements.md)** - Detailed feature requirements
- **[Design Document](./design.md)** - Architecture and implementation design
- **[Implementation Tasks](./tasks.md)** - Task breakdown and progress tracking

## Quick Start

### 1. Access Provider Settings

1. Open the Canvas application
2. From the Project Hub page, click **"Provider Settings"**
3. The Provider Settings dialog will open

### 2. Enable a Predefined Provider

1. Find the provider (e.g., OpenAI) in the "Predefined Providers" section
2. Toggle the switch to **ON**
3. Enter your API key in the "API Key" field
4. The provider is now available in chat nodes

### 3. Add a Custom Provider

1. Click **"Add Custom Provider"** in the "Custom Providers" section
2. Fill in the form:
   - **Provider Name**: e.g., "My Ollama"
   - **API Type**: Select "OpenAI"
   - **API Key**: Enter any value (or your actual key)
   - **Base URL**: e.g., `http://localhost:11434/v1`
   - **Models**: Add at least one model
3. Click **"Test Connection"** to verify (optional)
4. Click **"Confirm"** to save

### 4. Use in Chat Nodes

1. Create or open a project
2. Add a chat node to the canvas
3. Open the model selector
4. Select a model from your enabled providers
5. Execute the node

## Architecture Overview

### Components

```
Project Hub Page
  └─> Provider Settings Dialog
       ├─> Predefined Provider Cards
       │    ├─> Enable/Disable Toggle
       │    └─> API Key Input
       └─> Custom Provider Cards
            ├─> Add Custom Provider Button
            ├─> Custom Provider Dialog
            │    ├─> Form Fields
            │    ├─> Model Management
            │    └─> Test Connection
            └─> Edit/Delete Actions
```

### Data Flow

```
User Configuration
  ↓
Settings Store (Zustand)
  ↓
localStorage (Persistence)
  ↓
Provider Registry
  ↓
LLM Client
  ↓
Chat Nodes
```

### Key Files

#### State Management
- `src/state/createSettingsSlice.ts` - Settings store with provider management
- `src/state/store.ts` - Main Zustand store configuration

#### UI Components
- `src/app/pages/ProjectHubPage.tsx` - Entry point with Provider Settings button
- `src/app/pages/ProviderSettingsDialog.tsx` - Main provider settings dialog
- `src/components/CustomProviderDialog.tsx` - Add/edit custom provider dialog
- `src/components/ModelSelector.tsx` - Model selector in chat nodes

#### Services
- `src/services/llm/client.ts` - LLM client with provider registry
- `src/services/llm/providers/custom.ts` - Custom provider adapter
- `src/config/llmProviders.ts` - Provider configuration and filtering
- `src/config/llmProviders.json` - Predefined provider definitions

#### Types
- `src/services/llm/types.ts` - Core type definitions

## Predefined vs Custom Providers

### Predefined Providers

**Characteristics:**
- Pre-configured in `llmProviders.json`
- Cannot be deleted or renamed
- Models are pre-defined
- Can be enabled/disabled
- Require API keys

**Examples:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude models)
- Google Gemini
- DeepSeek

### Custom Providers

**Characteristics:**
- User-defined configurations
- Fully editable (name, URL, models, API key)
- Can be added and deleted
- Support any OpenAI-compatible API
- Useful for self-hosted or alternative providers

**Examples:**
- Ollama (local models)
- LM Studio (local models)
- Together AI (cloud-hosted open models)
- Custom API endpoints

## Provider Configuration Format

### Predefined Provider State

```typescript
{
  "openai": {
    "enabled": true,
    "apiKey": "sk-..."
  },
  "anthropic": {
    "enabled": false
  }
}
```

### Custom Provider Configuration

```typescript
{
  "id": "custom-1234567890-abc123",
  "name": "My Ollama",
  "apiType": "OpenAI",
  "baseUrl": "http://localhost:11434/v1",
  "apiKey": "ollama",
  "models": [
    {
      "id": "llama2",
      "label": "Llama 2 7B"
    },
    {
      "id": "mistral",
      "label": "Mistral 7B"
    }
  ],
  "enabled": true,
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

## API Integration

### Request Format

The application sends requests in OpenAI chat completions format:

```http
POST {baseUrl}/chat/completions
Content-Type: application/json
Authorization: Bearer {apiKey}
```

```json
{
  "model": "model-id",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Expected Response

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Response text"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

See [API Compatibility Guide](./API_COMPATIBILITY.md) for details.

## Security Considerations

### API Key Storage

- API keys are stored in browser localStorage
- Keys are stored in plain text (browser storage limitation)
- Keys are only sent to the configured provider's base URL
- Keys are never exposed in error messages or logs

### Best Practices

1. **Use development keys**: Don't use production API keys in the browser
2. **Set spending limits**: Configure spending limits on your API keys
3. **Rotate keys regularly**: Change API keys periodically
4. **Use HTTPS**: Always use HTTPS for remote providers
5. **Consider a backend proxy**: For production, implement a backend that handles API keys

### Warnings

The application displays warnings for:
- Storing API keys in browser storage
- Using HTTP (non-HTTPS) for remote providers
- Security implications of browser-based key storage

## Testing

### Unit Tests

Located in:
- `src/state/createSettingsSlice.test.ts` - Settings store tests
- `src/services/llm/providers/custom.test.ts` - Custom provider adapter tests
- `src/components/CustomProviderDialog.test.tsx` - Dialog component tests
- `src/services/llm/client-refresh.test.ts` - Provider refresh tests

Run tests:
```bash
npm test
```

### Integration Tests

Test complete workflows:
- Configure provider → Use in chat node
- Enable/disable providers
- Add/edit/delete custom providers
- Persistence across page reloads

### Manual Testing

1. Test predefined provider configuration
2. Test custom provider addition
3. Test connection testing feature
4. Test model selection in chat nodes
5. Test provider deletion handling
6. Test persistence (refresh page)

## Common Use Cases

### Local Development with Ollama

```bash
# Install Ollama
# Download from https://ollama.ai

# Pull a model
ollama pull llama2

# Start server (usually runs automatically)
ollama serve
```

Configure in app:
- Name: "Ollama"
- API Type: "OpenAI"
- Base URL: `http://localhost:11434/v1`
- API Key: "ollama"
- Models: Add models you've pulled

### Local Development with LM Studio

1. Download and install LM Studio
2. Load a model in the Models tab
3. Go to Local Server tab
4. Click "Start Server"
5. Note the port (usually 1234)

Configure in app:
- Name: "LM Studio"
- API Type: "OpenAI"
- Base URL: `http://localhost:1234/v1`
- API Key: "lm-studio"
- Models: Add the loaded model

### Cloud Provider (Together AI)

1. Sign up at https://together.ai
2. Get your API key
3. Check available models in their docs

Configure in app:
- Name: "Together AI"
- API Type: "OpenAI"
- Base URL: `https://api.together.xyz/v1`
- API Key: Your actual API key
- Models: Add models from their catalog

## Troubleshooting

### Quick Fixes

**Provider not showing in model selector:**
- Check if provider is enabled
- Verify API key is configured
- Refresh the page

**Connection test fails:**
- Verify server is running (for local providers)
- Check base URL is correct
- Test with curl to isolate the issue

**Authentication errors:**
- Verify API key is correct
- Check if key has required permissions
- Try generating a new key

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for detailed solutions.

## Limitations

### Current Limitations

- ❌ Streaming responses not yet supported
- ❌ Function calling / tool use not supported
- ❌ Vision / multimodal inputs not supported
- ❌ Only OpenAI-compatible APIs supported
- ❌ No provider health monitoring
- ❌ No usage statistics or cost tracking

### Future Enhancements

Planned features:
- ✨ Streaming response support
- ✨ Function calling / tool use
- ✨ Vision and multimodal inputs
- ✨ Provider templates for popular services
- ✨ Bulk import/export of configurations
- ✨ Provider health monitoring
- ✨ Usage statistics and cost tracking
- ✨ Per-project provider overrides

## Contributing

### Adding Support for New Providers

To add a new predefined provider:

1. Edit `src/config/llmProviders.json`
2. Add provider definition with models
3. Set default `enabled` status
4. Test the configuration
5. Update documentation

### Improving Compatibility

To improve compatibility with more APIs:

1. Identify the API format differences
2. Extend the provider adapter system
3. Add new API type if needed
4. Test thoroughly
5. Document the new provider type

## Support

### Documentation

- [User Guide](./USER_GUIDE.md) - How to use the feature
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [API Compatibility](./API_COMPATIBILITY.md) - Understanding compatible APIs

### Getting Help

1. Check the documentation above
2. Review the troubleshooting guide
3. Check browser console for errors
4. Test the API directly with curl
5. Verify provider's API documentation

## License

This feature is part of the Canvas application. See the main project license for details.

## Changelog

### Version 1.0.0 (Current)

- ✅ Predefined provider enable/disable
- ✅ Predefined provider API key management
- ✅ Custom provider CRUD operations
- ✅ Custom model management
- ✅ Connection testing
- ✅ Provider filtering in chat nodes
- ✅ Persistent configuration
- ✅ Security warnings
- ✅ Comprehensive documentation

### Planned for Version 1.1.0

- 🔄 Streaming response support
- 🔄 Provider health monitoring
- 🔄 Usage statistics
- 🔄 Provider templates

## Credits

Inspired by similar features in:
- DeepChat's custom provider functionality
- OpenAI's API design
- Ollama's local model serving
- LM Studio's local API server
