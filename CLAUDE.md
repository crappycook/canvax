# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build production bundle (TypeScript compilation + Vite build)
- `pnpm lint` - Run ESLint on all files
- `pnpm preview` - Preview production build locally

**Package Manager**: This project uses pnpm as the primary package manager

**TypeScript Configuration**: Uses TypeScript 5.8 with strict configuration including:
- Strict null checks and unused variable detection
- ES2022 target with DOM library support
- Bundle mode with `@` path alias for `src/` directory
- Modern JSX transform for React 19

## Architecture Overview

This is a React + TypeScript + Vite application implementing a Flowith-style canvas-based AI interaction tool. The application uses React Flow (@xyflow/react) for canvas/flow functionality.

### Key Technologies
- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Tailwind CSS 4 + shadcn/ui components
- **Flow/Canvas**: @xyflow/react (React Flow)
- **Styling**: Tailwind CSS with `cn()` utility for class composition
- **Icons**: Lucide React

### Project Structure
- `src/` - Main source code
  - `components/` - React components
    - `ui/` - Base UI components (Button, etc.)
    - `custom-nodes.tsx` - Custom node implementations
    - `Canvax.tsx` - Main canvas component
    - `demo.tsx` - Demo node content
    - `node-types.ts` - Node type definitions
    - `base-node.tsx` - Base node component structure
  - `lib/utils.ts` - Utility functions (cn for class merging)
  - `App.tsx` - Root application component
  - `main.tsx` - Application entry point

### Core Concepts
- **Nodes**: Custom nodes built with BaseNode components
- **Edges**: Connections between nodes for flow
- **Canvas**: Infinite canvas for node arrangement
- **State Management**: Currently uses React Flow's built-in state hooks

### Component Patterns
- Uses `forwardRef` for all base components
- Implements compound component pattern for node structure
- Follows shadcn/ui conventions for styling and structure
- Uses `cn()` utility from `lib/utils.ts` for Tailwind class composition

### Development Guidelines
- Follow Cursor rules in `.cursor/rules/` directory
- Use TypeScript with strict typing
- Implement accessibility features (ARIA labels, keyboard navigation)
- Follow mobile-first responsive design
- Use modern Tailwind CSS syntax (e.g., `size-4` instead of `h-4 w-4`)

### Current Implementation Status
- Basic canvas with React Flow integration using `useNodesState` and `useEdgesState`
- Custom node components with compound component architecture (BaseNode, BaseNodeHeader, BaseNodeContent, BaseNodeFooter)
- React Flow handles (connection points) integrated into custom nodes
- Demo nodes showing full component structure with example content
- No LLM integration or external data persistence yet

### Planned Features (from PRD)
- Multi-model AI node connections
- Local storage for projects
- API key management
- Markdown rendering
- Export/import functionality
- Hotkey support
- Accessibility compliance