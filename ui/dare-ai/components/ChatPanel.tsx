'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { sendChatMessage, askQuestion } from '@/lib/api';
import { formatDate, copyToClipboard, formatConfidence } from '@/lib/utils';
import MessageBubble from './MessageBubble';

export default function ChatPanel() {
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    userId,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message via Rasa
  const handleSendRasa = async (message: string) => {
    try {
      setLoading(true);
      setError(null);

      // Add user message
      addMessage({
        sender: 'user',
        text: message,
      });

      // Send to Rasa
      const responses = await sendChatMessage(message, userId);

      // Add bot responses
      for (const response of responses) {
        if (response.text) {
          addMessage({
            sender: 'bot',
            text: response.text,
          });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send RAG question
  const handleAskQuestion = async (message: string) => {
    try {
      setLoading(true);
      setError(null);

      // Add user message
      addMessage({
        sender: 'user',
        text: message,
      });

      // Check if it's a complex question that needs RAG
      if (message.length > 20 && /[?]/.test(message)) {
        // Use RAG API
        const result = await askQuestion(message);

        addMessage({
          sender: 'bot',
          text: result.answer,
          confidence: result.confidence,
          sources: result.sources,
        });
      } else {
        // Use standard Rasa
        const responses = await sendChatMessage(message, userId);
        for (const response of responses) {
          if (response.text) {
            addMessage({
              sender: 'bot',
              text: response.text,
            });
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process message';
      setError(errorMessage);
      console.error('Question error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    // Try RAG first for complex questions, fallback to Rasa
    await handleAskQuestion(message);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-dare-100 dark:bg-dare-900 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to DARE AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              Ask questions about institutional documents, search the repository, or discover research.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setInput('What research is available on sustainable agriculture?')}
                className="px-4 py-2 text-sm bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100 rounded-lg hover:bg-dare-200 dark:hover:bg-dare-800 transition-colors text-left"
              >
                🔍 Search agriculture research
              </button>
              <button
                onClick={() => setInput('How do I submit a document?')}
                className="px-4 py-2 text-sm bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100 rounded-lg hover:bg-dare-200 dark:hover:bg-dare-800 transition-colors text-left"
              >
                📤 Learn submission process
              </button>
              <button
                onClick={() => setInput('What collections are available?')}
                className="px-4 py-2 text-sm bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100 rounded-lg hover:bg-dare-200 dark:hover:bg-dare-800 transition-colors text-left"
              >
                📚 Browse collections
              </button>
              <button
                onClick={() => setInput('Tell me about DARE')}
                className="px-4 py-2 text-sm bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100 rounded-lg hover:bg-dare-200 dark:hover:bg-dare-800 transition-colors text-left"
              >
                ℹ️ About DARE
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg rounded-tl-none">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about documents, search, or get help..."
              className="flex-1 input-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary flex items-center justify-center gap-2 px-6"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Powered by ROSERAG AI • Questions are indexed and analyzed
          </p>
        </form>
      </div>
    </div>
  );
}
