import { memo } from 'react'
import { BaseEdge, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { CustomEdgeData } from '@/types'
import { useStore } from '@/state/store'

// Color palette for branches - using Tailwind color classes
const BRANCH_COLORS = [
  'stroke-blue-500',
  'stroke-green-500',
  'stroke-purple-500',
  'stroke-orange-500',
  'stroke-pink-500',
  'stroke-cyan-500',
  'stroke-indigo-500',
  'stroke-yellow-500',
] as const

export const BranchEdge = memo(function BranchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as CustomEdgeData | undefined
  const isBranchEdge = edgeData?.isBranchEdge ?? false
  const branchIndex = edgeData?.branchIndex ?? 0

  const highlightedEdgeIds = useStore(state => state.highlightedEdgeIds)

  // Get the path for the edge (smooth bezier curve)
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Check if this edge is highlighted
  const isHighlighted = highlightedEdgeIds.has(id)

  // Determine stroke color and width
  const strokeColor = isBranchEdge
    ? BRANCH_COLORS[branchIndex % BRANCH_COLORS.length]
    : 'stroke-gray-400 dark:stroke-gray-600'

  const strokeWidth = isBranchEdge ? 'stroke-[2.5]' : 'stroke-[1.5]'

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={cn(
        strokeColor,
        strokeWidth,
        'transition-colors',
        isHighlighted && 'edge-branch-highlighted'
      )}
    />
  )
})
