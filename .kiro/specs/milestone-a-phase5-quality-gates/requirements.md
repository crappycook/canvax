# Requirements Document

## Introduction

Phase 5 是 Milestone A 的质量保证阶段，旨在通过单元测试和手动验证确保 Canvas MVP 的核心功能稳定可靠。本阶段将为关键业务逻辑编写单元测试，并创建完整的手动验证清单，确保从创建节点到保存项目的完整用户流程正常工作。

## Requirements

### Requirement 1: 单元测试覆盖核心逻辑

**User Story:** 作为开发者，我希望关键业务逻辑有单元测试覆盖，以便在后续开发中及时发现回归问题。

#### Acceptance Criteria

1. WHEN 项目配置了 Vitest 测试环境 THEN 系统 SHALL 能够通过 `pnpm test` 命令运行所有测试
2. WHEN 测试 `validateNoCycle` 函数 THEN 系统 SHALL 正确检测图中的循环依赖并返回预期结果
3. WHEN 测试 `collectUpstreamContext` 函数 THEN 系统 SHALL 正确收集上游节点的消息上下文，包括拓扑遍历和去重逻辑
4. WHEN 测试 `RuntimeSlice.runNext` 方法 THEN 系统 SHALL 正确调度任务队列，尊重并发限制
5. WHEN 测试 `ProjectSlice.deriveSnapshot` 方法 THEN 系统 SHALL 正确从各个切片组合生成项目快照
6. WHEN 测试 `ProjectSlice.hydrateProject` 方法 THEN 系统 SHALL 正确将项目快照还原到各个切片状态
7. WHEN 所有测试运行 THEN 系统 SHALL 在 CI 和本地环境都能通过

### Requirement 2: MVP 手动验证清单

**User Story:** 作为 QA 测试人员，我希望有一份完整的手动验证清单，以便系统性地验证 MVP 的核心功能。

#### Acceptance Criteria

1. WHEN 创建验证清单文档 THEN 系统 SHALL 包含「创建→连线→运行→停止→保存→重开」的完整流程
2. WHEN 执行验证清单 THEN 每个测试项 SHALL 有明确的操作步骤和预期结果
3. WHEN 发现问题 THEN 清单 SHALL 提供记录问题的格式和位置
4. WHEN 验证清单完成 THEN 文档 SHALL 存放在 `docs/task/milestone-a-checklist.md`
5. WHEN 验证清单包含测试场景 THEN 系统 SHALL 覆盖正常流程、错误处理、边界条件等关键场景

### Requirement 3: 测试基础设施配置

**User Story:** 作为开发者，我希望测试环境配置完善，以便能够高效地编写和运行测试。

#### Acceptance Criteria

1. WHEN 配置 Vitest THEN 系统 SHALL 支持 TypeScript 和 React 组件测试
2. WHEN 配置测试脚本 THEN package.json SHALL 包含 `test`、`test:watch` 和 `test:coverage` 命令
3. WHEN 运行测试 THEN 系统 SHALL 正确解析路径别名（如 `@/` 映射到 `src/`）
4. WHEN 生成测试覆盖率报告 THEN 系统 SHALL 输出可读的覆盖率统计信息
5. IF 测试失败 THEN 系统 SHALL 提供清晰的错误信息和堆栈跟踪

### Requirement 4: 关键算法测试用例

**User Story:** 作为开发者，我希望图算法和状态管理逻辑有充分的测试用例，以便确保边界情况得到正确处理。

#### Acceptance Criteria

1. WHEN 测试循环检测 THEN 系统 SHALL 覆盖自环、简单循环、复杂循环等场景
2. WHEN 测试上下文收集 THEN 系统 SHALL 覆盖单个上游、多个上游、深层嵌套、消息限制等场景
3. WHEN 测试任务调度 THEN 系统 SHALL 覆盖单任务、并发任务、队列满载、任务取消等场景
4. WHEN 测试项目快照 THEN 系统 SHALL 覆盖空项目、复杂图结构、历史记录等场景
5. WHEN 测试边界条件 THEN 系统 SHALL 包含空输入、null 值、极大数据量等测试

### Requirement 5: 测试文档和维护性

**User Story:** 作为团队成员，我希望测试代码易于理解和维护，以便新成员能够快速上手。

#### Acceptance Criteria

1. WHEN 编写测试 THEN 每个测试 SHALL 有清晰的描述说明测试目的
2. WHEN 组织测试文件 THEN 测试文件 SHALL 与源代码文件对应（如 `graph.ts` 对应 `graph.test.ts`）
3. WHEN 使用测试工具函数 THEN 系统 SHALL 提供可复用的 mock 数据和辅助函数
4. WHEN 测试失败 THEN 错误信息 SHALL 明确指出失败原因和位置
5. WHEN 添加新功能 THEN 开发者 SHALL 同步添加相应的单元测试
