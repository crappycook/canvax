# Implementation Plan

- [x] 1. Extend type definitions for custom providers
  - Add `CustomProviderConfig` interface to `src/services/llm/types.ts`
  - Add `CustomModelConfig` interface for custom provider models
  - Add `PredefinedProviderState` interface for predefined provider configuration
  - Extend `LLMProviderDefinition` interface with `enabled`, `isCustom`, and `baseUrl` optional fields
  - Extend `FlattenedModelDefinition` interface with `isCustom` optional field
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Update llmProviders.json configuration
  - Add `enabled` field to all predefined providers in `src/config/llmProviders.json`
  - Set default `enabled` value to `false` for all providers
  - Verify JSON structure matches updated `LLMProviderDefinition` interface
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 3. Extend Settings Store with provider management
- [x] 3.1 Add provider state and methods
  - Add `predefinedProviders: PredefinedProviderState` to settings state in `src/state/createSettingsSlice.ts`
  - Add `customProviders: CustomProviderConfig[]` to settings state
  - Implement `setPredefinedProviderEnabled` method
  - Implement `setPredefinedProviderApiKey` method
  - Implement `removePredefinedProviderApiKey` method
  - _Requirements: 1.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.2 Implement custom provider methods
  - Implement `addCustomProvider` method with unique ID generation
  - Implement `updateCustomProvider` method with timestamp updates
  - Implement `removeCustomProvider` method
  - Implement `getCustomProvider` helper method
  - Implement `getEnabledProviders` helper method
  - _Requirements: 6.1, 6.2, 6.3, 8.3, 8.4, 9.3_

- [x] 3.3 Implement unique ID generation utility
  - Create `generateUniqueId()` function using timestamp and random string
  - Use format: `custom-${timestamp}-${random}`
  - _Requirements: 1.5, 6.3_

- [x] 4. Update provider configuration module
  - Modify `src/config/llmProviders.ts` to support enabled filtering
  - Create `getEnabledProviders()` function to filter by enabled status
  - Update function to merge predefined and custom providers
  - Update function to apply predefined provider state (enabled, apiKey)
  - Update `llmProviders` export to use `getEnabledProviders()`
  - Update `llmModels` export to include only enabled provider models with `isCustom` flag
  - Update `findProviderById`, `findProviderByModel`, `findModelById` to work with enabled providers
  - Create `refreshProviders()` function for dynamic updates
  - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 12.4, 18.4_

- [x] 5. Implement Custom Provider Adapter
  - Create `src/services/llm/providers/custom.ts` with `CustomProviderAdapter` class
  - Extend from `BaseProviderAdapter` or reuse OpenAI adapter logic
  - Accept `providerId` and `baseUrl` in constructor
  - Implement `createClient` method with custom base URL using OpenAI SDK
  - Implement `mapRequest` method (reuse OpenAI format)
  - Implement `mapResponse` method (reuse OpenAI format)
  - Implement `mapError` method with custom provider context
  - Implement `generate` method with error handling
  - Implement `streamGenerate` method with streaming support
  - Implement `validateApiKey` method for connection testing
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3_

- [x] 6. Update LLM Client to support enabled providers only
  - Modify `registerProviders` logic in `src/services/llm/client.ts` to use `getEnabledProviders()`
  - Create `CustomProviderAdapter` instances for enabled custom providers
  - Map custom provider models to provider IDs in `modelToProvider` map
  - Implement `refreshProviders` method to reload enabled providers
  - Subscribe to settings store changes to trigger provider refresh
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 7. Create Provider Settings Dialog component
- [x] 7.1 Create main provider settings dialog
  - Create `src/app/pages/ProviderSettingsDialog.tsx`
  - Set up dialog with header, content sections, and footer
  - Add "Predefined Providers" section
  - Add "Custom Providers" section with "Add Custom Provider" button
  - Add state management for showing custom provider dialog
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1, 7.1_

- [x] 7.2 Create Predefined Provider Card component
  - Create `PredefinedProviderCard` component (inline or separate file)
  - Display provider name and model count
  - Add enable/disable toggle switch
  - Add API key input field (password type)
  - Disable API key input when provider is disabled
  - Connect to Settings Store methods
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7.3 Create Custom Provider Card component
  - Create `CustomProviderCard` component (inline or separate file)
  - Display provider name, API type, model count, and base URL
  - Add "Custom" badge to distinguish from predefined providers
  - Add "Disabled" badge for disabled providers
  - Add "Edit" button that opens custom provider dialog
  - Add "Delete" button that triggers deletion flow
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Create Custom Provider Dialog component
- [ ] 8.1 Create dialog component structure
  - Create `src/components/CustomProviderDialog.tsx`
  - Set up dialog with header, content, and footer sections
  - Add form state management for provider configuration
  - Add validation state for form errors
  - Support both add and edit modes based on `provider` prop
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 8.2 Implement form fields
  - Add provider name input field with validation
  - Add API type dropdown (OpenAI, Anthropic, Google, Custom)
  - Add API key password input field with validation
  - Add base URL input field with URL validation and hint text
  - Add enable provider toggle switch
  - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3_

