# Custom LLM Providers - User Guide

## Overview

The Canvas application allows you to configure and use both predefined LLM providers (OpenAI, Anthropic, Google Gemini, DeepSeek) and custom providers with OpenAI-compatible APIs. This guide will walk you through configuring providers and using them in your projects.

## Accessing Provider Settings

Provider settings are managed from the **Project Hub** page, which is the main entry page of the application.

1. Navigate to the Project Hub page (the home page when you open the application)
2. Click the **"Provider Settings"** button in the header
3. The Provider Settings dialog will open, showing all available providers

## Understanding Provider Types

### Predefined Providers

Predefined providers are built-in providers that come pre-configured with the application:

- **OpenAI** - GPT-4, GPT-3.5, and other OpenAI models
- **Anthropic** - Claude models (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
- **Google Gemini** - Google's Gemini models
- **DeepSeek** - DeepSeek models

**Key characteristics:**
- Pre-configured with model lists and API endpoints
- Cannot be deleted or have their base configuration changed
- Can be enabled/disabled
- Require API keys to function

### Custom Providers

Custom providers are user-defined providers that you add yourself:

- Support any OpenAI-compatible API
- Fully configurable (name, base URL, models, API keys)
- Can be added, edited, and deleted
- Useful for self-hosted models (Ollama, LM Studio) or alternative providers

## Configuring Predefined Providers

### Enabling a Predefined Provider

1. Open Provider Settings from the Project Hub
2. Find the provider in the "Predefined Providers" section
3. Toggle the switch to **ON** (enabled)
4. The provider's models will now be available in chat nodes

### Adding an API Key

1. Ensure the provider is enabled
2. Enter your API key in the "API Key" field
3. The key is automatically saved to browser localStorage
4. The key will be used for all API requests to that provider

**Security Note:** API keys are stored in your browser's localStorage. While this is convenient, be aware that:
- Keys are stored in plain text in your browser
- Anyone with access to your browser can potentially access these keys
- Consider using environment-specific keys (not production keys)
- For production use, consider implementing a backend proxy

### Disabling a Predefined Provider

1. Toggle the switch to **OFF** (disabled)
2. The provider's models will no longer appear in chat nodes
3. Existing chat nodes using this provider will show an error
4. The API key is retained but not used

## Configuring Custom Providers

### Adding a Custom Provider

1. Open Provider Settings from the Project Hub
2. Click **"Add Custom Provider"** in the Custom Providers section
3. Fill in the required fields:

   **Provider Name**
   - A friendly name for your provider (e.g., "My Local Ollama")
   - This name will appear in model selectors

   **API Type**
   - Select the API format your provider uses
   - Options: OpenAI, Anthropic, Google, Custom
   - Most self-hosted models use "OpenAI" format

   **API Key**
   - The authentication key for your provider
   - Some local providers may not require a key (use any value)
   - Stored securely in browser localStorage

   **Base URL**
   - The base URL of your provider's API endpoint
   - Example: `http://localhost:11434/v1` (Ollama)
   - Example: `https://api.openai.com/v1` (OpenAI)
   - Must be a valid URL format
   - **Security Warning:** Use HTTPS for remote providers

   **Models**
   - Click "Add Model" to add available models
   - For each model, provide:
     - **Model ID**: The exact model identifier (e.g., `llama2`, `gpt-4`)
     - **Model Label**: A friendly display name (e.g., "Llama 2 7B")
   - You must add at least one model
   - You can add multiple models

   **Enable Provider**
   - Toggle to enable/disable the provider
   - Disabled providers won't appear in chat nodes

4. Click **"Test Connection"** to verify your configuration (optional but recommended)
5. Click **"Confirm"** to save the provider

### Testing a Custom Provider Connection

Before saving, you can test if your provider configuration works:

1. Fill in all required fields in the custom provider dialog
2. Click **"Test Connection"**
3. The system will attempt to make a test API call
4. Results:
   - ✅ **Success**: "Connection successful" - your configuration works
   - ❌ **Error**: An error message will explain what went wrong

**Common test errors:**
- "Network error" - Check if the base URL is correct and accessible
- "Authentication failed" - Verify your API key is correct
- "Invalid response" - The API may not be OpenAI-compatible

**Note:** You can save the configuration even if the test fails. This is useful if you want to configure the provider before the service is available.

### Editing a Custom Provider

1. Open Provider Settings from the Project Hub
2. Find the provider in the "Custom Providers" section
3. Click the **Edit** button (pencil icon)
4. Modify any fields as needed
5. Click **"Confirm"** to save changes

**Note:** The provider ID and creation timestamp cannot be changed.

### Deleting a Custom Provider

1. Open Provider Settings from the Project Hub
2. Find the provider in the "Custom Providers" section
3. Click the **Delete** button (trash icon)
4. Confirm the deletion in the dialog
5. The provider will be permanently removed

**Warning:** If any chat nodes in your projects are using this provider, they will show an error. You'll need to reconfigure those nodes with a different provider.

## Using Providers in Chat Nodes

### Selecting a Model

1. Create or open a chat node in your canvas
2. Click the model selector dropdown
3. Only **enabled** providers will show their models
4. Custom provider models will have a "Custom" badge
5. Select the model you want to use

### If No Providers Are Available

If you see "No providers enabled" in the model selector:

1. Go back to the Project Hub
2. Open Provider Settings
3. Enable at least one provider
4. Configure the API key if required
5. Return to your canvas - models should now be available

### Provider Errors in Chat Nodes

If a chat node shows a provider error:

**"Provider not found or disabled"**
- The selected provider has been disabled or deleted
- Solution: Open Provider Settings and re-enable the provider, or select a different model

**"Authentication failed"**
- The API key is missing or invalid
- Solution: Open Provider Settings and update the API key

**"Connection failed"**
- Cannot reach the provider's API endpoint
- Solution: Check your internet connection, verify the base URL (for custom providers)

## Common Use Cases

### Using Ollama (Local Models)

Ollama is a popular tool for running LLMs locally. Here's how to configure it:

1. Install and start Ollama on your machine
2. Pull a model: `ollama pull llama2`
3. Add a custom provider with:
   - Name: "Ollama"
   - API Type: "OpenAI"
   - API Key: "ollama" (any value works)
   - Base URL: `http://localhost:11434/v1`
   - Models: Add models you've pulled (e.g., `llama2`, `mistral`)

### Using LM Studio

LM Studio provides a local API server for LLMs:

1. Start LM Studio and load a model
2. Enable the local server (usually on port 1234)
3. Add a custom provider with:
   - Name: "LM Studio"
   - API Type: "OpenAI"
   - API Key: "lm-studio" (any value works)
   - Base URL: `http://localhost:1234/v1`
   - Models: Add the model you loaded

### Using Alternative Cloud Providers

Many cloud providers offer OpenAI-compatible APIs:

1. Get your API key from the provider
2. Find their base URL (check their documentation)
3. Add a custom provider with their details
4. **Important:** Use HTTPS for security

## Troubleshooting

### Provider Not Showing in Model Selector

**Possible causes:**
- Provider is disabled
- No API key configured (for providers that require it)
- Provider was just added (try refreshing the page)

**Solutions:**
1. Open Provider Settings
2. Verify the provider is enabled (toggle is ON)
3. Verify the API key is entered
4. Close and reopen the model selector

### "Invalid URL" Error When Adding Custom Provider

**Cause:** The base URL format is incorrect

**Solutions:**
- Ensure URL starts with `http://` or `https://`
- Don't include trailing slashes
- Don't include the full endpoint path (e.g., `/chat/completions`)
- Example: ✅ `http://localhost:11434/v1` ❌ `localhost:11434`

### Connection Test Fails

**Common issues:**

1. **Local server not running**
   - Start your local LLM server (Ollama, LM Studio, etc.)
   - Verify it's running on the correct port

2. **Wrong base URL**
   - Check the provider's documentation for the correct URL
   - Common mistake: using `/v1/chat/completions` instead of `/v1`

3. **CORS issues (browser security)**
   - Local servers may need CORS configuration
   - Check your server's CORS settings
   - Some servers have a `--cors` flag

4. **Firewall blocking connection**
   - Check if your firewall is blocking the port
   - Try accessing the URL directly in your browser

### Chat Node Shows "Provider Error"

**If provider was working before:**
1. Check if the provider is still enabled
2. Verify the API key hasn't expired
3. Check if the provider's service is online

**If using a custom provider:**
1. Test the connection in Provider Settings
2. Verify the base URL is still correct
3. Check if the model ID still exists on the provider

### API Key Security Concerns

**Best practices:**

1. **Don't use production API keys**
   - Use separate keys for development
   - Set spending limits on your API keys

2. **Rotate keys regularly**
   - Change your API keys periodically
   - Remove old keys from Provider Settings

3. **Use HTTPS for remote providers**
   - Never send API keys over unencrypted connections
   - The app will warn you if using HTTP for remote URLs

4. **Consider a backend proxy**
   - For production apps, implement a backend that handles API keys
   - Don't store sensitive keys in the browser

## Persistence and Data Storage

### Where Settings Are Stored

All provider configurations are stored in your browser's localStorage:
- Predefined provider states (enabled/disabled, API keys)
- Custom provider configurations
- Settings persist across browser sessions
- Settings are specific to your browser and device

### Backing Up Your Configuration

To backup your provider settings:

1. Open browser developer tools (F12)
2. Go to Application → Local Storage
3. Find the key for Canvax settings
4. Copy the JSON value
5. Save it to a file

To restore:
1. Paste the JSON back into localStorage
2. Refresh the page

### Clearing Settings

To reset all provider settings:

1. Open Provider Settings
2. Disable all providers
3. Delete all custom providers
4. Or clear browser localStorage for the site

## API Format Compatibility

### OpenAI-Compatible APIs

The custom provider feature works with any API that follows the OpenAI chat completions format:

**Request format:**
```json
POST /v1/chat/completions
{
  "model": "model-name",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response format:**
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

### Supported Providers

Known compatible providers:
- ✅ OpenAI
- ✅ Ollama (with OpenAI compatibility mode)
- ✅ LM Studio
- ✅ LocalAI
- ✅ Text Generation WebUI (with OpenAI extension)
- ✅ vLLM
- ✅ Together AI
- ✅ Anyscale

### Unsupported Features

Currently not supported:
- ❌ Streaming responses (coming soon)
- ❌ Function calling / tool use
- ❌ Vision / multimodal inputs
- ❌ Non-OpenAI API formats (Anthropic native, Google native)

## Tips and Best Practices

### Organizing Providers

- Use clear, descriptive names for custom providers
- Include the model size or variant in model labels
- Example: "Llama 2 7B", "Llama 2 13B" instead of just "llama2"

### Performance Considerations

- Local models are faster but may have lower quality
- Cloud models have higher latency but better quality
- Consider using local models for development/testing
- Use cloud models for production or high-quality outputs

### Cost Management

- Set up spending limits on your API keys
- Monitor usage in your provider's dashboard
- Consider using smaller models for simple tasks
- Use local models when possible to avoid costs

### Model Selection

- Start with smaller, faster models for testing
- Use larger models only when needed
- Different models excel at different tasks:
  - GPT-4: Complex reasoning, coding
  - Claude: Long context, analysis
  - Llama 2: General purpose, local deployment
  - Mistral: Fast, efficient, good quality

## Getting Help

If you encounter issues not covered in this guide:

1. Check the browser console for error messages (F12)
2. Verify your provider's documentation for API details
3. Test the API endpoint directly (using curl or Postman)
4. Check if the provider's service is online
5. Review the troubleshooting section above

## Next Steps

Now that you understand how to configure providers:

1. Set up your preferred providers in Provider Settings
2. Create a new project or open an existing one
3. Add chat nodes to your canvas
4. Select models from your enabled providers
5. Start building AI workflows!
