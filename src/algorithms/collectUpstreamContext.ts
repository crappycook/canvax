import { type Node, type Edge } from '@xyflow/react'
import { type ChatNodeData } from '@/canvas/types'

export interface ExecutionContext {
  nodeId: string
  upstreamNodes: Node<ChatNodeData>[]
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  executionOrder: string[]
}

export function collectUpstreamContext(
  targetNodeId: string,
  nodes: Node<ChatNodeData>[],
  edges: Edge[]
): ExecutionContext {
  const visited = new Set<string>()
  const executionOrder: string[] = []
  const upstreamNodes: Node<ChatNodeData>[] = []
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  
  function traverse(nodeId: string): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    // Add node to execution order (topological - depth first)
    executionOrder.push(nodeId)
    upstreamNodes.push(node)
    
    // Collect messages from this node
    const nodeData = node.data as ChatNodeData
    if (nodeData.messages && nodeData.messages.length > 0) {
      const nodeMessages = nodeData.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      messages.push(...nodeMessages)
    }
    
    // Recursively traverse incoming edges (sources that connect to this target)
    const incomingEdges = edges.filter(edge => edge.target === nodeId)
    for (const edge of incomingEdges) {
      traverse(edge.source)
    }
  }
  
  // Start traversal from target node
  traverse(targetNodeId)
  
  // Reverse to get topological order (sources first)
  executionOrder.reverse()
  upstreamNodes.reverse()
  
  // Deduplicate messages while preserving order
  const uniqueMessages = messages.filter((msg, index, arr) => 
    index === arr.findIndex(m => 
      m.role === msg.role && m.content === msg.content
    )
  )
  
  return {
    nodeId: targetNodeId,
    upstreamNodes,
    messages: uniqueMessages,
    executionOrder
  }
}

export function validateNoCycle(nodes: string[], edges: Edge[]): boolean {
  const graph = new Map<string, string[]>()
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  // Build adjacency list
  edges.forEach(edge => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, [])
    }
    graph.get(edge.source)!.push(edge.target)
  })
  
  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    
    visited.add(nodeId)
    recStack.add(nodeId)
    
    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true
    }
    
    recStack.delete(nodeId)
    return false
  }
  
  for (const nodeId of nodes) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return false
    }
  }
  
  return true
}