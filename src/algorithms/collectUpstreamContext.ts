import { type Node, type Edge } from '@xyflow/react'
import { type ChatNodeData } from '@/canvas/types'

export interface ExecutionContext {
  nodeId: string
  upstreamNodes: Node<ChatNodeData>[]
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  executionOrder: string[]
  hasErrors: boolean
  errorNodes: string[]
  isComplete: boolean
}

/**
 * Collects upstream context for a target node using topological sorting
 * Ensures messages are collected in proper execution order and deduplicated
 */
export function collectUpstreamContext(
  targetNodeId: string,
  nodes: Node<ChatNodeData>[],
  edges: Edge[]
): ExecutionContext {
  // Build adjacency list for topological sort
  const adjacencyList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  // Initialize all nodes
  nodes.forEach(node => {
    adjacencyList.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  // Build graph
  edges.forEach(edge => {
    const sources = adjacencyList.get(edge.source) || []
    sources.push(edge.target)
    adjacencyList.set(edge.source, sources)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // Find all upstream nodes using BFS from target (going backwards)
  const upstreamNodeIds = new Set<string>()
  const queue: string[] = []
  
  // Start from target node and traverse backwards
  const incomingEdges = edges.filter(e => e.target === targetNodeId)
  incomingEdges.forEach(edge => {
    queue.push(edge.source)
    upstreamNodeIds.add(edge.source)
  })
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    const incoming = edges.filter(e => e.target === currentId)
    
    incoming.forEach(edge => {
      if (!upstreamNodeIds.has(edge.source)) {
        upstreamNodeIds.add(edge.source)
        queue.push(edge.source)
      }
    })
  }
  
  // Perform topological sort on upstream nodes only
  const executionOrder: string[] = []
  const tempInDegree = new Map<string, number>()
  const sortQueue: string[] = []
  
  // Initialize in-degrees for upstream nodes only
  upstreamNodeIds.forEach(nodeId => {
    const degree = edges.filter(e => 
      e.target === nodeId && upstreamNodeIds.has(e.source)
    ).length
    tempInDegree.set(nodeId, degree)
    
    if (degree === 0) {
      sortQueue.push(nodeId)
    }
  })
  
  // Kahn's algorithm for topological sort
  while (sortQueue.length > 0) {
    const currentId = sortQueue.shift()!
    executionOrder.push(currentId)
    
    const outgoing = edges.filter(e => 
      e.source === currentId && upstreamNodeIds.has(e.target)
    )
    
    outgoing.forEach(edge => {
      const newDegree = (tempInDegree.get(edge.target) || 0) - 1
      tempInDegree.set(edge.target, newDegree)
      
      if (newDegree === 0) {
        sortQueue.push(edge.target)
      }
    })
  }
  
  // Collect upstream nodes in topological order
  const upstreamNodes: Node<ChatNodeData>[] = []
  const errorNodes: string[] = []
  let hasErrors = false
  
  executionOrder.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      upstreamNodes.push(node)
      
      // Check for error status
      if (node.data.status === 'error') {
        hasErrors = true
        errorNodes.push(nodeId)
      }
    }
  })
  
  // Collect and deduplicate messages in topological order
  const messagesMap = new Map<string, { 
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
    nodeId: string
  }>()
  
  executionOrder.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const nodeData = node.data as ChatNodeData
    if (nodeData.messages && nodeData.messages.length > 0) {
      nodeData.messages.forEach(msg => {
        // Create unique key based on role, content, and position in conversation
        const key = `${msg.role}:${msg.content}:${msg.createdAt}`
        
        if (!messagesMap.has(key)) {
          messagesMap.set(key, {
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt,
            nodeId: nodeId
          })
        }
      })
    }
  })
  
  // Convert to array and sort by timestamp to maintain conversation order
  const messages = Array.from(messagesMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ role, content }) => ({ role, content }))
  
  // Check if context is complete (no missing nodes in the chain)
  const isComplete = executionOrder.length === upstreamNodeIds.size && !hasErrors
  
  return {
    nodeId: targetNodeId,
    upstreamNodes,
    messages,
    executionOrder,
    hasErrors,
    errorNodes,
    isComplete
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