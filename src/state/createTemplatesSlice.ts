import { type StateCreator } from 'zustand'
import { type Node } from '@xyflow/react'
import { type ChatNodeData } from '@/canvas/types'

export interface TemplatesSlice {
  templates: Array<{
    id: string
    name: string
    description: string
    node: Node<ChatNodeData>
    category: string
  }>
  
  addTemplate: (template: Omit<TemplatesSlice['templates'][0], 'id'>) => void
  removeTemplate: (templateId: string) => void
  applyTemplate: (templateId: string, position: { x: number; y: number }) => void
  getTemplatesByCategory: (category: string) => TemplatesSlice['templates']
}

export const createTemplatesSlice: StateCreator<TemplatesSlice> = (set, get) => ({
  templates: [
    {
      id: 'template-chat',
      name: 'Chat Node',
      description: 'Basic chat node with prompt input',
      category: 'basic',
      node: {
        id: 'template-chat-node',
        type: 'chat',
        position: { x: 0, y: 0 },
        data: {
          title: 'Chat',
          modelId: 'gpt-4',
          prompt: 'Hello! How can I help you today?',
          messages: [],
          status: 'idle'
        }
      }
    },
    {
      id: 'template-summarize',
      name: 'Summarize Node',
      description: 'Node for summarizing content',
      category: 'processing',
      node: {
        id: 'template-summarize-node',
        type: 'chat',
        position: { x: 0, y: 0 },
        data: {
          title: 'Summarize',
          modelId: 'gpt-4',
          prompt: 'Please summarize the following content:',
          messages: [],
          status: 'idle'
        }
      }
    }
  ],

  addTemplate: (template) => {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`
    }
    
    set((state) => ({
      templates: [...state.templates, newTemplate]
    }))
  },

  removeTemplate: (templateId) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId)
    }))
  },

  applyTemplate: (templateId, position) => {
    const state = get()
    const template = state.templates.find((t) => t.id === templateId)
    if (!template) return

    const newNode: Node<ChatNodeData> = {
      ...template.node,
      id: `node-${Date.now()}`,
      position,
      data: {
        ...template.node.data,
        title: template.node.data.title,
        messages: []
      }
    }

    // This would need to be integrated with the nodes slice
    // For now, we'll just return the node to be added
    console.log('Template applied:', newNode)
  },

  getTemplatesByCategory: (category) => {
    const state = get()
    return state.templates.filter((t) => t.category === category)
  }
})