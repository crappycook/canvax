# Implementation Plan

- [x] 1. 配置测试基础设施
  - 安装 Vitest 和相关测试依赖（vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/jest-dom）
  - 创建 `vitest.config.ts` 配置文件，包含 jsdom 环境、覆盖率设置、路径别名
  - 在 `package.json` 添加测试脚本（test, test:ui, test:run, test:coverage）
  - 创建 `src/test/setup.ts` 测试环境初始化文件
  - 验证测试环境可以正常运行
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. 创建测试工具和 Mock 数据
  - 创建 `src/test/testUtils.ts` 文件
  - 实现 `createMockNode` 函数，用于创建测试节点
  - 实现 `createMockEdge` 函数，用于创建测试边
  - 实现 `createMockProjectSnapshot` 函数，用于创建测试项目快照
  - 创建 `src/test/mockData.ts` 文件，包含常用的 mock 数据（空节点、带消息节点、错误节点、简单边、循环边等）
  - _Requirements: 5.3, 4.5_

- [x] 3. 实现图算法测试
- [x] 3.1 创建 validateNoCycle 测试文件
  - 创建 `src/algorithms/collectUpstreamContext.test.ts` 文件（包含 validateNoCycle 测试）
  - 编写基础场景测试：空图、单节点、简单链式图
  - 编写循环检测测试：自环、两节点循环、三节点循环、复杂循环
  - 编写边界情况测试：多个独立子图、菱形结构
  - 验证所有测试通过
  - _Requirements: 1.2, 4.1, 5.1_

- [x] 3.2 创建 collectUpstreamContext 测试
  - 在同一测试文件中添加 collectUpstreamContext 测试套件
  - 编写基础场景测试：无上游、单个上游、多个上游
  - 编写复杂图结构测试：深层嵌套、多路径汇聚、菱形依赖
  - 编写消息处理测试：消息去重、时间戳排序、错误节点标记
  - 编写边界情况测试：无消息节点、空消息数组
  - 验证所有测试通过
  - _Requirements: 1.3, 4.2, 5.1_

- [x] 4. 实现 ProjectSlice 测试
  - 创建 `src/state/createProjectSlice.test.ts` 文件
  - 编写 deriveSnapshot 测试：空状态、包含节点边、视口状态、设置信息、ID 生成、时间戳
  - 编写 hydrateProject 测试：还原节点边、还原视口、还原设置、清空选择、还原历史、设置项目 ID
  - 编写 newProject 测试：创建空项目、自定义标题、生成唯一 ID、初始化视口
  - Mock unifiedStorageService 以避免实际存储操作
  - 验证所有测试通过
  - _Requirements: 1.5, 1.6, 4.4, 5.2_


- [x] 5. 实现 RuntimeSlice 测试
  - 创建 `src/state/createRuntimeSlice.test.ts` 文件
  - 编写 enqueueNode 测试：添加节点、避免重复、保持顺序
  - 编写 dequeueNode 测试：取出节点、更新 currentExecution、空队列处理
  - 编写 startExecution 测试：设置 isRunning、加入队列、设置 currentExecution
  - 编写 stopExecution 测试：停止所有、停止特定节点、移除队列、更新状态
  - 编写 executionResults 测试：设置结果、获取结果、清空结果
  - 验证所有测试通过
  - _Requirements: 1.4, 4.3, 5.2_

- [x] 6. 运行测试并验证覆盖率
  - 运行 `pnpm test:run` 确保所有测试通过
  - 运行 `pnpm test:coverage` 生成覆盖率报告
  - 验证代码覆盖率达到目标（语句 80%、函数 80%、行 80%、分支 75%）
  - 如果覆盖率不足，补充缺失的测试用例
  - 确保测试运行时间在合理范围内（< 10 秒）
  - _Requirements: 1.1, 1.7, 3.4_

- [ ] 7. 创建 MVP 手动验证清单
  - 创建 `docs/task/milestone-a-checklist.md` 文件
  - 编写环境准备检查项
  - 编写项目管理验证流程（创建、保存、打开、删除）
  - 编写节点操作验证流程（创建、编辑、拖动、复制、删除）
  - 编写连线与上下文验证流程（连接、循环检测、删除、多上游）
  - 编写运行与执行验证流程（运行、查看结果、停止、并行、错误处理、重试）
  - 编写保存与恢复验证流程（手动保存、自动保存、导出、导入、状态恢复）
  - 编写边界条件测试项（空项目、大量节点、长消息、网络断开、无效输入）
  - 编写可访问性检查项（键盘导航、焦点管理、ARIA 标签、对比度）
  - 编写浏览器兼容性检查项（Chrome、Firefox、Safari、Edge）
  - 添加问题记录模板
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. 执行手动验证并记录结果
  - 清空浏览器缓存和存储
  - 准备测试数据（API Key、测试提示词）
  - 按清单逐项执行验证
  - 记录每项测试结果（通过/失败）
  - 截图关键步骤和发现的问题
  - 记录问题详情（步骤、预期、实际、严重程度）
  - 在清单文档中更新验证结果
  - 统计通过率并生成总结
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 9. 文档完善和总结
  - 更新 README 或开发文档，说明如何运行测试
  - 记录测试覆盖率结果
  - 总结手动验证发现的问题
  - 创建问题跟踪列表（如果发现 Critical/High 问题）
  - 更新项目状态，标记 Phase 5 完成
  - _Requirements: 5.4, 5.5_
