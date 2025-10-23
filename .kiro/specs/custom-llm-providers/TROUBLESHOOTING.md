# Custom LLM Providers - Troubleshooting Guide

## Quick Diagnostics

Before diving into specific issues, run through this quick checklist:

- [ ] Is the provider enabled in Provider Settings?
- [ ] Is the API key configured (if required)?
- [ ] Is the base URL correct (for custom providers)?
- [ ] Can you access the provider's API directly (test with curl)?
- [ ] Are there any errors in the browser console (F12)?
- [ ] Is your internet connection working (for cloud providers)?
- [ ] Is the local server running (for local providers)?

## Common Issues and Solutions

### 1. Provider Not Appearing in Model Selector

**Symptom:** When you open the model selector in a chat node, your provider or its models don't appear.

**Possible Causes:**

#### A. Provider is Disabled
**Check:** Open Provider Settings → Find your provider → Check if toggle is ON

**Solution:**
1. Open Provider Settings from Project Hub
2. Find the provider in the list
3. Toggle the switch to ON (enabled)
4. Close and reopen the model selector

#### B. No API Key Configured
**Check:** Provider Settings → Provider card → API Key field is empty

**Solution:**
1. Open Provider Settings
2. Enter your API key in the provider's API Key field
3. The key is automatically saved
4. Return to your canvas

#### C. Provider Was Just Added
**Check:** Did you just add the custom provider?

**Solution:**
1. Close the model selector
2. Wait a moment for the provider registry to refresh
3. Reopen the model selector
4. If still not showing, refresh the page (F5)

#### D. No Models Defined
**Check:** Custom provider has no models in its configuration

**Solution:**
1. Open Provider Settings
2. Click Edit on the custom provider
3. Add at least one model with ID and label
4. Save the provider

### 2. "Provider not found or disabled" Error

**Symptom:** Chat node shows an error message about the provider not being found.

**Possible Causes:**

#### A. Provider Was Disabled
**Solution:**
1. Open Provider Settings
2. Find the provider
3. Enable it (toggle to ON)
4. Return to canvas - error should clear

#### B. Custom Provider Was Deleted
**Solution:**
1. The provider no longer exists
2. You need to select a different model for this chat node
3. Open the model selector and choose an available model

#### C. Provider ID Changed
**Solution:**
1. This shouldn't happen normally
2. If it does, you'll need to reconfigure the chat node
3. Select a new model from available providers

### 3. "Authentication failed" Error

**Symptom:** Chat node execution fails with authentication error.

**Possible Causes:**

#### A. Missing API Key
**Check:** Provider Settings → Provider → API Key field

**Solution:**
1. Open Provider Settings
2. Enter the correct API key
3. Save and try again

#### B. Invalid API Key
**Check:** Verify the key is correct in your provider's dashboard

**Solution:**
1. Log into your provider's website
2. Generate a new API key
3. Copy the new key
4. Update it in Provider Settings
5. Try the request again

#### C. API Key Expired
**Check:** Some providers expire keys after a certain time

**Solution:**
1. Generate a new API key from your provider
2. Update it in Provider Settings
3. Consider setting up key rotation reminders

#### D. API Key Lacks Permissions
**Check:** Some providers have different key types with different permissions

**Solution:**
1. Verify your key has chat/completion permissions
2. Generate a new key with correct permissions
3. Update in Provider Settings

### 4. "Connection failed" or Network Errors

**Symptom:** Cannot connect to the provider's API.

**Possible Causes:**

#### A. Local Server Not Running
**For Ollama, LM Studio, etc.**

**Check:**
```bash
# Test if server is responding
curl http://localhost:11434/v1/models
```

**Solution:**
1. Start your local LLM server
2. Verify it's running on the expected port
3. Try the request again

**Common commands:**
- Ollama: `ollama serve`
- LM Studio: Start the local server in the UI

#### B. Wrong Port Number
**Check:** Verify the port in your base URL matches the server

**Solution:**
1. Check what port your server is running on
2. Update the base URL in Provider Settings
3. Common ports:
   - Ollama: 11434
   - LM Studio: 1234
   - Text Generation WebUI: 5000

#### C. Wrong Base URL
**Check:** The base URL format and path

