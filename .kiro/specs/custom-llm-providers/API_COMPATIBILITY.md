# API Format Compatibility Guide

## Overview

The Canvas application's custom provider feature is designed to work with **OpenAI-compatible APIs**. This document explains what that means, which providers are compatible, and how to verify compatibility.

## OpenAI Chat Completions API Format

### Request Format

The application sends requests in the following format:

```http
POST {baseUrl}/chat/completions
Content-Type: application/json
Authorization: Bearer {apiKey}
```

```json
{
  "model": "model-identifier",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 1.0,
  "stream": false
}
```

### Required Request Fields

- **model** (string): The model identifier
- **messages** (array): Array of message objects with `role` and `content`

### Optional Request Fields

- **temperature** (number, 0-2): Controls randomness (default: 0.7)
- **max_tokens** (number): Maximum tokens to generate (default: 1000)
- **top_p** (number, 0-1): Nucleus sampling parameter (default: 1.0)
- **stream** (boolean): Whether to stream the response (default: false)
- **stop** (array of strings): Stop sequences

### Response Format

The application expects responses in this format:

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "model-identifier",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 25,
    "total_tokens": 45
  }
}
```

### Required Response Fields

- **choices** (array): Array of completion choices
  - **message** (object): The generated message
    - **role** (string): Should be "assistant"
    - **content** (string): The generated text
  - **finish_reason** (string): Why generation stopped ("stop", "length", etc.)

### Optional Response Fields

- **id** (string): Unique identifier for the completion
- **model** (string): The model that generated the response
- **usage** (object): Token usage information
  - **prompt_tokens** (number): Tokens in the prompt
  - **completion_tokens** (number): Tokens in the completion
  - **total_tokens** (number): Total tokens used

## Message Roles

The application uses three message roles:

1. **system**: System instructions that guide the model's behavior
2. **user**: Messages from the user
3. **assistant**: Messages from the AI assistant

Your provider must support at least `user` and `assistant` roles. System message support is recommended but not required.

## Compatible Providers

### Fully Compatible

These providers are known to work perfectly with the custom provider feature:

#### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: Required (starts with `sk-`)
- **Models**: GPT-4, GPT-3.5-turbo, etc.
- **Notes**: The reference implementation

#### Ollama
- **Base URL**: `http://localhost:11434/v1`
- **API Key**: Not required (use any value)
- **Models**: Any model you've pulled (llama2, mistral, etc.)
- **Notes**: Requires OpenAI compatibility mode (enabled by default)
- **Setup**: 
  ```bash
  ollama pull llama2
  ollama serve
  ```

#### LM Studio
- **Base URL**: `http://localhost:1234/v1`
- **API Key**: Not required (use any value)
- **Models**: Any model you've loaded
- **Notes**: Enable local server in LM Studio UI
- **Setup**: Load a model, then start the local server

#### LocalAI
- **Base URL**: `http://localhost:8080/v1`
- **API Key**: Configurable
- **Models**: Depends on your configuration
- **Notes**: Drop-in OpenAI replacement
- **Docs**: https://localai.io/

#### Text Generation WebUI (oobabooga)
- **Base URL**: `http://localhost:5000/v1`
- **API Key**: Not required
- **Models**: Loaded model
- **Notes**: Requires OpenAI extension enabled
- **Setup**: Enable `openai` extension in settings

#### vLLM
- **Base URL**: `http://localhost:8000/v1`
- **API Key**: Configurable
- **Models**: Depends on deployment
- **Notes**: High-performance inference server
- **Docs**: https://docs.vllm.ai/

#### Together AI
- **Base URL**: `https://api.together.xyz/v1`
- **API Key**: Required
- **Models**: Various open-source models
- **Notes**: Cloud-hosted open models
- **Docs**: https://docs.together.ai/

#### Anyscale Endpoints
- **Base URL**: `https://api.endpoints.anyscale.com/v1`
- **API Key**: Required
- **Models**: Various models
- **Notes**: OpenAI-compatible API
- **Docs**: https://docs.anyscale.com/

### Partially Compatible

These providers may work but might have limitations:

#### Hugging Face Inference API
- **Compatibility**: Varies by model
- **Notes**: Some models support chat format, others don't
- **Recommendation**: Test thoroughly before use

#### Replicate
- **Compatibility**: Depends on model
- **Notes**: API format varies by model
- **Recommendation**: May require custom adapter

### Not Compatible

These providers use different API formats and won't work:

#### Anthropic (Native API)
- **Issue**: Uses different request/response format
- **Workaround**: Use a proxy that converts to OpenAI format
- **Note**: Anthropic is available as a predefined provider

#### Google Gemini (Native API)
- **Issue**: Different API structure
- **Workaround**: Use a compatibility layer
- **Note**: Google is available as a predefined provider

#### Cohere
- **Issue**: Different API format
- **Workaround**: Not currently supported

## Testing Compatibility

### Manual Testing with curl

Test if a provider is compatible using curl:

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Say hello"}
    ],
    "max_tokens": 50
  }'
