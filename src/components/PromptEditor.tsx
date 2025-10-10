import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Textarea } from './ui/textarea'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  onEnter?: () => void
}

export const PromptEditor = forwardRef<HTMLTextAreaElement, PromptEditorProps>(
  ({
    value,
    onChange,
    placeholder = 'Enter your prompt...',
    disabled = false,
    autoFocus = false,
    onEnter,
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => textareaRef.current, [])

    useEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value])

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without Shift triggers execution
      if (event.key === 'Enter' && !event.shiftKey && onEnter) {
        event.preventDefault()
        onEnter()
      }
      // Shift+Enter allows newline (default behavior)
    }

    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="min-h-[80px] resize-none overflow-hidden"
        rows={3}
      />
    )
  }
)

PromptEditor.displayName = 'PromptEditor'