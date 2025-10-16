# Design Document

## Overview

Phase 5 的设计聚焦于为 Canvas MVP 建立完善的质量保证体系。本设计包含两个核心部分：

1. **单元测试套件** - 为关键业务逻辑提供自动化测试覆盖
2. **手动验证清单** - 提供系统性的端到端功能验证流程

设计目标是确保核心功能的稳定性，同时建立可持续的测试实践，为后续开发提供安全网。

## Architecture

### 测试架构层次

```
┌─────────────────────────────────────────┐
│         Manual Verification             │
│    (End-to-End User Workflows)          │
└─────────────────────────────────────────┘
                  ▲
                  │
┌─────────────────────────────────────────┐
│         Unit Tests Layer                │
│  ┌─────────────┬──────────────────────┐ │
│  │ Graph Utils │  State Management    │ │
│  │  - validate │  - ProjectSlice      │ │
│  │  - collect  │  - RuntimeSlice      │ │
│  └─────────────┴──────────────────────┘ │
└─────────────────────────────────────────┘
                  ▲
                  │
┌─────────────────────────────────────────┐
│      Test Infrastructure                │
│  - Vitest Configuration                 │
│  - Test Utilities & Mocks               │
│  - Coverage Reporting                   │
└─────────────────────────────────────────┘
```

### 测试范围划分


**Phase 5 测试范围：**
- ✅ 图算法逻辑（validateNoCycle, collectUpstreamContext）
- ✅ 状态管理核心方法（deriveSnapshot, hydrateProject）
- ✅ 运行时调度逻辑（RuntimeSlice）
- ❌ UI 组件测试（留待后续阶段）
- ❌ 集成测试（留待后续阶段）

## Components and Interfaces

### 1. 测试基础设施

#### Vitest 配置

```typescript
// vitest.config.ts
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
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### 测试工具函数

```typescript
// src/test/testUtils.ts
export function createMockNode(overrides?: Partial<Node<ChatNodeData>>): Node<ChatNodeData>
export function createMockEdge(overrides?: Partial<Edge>): Edge
export function createMockProjectSnapshot(overrides?: Partial<ProjectSnapshot>): ProjectSnapshot
```


### 2. 图算法测试设计

#### validateNoCycle 测试用例

```typescript
describe('validateNoCycle', () => {
  // 基础场景
  test('空图返回 true')
  test('单节点无边返回 true')
  test('简单链式图返回 true')
  
  // 循环检测
  test('自环返回 false')
  test('两节点循环返回 false')
  test('三节点循环返回 false')
  test('复杂图中的循环返回 false')
  
  // 边界情况
  test('多个独立子图返回 true')
  test('菱形结构（非循环）返回 true')
})
```

#### collectUpstreamContext 测试用例

```typescript
describe('collectUpstreamContext', () => {
  // 基础场景
  test('无上游节点返回空上下文')
  test('单个上游节点返回其消息')
  test('多个上游节点按拓扑序返回')
  
  // 复杂图结构
  test('深层嵌套上游节点')
  test('多路径汇聚到目标节点')
  test('菱形依赖结构')
  
  // 消息处理
  test('消息去重（相同内容和时间戳）')
  test('消息按时间戳排序')
  test('包含错误节点时标记 hasErrors')
  
  // 边界情况
  test('上游节点无消息')
  test('空消息数组')
  test('极大消息量（性能测试）')
})
```

### 3. 状态管理测试设计

#### ProjectSlice 测试用例

```typescript
describe('ProjectSlice', () => {
  describe('deriveSnapshot', () => {
    test('从空状态生成快照')
    test('包含节点和边的快照')
    test('保留视口状态')
    test('包含设置信息')
    test('生成唯一项目 ID')
    test('更新时间戳')
  })
  
  describe('hydrateProject', () => {
    test('还原节点和边')
    test('还原视口位置')
    test('还原设置')
    test('清空选择状态')
    test('还原历史记录')
    test('设置当前项目 ID')
  })
  
  describe('newProject', () => {
    test('创建空项目')
    test('使用自定义标题')
    test('生成唯一 ID')
    test('初始化默认视口')
  })
})
```


#### RuntimeSlice 测试用例

```typescript
describe('RuntimeSlice', () => {
  describe('enqueueNode', () => {
    test('添加节点到队列')
    test('避免重复添加')
    test('保持队列顺序')
  })
  
  describe('dequeueNode', () => {
    test('从队列头部取出节点')
    test('更新 currentExecution')
    test('空队列返回 null')
  })
  
  describe('startExecution', () => {
    test('设置 isRunning 为 true')
    test('指定节点时加入队列')
    test('设置 currentExecution')
  })
  
  describe('stopExecution', () => {
    test('停止所有执行')
    test('停止特定节点')
    test('从队列移除节点')
    test('更新 currentExecution')
  })
  
  describe('executionResults', () => {
    test('设置执行结果')
    test('获取执行结果')
    test('清空所有结果')
  })
})
```

### 4. 测试数据模型

#### Mock 数据结构

```typescript
// src/test/mockData.ts
export const mockNodes = {
  empty: createMockNode({ id: 'node-1', data: { messages: [] } }),
  withMessages: createMockNode({
    id: 'node-2',
    data: {
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello', createdAt: 1000 },
        { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: 2000 },
      ],
    },
  }),
  withError: createMockNode({
    id: 'node-3',
    data: { status: 'error', error: { code: 'LLM_ERROR', message: 'Failed' } },
  }),
}