- [ ] 8.3 Implement models management section
  - Create `ModelsManager` component for adding/removing models
  - Display list of existing models with remove buttons
  - Add input fields for new model ID and label
  - Add "Add Model" button to append new model to list
  - Validate at least one model is defined
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 8.4 Implement form validation
  - Validate provider name is not empty and unique
  - Validate base URL is valid URL format
  - Validate API key is not empty
  - Validate at least one model is defined
  - Display inline error messages for invalid fields
  - Disable confirm button when form is invalid
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.5 Implement connection testing
  - Add "Test Connection" button
  - Implement `handleTestConnection` function
  - Call custom provider adapter's `validateApiKey` method
  - Display loading state during test
  - Display success/error result with badge or message
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 8.6 Implement save and cancel handlers
  - Implement `handleSave` function to call `onSave` callback
  - Implement `handleCancel` function to close dialog
  - Support both add and edit modes
  - Clear form state on close
  - _Requirements: 6.1, 6.2, 6.4, 8.3, 8.4_

- [ ] 9. Integrate Provider Settings into Project Hub Page
  - Add "Provider Settings" button to `src/app/pages/ProjectHubPage.tsx` header
  - Add state for showing/hiding provider settings dialog
  - Import and render `ProviderSettingsDialog` component
  - Position button prominently in the page header or navigation
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 10. Implement delete custom provider flow
  - Handle "Delete" button click in Custom Provider Card
  - Show confirmation dialog with provider name
  - Call `removeCustomProvider` on confirmation
  - Handle gracefully if provider was used in chat nodes
  - Refresh provider list after deletion
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Update chat node model selector
  - Modify model selector in chat nodes to use `getEnabledProviders()`
  - Display only models from enabled providers
  - Add visual indicator (badge) for custom provider models
  - Show message if no providers are enabled with link to settings
  - Group models by provider if needed
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12. Implement provider error handling
  - Extend error handling to include provider context
  - Display provider name in error messages for custom providers
  - Add link to open provider settings from error messages
  - Provide specific error messages for common issues (connection, auth, invalid response)
  - Handle missing/disabled provider gracefully in chat nodes
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 13. Add security warnings and validations
  - Display warning about storing API keys in browser storage
  - Recommend HTTPS for custom provider base URLs
  - Warn users if base URL is not HTTPS
  - Sanitize and validate base URLs to prevent injection
  - Never display full API keys in UI or error messages
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14. Implement UI/UX polish
  - Add tooltips explaining each field in custom provider dialog
  - Add placeholder text for all input fields
  - Display API endpoint path hint below base URL field (e.g., "/chat/completions")
  - Use consistent design system (colors, spacing, typography)
  - Add appropriate icons for providers and actions
  - Ensure responsive layout for dialogs and cards
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 15. Handle provider refresh on settings changes
  - Subscribe to settings store changes in LLM Client
  - Call `refreshProviders` when predefined or custom providers change
  - Ensure model selector updates when providers change
  - Test that changes persist across page reloads
  - _Requirements: 12.4_

- [ ] 16. Update persistence configuration
  - Verify `predefinedProviders` and `customProviders` are included in Zustand persist partialize
  - Test that provider configurations persist to localStorage
  - Test that providers load correctly on app initialization
  - _Requirements: 6.2_

- [ ]* 17. Write unit tests for provider functionality
  - Test `setPredefinedProviderEnabled`, `setPredefinedProviderApiKey` store methods
  - Test `addCustomProvider`, `updateCustomProvider`, `removeCustomProvider` store methods
  - Test unique ID generation
  - Test `getEnabledProviders` filtering logic
  - Test `CustomProviderAdapter` request/response mapping
  - Test form validation logic in dialogs
  - Test provider refresh logic in LLM Client
  - _Requirements: All requirements_

- [ ]* 18. Write integration tests
  - Test complete flow: configure provider in Project Hub → use in chat node
  - Test enabling/disabling predefined providers
  - Test adding custom provider → selecting model → executing node
  - Test editing custom provider and verifying changes
  - Test deleting custom provider and handling in chat nodes
  - Test connection testing with valid and invalid configurations
  - Test error handling for disabled/missing providers
  - Test persistence across page reloads
  - _Requirements: All requirements_

- [ ] 19. Documentation and polish
  - Add JSDoc comments to provider types and methods
  - Document provider configuration format
  - Add user guide for configuring providers in Project Hub
  - Document supported API formats and compatibility
  - Add troubleshooting guide for common provider issues
  - Document the difference between predefined and custom providers
  - _Requirements: All requirements_
