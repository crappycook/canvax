import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  addEdge,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { nodeTypes } from '@/components/node-types'
import { edgeTypes } from '@/canvas/register'
import { useStore } from '@/state/store'
import { validateNoCycle } from '@/algorithms/collectUpstreamContext'
import type { ChatNodeData } from '@/types'
import { Inspector } from '@/canvas/components/Inspector'
import { DeleteBranchConfirmDialog } from '@/canvas/components/DeleteBranchConfirmDialog'

const DEFAULT_NODES: Node<ChatNodeData>[] = [
  {
    id: 'node-chat-1',
    type: 'chat',
    position: { x: 200, y: 120 },
    data: {
      label: 'Chat Node',
      description: 'Draft prompts and iterate quickly',
      model: 'gpt-4o',
      prompt: '',
      messages: [],
      status: 'idle',
      createdAt: Date.now(),
    },
  },
]

const DEFAULT_EDGES: Edge[] = [
]

interface ReactFlowCanvasProps {
  projectId?: string
}

export default function ReactFlowCanvas({ projectId }: ReactFlowCanvasProps) {
  const nodes = useStore(state => state.nodes)
  const edges = useStore(state => state.edges)
  const setNodes = useStore(state => state.setNodes)
  const setEdges = useStore(state => state.setEdges)
  const applyNodeChanges = useStore(state => state.applyNodeChanges)
  const applyEdgeChanges = useStore(state => state.applyEdgeChanges)
  const connectEdge = useStore(state => state.connectEdge)
  const removeEdgesConnectedToNode = useStore(state => state.removeEdgesConnectedToNode)
  const deleteBranchCascade = useStore(state => state.deleteBranchCascade)
  const selectedNodeId = useStore(state => state.selectedNodeId)
  const selectNode = useStore(state => state.selectNode)
  const currentProjectId = useStore(state => state.currentProjectId)

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteNodes, setPendingDeleteNodes] = useState<Node[]>([])
  const [branchCount, setBranchCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Only set default nodes for NEW projects (no projectId in URL)
  // For existing projects, wait for data to load from storage
  useEffect(() => {
    if (!projectId && !isInitialized && nodes.length === 0 && edges.length === 0) {
      setNodes(DEFAULT_NODES)
      setEdges(DEFAULT_EDGES)
      setIsInitialized(true)
    } else if (projectId && currentProjectId === projectId && nodes.length > 0) {
      // Mark as initialized once we have loaded data for an existing project
      setIsInitialized(true)
    }
  }, [projectId, currentProjectId, nodes.length, edges.length, setNodes, setEdges, isInitialized])

  const toastMessage = useStore(state => state.ui.toastMessage)
  const showToast = useStore(state => state.showToast)
  const hideToast = useStore(state => state.hideToast)
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (toastMessage) {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }

      toastTimerRef.current = window.setTimeout(() => {
        hideToast()
        toastTimerRef.current = null
      }, 3000)
    }

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [toastMessage, hideToast])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      applyNodeChanges(changes)
    },
    [applyNodeChanges]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      applyEdgeChanges(changes)
    },
    [applyEdgeChanges]
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return
      }

      if (connection.source === connection.target) {
        showToast('Cannot create a connection to the same node.')
        return
      }

      const hasDuplicate = edges.some(
        edge => edge.source === connection.source && edge.target === connection.target
      )

      if (hasDuplicate) {
        showToast('These nodes are already connected.')
        return
      }

      const nextEdges = addEdge(connection, edges)
      const nodeIds = nodes.map(node => node.id)
      const isAcyclic = validateNoCycle(nodeIds, nextEdges)

      if (!isAcyclic) {
        showToast('This connection would create a cycle. Choose a different target.')
        return
      }

      connectEdge(connection)
    },
    [connectEdge, edges, nodes, showToast]
  )

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      // Check if any of the deleted nodes have child branches
      const nodesWithBranches = deletedNodes.filter(node => {
        const childEdges = edges.filter(e => e.source === node.id)
        return childEdges.length > 0
      })

      if (nodesWithBranches.length > 0) {
        // Calculate total branch count
        const totalBranches = nodesWithBranches.reduce((count, node) => {
          const childEdges = edges.filter(e => e.source === node.id)
          return count + childEdges.length
        }, 0)

        // Show confirmation dialog
        setPendingDeleteNodes(deletedNodes)
        setBranchCount(totalBranches)
        setDeleteDialogOpen(true)
      } else {
        // No branches, proceed with normal deletion
        deletedNodes.forEach(node => {
          removeEdgesConnectedToNode(node.id)
        })
      }
    },
    [edges, removeEdgesConnectedToNode]
  )

  const handleDeleteConfirm = useCallback(() => {
    // Delete all pending nodes using cascade delete
    pendingDeleteNodes.forEach(node => {
      deleteBranchCascade(node.id)
    })
    setPendingDeleteNodes([])
    setBranchCount(0)
  }, [pendingDeleteNodes, deleteBranchCascade])

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteNodes([])
    setBranchCount(0)
  }, [])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const handlePaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const memoizedNodes = useMemo(() => nodes, [nodes])
  const memoizedEdges = useMemo(() => edges, [edges])

  return (
    <div className="relative flex-1 bg-gray-50">
      <ReactFlow
        nodes={memoizedNodes}
        edges={memoizedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodesDelete={handleNodesDelete}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap />
        <Controls />
        <Background />
        <Inspector selectedNodeId={selectedNodeId} />
      </ReactFlow>
      {toastMessage && (
        <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-lg bg-slate-900/95 px-6 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-sm">
            {toastMessage}
          </div>
        </div>
      )}
      <DeleteBranchConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        branchCount={branchCount}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
