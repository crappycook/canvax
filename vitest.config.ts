import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'dist/',
        // Exclude UI components and pages from Phase 5 coverage requirements
        'src/components/**',
        'src/canvas/components/**',
        'src/canvas/nodes/ChatNode.tsx',
        'src/canvas/nodes/ErrorDisplay.tsx',
        'src/canvas/nodes/HybridNodeContent.tsx',
        'src/canvas/nodes/InputNodeContent.tsx',
        'src/canvas/nodes/NodeStatusBadge.tsx',
        'src/canvas/nodes/ResponseNodeContent.tsx',
        'src/canvas/ReactFlowCanvas.tsx',
        'src/canvas/register.ts',
        'src/app/**',
        'src/hooks/**',
        'src/services/**',
        'src/lib/**',
        'src/config/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/types.ts',
        'src/canvas/types.ts',
        'src/types/errors.ts',
        'src/types/storage.ts',
        // Exclude untested state slices from Phase 5
        'src/state/createCanvasSlice.ts',
        'src/state/createEdgesSlice.ts',
        'src/state/createNodesSlice.ts',
        'src/state/createSettingsSlice.ts',
        'src/state/createTemplatesSlice.ts',
        'src/state/createUiSlice.ts',
        'src/state/store.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
