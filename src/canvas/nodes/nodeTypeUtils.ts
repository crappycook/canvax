import { useMemo } from 'react'
import type { Edge } from '@xyflow/react'
import type { ChatNodeData, NodeType } from '@/canvas/types'

/**
 * Determines the type of a node based on its data and connections
 * 
 * Logic:
 * - Input Node: No downstream connections AND no assistant messages
 * - Response Node: Has upstream connection AND has assistant messages AND prompt is empty
 * - Hybrid Node: All other cases (has connections and both messages and prompt)
 * 
 * @param nodeId - The ID of the node to check
 * @param nodeData - The data of the node
 * @param edges - All edges in the graph
 * @returns The node type: 'input', 'response', or 'hybrid'
 */
export function getNodeType(
  nodeId: string,
  nodeData: ChatNodeData,
  edges: Edge[]
): NodeType {
  const hasDownstream = edges.some(e => e.source === nodeId)
  const hasUpstream = edges.some(e => e.target === nodeId)
  const hasPrompt = nodeData.prompt.trim().length > 0
  const hasAssistantMessages = nodeData.messages.some(m => m.role === 'assistant')
  
  // Input node: no downstream connections and no assistant messages
  if (!hasDownstream && !hasAssistantMessages) {
    return 'input'
  }
  
  // Response node: has upstream, has assistant messages, no prompt
  if (hasUpstream && hasAssistantMessages && !hasPrompt) {
    return 'response'
  }
  
  // Hybrid node: all other cases
  return 'hybrid'
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
      nodeData.prompt,
      nodeData.messages.length,
      // Check if there are assistant messages
      nodeData.messages.some(m => m.role === 'assistant'),
      // Serialize edges to detect changes
      edges.filter(e => e.source === nodeId || e.target === nodeId).length
    ]
  )
}
