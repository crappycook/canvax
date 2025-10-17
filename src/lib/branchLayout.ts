import { type XYPosition } from '@xyflow/react'

/**
 * Configuration for branch layout calculations
 */
export const BRANCH_LAYOUT_CONFIG = {
  horizontalSpacing: 350, // Horizontal offset between sibling branches
  verticalSpacing: 200,   // Vertical offset for child nodes
  viewportPadding: 100,   // Minimum padding from viewport edges
  maxViewportWidth: 10000, // Maximum viewport width to consider
  maxViewportHeight: 10000, // Maximum viewport height to consider
}

/**
 * Calculate the position for a new branch node based on parent position and branch index
 * 
 * @param parentPosition - The position of the parent node
 * @param branchIndex - The index of this branch among siblings (0, 1, 2, ...)
 * @param nodeDepth - The depth of the node in the branch (0 for first node, 1 for second, etc.)
 * @param viewportBounds - Optional viewport bounds to check against
 * @returns The calculated position for the new node
 */
export function calculateBranchPosition(
  parentPosition: XYPosition,
  branchIndex: number,
  nodeDepth: number = 0,
  viewportBounds?: { width: number; height: number }
): XYPosition {
  // Calculate base offsets
  const horizontalOffset = branchIndex * BRANCH_LAYOUT_CONFIG.horizontalSpacing
  const verticalOffset = (nodeDepth + 1) * BRANCH_LAYOUT_CONFIG.verticalSpacing

  // Calculate initial position
  let x = parentPosition.x + horizontalOffset
  let y = parentPosition.y + verticalOffset

  // Check viewport bounds if provided
  if (viewportBounds) {
    const maxWidth = Math.min(viewportBounds.width, BRANCH_LAYOUT_CONFIG.maxViewportWidth)
    const maxHeight = Math.min(viewportBounds.height, BRANCH_LAYOUT_CONFIG.maxViewportHeight)

    // Ensure position stays within viewport with padding
    if (x + BRANCH_LAYOUT_CONFIG.viewportPadding > maxWidth) {
      // If we exceed horizontal bounds, wrap to next row
      x = parentPosition.x
      y += BRANCH_LAYOUT_CONFIG.verticalSpacing
    }

    if (y + BRANCH_LAYOUT_CONFIG.viewportPadding > maxHeight) {
      // If we exceed vertical bounds, clamp to max with padding
      y = maxHeight - BRANCH_LAYOUT_CONFIG.viewportPadding
    }

    // Ensure minimum padding from edges
    x = Math.max(BRANCH_LAYOUT_CONFIG.viewportPadding, x)
    y = Math.max(BRANCH_LAYOUT_CONFIG.viewportPadding, y)
  }

  return { x, y }
}

/**
 * Calculate positions for a pair of branch nodes (Input + Response)
 * 
 * @param parentPosition - The position of the parent node
 * @param branchIndex - The index of this branch among siblings
 * @param viewportBounds - Optional viewport bounds to check against
 * @returns An object with positions for the input and response nodes
 */
export function calculateBranchNodePositions(
  parentPosition: XYPosition,
  branchIndex: number,
  viewportBounds?: { width: number; height: number }
): { inputPosition: XYPosition; responsePosition: XYPosition } {
  // Calculate input node position (depth 0)
  const inputPosition = calculateBranchPosition(
    parentPosition,
    branchIndex,
    0,
    viewportBounds
  )

  // Calculate response node position (depth 1, directly below input)
  const responsePosition = calculateBranchPosition(
    parentPosition,
    branchIndex,
    1,
    viewportBounds
  )

  return { inputPosition, responsePosition }
}