```

### Expected Response

A compatible provider should return:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Compatibility Checklist

- [ ] Accepts POST requests to `/v1/chat/completions`
- [ ] Accepts `model` field in request
- [ ] Accepts `messages` array with `role` and `content`
- [ ] Returns `choices` array in response
- [ ] Each choice has `message` object with `content`
- [ ] Supports `temperature`, `max_tokens`, `top_p` parameters (optional)
- [ ] Returns `finish_reason` in choices (optional)

## API Type Selection

When adding a custom provider, you select an API Type:

### OpenAI
- Use for: OpenAI, Ollama, LM Studio, LocalAI, vLLM, etc.
- Format: Standard OpenAI chat completions
- Most common choice for custom providers

### Anthropic
- Use for: Future Anthropic-compatible providers
- Format: Anthropic's native format
- Currently experimental

### Google
- Use for: Future Google-compatible providers
- Format: Google's Gemini format
- Currently experimental

### Custom
- Use for: Providers with slight variations
- Format: OpenAI-like with minor differences
- May require additional configuration

**Recommendation**: Start with "OpenAI" for most providers.

## Common Compatibility Issues

### Issue 1: Different Endpoint Path

**Problem**: Provider uses `/api/chat` instead of `/v1/chat/completions`

**Solution**: 
- Include the full path in the base URL
- Example: `http://localhost:8080/api` instead of `http://localhost:8080`

### Issue 2: Different Message Format

**Problem**: Provider expects `prompt` instead of `messages`

**Solution**: 
- This provider is not compatible
- Look for an OpenAI compatibility mode in the provider's settings

### Issue 3: Missing Required Fields

**Problem**: Provider requires additional fields not sent by the app

**Solution**:
- Check if the provider has a compatibility mode
- Some providers allow default values for required fields

### Issue 4: Different Response Structure

**Problem**: Provider returns text directly instead of in `choices` array

**Solution**:
- This provider is not compatible
- Consider using a proxy to transform responses

### Issue 5: Authentication Format

**Problem**: Provider expects API key in a different header

**Solution**:
- Most providers support `Authorization: Bearer {key}`
- If not, the provider may not be compatible

## Streaming Support

### Current Status

Streaming is **not yet supported** in the current version of the application.

### Future Support

Streaming will be added in a future update with:
- Real-time token-by-token display
- Faster perceived response times
- Better user experience for long responses

### Streaming Format

When implemented, the app will support Server-Sent Events (SSE) format:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" there"}}]}

data: [DONE]
```

## Advanced Features

### Currently Unsupported

These OpenAI API features are not yet supported:

- **Function Calling / Tool Use**: `tools` parameter
- **Vision / Multimodal**: Image inputs in messages
- **JSON Mode**: `response_format` parameter
- **Logprobs**: Token probability information
- **Multiple Choices**: `n` parameter > 1
- **Presence/Frequency Penalties**: `presence_penalty`, `frequency_penalty`

### Future Enhancements

Planned for future versions:
- Streaming responses
- Function calling support
- Vision/multimodal inputs
- Advanced sampling parameters

## Provider Configuration Examples

### Example 1: Ollama

```json
{
  "name": "Ollama Local",
  "apiType": "OpenAI",
  "baseUrl": "http://localhost:11434/v1",
  "apiKey": "ollama",
  "models": [
    {"id": "llama2", "label": "Llama 2 7B"},
    {"id": "mistral", "label": "Mistral 7B"}
  ]
}
```

### Example 2: LM Studio

```json
{
  "name": "LM Studio",
  "apiType": "OpenAI",
  "baseUrl": "http://localhost:1234/v1",
  "apiKey": "lm-studio",
  "models": [
    {"id": "local-model", "label": "Loaded Model"}
  ]
}
```

### Example 3: Together AI

```json
{
  "name": "Together AI",
  "apiType": "OpenAI",
  "baseUrl": "https://api.together.xyz/v1",
  "apiKey": "your-together-api-key",
  "models": [
    {"id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "label": "Mixtral 8x7B"},
    {"id": "meta-llama/Llama-2-70b-chat-hf", "label": "Llama 2 70B"}
  ]
}
```

### Example 4: vLLM

```json
{
  "name": "vLLM Server",
  "apiType": "OpenAI",
  "baseUrl": "http://localhost:8000/v1",
  "apiKey": "vllm",
  "models": [
    {"id": "facebook/opt-125m", "label": "OPT 125M"}
  ]
}
```

## Verifying Model IDs

Different providers use different model identifier formats:

### OpenAI
- Format: `gpt-4`, `gpt-3.5-turbo`
- Case-sensitive: Yes
- Versioning: Sometimes includes date (e.g., `gpt-4-0613`)

### Ollama
- Format: Model name as pulled (e.g., `llama2`, `mistral`)
- Case-sensitive: Yes
- List models: `ollama list`

### LM Studio
- Format: Usually `local-model` or the model's filename
- Check: Look in LM Studio UI for the exact identifier

### Together AI
- Format: `organization/model-name` (e.g., `mistralai/Mixtral-8x7B-Instruct-v0.1`)
- Case-sensitive: Yes
- List: Check Together AI documentation

### vLLM
- Format: Depends on how you started the server
- Usually: The Hugging Face model path

## Best Practices

1. **Test with curl first**: Verify the API works before adding to the app
2. **Use exact model IDs**: Copy model identifiers exactly as they appear
3. **Check documentation**: Review the provider's API docs for specifics
4. **Start simple**: Test with basic parameters before adding complexity
5. **Monitor responses**: Check browser console for response format issues
6. **Use HTTPS**: Always use HTTPS for remote providers
7. **Keep keys secure**: Don't share API keys or commit them to version control

## Getting Help

If you're unsure about a provider's compatibility:

1. Check the provider's documentation for "OpenAI compatibility"
2. Test the API with curl using the format shown above
3. Look for example code in the provider's docs
4. Check if the provider has a compatibility mode
5. Search for community examples or discussions

## Contributing

If you successfully configure a provider not listed here:

1. Document your configuration
2. Note any special requirements or setup steps
3. Share with the community
4. Help others by documenting your experience
