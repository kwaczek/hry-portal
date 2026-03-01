'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@hry/shared';
import { QUICK_REACTIONS, CHAT_MAX_LENGTH } from '@hry/shared';

interface GameChatProps {
  messages: ChatMessage[];
  isGuest: boolean;
  onSend: (text: string) => void;
  onReaction: (emoji: string) => void;
  onClose: () => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function GameChat({ messages, isGuest, onSend, onReaction, onClose }: GameChatProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <div className="fixed top-14 right-0 bottom-0 z-20 w-full sm:w-80 flex flex-col bg-bg-root/95 backdrop-blur-xl border-l border-border-default animate-[fadeIn_0.15s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-text-secondary">
          Hospodský pokec
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-text-faint hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-xs text-text-faint py-8">
            Zatím žádné zprávy
          </p>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick reactions */}
      <div className="px-3 py-2 border-t border-border-subtle">
        <div className="flex gap-1 justify-center">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction(emoji)}
              className="w-8 h-8 rounded-md text-base hover:bg-bg-hover active:scale-90 transition-all cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      {isGuest ? (
        <div className="px-4 py-3 border-t border-border-subtle text-center">
          <p className="text-xs text-text-faint">
            Pro psaní zpráv se přihlas
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-3 py-2 border-t border-border-subtle">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, CHAT_MAX_LENGTH))}
                placeholder="Napiš zprávu..."
                className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-400/30 transition-colors"
              />
              {text.length > CHAT_MAX_LENGTH * 0.8 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-faint">
                  {text.length}/{CHAT_MAX_LENGTH}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2 rounded-lg bg-amber-500 text-bg-root disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.type === 'system') {
    return (
      <div className="text-center py-1">
        <span className="text-[11px] text-text-faint italic">{message.content}</span>
      </div>
    );
  }

  if (message.type === 'reaction') {
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <span className="text-[11px] text-text-muted">{message.senderName}</span>
        <span className="text-base">{message.content}</span>
      </div>
    );
  }

  return (
    <div className="group py-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-medium text-amber-400/70 flex-shrink-0">
          {message.senderName}
        </span>
        <span className="text-[10px] text-text-faint opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <p className="text-sm text-text-secondary break-words leading-snug">
        {message.content}
      </p>
    </div>
  );
}
