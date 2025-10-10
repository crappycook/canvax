# Context Collection Flow Diagram

## Before Optimization

```
Input Node (A) → Execute
  ↓
Simple DFS traversal
  ↓
Messages collected in arbitrary order
  ↓
Possible duplicates
  ↓
No error checking
  ↓
LLM Request
```

## After Optimization

```
Input Node (A) → Execute
  ↓
1. BFS to identify all upstream nodes
  ↓
2. Topological sort (Kahn's algorithm)
   - Ensures proper dependency order
   - Handles complex graphs (diamond, multi-path)
  ↓
3. Collect messages in topological order
   - Process nodes: [Root → ... → Parent]
   - Extract messages from each node
  ↓
4. Deduplicate messages
   - Key: role:content:timestamp
   - Preserves first occurrence
  ↓
5. Sort by timestamp
   - Maintains conversation chronology
   - Ensures proper context flow
  ↓
6. Error detection
   - Check each node status
   - Track error nodes
   - Mark context completeness
  ↓
7. Context integrity check
   - Log warnings if errors found
   - Set warning on node
   - Allow execution to proceed
  ↓
8. Combine context + current prompt
   - [...context.messages, currentPrompt]
  ↓
LLM Request with optimized context
```

## Example: Diamond Graph

```
        Node A (user: "Hello")
       /                    \
Node B (asst: "Hi")    Node C (asst: "Hey")
       \                    /
        Node D (Execute)
```

### Collection Process:

1. **BFS from D**: Identifies {B, C, A}
2. **Topological Sort**: [A, B, C] or [A, C, B]
3. **Message Collection**:
   - From A: "Hello" (timestamp: 1000)
   - From B: "Hi" (timestamp: 2000)
   - From C: "Hey" (timestamp: 2500)
4. **Deduplication**: All unique, keep all
5. **Timestamp Sort**: ["Hello", "Hi", "Hey"]
6. **Final Context**: 
   ```
   [
     { role: 'user', content: 'Hello' },
     { role: 'assistant', content: 'Hi' },
     { role: 'assistant', content: 'Hey' }
   ]
   ```

## Error Handling Example

```
Node A (status: error, error: "API timeout")
  ↓
Node B (Execute)
```

### Detection:

1. Collect context from A
2. Detect A has error status
3. Set `hasErrors = true`
4. Add A to `errorNodes`
5. Set `isComplete = false`
6. Log warning: "⚠️ Context integrity warning: Upstream nodes have errors: Node A"
7. Set node warning (non-blocking)
8. Execution proceeds with warning

## Benefits

### Correctness
- ✅ Proper topological ordering
- ✅ No duplicate messages
- ✅ Chronological conversation flow

### Robustness
- ✅ Error detection
- ✅ Context integrity checking
- ✅ Handles complex graph topologies

### Performance
- ✅ Efficient BFS traversal
- ✅ O(V + E) topological sort
- ✅ O(n) deduplication with Map

### User Experience
- ✅ Clear warnings for issues
- ✅ Non-blocking execution
- ✅ Predictable behavior
