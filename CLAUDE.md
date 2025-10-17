# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build production bundle (TypeScript compilation + Vite build)
- `pnpm lint` - Run ESLint on all files
- `pnpm preview` - Preview production build locally

**Testing Commands**:
- `pnpm test` - Run tests in watch mode (interactive development)
- `pnpm test:run` - Run all tests once (CI/CD)
- `pnpm test:ui` - Run tests with interactive UI interface
- `pnpm test:coverage` - Run tests and generate coverage report

**Package Manager**: This project uses pnpm as the primary package manager

**TypeScript Configuration**: Uses TypeScript 5.8 with strict configuration including:
- Strict null checks and unused variable detection
- ES2022 target with DOM library support
- Bundle mode with `@` path alias for `src/` directory
- Modern JSX transform for React 19

## Architecture Overview

This is a React + TypeScript + Vite application implementing a Flowith-style canvas-based AI interaction tool. The application uses React Flow (@xyflow/react) for canvas/flow functionality with advanced AI workflow orchestration.

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Tailwind CSS 4 + shadcn/ui components
- **Flow/Canvas**: @xyflow/react (React Flow)
- **State Management**: Zustand with persistence and devtools
- **Routing**: React Router DOM
- **LLM Integration**: Custom LLM client with OpenAI API support
- **Styling**: Tailwind CSS with `cn()` utility for class composition
- **Icons**: Lucide React

### Project Structure
- `src/` - Main source code
  - `app/` - Application-level components and routing
    - `router.tsx` - React Router configuration
    - `AppShell.tsx` - Main application layout
    - `pages/` - Page components (CanvasPage, ProjectHubPage, SettingsModal)
  - `state/` - Zustand store slices (project, canvas, nodes, edges, runtime, settings, UI, templates)
  - `canvas/` - Canvas-specific components
    - `ReactFlowCanvas.tsx` - Main canvas with React Flow
    - `components/` - Canvas-specific components (TopBar)
    - `nodes/` - Node type implementations (ChatNode, InputNodeContent, ResponseNodeContent, ErrorDisplay)
  - `components/` - Reusable UI components
    - `ui/` - Base UI components (Button, TextArea, DropdownMenu)
    - `custom-nodes.tsx` - Custom node implementations
    - `base-node.tsx` - Base node component structure
    - ModelSelector, PromptEditor, MessageHistory, MarkdownRenderer
  - `services/` - External service integrations
    - `llmClient.ts` - OpenAI API client with error handling
  - `hooks/` - Custom React hooks
    - `useExecutionManager.ts` - AI workflow execution orchestration
    - `useDebounce.ts` - Performance optimization
  - `algorithms/` - Business logic
    - `collectUpstreamContext.ts` - Context collection for AI workflows
  - `types.ts` - TypeScript type definitions
  - `types/errors.ts` - Error handling utilities

### State Management Architecture

The application uses Zustand with a modular slice pattern:
- **ProjectSlice**: Project lifecycle and snapshots
- **CanvasSlice**: Canvas viewport and interactions
- **NodesSlice**: Node management with CRUD operations and relationships
- **EdgesSlice**: Edge management and connections
- **RuntimeSlice**: Execution state and queue management
- **SettingsSlice**: User preferences and API keys
- **UiSlice**: UI state and modals
- **TemplatesSlice**: Node templates and presets

### Core Workflow Patterns

**AI Node Execution Flow**:
1. Input nodes collect user prompts
2. Execution manager collects upstream context
3. LLM client generates responses via OpenAI API
4. Response nodes display AI outputs
5. Auto-creation of response nodes for input nodes

**Context Collection**: The `collectUpstreamContext` algorithm builds complete message arrays from connected nodes, ensuring proper conversation flow and context preservation.

### Component Patterns
- Uses `forwardRef` for all base components
- Implements compound component pattern for node structure
- Follows shadcn/ui conventions for styling and structure
- Uses `cn()` utility for Tailwind class composition
- Error boundaries and graceful error handling throughout

### Development Guidelines
- Follow Cursor rules in `.cursor/rules/` directory for specialized tasks
- Use TypeScript with strict typing and comprehensive interfaces
- Implement accessibility features (ARIA labels, keyboard navigation)
- Follow mobile-first responsive design
- Use modern Tailwind CSS syntax (e.g., `size-4` instead of `h-4 w-4`)
- Maintain separation of concerns between state, UI, and services
- Test files are co-located with source files using `.test.ts` or `.test.tsx` extensions
- Use test utilities from `src/test/testUtils.ts` for consistent testing patterns

### Key Implementation Features
- **Multi-page routing**: Canvas, Project Hub, and Settings
- **Persistent state**: Project snapshots with localStorage
- **Real-time execution**: Queue-based AI workflow execution
- **Error handling**: Comprehensive error types and user-friendly error display
- **Context-aware AI**: Intelligent context collection from connected nodes
- **Responsive design**: Mobile-friendly canvas interface

### Testing Framework
- **Vitest**: Test runner with watch mode and coverage
- **Testing Libraries**: @testing-library/react and @testing-library/jest-dom
- **Test Environment**: happy-dom/jsdom for DOM testing
- **Coverage**: v8 coverage with comprehensive reporting
- Test utilities and mock data generators in `src/test/`

### AI/LLM Integration
- OpenAI API integration with configurable models
- Support for temperature and max token settings
- Streaming response support
- API key management with secure storage
- Multi-model support (GPT-4, GPT-3.5, etc.)

### Cursor Rules Integration
- **typescript-pro**: Advanced typing and TypeScript architecture
- **frontend-developer**: React components and responsive design (proactively applied)
- **shadcn-ui-expert**: shadcn/ui component expertise
- **ui-ux-designer**: Interface design and user experience
- **prd-writer**: Product requirements documentation