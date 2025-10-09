import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Textarea } from './ui/textarea'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
}

export const PromptEditor = forwardRef<HTMLTextAreaElement, PromptEditorProps>(
  ({
    value,
    onChange,
    placeholder = 'Enter your prompt...',
    disabled = false,
    autoFocus = false,
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

    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
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