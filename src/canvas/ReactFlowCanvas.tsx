import { useCallback, useEffect } from 'react'
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
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { nodeTypes } from '@/components/node-types'
import { useStore } from '@/state/store'

const DEFAULT_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'baseNodeCustom',
    position: { x: 120, y: 80 },
    data: { label: 'Idea Starter' },
  },
  {
    id: 'node-2',
    type: 'baseNodeCustom',
    position: { x: 420, y: 260 },
    data: { label: 'Refine Output' },
  },
]

const DEFAULT_EDGES: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
  },
]

interface ReactFlowCanvasProps {
  projectId?: string
}

export default function ReactFlowCanvas({ projectId: _projectId }: ReactFlowCanvasProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const nodes = useStore(state => state.nodes)
  const edges = useStore(state => state.edges)
  const setNodes = useStore(state => state.setNodes)
  const setEdges = useStore(state => state.setEdges)
  const applyNodeChanges = useStore(state => state.applyNodeChanges)
  const applyEdgeChanges = useStore(state => state.applyEdgeChanges)
  const connectEdge = useStore(state => state.connectEdge)

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      setNodes(DEFAULT_NODES)
      setEdges(DEFAULT_EDGES)
    }
  }, [nodes.length, edges.length, setNodes, setEdges])

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
      connectEdge(connection)
    },
    [connectEdge]
  )

  return (
    <div className="flex-1 bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
