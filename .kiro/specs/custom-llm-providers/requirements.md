# Requirements Document

## Introduction

This document specifies requirements for enabling users to add custom LLM providers to the Canvas application. Currently, the application only supports predefined providers configured in `llmProviders.json` (OpenAI, Anthropic, Google Gemini, DeepSeek). This feature SHALL allow users to dynamically add custom providers with OpenAI-compatible APIs through a user interface accessible from the Project Hub page, similar to DeepChat's custom provider functionality. Custom providers SHALL be stored in user settings and persist across sessions. Chat nodes in the canvas SHALL only be able to select from enabled providers configured in the Project Hub.

## Glossary

- **Canvas Application**: The React-based visual conversation flow application
- **Custom Provider**: A user-defined LLM provider configuration with API endpoint and authentication details
- **Predefined Provider**: A built-in provider configured in `llmProviders.json` (OpenAI, Anthropic, etc.)
- **Project Hub Page**: The entry page for managing projects and LLM provider settings
- **Provider Settings UI**: The UI component in Project Hub for managing LLM providers and API keys
- **Provider Configuration**: The data structure containing provider name, API type, base URL, API key, models, and enabled status
- **OpenAI-Compatible API**: An API that follows OpenAI's chat completion endpoint format
- **Settings Store**: The Zustand store slice managing user preferences and provider configurations
- **Provider Registry**: The system component that manages both predefined and custom providers
- **Chat Node**: A canvas node that can select from enabled providers for LLM interactions
- **Enabled Provider**: A provider (predefined or custom) that has been activated and configured with an API key

## Requirements

### Requirement 1: Custom Provider Data Model

**User Story:** As a developer, I want a clear data structure for custom providers, so that the system can store and manage user-defined provider configurations.

#### Acceptance Criteria

1. THE Canvas Application SHALL define a `CustomProviderConfig` interface with fields for `id`, `name`, `apiType`, `baseUrl`, `apiKey`, `models`, and `enabled`
2. THE `apiType` field SHALL support values including "OpenAI", "Anthropic", "Google", and "Custom"
3. THE `models` field SHALL be an array of model definitions with `id` and `label` properties
4. THE Settings Store SHALL include a `customProviders` array in the settings state
5. THE `id` field SHALL be auto-generated using a unique identifier (UUID or timestamp-based)
6. THE `enabled` field SHALL default to true when a provider is created

### Requirement 2: Provider Settings UI Location

**User Story:** As a user, I want to manage LLM providers from the Project Hub page, so that I can configure providers before working on projects.

#### Acceptance Criteria

1. THE Project Hub Page SHALL include a "Provider Settings" or "LLM Settings" button/link in the header or navigation area
2. WHEN the user clicks the settings button, THE Canvas Application SHALL open a provider settings dialog
3. THE provider settings dialog SHALL display both predefined and custom providers
4. THE provider settings UI SHALL be accessible before entering any project canvas
5. THE Canvas Application SHALL NOT display provider settings within the canvas workspace

### Requirement 3: Predefined Provider Configuration

**User Story:** As a user, I want to enable/disable and configure predefined providers, so that I can control which providers are available in my projects.

#### Acceptance Criteria

1. THE provider settings UI SHALL display all predefined providers from `llmProviders.json`
2. WHEN displaying predefined providers, THE UI SHALL show provider name, required API key status, and available models
3. THE UI SHALL include an enable/disable toggle for each predefined provider
4. THE UI SHALL include an API key input field for each predefined provider that requires an API key
5. THE predefined provider enabled status and API keys SHALL be stored in the Settings Store

### Requirement 4: Add Custom Provider UI

**User Story:** As a user, I want to add custom LLM providers through a dialog interface, so that I can use providers not included in the default configuration.

#### Acceptance Criteria

1. THE provider settings UI SHALL display an "Add Custom Provider" button
2. WHEN the user clicks "Add Custom Provider", THE Canvas Application SHALL open a custom provider dialog with input fields
3. THE dialog SHALL include input fields for provider name, API type (dropdown), API key, and base URL
4. THE dialog SHALL include an "Enable Provider" toggle that defaults to enabled
5. THE dialog SHALL include "Cancel" and "Confirm" buttons for form submission

