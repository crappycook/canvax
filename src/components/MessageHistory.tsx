import React from 'react';
import type { ChatMessage } from '../types';
import { cn } from '../lib/utils';

interface MessageHistoryProps {
  messages: ChatMessage[];
  className?: string;
  readOnly?: boolean;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({
  messages,
  className,
  readOnly = false,
}) => {
  if (messages.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm italic p-4", className)}>
        {readOnly ? 'No messages to display.' : 'No messages yet. Enter a prompt and run the node to start a conversation.'}
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-4 p-4", className)}
      role={readOnly ? "article" : undefined}
      aria-label={readOnly ? "Message history" : undefined}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "rounded-lg p-3 max-w-[90%]",
            message.role === 'user'
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted",
            readOnly && "cursor-default"
          )}
        >
          <div className="text-sm font-medium mb-1">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};