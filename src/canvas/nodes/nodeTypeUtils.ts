import { useMemo } from 'react'
import type { Edge } from '@xyflow/react'
import type { ChatNodeData, NodeType } from '@/canvas/types'

/**
 * Determines the type of a node based on its data and connections
 * 
 * Logic:
 * - If nodeType is explicitly set in data, use that (for branch nodes)
 * - Response Node: Has assistant messages AND prompt is empty (pure response display)
 * - Input Node: No assistant messages (fresh input node)
 * - Hybrid Node: Has assistant messages AND has prompt (continuing conversation)
 * 
 * @param nodeId - The ID of the node to check
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns The node type: 'input', 'response', or 'hybrid'
 */
export function getNodeType(
  _nodeId: string,
  nodeData: ChatNodeData,
  _edges: Edge[]
): NodeType {
  // If nodeType is explicitly set (e.g., for branch nodes), respect it
  if (nodeData.nodeType) {
    return nodeData.nodeType
  }
  
  // Safely check for prompt and messages (handle undefined/null cases for legacy data)
  const prompt = nodeData.prompt ?? ''
  const messages = nodeData.messages ?? []
  
  const hasPrompt = prompt.trim().length > 0
  const hasAssistantMessages = messages.some(m => m.role === 'assistant')
  
  // Response node: has assistant messages but no prompt (pure response display)
  if (hasAssistantMessages && !hasPrompt) {
    return 'response'
  }
  
  // Hybrid node: has both assistant messages and prompt (continuing conversation)
  if (hasAssistantMessages && hasPrompt) {
    return 'hybrid'
  }
  
  // Input node: no assistant messages (fresh input node)
  return 'input'
}

/**
 * Checks if a node is an input node
 * 
 * @param nodeId - The ID of the node to check
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns True if the node is an input node
 */
export function isInputNode(
  nodeId: string,
  nodeData: ChatNodeData,
  edges: Edge[]
): boolean {
  return getNodeType(nodeId, nodeData, edges) === 'input'
}

/**
 * Checks if a node is a response node
 * 
 * @param nodeId - The ID of the node to check
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns True if the node is a response node
 */
export function isResponseNode(
  nodeId: string,
  nodeData: ChatNodeData,
  edges: Edge[]
): boolean {
  return getNodeType(nodeId, nodeData, edges) === 'response'
}

/**
 * Checks if a node is a hybrid node
 * 
 * @param nodeId - The ID of the node to check
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns True if the node is a hybrid node
 */
export function isHybridNode(
  nodeId: string,
  nodeData: ChatNodeData,
  edges: Edge[]
): boolean {
  return getNodeType(nodeId, nodeData, edges) === 'hybrid'
}

/**
 * React hook that memoizes node type calculation for performance
 * 
 * @param nodeId - The ID of the node
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns The memoized node type
 */
export function useNodeType(
  nodeId: string,
  nodeData: ChatNodeData,
  edges: Edge[]
): NodeType {
  return useMemo(
    () => getNodeType(nodeId, nodeData, edges),
    [
      nodeId,
      nodeData.nodeType,
      nodeData.prompt,
      nodeData.messages?.length ?? 0,
      // Check if there are assistant messages
      nodeData.messages?.some(m => m.role === 'assistant') ?? false,
      // Serialize edges to detect changes
      edges.filter(e => e.source === nodeId || e.target === nodeId).length
    ]
  )
}