### Requirement 5: Custom Provider Form Validation

**User Story:** As a user, I want the system to validate my custom provider configuration, so that I don't save invalid or incomplete configurations.

#### Acceptance Criteria

1. WHEN the user submits the custom provider form, THE Canvas Application SHALL validate that the provider name is not empty
2. THE Canvas Application SHALL validate that the base URL is a valid URL format
3. THE Canvas Application SHALL validate that the API key is not empty
4. IF validation fails, THE dialog SHALL display error messages next to the invalid fields
5. THE "Confirm" button SHALL be disabled until all required fields are valid

### Requirement 6: Save Custom Provider

**User Story:** As a user, I want my custom provider configurations to be saved, so that I can use them across sessions.

#### Acceptance Criteria

1. WHEN the user confirms the custom provider dialog, THE Settings Store SHALL add the configuration to the `customProviders` array
2. THE Settings Store SHALL persist custom providers to localStorage via Zustand persist middleware
3. THE Canvas Application SHALL generate a unique ID for each custom provider
4. THE provider settings dialog SHALL close the custom provider dialog after successful save
5. THE provider settings dialog SHALL display the newly added custom provider in the providers list

### Requirement 7: Display Custom Providers in Settings

**User Story:** As a user, I want to see my custom providers in the settings interface, so that I can manage them alongside predefined providers.

#### Acceptance Criteria

1. THE provider settings dialog SHALL display custom providers in a separate section labeled "Custom Providers"
2. WHEN displaying custom providers, THE dialog SHALL show the provider name, API type, and base URL
3. THE dialog SHALL display an "Edit" button next to each custom provider
4. THE dialog SHALL display a "Delete" button next to each custom provider
5. THE dialog SHALL visually distinguish custom providers from predefined providers

### Requirement 8: Edit Custom Provider

**User Story:** As a user, I want to edit my custom provider configurations, so that I can update API keys or endpoints when they change.

#### Acceptance Criteria

1. WHEN the user clicks "Edit" on a custom provider, THE Canvas Application SHALL open the custom provider dialog
2. THE dialog SHALL pre-fill all fields with the existing provider configuration
3. WHEN the user confirms changes, THE Settings Store SHALL update the provider configuration in the `customProviders` array
4. THE Canvas Application SHALL preserve the provider ID when updating
5. THE provider settings dialog SHALL reflect the updated configuration immediately

### Requirement 9: Delete Custom Provider

**User Story:** As a user, I want to delete custom providers I no longer need, so that I can keep my provider list clean.

#### Acceptance Criteria

1. WHEN the user clicks "Delete" on a custom provider, THE Canvas Application SHALL display a confirmation dialog
2. THE confirmation dialog SHALL show the provider name and warn about deletion
3. WHEN the user confirms deletion, THE Settings Store SHALL remove the provider from the `customProviders` array
4. IF the deleted provider was used in any chat nodes, THE Canvas Application SHALL handle the missing provider gracefully
5. THE provider settings dialog SHALL update the providers list immediately after deletion

### Requirement 10: Custom Provider Model Management

**User Story:** As a user, I want to define which models are available for my custom provider, so that I can select the appropriate model for each conversation.

#### Acceptance Criteria

1. THE custom provider dialog SHALL include a "Models" section with an "Add Model" button
2. WHEN the user clicks "Add Model", THE dialog SHALL display input fields for model ID and label
3. THE user SHALL be able to add multiple models to a custom provider
4. THE user SHALL be able to remove models from the list before saving
5. THE Canvas Application SHALL require at least one model to be defined for each custom provider

### Requirement 11: Chat Node Provider Selection

**User Story:** As a user, I want chat nodes to only show enabled providers, so that I can only select from properly configured providers.

#### Acceptance Criteria

1. WHEN a user opens the model selector in a chat node, THE Canvas Application SHALL display only enabled providers
2. THE model selector SHALL include models from both predefined and custom providers that are enabled
3. THE model selector SHALL NOT display models from disabled providers
4. THE model selector SHALL display a visual indicator for custom provider models (e.g., "Custom" badge)
5. IF no providers are enabled, THE model selector SHALL display a message prompting the user to configure providers in Project Hub

