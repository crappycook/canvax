# Implementation Plan

- [x] 1. Enhance type definitions with branch metadata
  - Add `branchId`, `parentNodeId`, and `branchIndex` fields to `ChatNodeData` interface in `src/types.ts`
  - Add `branchIndex` and `isBranchEdge` fields to `CustomEdgeData` interface in `src/types.ts`
  - Create `BranchMetadata` interface in `src/types.ts`
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [x] 2. Implement single-path context collection algorithm
  - [x] 2.1 Create `collectUpstreamContextSinglePath` function in `src/algorithms/collectUpstreamContext.ts`
    - Implement single-path traversal from target node to root
    - Collect messages in chronological order
    - Track execution order and error states
    - Return `ExecutionContext` with branch-isolated data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 2.2 Write unit tests for single-path context collection
    - Test single linear path traversal
    - Test branching scenarios (verify only one path followed)
    - Test message ordering and deduplication
    - Test error node detection
    - Test empty path and edge cases
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Add branch creation method to NodesSlice
  - [x] 3.1 Implement `createBranchFromNode` method in `src/state/createNodesSlice.ts`
    - Calculate branch index from existing edges
    - Generate unique branch ID
    - Calculate position offsets (horizontal: 350px * branchIndex, vertical: 200px)
    - Create Input node with branch metadata
    - Create Response node with branch metadata
    - Add edges with branch metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.2 Implement `getBranchMetadata` method in `src/state/createNodesSlice.ts`
    - Extract branch metadata from node data
    - Calculate branch depth by traversing to root
    - Count messages in branch path
    - Return `BranchMetadata` object or null
    - _Requirements: 4.5_
  
  - [x] 3.3 Implement `getBranchPath` method in `src/state/createNodesSlice.ts`
    - Traverse from current node to root following parent edges
    - Build array of nodes in path order
    - Handle circular reference protection
    - Return ordered array of nodes
    - _Requirements: 4.1, 4.2_
  
  - [x] 3.4 Implement `getSiblingBranches` method in `src/state/createNodesSlice.ts`
    - Find parent node from current node's metadata
    - Get all edges from parent node
    - Filter to find sibling branch nodes
    - Return array of sibling nodes
    - _Requirements: 4.3, 4.4_
  
  - [ ]* 3.5 Write unit tests for NodesSlice branch methods
    - Test `createBranchFromNode` with various scenarios
    - Test `getBranchMetadata` calculation
    - Test `getBranchPath` traversal
    - Test `getSiblingBranches` detection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Update ResponseNodeContent to support branch creation
  - Modify `handleContinueConversation` to call `createBranchFromNode` instead of `convertNodeToInput`
  - Update button to trigger branch creation
  - Ensure button only shows for Response nodes with success status
  - _Requirements: 1.1, 1.2_

- [x] 5. Integrate single-path context collection into execution flow
  - Update `useRunNode` hook in `src/hooks/useRunNode.ts` to use `collectUpstreamContextSinglePath` for branch nodes
  - Add logic to detect if node is part of a branch (check for `branchId` metadata)
  - Fall back to original `collectUpstreamContext` for non-branch nodes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Create branch visualization components
  - [x] 6.1 Create `BranchBadge` component in `src/canvas/components/BranchBadge.tsx`
    - Display branch index as "B1", "B2", etc.
    - Position badge in top-right corner of node
    - Add tooltip with full branch ID
    - Style with primary color scheme
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Enhance `ChatNode` to render branch badge
    - Check for `branchId` in node data
    - Render `BranchBadge` component when branch metadata exists
    - Pass branch index and ID to badge
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.3 Create or enhance edge component for branch styling
    - Detect branch edges using `isBranchEdge` flag
    - Apply color based on `branchIndex` (use color palette)
    - Increase stroke width for branch edges
    - Update edge registration in `src/canvas/register.ts`
    - _Requirements: 3.2, 3.4_

