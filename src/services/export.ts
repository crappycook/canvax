import { type ProjectSnapshot } from '@/types'

export interface ExportFormat {
  id: string
  name: string
  extension: string
  mimeType: string
}

export class ExportService {
  getSupportedFormats(): ExportFormat[] {
    return [
      {
        id: 'markdown',
        name: 'Markdown',
        extension: '.md',
        mimeType: 'text/markdown'
      },
      {
        id: 'json',
        name: 'JSON',
        extension: '.json',
        mimeType: 'application/json'
      },
      {
        id: 'png',
        name: 'PNG Image',
        extension: '.png',
        mimeType: 'image/png'
      }
    ]
  }

  async exportToMarkdown(project: ProjectSnapshot): Promise<Blob> {
    const content = this.generateMarkdownContent(project)
    return new Blob([content], { type: 'text/markdown' })
  }

  async exportToJSON(project: ProjectSnapshot): Promise<Blob> {
    const content = JSON.stringify(project, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  async exportToImage(project: ProjectSnapshot, format: 'png' | 'svg'): Promise<Blob> {
    // TODO: Implement actual image export using html-to-image or canvas API
    // For now, return a placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000000'
      ctx.font = '16px Arial'
      ctx.fillText(`Canvas Export: ${project.metadata.title}`, 20, 30)
    }
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob())
      }, `image/${format}`)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exportMultipleProjects(_projectIds: string[], _format: string): Promise<Blob> {
    // TODO: Implement batch export
    // For now, return empty blob
    return new Blob()
  }

  private generateMarkdownContent(project: ProjectSnapshot): string {
    const lines: string[] = []
    
    lines.push(`# ${project.metadata.title}`)
    lines.push(`\n**Last Updated:** ${new Date(project.metadata.updatedAt).toLocaleString()}`)
    lines.push('')
    
    // Add node content
    project.graph.nodes.forEach((node) => {
      const nodeData = node.data
      lines.push(`## ${nodeData.label || 'Untitled Node'}`)
      lines.push(`\n**Model:** ${nodeData.model || 'Unknown'}`)
      lines.push(`\n**Prompt:** ${nodeData.prompt || 'No prompt'}`)
      
      if (nodeData.messages && nodeData.messages.length > 0) {
        lines.push('\n### Messages:')
        nodeData.messages.forEach((message) => {
          lines.push(`\n**${message.role.toUpperCase()}:**`)
          lines.push(message.content)
          lines.push('')
        })
      }
      
      lines.push('')
    })
    
    return lines.join('\n')
  }
}

export const exportService = new ExportService()