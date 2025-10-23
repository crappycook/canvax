# Custom LLM Providers - Documentation Index

## Overview

This directory contains comprehensive documentation for the Custom LLM Providers feature. The documentation is organized for different audiences and use cases.

## For End Users

### Getting Started

1. **[README.md](./README.md)** - Start here!
   - Feature overview and quick start guide
   - Key features and capabilities
   - Architecture overview
   - Common use cases

2. **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user manual
   - How to access provider settings
   - Configuring predefined providers (OpenAI, Anthropic, etc.)
   - Adding and managing custom providers
   - Using providers in chat nodes
   - Step-by-step tutorials for common scenarios
   - Security best practices

### When Things Go Wrong

3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problem-solving guide
   - Quick diagnostics checklist
   - Common issues and solutions
   - Provider-specific troubleshooting
   - Advanced debugging techniques
   - Error message explanations

### Understanding Compatibility

4. **[API_COMPATIBILITY.md](./API_COMPATIBILITY.md)** - API format reference
   - OpenAI API format specification
   - List of compatible providers
   - Testing provider compatibility
   - Configuration examples for popular providers
   - Model ID formats and conventions

## For Developers

### Feature Specification

5. **[requirements.md](./requirements.md)** - Detailed requirements
   - User stories and acceptance criteria
   - EARS-compliant requirement specifications
   - Glossary of terms
   - Complete feature requirements

6. **[design.md](./design.md)** - Architecture and design
   - High-level architecture
   - Component structure
   - Data flow diagrams
   - UI/UX design
   - Service layer design
   - Security considerations

### Implementation

7. **[tasks.md](./tasks.md)** - Implementation task list
   - Detailed task breakdown
   - Task dependencies
   - Progress tracking
   - Requirement traceability

### Additional Documentation

8. **[security-implementation.md](./security-implementation.md)** - Security details
   - API key storage and handling
   - Security warnings implementation
   - Best practices

9. **[persistence-verification.md](./persistence-verification.md)** - Persistence testing
   - localStorage persistence verification
   - Data structure validation
   - Testing procedures

## Documentation Structure

```
.kiro/specs/custom-llm-providers/
├── README.md                          # Feature overview and quick start
├── USER_GUIDE.md                      # Complete user manual
├── TROUBLESHOOTING.md                 # Problem-solving guide
├── API_COMPATIBILITY.md               # API format reference
├── requirements.md                    # Feature requirements
├── design.md                          # Architecture and design
├── tasks.md                           # Implementation tasks
├── security-implementation.md         # Security details
├── persistence-verification.md        # Persistence testing
└── DOCUMENTATION_INDEX.md            # This file
```

## Quick Reference

### I want to...

**Configure a provider**
→ [USER_GUIDE.md](./USER_GUIDE.md) - Sections: "Configuring Predefined Providers" or "Configuring Custom Providers"

**Use Ollama locally**
→ [USER_GUIDE.md](./USER_GUIDE.md) - Section: "Using Ollama (Local Models)"

**Fix a connection error**
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Section: "Connection failed or Network Errors"

**Check if my provider is compatible**
→ [API_COMPATIBILITY.md](./API_COMPATIBILITY.md) - Section: "Compatible Providers"

**Understand the architecture**
→ [design.md](./design.md) - Section: "Architecture"

**See implementation progress**
→ [tasks.md](./tasks.md) - Check task completion status

**Understand security implications**
→ [USER_GUIDE.md](./USER_GUIDE.md) - Section: "Security Considerations"
→ [security-implementation.md](./security-implementation.md)

**Test API compatibility**
→ [API_COMPATIBILITY.md](./API_COMPATIBILITY.md) - Section: "Testing Compatibility"

**Report a bug**
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Section: "Reporting Bugs"

**Contribute to the project**
→ [README.md](./README.md) - Section: "Contributing"

## Code Documentation

### Key Files with JSDoc Comments

All major code files include comprehensive JSDoc comments:

#### Type Definitions
- `src/services/llm/types.ts` - Core type definitions with detailed comments

