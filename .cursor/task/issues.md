# 项目 Issues/Tickets 清单（按里程碑与优先级）

> 使用建议：将本文件中的条目复制为代码托管平台的 Issue，并添加里程碑与标签。时间估算以理想工程日为单位，可按团队实际情况调整。

## 标签规范

- `milestone:A|B|C`
- `priority:P0|P1|P2`
- `type:feature|enhancement|chore|bug`
- `area:canvas|node|runtime|settings|storage|export|infra|ux`

---

## 里程碑 A（第 1–2 周，P0 必须项）

### A-01 初始化工程与质量基建 ✅

- 标签：`milestone:A` `priority:P0` `type:chore` `area:infra`
- 描述：创建 Vite + React + TS 项目；接入 ESLint/Prettier、Tailwind；配置路径别名。
- 验收标准：
  - [x] `pnpm dev`/`npm run dev` 可运行，热更新正常。
  - [x] 代码通过 Lint 与格式化，提交前钩子生效。
- 估时：1d
- 依赖：无

### A-02 引入 React Flow 与 Zustand ✅

- 标签：`milestone:A` `priority:P0` `type:feature` `area:canvas`
- 描述：安装 React Flow 与 Zustand，搭建最小可用画布 Demo 与全局状态容器。
- 验收标准：
  - [x] 画布显示，节点/边以示例数据渲染。
  - [x] Zustand store 初始化，能读写基本状态。
- 估时：0.5d
- 依赖：A-01

### A-03 画布平移与缩放

- 标签：`milestone:A` `priority:P0` `type:feature` `area:canvas`
- 描述：支持滚轮缩放、空格/中键拖拽平移；限制缩放范围 10%–400%。
- 验收标准：
  - [ ] 平移/缩放流畅，无明显掉帧。
  - [ ] 缩放居中策略合理，不丢失焦点。
- 估时：0.5d
- 依赖：A-02

### A-04 网格背景与吸附

- 标签：`milestone:A` `priority:P0` `type:enhancement` `area:canvas`
- 描述：画布网格、吸附粒度设置与开关。
- 验收标准：
  - [ ] 网格可开关；吸附对齐明显且可配置。
- 估时：0.5d
- 依赖：A-03

### A-05 节点基础卡片样式

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：实现节点卡片框架：标题、模型徽章、操作按钮区。
- 验收标准：
  - [ ] 统一的卡片外观，支持主题变量占位。
- 估时：0.5d
- 依赖：A-02

### A-06 节点创建与删除

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：工具栏按钮和快捷键 N 新建节点；Delete 删除节点。
- 验收标准：
  - [ ] 新建节点出现在鼠标位置或画布中心。
  - [ ] 删除后相关连线一并清理。
- 估时：0.5d
- 依赖：A-05

### A-07 节点拖拽与尺寸调整

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：节点支持拖拽移动与边缘拖拽调整尺寸，限制最小/最大。
- 验收标准：
  - [ ] 拖拽流畅；连线随动重绘。
  - [ ] 尺寸变化不破坏内容布局。
- 估时：0.5d
- 依赖：A-06

### A-08 入/出端口定义与连线规则

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：定义端口布局、箭头样式与连线规则；禁止循环连接。
- 验收标准：
  - [ ] 端口可交互；无循环连线；悬停高亮有效。
- 估时：0.5d
- 依赖：A-07

### A-09 节点头部工具条（运行/停止/复制/删除/标题）

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：仿 flowith 的节点头部交互，支持标题编辑与操作按钮。
- 验收标准：
  - [ ] 操作按钮可用并有禁用/加载态反馈。
- 估时：0.5d
- 依赖：A-05

### A-10 撤销/重做（历史≥20）

- 标签：`milestone:A` `priority:P0` `type:feature` `area:ux`
- 描述：将节点/连线/文本编辑纳入可撤销历史，深度≥20。
- 验收标准：
  - [ ] Ctrl/⌘+Z/Y 正常；状态一致、无越界。
- 估时：0.5d
- 依赖：A-06 A-08

### A-11 连线创建/删除/高亮

- 标签：`milestone:A` `priority:P0` `type:feature` `area:canvas`
- 描述：创建/删除连线，悬停与选中高亮；显示箭头方向。
- 验收标准：
  - [ ] 连线交互稳定、命中区域合理。
- 估时：0.5d
- 依赖：A-08

### A-12 数据模型与类型定义

- 标签：`milestone:A` `priority:P0` `type:chore` `area:infra`
- 描述：定义 `Node` `Edge` `Project` 等 TS 类型与校验（zod/自研）。
- 验收标准：
  - [ ] 统一类型在全局使用；新增字段需经过类型校验。