export const mockEdges = {
  simple: createMockEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' }),
  cycle: [
    createMockEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' }),
    createMockEdge({ id: 'edge-2', source: 'node-2', target: 'node-1' }),
  ],
}
```

## Data Models

### 测试覆盖率目标

```typescript
interface CoverageTarget {
  statements: number  // 80%
  branches: number    // 75%
  functions: number   // 80%
  lines: number       // 80%
}
```

### 测试文件组织

```
src/
  algorithms/
    collectUpstreamContext.ts
    collectUpstreamContext.test.ts  ← 新增
  state/
    createProjectSlice.ts
    createProjectSlice.test.ts      ← 新增
    createRuntimeSlice.ts
    createRuntimeSlice.test.ts      ← 新增
  test/
    setup.ts                         ← 新增
    testUtils.ts                     ← 新增
    mockData.ts                      ← 新增
```


## Error Handling

### 测试失败处理策略

1. **清晰的错误信息**
   - 使用描述性的测试名称
   - 提供详细的断言失败信息
   - 包含实际值和期望值的对比

2. **测试隔离**
   - 每个测试独立运行
   - 使用 beforeEach/afterEach 清理状态
   - 避免测试间的依赖

3. **Mock 失败场景**
   - 模拟网络错误
   - 模拟存储失败
   - 模拟无效输入

### 手动验证清单错误记录

```markdown
## 问题记录模板

### 问题 #1
- **测试步骤**: [具体步骤]
- **预期结果**: [应该发生什么]
- **实际结果**: [实际发生了什么]
- **严重程度**: Critical / High / Medium / Low
- **截图**: [如果适用]
- **复现步骤**: [详细步骤]
```

## Testing Strategy

### 单元测试策略

#### 1. 测试优先级

**P0 - 必须测试**
- validateNoCycle（循环检测）
- collectUpstreamContext（上下文收集）
- deriveSnapshot（快照生成）
- hydrateProject（快照还原）

**P1 - 应该测试**
- RuntimeSlice 队列管理
- 边界条件和错误场景

**P2 - 可选测试**
- 性能测试
- 压力测试

#### 2. 测试编写原则

- **AAA 模式**: Arrange（准备）→ Act（执行）→ Assert（断言）
- **单一职责**: 每个测试只验证一个行为
- **可读性**: 测试名称清晰描述测试内容
- **可维护性**: 使用测试工具函数减少重复代码

#### 3. Mock 策略

```typescript
// 最小化 mock，优先使用真实实现
// 仅在以下情况使用 mock：
// - 外部依赖（API、存储）
// - 时间相关逻辑（Date.now）
// - 随机数生成（crypto.randomUUID）