**Solution:**
1. Verify the correct base URL from provider docs
2. Common mistakes:
   - ❌ `localhost:11434` → ✅ `http://localhost:11434/v1`
   - ❌ `http://localhost:11434/v1/chat/completions` → ✅ `http://localhost:11434/v1`
   - ❌ `http://localhost:11434/` → ✅ `http://localhost:11434/v1`

#### D. CORS Issues
**Symptom:** Browser console shows CORS error

**Check:** Open browser console (F12) and look for CORS-related errors

**Solution:**
1. Configure your local server to allow CORS
2. For Ollama: Set `OLLAMA_ORIGINS=*` environment variable
3. For LM Studio: Enable CORS in settings
4. For custom servers: Add CORS headers

**Example CORS headers needed:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### E. Firewall Blocking Connection
**Check:** Try accessing the URL directly in browser

**Solution:**
1. Check firewall settings
2. Allow the port through firewall
3. On Windows: Windows Defender Firewall → Allow an app
4. On Mac: System Preferences → Security & Privacy → Firewall

#### F. Provider Service is Down
**For cloud providers**

**Check:** Visit the provider's status page
- OpenAI: https://status.openai.com
- Anthropic: https://status.anthropic.com

**Solution:**
1. Wait for the service to come back online
2. Check provider's social media for updates
3. Try a different provider temporarily

### 5. "Invalid response" or Parsing Errors

**Symptom:** Provider responds but the app can't parse the response.

**Possible Causes:**

#### A. API Not OpenAI-Compatible
**Check:** The provider's API documentation

**Solution:**
1. Verify the provider uses OpenAI-compatible format
2. Test the API directly:
```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
3. If response format is different, the provider may not be compatible

#### B. Wrong API Type Selected
**Check:** Custom provider's API Type setting

**Solution:**
1. Open Provider Settings
2. Edit the custom provider
3. Try changing the API Type
4. Test connection again

#### C. Model Not Available
**Check:** The model ID exists on the provider

**Solution:**
1. For Ollama: Run `ollama list` to see available models
2. For LM Studio: Check loaded models in the UI
3. Update the model ID in provider settings to match exactly

### 6. Test Connection Fails

**Symptom:** "Test Connection" button shows an error.

**Possible Causes:**

#### A. All the Above Issues
**Solution:** Work through sections 3, 4, and 5 above

#### B. Timeout
**Check:** Is the server responding slowly?

**Solution:**
1. Wait longer for the test to complete
2. Check server performance
3. Try a smaller model if using local LLM

#### C. Model Not Loaded
**For local providers**

**Solution:**
1. Ollama: Run `ollama pull <model-name>` first
2. LM Studio: Load a model in the UI before testing
3. Verify model is ready before testing connection

### 7. Models Not Loading in Chat Node

**Symptom:** Model selector is empty or shows "No providers enabled".

**Possible Causes:**

#### A. No Providers Enabled
**Solution:**
1. Open Provider Settings
2. Enable at least one provider
3. Configure its API key if required
4. Return to canvas

#### B. All Providers Disabled
**Solution:**
1. Review each provider in Provider Settings
2. Enable the ones you want to use
3. Ensure API keys are configured

#### C. Provider Registry Not Refreshed
**Solution:**
1. Refresh the page (F5)
2. Close and reopen the model selector
3. Check browser console for errors

### 8. Custom Provider Can't Be Saved

**Symptom:** "Confirm" button is disabled or save fails.

**Possible Causes:**

#### A. Validation Errors
**Check:** Look for red error messages in the dialog

**Solution:**
1. **Provider Name**: Must not be empty
2. **Base URL**: Must be valid URL format (http:// or https://)
3. **API Key**: Must not be empty
4. **Models**: Must have at least one model defined

#### B. Duplicate Provider Name
**Check:** Another provider with the same name exists

**Solution:**
1. Use a unique name for each provider
2. Or edit the existing provider instead

### 9. Performance Issues

**Symptom:** Requests are very slow or timeout.

**Possible Causes:**

#### A. Local Model Too Large
**For local LLMs**

**Solution:**
1. Use a smaller model variant
2. Example: Use 7B instead of 13B or 70B
3. Check your system resources (RAM, GPU)

#### B. High Temperature/Max Tokens
**Check:** Chat node settings

**Solution:**
1. Reduce max_tokens to a reasonable value (e.g., 1000)
2. Lower temperature if not needed
3. These settings affect generation time

#### C. Network Latency
**For cloud providers**

**Solution:**
1. Check your internet connection speed
2. Try a different network
3. Consider using a provider with servers closer to you

### 10. Security Warnings

**Symptom:** Browser shows security warnings or HTTPS errors.

**Possible Causes:**

#### A. Using HTTP for Remote Provider
**Check:** Base URL starts with `http://` not `https://`

