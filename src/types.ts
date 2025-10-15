export interface BaseNodeData {
  label: string;
  description?: string;
}

export interface CustomEdgeData {
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export type NodeType = 'input' | 'response' | 'hybrid';

export type NodeErrorType =
  | 'api_key_missing'
  | 'api_key_invalid'
  | 'rate_limit'
  | 'network_error'
  | 'model_not_found'
  | 'context_incomplete'
  | 'unknown';

export interface NodeError {
  type: NodeErrorType;
  message: string;
  retryable: boolean;
  actionLabel?: string;
  actionHandler?: () => void;
}

export interface ChatNodeData extends BaseNodeData, Record<string, unknown> {
  model: string;
  prompt: string;
  messages: ChatMessage[];
  status: 'idle' | 'running' | 'error' | 'success';
  error?: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: number;
  nodeType?: NodeType;
  sourceNodeId?: string;
}

export interface ProjectSnapshot {
  id: string;
  version: number;
  metadata: {
    title: string;
    updatedAt: number;
  };
  graph: {
    nodes: Array<{
      id: string;
      position: { x: number; y: number };
      data: ChatNodeData;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
    viewport: { x: number; y: number; zoom: number };
  };
  settings: {
    defaultModel: string;
    language: 'zh' | 'en';
    autoSave: boolean;
    theme: 'light' | 'dark' | 'system';
    apiKeys: Record<string, string>;
    maxTokens: number;
    temperature: number;
  };
  history: unknown;
}