export interface BaseNodeData {
  label: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatNodeData extends BaseNodeData, Record<string, unknown> {
  model: string;
  prompt: string;
  messages: ChatMessage[];
  status: 'idle' | 'running' | 'error' | 'success';
  error?: string;
  temperature?: number;
  maxTokens?: number;
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
  history: any;
}