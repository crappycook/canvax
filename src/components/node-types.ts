import { BaseNodeCustom } from './custom-nodes'

// 导出节点类型映射
export const nodeTypes = {
  baseNodeCustom: BaseNodeCustom,
}

export type CustomNodeTypes = typeof nodeTypes
