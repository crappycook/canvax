import { useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type OnConnect,
  type Node,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { type CustomNodeData } from '@/components/custom-nodes'
import { nodeTypes } from '@/components/node-types'

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    type: 'baseNodeCustom',
    position: { x: 100, y: 50 },
    data: { label: 'Node 1' },
  },
  {
    id: '2',
    type: 'baseNodeCustom',
    position: { x: 100, y: 300 },
    data: { label: 'Node 2' },
  },
]

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }]

function Canvax() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Edge) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect as OnConnect}
      fitView
      fitViewOptions={{ padding: 0.2 }}
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  )
}

export default Canvax
