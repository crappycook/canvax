import '@xyflow/react/dist/style.css'

import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from '@/components/base-node'

function App() {
  return (
    <div className="w-screen h-screen p-8">
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle>Base Node</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          This is a base node component that can be used to build other nodes.
        </BaseNodeContent>
      </BaseNode>
    </div>
  )
}

export default App
