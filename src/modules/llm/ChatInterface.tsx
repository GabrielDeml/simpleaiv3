import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { useLLMStore } from '../../stores/useLLMStore';

export function ChatInterface() {
  const { messages, isGenerating, currentResponse, error, sendMessage, stopGenerating } =
    useLLMStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    setInput('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            Send a message to start chatting with the model.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text border border-border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isGenerating && currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-surface-light text-text border border-border">
              {currentResponse}
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse" />
            </div>
          </div>
        )}

        {/* Generating indicator (no text yet) */}
        {isGenerating && !currentResponse && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2.5 text-sm bg-surface-light text-text-muted border border-border">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="rounded-lg px-4 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isGenerating}
            rows={1}
            className="flex-1 resize-none rounded-lg bg-surface-light border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          {isGenerating ? (
            <button
              onClick={stopGenerating}
              className="shrink-0 p-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Stop generating"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 p-2.5 rounded-lg bg-primary hover:bg-primary-light text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