- 估时：0.5d
- 依赖：A-01

### A-13 设置面板：API Key 管理（本地加密）

- 标签：`milestone:A` `priority:P0` `type:feature` `area:settings`
- 描述：API Key 输入、遮罩显示、WebCrypto 本地加密存储。
- 验收标准：
  - [ ] Key 不明文持久化；删除后不可用；导出不包含 Key。
- 估时：0.5d
- 依赖：A-12

### A-14 统一请求封装（OpenAI 兼容）

- 标签：`milestone:A` `priority:P0` `type:feature` `area:runtime`
- 描述：统一 HTTP 封装、错误分类、超时与 AbortController。
- 验收标准：
  - [ ] 成功/失败/超时可区分；可中断；日志可读。
- 估时：0.5d
- 依赖：A-13

### A-15 节点内请求运行 UI

- 标签：`milestone:A` `priority:P0` `type:feature` `area:node`
- 描述：在节点内编辑提示词并运行，请求状态显示加载/错误/重试。
- 验收标准：
  - [ ] 正常返回展示消息流；失败提示原因并可重试。
- 估时：0.5d
- 依赖：A-14

### A-16 保存/打开项目（IndexedDB + JSON）

- 标签：`milestone:A` `priority:P0` `type:feature` `area:storage`
- 描述：以 `{version,nodes,edges,settings,history}` 结构保存与恢复。
- 验收标准：
  - [ ] 重新打开后位置/连接/内容完整还原。
- 估时：0.5d
- 依赖：A-12

### A-17 首次启动向导与样例项目

- 标签：`milestone:A` `priority:P0` `type:enhancement` `area:ux`
- 描述：提供简短上手提示与样例画布，帮助完成首条链路。
- 验收标准：
  - [ ] 新手 10 分钟内完成节点≥3、连线≥2。
- 估时：0.5d
- 依赖：A-16

### A-18 单元测试骨架（vitest + RTL）

- 标签：`milestone:A` `priority:P0` `type:chore` `area:infra`
- 描述：配置测试框架，覆盖关键逻辑（store、节点创建、连线）。
- 验收标准：
  - [ ] 覆盖率基线 40%+；CI 通过。
- 估时：0.5d
- 依赖：A-01

### A-19 E2E 冒烟（Playwright）

- 标签：`milestone:A` `priority:P0` `type:chore` `area:infra`
- 描述：自动化验证：创建节点→连线→保存→重新打开。
- 验收标准：
  - [ ] 本地脚本可跑；关键路径稳定通过。
- 估时：0.5d
- 依赖：A-16

### A-20 异常与日志

- 标签：`milestone:A` `priority:P0` `type:chore` `area:infra`
- 描述：捕获未处理异常、分类错误提示、本地日志留存。
- 验收标准：
  - [ ] 错误弹出清晰；日志含时间/分类/请求ID。
- 估时：0.5d
- 依赖：A-14

---

## 里程碑 B（第 3–4 周，P1 应该项）

### B-01 迷你地图与缩放控件

- 标签：`milestone:B` `priority:P1` `type:enhancement` `area:canvas`
- 描述：显示视窗范围，点击跳转，独立缩放控件。
- 验收标准：
  - [ ] 视窗同步；支持开关；交互不卡顿。
- 估时：0.5d
- 依赖：A-03

### B-02 框选/多选与分组框

- 标签：`milestone:B` `priority:P1` `type:feature` `area:canvas`
- 描述：框选与批量移动，对齐线与吸附；分组框管理区域。
- 验收标准：
  - [ ] 多选不丢失相对位置；对齐线准确。
- 估时：1d
- 依赖：A-07

### B-03 Markdown 渲染与代码高亮

- 标签：`milestone:B` `priority:P1` `type:feature` `area:node`
- 描述：remark/rehype + 高亮库；代码块复制按钮。
- 验收标准：
  - [ ] 标题/列表/链接/代码块显示正确；复制按钮可用。
- 估时：0.5d
- 依赖：A-15

### B-04 节点模板（问答/总结/翻译/提纲）

- 标签：`milestone:B` `priority:P1` `type:feature` `area:node`
- 描述：基于模板一键创建节点并填充提示词，可二次编辑。
- 验收标准：
  - [ ] 模板可配置；创建后可立即运行。
- 估时：0.5d
- 依赖：A-06

### B-05 上下文选择注入