#### State Management
- `src/state/createSettingsSlice.ts` - Settings store with provider management methods

#### Services
- `src/services/llm/client.ts` - LLM client with provider registry
- `src/services/llm/providers/custom.ts` - Custom provider adapter implementation
- `src/config/llmProviders.ts` - Provider configuration and filtering

#### UI Components
- `src/app/pages/ProviderSettingsDialog.tsx` - Main provider settings dialog
- `src/components/CustomProviderDialog.tsx` - Custom provider add/edit dialog
- `src/components/ModelSelector.tsx` - Model selector component

### Reading the Code

1. **Start with types**: `src/services/llm/types.ts` defines all core interfaces
2. **Understand state**: `src/state/createSettingsSlice.ts` shows how settings are managed
3. **Follow the flow**: `src/config/llmProviders.ts` shows how providers are filtered and merged
4. **See the UI**: `src/app/pages/ProviderSettingsDialog.tsx` shows the user interface
5. **Dive into adapters**: `src/services/llm/providers/custom.ts` shows API integration

## Testing Documentation

### Test Files

- `src/state/createSettingsSlice.test.ts` - Settings store tests
- `src/services/llm/providers/custom.test.ts` - Custom provider adapter tests
- `src/components/CustomProviderDialog.test.tsx` - Dialog component tests
- `src/services/llm/client-refresh.test.ts` - Provider refresh tests
- `src/state/persistence.test.ts` - Persistence tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/state/createSettingsSlice.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Documentation Maintenance

### Keeping Documentation Updated

When making changes to the feature:

1. **Update requirements.md** if requirements change
2. **Update design.md** if architecture changes
3. **Update tasks.md** to track progress
4. **Update USER_GUIDE.md** if user-facing behavior changes
5. **Update TROUBLESHOOTING.md** if new issues are discovered
6. **Update API_COMPATIBILITY.md** if new providers are supported
7. **Update JSDoc comments** in code files
8. **Update README.md** for major changes

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Keep user documentation separate from developer documentation
- Use consistent terminology (refer to glossary in requirements.md)
- Include screenshots or diagrams where appropriate
- Test all examples and commands before documenting

## Glossary

Quick reference for key terms:

- **Predefined Provider**: Built-in provider configured in llmProviders.json
- **Custom Provider**: User-defined provider with OpenAI-compatible API
- **Enabled Provider**: Provider that is active and available in chat nodes
- **Provider Settings**: UI for managing provider configurations
- **Base URL**: API endpoint URL for custom providers
- **Model ID**: Unique identifier for a specific model
- **API Key**: Authentication credential for provider access
- **OpenAI-Compatible**: API that follows OpenAI's chat completions format

## Version History

### Current Version: 1.0.0

Complete implementation of custom LLM providers feature with:
- Predefined provider management
- Custom provider CRUD operations
- Connection testing
- Comprehensive documentation

### Planned: Version 1.1.0

- Streaming response support
- Provider health monitoring
- Usage statistics
- Provider templates

## Getting Help

### For Users

1. Check the [USER_GUIDE.md](./USER_GUIDE.md)
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Verify compatibility in [API_COMPATIBILITY.md](./API_COMPATIBILITY.md)
4. Check browser console for errors
5. Test API directly with curl

### For Developers

1. Review [design.md](./design.md) for architecture
2. Check [requirements.md](./requirements.md) for specifications
3. Read JSDoc comments in code files
4. Review test files for examples
5. Check [tasks.md](./tasks.md) for implementation details

## Contributing to Documentation

### Reporting Documentation Issues

If you find errors or unclear sections:

1. Note the specific document and section
2. Describe what's unclear or incorrect
3. Suggest improvements if possible
4. Include context (what you were trying to do)

### Improving Documentation

To contribute documentation improvements:

1. Follow the existing structure and style
2. Keep user docs separate from developer docs
3. Include examples and code snippets
4. Test all commands and examples
5. Update this index if adding new documents

## License

This documentation is part of the Canvas application. See the main project license for details.

---

**Last Updated**: 2024
**Documentation Version**: 1.0.0
**Feature Version**: 1.0.0