// 示例
vi.mock('@/services/unifiedStorage', () => ({
  unifiedStorageService: {
    saveProject: vi.fn(),
    loadProject: vi.fn(),
  },
}))
```


### 手动验证策略

#### 验证清单结构

```markdown
# Milestone A MVP 验证清单

## 环境准备
- [ ] 开发环境启动正常
- [ ] 浏览器 DevTools 无错误
- [ ] 所有依赖安装完成

## 核心流程验证

### 1. 项目管理
- [ ] 创建新项目
- [ ] 项目标题可编辑
- [ ] 保存项目
- [ ] 刷新页面后项目恢复
- [ ] 打开已有项目
- [ ] 删除项目

### 2. 节点操作
- [ ] 创建新节点
- [ ] 编辑节点标题
- [ ] 选择模型
- [ ] 输入提示词
- [ ] 拖动节点位置
- [ ] 复制节点
- [ ] 删除节点

### 3. 连线与上下文
- [ ] 连接两个节点
- [ ] 验证循环检测（尝试创建循环）
- [ ] 删除连线
- [ ] 多个上游节点连接

### 4. 运行与执行
- [ ] 运行单个节点
- [ ] 查看运行结果
- [ ] 停止运行中的节点
- [ ] 并行运行多个节点
- [ ] 错误处理（无效 API Key）
- [ ] 重试失败的节点

### 5. 保存与恢复
- [ ] 手动保存
- [ ] 自动保存指示器
- [ ] 导出项目 JSON
- [ ] 导入项目 JSON
- [ ] 完整状态恢复

## 边界条件测试
- [ ] 空项目保存
- [ ] 大量节点（50+）性能
- [ ] 长消息内容显示
- [ ] 网络断开时的行为
- [ ] 无效输入处理

## 可访问性检查
- [ ] 键盘导航
- [ ] 焦点管理
- [ ] ARIA 标签
- [ ] 对比度检查

## 浏览器兼容性
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
```

#### 验证执行流程

1. **准备阶段**
   - 清空浏览器缓存和存储
   - 准备测试数据（API Key、测试提示词）
   - 记录环境信息（浏览器版本、操作系统）

2. **执行阶段**
   - 按清单顺序逐项验证
   - 记录每项结果（通过/失败）
   - 截图关键步骤
   - 记录发现的问题

3. **总结阶段**
   - 统计通过率
   - 分类问题严重程度
   - 提出改进建议
   - 更新文档

## Implementation Notes

### 测试环境配置

1. **安装依赖**
```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

2. **配置文件**
- `vitest.config.ts` - Vitest 主配置
- `src/test/setup.ts` - 测试环境初始化
- `.gitignore` - 忽略覆盖率报告

3. **package.json 脚本**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 持续集成考虑

- 测试应在 CI 环境中自动运行
- 覆盖率报告应上传到 CI 平台
- 测试失败应阻止合并
- 性能测试可作为可选步骤

### 文档维护

- 测试文档应与代码同步更新
- 新功能必须包含测试
- 手动验证清单应定期审查
- 测试覆盖率目标应定期评估

## Success Criteria

### 单元测试成功标准

- ✅ 所有测试通过（`pnpm test` 无失败）
- ✅ 代码覆盖率达到 80%（语句、函数、行）
- ✅ 分支覆盖率达到 75%
- ✅ 测试运行时间 < 10 秒
- ✅ 无测试警告或弃用提示

### 手动验证成功标准

- ✅ 核心流程 100% 通过
- ✅ 边界条件测试 90% 通过
- ✅ 无 Critical 或 High 严重程度问题
- ✅ 可访问性检查通过
- ✅ 至少两个浏览器验证通过

### 交付物清单

- ✅ `vitest.config.ts` 配置文件
- ✅ `src/test/setup.ts` 测试环境设置
- ✅ `src/test/testUtils.ts` 测试工具函数
- ✅ `src/test/mockData.ts` Mock 数据
- ✅ `src/algorithms/collectUpstreamContext.test.ts`
- ✅ `src/state/createProjectSlice.test.ts`
- ✅ `src/state/createRuntimeSlice.test.ts`
- ✅ `docs/task/milestone-a-checklist.md` 验证清单
- ✅ 测试覆盖率报告