- 标签：`milestone:B` `priority:P1` `type:feature` `area:runtime`
- 描述：选取上游节点内容片段注入下游请求；提供预览。
- 验收标准：
  - [ ] 选区可清除；请求预览可见注入片段。
- 估时：1d
- 依赖：A-11 A-14

### B-06 项目内全文搜索

- 标签：`milestone:B` `priority:P1` `type:feature` `area:ux`
- 描述：按节点标题与消息文本搜索，定位并高亮结果。
- 验收标准：
  - [ ] 大小写/模糊匹配；跳转定位准确。
- 估时：0.5d
- 依赖：A-16

### B-07 导出 PNG/Markdown/JSON

- 标签：`milestone:B` `priority:P1` `type:feature` `area:export`
- 描述：导出画布截图（无裁切、分辨率设置）与结构化文本。
- 验收标准：
  - [ ] PNG 覆盖完整画布区域；Markdown/JSON 含元信息。
- 估时：0.5d
- 依赖：A-16

### B-08 渲染虚拟化与性能优化

- 标签：`milestone:B` `priority:P1` `type:enhancement` `area:runtime`
- 描述：长消息/大量节点虚拟列表与渲染分层。
- 验收标准：
  - [ ] 100+ 节点下交互稳定；内存可控。
- 估时：1d
- 依赖：A-15

### B-09 请求去重与缓存

- 标签：`milestone:B` `priority:P1` `type:enhancement` `area:runtime`
- 描述：对相同输入的请求去重；结果短期缓存与命中日志。
- 验收标准：
  - [ ] 重复请求被抑制；命中率可观察。
- 估时：0.5d
- 依赖：A-14

---

## 里程碑 C（第 5–6 周，P2 可选项）

### C-01 主题/暗色模式

- 标签：`milestone:C` `priority:P2` `type:enhancement` `area:ux`
- 描述：全局主题切换，保证对比度与可读性。
- 验收标准：
  - [ ] 明暗主题覆盖主要页面与组件；对比度合规。
- 估时：0.5d
- 依赖：A-05

### C-02 键位自定义

- 标签：`milestone:C` `priority:P2` `type:feature` `area:ux`
- 描述：导入/导出键位映射，自定义常用操作快捷键。
- 验收标准：
  - [ ] 冲突检测与提醒；可恢复默认。
- 估时：0.5d
- 依赖：A-10

### C-03 全局请求队列与速率限制

- 标签：`milestone:C` `priority:P2` `type:feature` `area:runtime`
- 描述：并发上限、退避重试、可视化队列。
- 验收标准：
  - [ ] 队列状态可见；速率限制可配置；退避策略生效。
- 估时：1d
- 依赖：A-14

### C-04 节点级中断

- 标签：`milestone:C` `priority:P2` `type:feature` `area:runtime`
- 描述：对单个节点的正在进行请求执行中断，立即停止并回滚 UI 状态。
- 验收标准：
  - [ ] 中断即时；未完成请求不污染历史。
- 估时：0.5d
- 依赖：C-03

### C-05 版本快照/时光轴

- 标签：`milestone:C` `priority:P2` `type:feature` `area:storage`
- 描述：创建与恢复项目快照，简版差异查看。
- 验收标准：
  - [ ] 快照可命名；恢复后画布完全还原。
- 估时：1d
- 依赖：A-16

### C-06 文件迁移与兼容

- 标签：`milestone:C` `priority:P2` `type:chore` `area:storage`
- 描述：项目文件版本号与迁移脚本；失败备份与回退。
- 验收标准：
  - [ ] 老文件可打开；迁移失败保留原始备份并提示修复路径。
- 估时：0.5d
- 依赖：A-16

### C-07 调试面板与可观测性

- 标签：`milestone:C` `priority:P2` `type:enhancement` `area:infra`
- 描述：展示请求日志、上下文注入预览、关键性能指标。
- 验收标准：
  - [ ] 面板信息清晰；开关不影响性能。
- 估时：0.5d
- 依赖：A-14 B-05

---

## Issue 模板（可复制使用）

```md
### 标题

<清晰动作 + 对象，例如：实现画布平移与缩放>

- 里程碑：A/B/C
- 优先级：P0/P1/P2
- 类型：feature/enhancement/chore/bug
- 模块：canvas/node/runtime/settings/storage/export/infra/ux
- 预估：Xd
- 依赖：<Issue 编号/模块>

#### 背景

<问题与目标简述>

#### 需求与范围

- [ ] 要点 1
- [ ] 要点 2

#### 验收标准

- [ ] 用例 1
- [ ] 用例 2

#### 备注/参考

- PRD：`prd.md`
```
