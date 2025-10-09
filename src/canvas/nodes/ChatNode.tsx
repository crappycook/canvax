import React, { useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BaseNode, BaseNodeContent, BaseNodeFooter, CustomHeader } from '@/components/base-node';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ModelSelector';
import { PromptEditor } from '@/components/PromptEditor';
import { MessageHistory } from '@/components/MessageHistory';
import { useRunNode } from '../../hooks/useRunNode';
import { useStore } from '../../state/store';
import type { ChatNodeData, ChatMessage } from '@/types';
import { cn } from '../../lib/utils';
import { Play, Square, Copy, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface ChatNodeProps extends NodeProps {
  data: ChatNodeData;
}

export const ChatNode = React.memo(({ id, data }: ChatNodeProps) => {
  const nodeId = id!;
  const promptEditorRef = useRef<HTMLTextAreaElement>(null);

  // Cast data to ChatNodeData since it comes from NodeProps
  const nodeData = data as ChatNodeData;

  // Use the store to manage node state
  const {
    updateNode,
    setNodeStatus,
    addMessageToNode,
    clearNodeMessages
  } = useStore();

  const { run, stop, isRunning, canRun, requiresApiKey } = useRunNode(nodeId);


  const handleModelChange = useCallback((newModel: string) => {
    updateNode(nodeId, { model: newModel });
  }, [nodeId, updateNode]);

  const handlePromptChange = useCallback((newPrompt: string) => {
    updateNode(nodeId, { prompt: newPrompt });
  }, [nodeId, updateNode]);

  const handleRun = useCallback(async () => {
    if (!nodeData.prompt?.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: nodeData.prompt,
      timestamp: Date.now(),
    };

    // Add user message to node
    addMessageToNode(nodeId, userMessage);
    setNodeStatus(nodeId, 'running');

    try {
      await run();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `Simulated response from ${nodeData.model}. This would be the actual AI response in a real implementation.`,
        timestamp: Date.now(),
      };

      // Add assistant message and update status
      addMessageToNode(nodeId, assistantMessage);
      setNodeStatus(nodeId, 'success');

      // Clear prompt after sending
      updateNode(nodeId, { prompt: '' });
    } catch (err) {
      setNodeStatus(nodeId, 'error');
    }
  }, [nodeId, nodeData.prompt, nodeData.model, run, addMessageToNode, setNodeStatus, updateNode]);

  const handleStop = useCallback(() => {
    stop();
    setNodeStatus(nodeId, 'idle');
  }, [nodeId, stop, setNodeStatus]);

  const handleCopy = useCallback(() => {
    if (nodeData.messages && nodeData.messages.length > 0) {
      const lastMessage = nodeData.messages[nodeData.messages.length - 1];
      navigator.clipboard.writeText(lastMessage.content);
    }
  }, [nodeData.messages]);

  const handleClear = useCallback(() => {
    clearNodeMessages(nodeId);
    setNodeStatus(nodeId, 'idle');
    updateNode(nodeId, { error: undefined });
  }, [nodeId, clearNodeMessages, setNodeStatus, updateNode]);

  // Focus management
  useEffect(() => {
    if (nodeData.status === 'success' && promptEditorRef.current) {
      promptEditorRef.current.focus();
    }
  }, [nodeData.status]);

  const canRunActual = canRun && !isRunning && nodeData.prompt?.trim().length > 0;
  const canCopyActual = nodeData.messages && nodeData.messages.length > 0;

  return (
    <BaseNode>
      <CustomHeader
        title={nodeData.label}
        description={nodeData.description}
      />
      <Handle type="target" position={Position.Top} />

      <BaseNodeContent>
        <div className="p-4 space-y-4">
          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Model</label>
            <ModelSelector
              value={nodeData.model}
              onValueChange={handleModelChange}
              disabled={isRunning || requiresApiKey}
            />
          </div>

          {/* Prompt Editor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <PromptEditor
              value={nodeData.prompt || ''}
              onChange={handlePromptChange}
              placeholder="Enter your message..."
              disabled={isRunning || requiresApiKey}
              autoFocus
            />
          </div>

          {/* API Key Required Warning */}
          {requiresApiKey && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded text-sm">
              <AlertCircle className="size-4 inline mr-2" />
              API key required to run this node. Please check settings.
            </div>
          )}

          {/* Status Indicator */}
          {nodeData.status !== 'idle' && (
            <div className={cn(
              "flex items-center gap-2 text-sm p-2 rounded",
              nodeData.status === 'running' && "bg-blue-50 text-blue-700",
              nodeData.status === 'success' && "bg-green-50 text-green-700",
              nodeData.status === 'error' && "bg-red-50 text-red-700"
            )}>
              {nodeData.status === 'running' && (
                <>
                  <div className="size-2 bg-blue-600 rounded-full animate-pulse" />
                  <span>Running...</span>
                </>
              )}
              {nodeData.status === 'success' && (
                <>
                  <CheckCircle className="size-4" />
                  <span>Completed</span>
                </>
              )}
              {nodeData.status === 'error' && (
                <>
                  <AlertCircle className="size-4" />
                  <span>{nodeData.error || 'Error occurred'}</span>
                </>
              )}
            </div>
          )}

          {/* Message History */}
          <div className="border rounded-lg">
            <div className="p-2 border-b bg-muted/50">
              <h3 className="text-sm font-medium">Conversation</h3>
            </div>
            <MessageHistory
              messages={nodeData.messages || []}
              className="max-h-40 overflow-y-auto"
            />
          </div>
        </div>
      </BaseNodeContent>

      <Handle type="source" position={Position.Bottom} />

      <BaseNodeFooter>
        <div className="flex justify-between items-center p-2 gap-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={isRunning ? handleStop : handleRun}
              disabled={!canRunActual && !isRunning}
              variant={isRunning ? "outline" : "default"}
            >
              {isRunning ? (
                <>
                  <Square className="size-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="size-3 mr-1" />
                  Run
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={!canCopyActual}
            >
              <Copy className="size-3 mr-1" />
              Copy
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={!nodeData.messages || nodeData.messages.length === 0}
            >
              <Trash2 className="size-3 mr-1" />
              Clear
            </Button>
          </div>

          <span className="text-xs text-muted-foreground">
            {(nodeData.messages || []).length} messages
          </span>
        </div>
      </BaseNodeFooter>
    </BaseNode>
  );
});

ChatNode.displayName = 'ChatNode';