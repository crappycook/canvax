# Requirements Document

## Introduction

The Conversation Branching feature enables users to create multiple independent conversation paths from any Response node in the canvas. This allows users to explore different conversation directions from the same starting point, with each branch maintaining its own isolated context and message history. The feature supports iterative exploration of ideas by allowing users to continue conversations, compare different approaches, and maintain clear visual organization of branching dialogue trees.

## Glossary

- **Canvas System**: The React Flow-based visual workspace where users create and manage conversation nodes
- **Response Node**: A chat node that displays LLM-generated responses and can serve as a branching point
- **Input Node**: A chat node where users enter prompts to send to the LLM
- **Branch**: An independent conversation path that diverges from a parent Response node
- **Branch Context**: The isolated message history specific to a single branch path
- **Parent Node**: The Response node from which a branch originates
- **Branch Path**: The linear sequence of nodes from a branch's root to its current endpoint
- **Node Store**: The Zustand state slice managing node data and operations
- **Edge Store**: The Zustand state slice managing connections between nodes
- **Context Collection Algorithm**: The algorithm that gathers upstream message history for LLM requests

## Requirements

### Requirement 1

**User Story:** As a user, I want to continue a conversation from any Response node, so that I can explore follow-up questions without modifying the original conversation flow

#### Acceptance Criteria

1. WHEN a user clicks a "Continue Conversation" button on a Response node, THE Canvas System SHALL create a new Input node connected to that Response node
2. WHEN the Canvas System creates a continuation Input node, THE Canvas System SHALL automatically position the new node 200 pixels below the parent Response node
3. WHEN a user enters a prompt in the continuation Input node, THE Canvas System SHALL create a new Response node connected to the Input node
4. WHEN the Canvas System creates a continuation Response node, THE Canvas System SHALL automatically position it 200 pixels below its parent Input node
5. WHERE a Response node has multiple branches, THE Canvas System SHALL offset each subsequent branch horizontally by 350 pixels to prevent overlap

### Requirement 2

**User Story:** As a user, I want each conversation branch to maintain its own independent context, so that different branches don't interfere with each other's message history

#### Acceptance Criteria

1. WHEN the Context Collection Algorithm collects upstream context for a branch node, THE Context Collection Algorithm SHALL traverse only the single path from that node to the root
2. WHEN the Context Collection Algorithm encounters multiple upstream nodes, THE Context Collection Algorithm SHALL select only the direct parent node in the current branch path
3. WHEN a branch node executes an LLM request, THE Canvas System SHALL include only messages from nodes in that branch's path
4. THE Context Collection Algorithm SHALL NOT include messages from sibling branches or alternative paths
5. WHEN two branches diverge from the same parent, THE Canvas System SHALL ensure each branch's LLM requests receive independent context

### Requirement 3

**User Story:** As a user, I want to visually identify different branches and their relationships, so that I can easily understand the conversation structure

#### Acceptance Criteria

1. WHEN a node is part of a branch, THE Canvas System SHALL display a branch identifier badge on that node
2. WHEN multiple branches exist from the same parent, THE Canvas System SHALL assign each branch a unique visual indicator
3. WHEN a user selects a branch node, THE Canvas System SHALL highlight all nodes in that branch's path
4. THE Canvas System SHALL render branch edges with visual styling that distinguishes them from non-branch connections
5. WHERE branches overlap visually, THE Canvas System SHALL apply automatic layout adjustments to maintain readability

### Requirement 4

**User Story:** As a user, I want to navigate between branches and understand branch relationships, so that I can efficiently manage complex conversation trees

#### Acceptance Criteria

1. WHEN a user selects a branch node, THE Inspector Panel SHALL display the complete branch path as a breadcrumb navigation
2. WHEN a user clicks a node in the branch path breadcrumb, THE Canvas System SHALL focus the viewport on that node
3. WHEN a user selects a parent node with multiple branches, THE Inspector Panel SHALL list all child branches with their identifiers
4. WHEN a user clicks a branch in the Inspector Panel branch list, THE Canvas System SHALL focus the viewport on that branch's first node
5. THE Inspector Panel SHALL display branch metadata including branch depth and message count

### Requirement 5

**User Story:** As a user, I want branch data to persist across sessions, so that I can continue working with branched conversations after closing and reopening a project

#### Acceptance Criteria

1. WHEN the Canvas System saves a project, THE Node Store SHALL persist branch metadata for all branch nodes
2. WHEN the Canvas System loads a project, THE Node Store SHALL restore branch relationships and identifiers
3. WHEN the Canvas System exports a project to JSON, THE Canvas System SHALL include branch metadata in the export
4. WHEN the Canvas System imports a project from JSON, THE Canvas System SHALL reconstruct branch relationships correctly
5. THE Canvas System SHALL maintain branch visual styling and layout after project reload

### Requirement 6

**User Story:** As a user, I want to delete branches without affecting other branches, so that I can clean up unwanted conversation paths

#### Acceptance Criteria

1. WHEN a user deletes a branch node, THE Canvas System SHALL remove all downstream nodes in that branch
2. WHEN a user deletes a branch node, THE Canvas System SHALL preserve sibling branches and their parent node
3. WHEN a user deletes a parent node with branches, THE Canvas System SHALL prompt for confirmation
4. WHEN a user confirms deletion of a parent node with branches, THE Canvas System SHALL remove the parent and all its branch descendants
5. THE Canvas System SHALL support undo/redo operations for branch deletion actions
