# Canvax - Canvas-based LLM Workflow Tool

A visual canvas application for building and executing LLM workflows with node-based interactions.

## Development

### Running the Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Testing

This project uses Vitest for unit testing with comprehensive coverage of core business logic.

### Test Commands

- `pnpm test` - Run tests in watch mode (interactive development)
- `pnpm test:run` - Run all tests once (CI/CD)
- `pnpm test:ui` - Run tests with interactive UI interface
- `pnpm test:coverage` - Run tests and generate coverage report

### Test Structure

Test files are co-located with source files using the `.test.ts` or `.test.tsx` extension:

```
src/
  algorithms/
    collectUpstreamContext.ts
    collectUpstreamContext.test.ts
  state/
    createProjectSlice.ts
    createProjectSlice.test.ts
  test/
    setup.ts          # Test environment configuration
    testUtils.ts      # Reusable test utilities
    mockData.ts       # Mock data generators
```

### Test Coverage

Current test coverage (as of Phase 5 completion):

| Metric    | Coverage | Target |
|-----------|----------|--------|
| Statements| 87.08%   | 80%    |
| Branches  | 91.52%   | 75%    |
| Functions | 85.71%   | 80%    |
| Lines     | 87.08%   | 80%    |

**Covered Components:**
- ✅ Graph algorithms (`validateNoCycle`, `collectUpstreamContext`)
- ✅ State management (`ProjectSlice`, `RuntimeSlice`)
- ✅ Node type utilities
- ✅ Test utilities and setup

### Writing Tests

Follow these guidelines when adding tests:

1. **Co-locate tests** - Place test files next to the source files they test
2. **Use test utilities** - Leverage `createMockNode`, `createMockEdge`, etc. from `src/test/testUtils.ts`
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Descriptive names** - Test names should clearly describe what is being tested
5. **Focus on behavior** - Test what the code does, not how it does it

Example:

```typescript
import { describe, test, expect } from 'vitest'
import { createMockNode } from '@/test/testUtils'
import { myFunction } from './myModule'

describe('myFunction', () => {
  test('should handle empty input', () => {
    // Arrange
    const input = []
    
    // Act
    const result = myFunction(input)
    
    // Assert
    expect(result).toEqual([])
  })
})
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