- [x] 7. Implement Inspector panel branch features
  - [x] 7.1 Add branch path breadcrumb section to Inspector
    - Display breadcrumb navigation for branch path
    - Implement click handlers to focus on path nodes
    - Show chevron separators between nodes
    - Only display when selected node has branch metadata
    - _Requirements: 4.1, 4.2_
  
  - [x] 7.2 Add sibling branches section to Inspector
    - List all sibling branches with labels
    - Implement click handlers to focus on sibling nodes
    - Display branch icons next to labels
    - Only display when siblings exist
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.3 Add branch metadata display to Inspector
    - Show branch depth (distance from root)
    - Show message count in branch
    - Show branch creation timestamp
    - Format metadata in readable layout
    - _Requirements: 4.5_

- [x] 8. Implement automatic layout for multiple branches
  - [x] 8.1 Create `calculateBranchPosition` utility function
    - Calculate horizontal offset based on branch index
    - Calculate vertical offset for node depth
    - Check for viewport bounds
    - Return position coordinates
    - _Requirements: 1.5, 3.5_
  
  - [x] 8.2 Update `createBranchFromNode` to use layout utility
    - Replace hardcoded offsets with utility function
    - Pass parent position and branch index
    - Apply calculated positions to new nodes
    - _Requirements: 1.5, 3.5_

- [x] 9. Add branch highlighting on selection
  - [x] 9.1 Implement branch path highlighting logic
    - Detect when selected node is part of a branch
    - Get all nodes in branch path
    - Apply highlight styling to path nodes
    - Apply highlight styling to path edges
    - _Requirements: 3.3_
  
  - [x] 9.2 Create highlight styles for branch paths
    - Define CSS classes for highlighted nodes
    - Define CSS classes for highlighted edges
    - Ensure high contrast for accessibility
    - Support both light and dark themes
    - _Requirements: 3.3_

- [x] 10. Ensure branch data persistence
  - [x] 10.1 Verify branch metadata in project snapshot
    - Confirm `branchId`, `parentNodeId`, `branchIndex` are saved
    - Confirm edge branch metadata is saved
    - Test save/load cycle preserves branch data
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.2 Test JSON export/import with branches
    - Export project with branches to JSON
    - Import JSON and verify branch structure
    - Verify branch relationships are correct
    - Verify branch visual styling is restored
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 11. Implement branch deletion with cascade
  - [x] 11.1 Add `deleteBranchCascade` method to NodesSlice
    - Find all downstream nodes in branch
    - Remove all branch nodes and edges
    - Preserve sibling branches
    - Update parent node if needed
    - _Requirements: 6.1, 6.2_
  
  - [x] 11.2 Add confirmation dialog for parent node deletion
    - Detect if node has child branches
    - Show confirmation modal with branch count
    - Implement confirm/cancel handlers
    - Call cascade delete on confirmation
    - _Requirements: 6.3, 6.4_
  
  - [x] 11.3 Integrate branch deletion with undo/redo
    - Capture branch state before deletion
    - Add deletion to history stack
    - Implement undo to restore branch
    - Implement redo to re-delete branch
    - _Requirements: 6.5_

- [ ]* 12. Add integration tests for branch workflows
  - Test complete branch creation flow
  - Test context isolation between branches
  - Test branch navigation in Inspector
  - Test branch deletion scenarios
  - Test persistence and restoration
  - _Requirements: All_

- [ ]* 13. Add accessibility features
  - Add ARIA labels to branch badges
  - Add keyboard navigation for branch path
  - Add screen reader announcements for branch actions
  - Test with keyboard-only navigation
  - Test with screen reader
  - _Requirements: 3.1, 4.1, 4.2_

- [ ]* 14. Performance optimization
  - Memoize `getBranchPath` and `getSiblingBranches` results
  - Add lazy loading for branch metadata calculation
  - Profile rendering performance with many branches
  - Optimize edge rendering for branch edges
  - _Requirements: All_