**Solution:**
1. Use HTTPS for all remote providers
2. Only use HTTP for localhost
3. Update base URL to use `https://`

#### B. Self-Signed Certificate
**For custom servers with self-signed certs**

**Solution:**
1. Add the certificate to your browser's trusted certificates
2. Or use a proper SSL certificate (Let's Encrypt is free)
3. For development, you may need to accept the risk

#### C. Mixed Content Warning
**Check:** Browser console for mixed content errors

**Solution:**
1. Ensure the app is served over HTTPS if using HTTPS providers
2. Or use HTTP for both app and provider (development only)

## Advanced Debugging

### Checking Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for errors in red
4. Common error patterns:

**CORS Error:**
```
Access to fetch at 'http://localhost:11434/v1/chat/completions' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```
→ Solution: Configure CORS on your server

**Network Error:**
```
Failed to fetch
```
→ Solution: Check if server is running and URL is correct

**Authentication Error:**
```
401 Unauthorized
```
→ Solution: Check API key

### Testing API Directly

Use curl to test the provider's API:

```bash
# Test OpenAI-compatible endpoint
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

Expected response:
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

### Checking localStorage

View stored provider configurations:

1. Open Developer Tools (F12)
2. Go to Application tab
3. Expand Local Storage
4. Find your app's domain
5. Look for the settings key
6. Check the JSON structure

### Network Tab Inspection

Monitor API requests:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Execute a chat node
4. Look for the API request
5. Check:
   - Request URL
   - Request headers (Authorization)
   - Request payload
   - Response status code
   - Response body

## Provider-Specific Issues

### Ollama

**Issue:** Models not found
```bash
# List available models
ollama list

# Pull a model if needed
ollama pull llama2
```

**Issue:** Server not starting
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve
```

**Issue:** CORS errors
```bash
# Set environment variable
export OLLAMA_ORIGINS="*"
ollama serve
```

### LM Studio

**Issue:** Server not enabled
- Open LM Studio
- Go to Local Server tab
- Click "Start Server"
- Note the port number (usually 1234)

**Issue:** Model not loaded
- Load a model in the Models tab first
- Wait for it to fully load
- Then start the server

### OpenAI

**Issue:** Rate limits
- Check your usage tier
- Implement retry logic
- Consider upgrading your plan

**Issue:** Model not available
- Verify you have access to the model
- Some models require special access
- Check OpenAI's model availability page

### Anthropic (Claude)

**Issue:** API key format
- Anthropic keys start with `sk-ant-`
- Verify you copied the full key
- Generate a new key if needed

**Issue:** Model names
- Use exact model names: `claude-3-5-sonnet-20241022`
- Check Anthropic docs for current model names

## Still Having Issues?

If you've tried everything above and still have problems:

1. **Check the browser console** for detailed error messages
2. **Test the API directly** with curl to isolate the issue
3. **Review provider documentation** for API specifics
4. **Try a different provider** to see if it's provider-specific
5. **Check provider status pages** for service outages
6. **Clear browser cache and localStorage** and reconfigure
7. **Try a different browser** to rule out browser-specific issues

## Reporting Bugs

If you believe you've found a bug in the application:

1. Note the exact steps to reproduce
2. Capture any error messages from console
3. Note your browser and version
4. Note the provider and configuration
5. Check if it happens with other providers
6. Report with all the above information

## Prevention Tips

To avoid common issues:

- ✅ Test connection before saving custom providers
- ✅ Use HTTPS for remote providers
- ✅ Keep API keys secure and rotate regularly
- ✅ Document your custom provider configurations
- ✅ Verify model IDs match exactly
- ✅ Keep local LLM servers updated
- ✅ Monitor API usage and costs
- ✅ Have backup providers configured