### Requirement 12: Integrate Custom Providers with Provider Registry

**User Story:** As a developer, I want custom providers to integrate seamlessly with the existing provider system, so that they work with all existing features.

#### Acceptance Criteria

1. THE LLM Client SHALL load custom providers from settings on initialization
2. THE LLM Client SHALL create provider adapters for custom providers using the OpenAI-compatible adapter
3. THE LLM Client SHALL only register enabled providers (both predefined and custom)
4. THE Canvas Application SHALL refresh the provider registry when provider settings change
5. THE LLM Client SHALL use the custom provider's base URL when making API calls

### Requirement 13: Custom Provider API Adapter

**User Story:** As a developer, I want a flexible adapter for custom providers, so that OpenAI-compatible APIs can be used without code changes.

#### Acceptance Criteria

1. THE Canvas Application SHALL implement a `CustomProviderAdapter` class that extends the OpenAI adapter
2. THE adapter SHALL accept a custom base URL in its configuration
3. THE adapter SHALL use the custom base URL for all API requests
4. THE adapter SHALL support the same request/response format as the OpenAI adapter
5. WHERE the custom API has minor differences, THE adapter SHALL provide configuration options to handle variations

### Requirement 14: Custom Provider Validation

**User Story:** As a user, I want to test my custom provider configuration before saving, so that I can verify it works correctly.

#### Acceptance Criteria

1. THE custom provider dialog SHALL include a "Test Connection" button
2. WHEN the user clicks "Test Connection", THE Canvas Application SHALL make a test API call using the provided configuration
3. IF the test succeeds, THE dialog SHALL display a success message with response details
4. IF the test fails, THE dialog SHALL display an error message with the failure reason
5. THE user SHALL be able to save the configuration regardless of test results

### Requirement 15: Custom Provider Security

**User Story:** As a user, I want my custom provider API keys to be stored securely, so that my credentials are protected.

#### Acceptance Criteria

1. THE Canvas Application SHALL store custom provider API keys in the same secure storage as predefined provider keys
2. THE provider settings dialog SHALL display API key fields as password inputs (masked)
3. THE Canvas Application SHALL not expose API keys in error messages or logs
4. THE Canvas Application SHALL only send API keys to the configured base URL
5. THE provider settings dialog SHALL warn users about storing API keys in browser storage

### Requirement 16: Custom Provider Error Handling

**User Story:** As a user, I want clear error messages when my custom provider fails, so that I can troubleshoot configuration issues.

#### Acceptance Criteria

1. WHEN a custom provider API call fails, THE Canvas Application SHALL display the provider name in the error message
2. THE error message SHALL include specific details about the failure (authentication, network, invalid response)
3. THE error display SHALL include a link to open provider settings from Project Hub
4. THE Canvas Application SHALL log custom provider errors with sufficient detail for debugging
5. WHERE the error is due to API incompatibility, THE error message SHALL suggest checking the API format

### Requirement 17: Custom Provider UI/UX Polish

**User Story:** As a user, I want the custom provider interface to be intuitive and consistent with the rest of the application, so that it's easy to use.

#### Acceptance Criteria

1. THE custom provider dialog SHALL follow the same design system as other dialogs in the application
2. THE dialog SHALL include helpful placeholder text in input fields
3. THE dialog SHALL display the API endpoint path hint (e.g., "/chat/completions") below the base URL field
4. THE provider settings dialog SHALL display providers with appropriate icons and visual hierarchy
5. THE Canvas Application SHALL provide tooltips explaining each field in the custom provider dialog

### Requirement 18: llmProviders.json Configuration

**User Story:** As a developer, I want to configure predefined providers in a JSON file, so that I can easily add or modify default providers.

#### Acceptance Criteria

1. THE Canvas Application SHALL read predefined providers from `src/config/llmProviders.json`
2. THE JSON configuration SHALL include fields for `id`, `name`, `requiresApiKey`, `enabled` (default), and `models`
3. THE `enabled` field SHALL indicate whether the provider is enabled by default
4. THE Canvas Application SHALL merge predefined providers with custom providers at runtime
5. THE predefined provider configuration SHALL be immutable by users (only enabled status and API keys can be changed)
