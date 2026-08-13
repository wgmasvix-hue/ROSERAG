'use client';

import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Message } from '@/lib/store';
import { formatDate, copyToClipboard, formatConfidence } from '@/lib/utils';
import Markdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex ${
        message.sender === 'user' ? 'justify-end' : 'justify-start'
      } animate-slideUp`}
    >
      <div
        className={`max-w-2xl ${
          message.sender === 'user'
            ? 'bg-dare-600 text-white rounded-lg rounded-tr-none'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg rounded-tl-none'
        } px-4 py-3 space-y-3`}
      >
        {/* Message Text */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown
            components={{
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold" {...props} />
              ),
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="bg-black/20 px-1.5 py-0.5 rounded text-sm"
                  {...props}
                />
              ),
              a: ({ node, ...props }) => (
                <a
                  className="underline hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-1" {...props} />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-lg font-bold mb-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base font-bold mb-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm font-bold mb-2" {...props} />
              ),
            }}
          >
            {message.text}
          </Markdown>
        </div>

        {/* Confidence Score */}
        {message.confidence !== undefined && message.sender === 'bot' && (
          <div className="flex items-center gap-2 pt-2 border-t border-black/10">
            <span className="text-xs font-medium">Confidence:</span>
            <div className="flex items-center gap-1">
              <div className="w-24 h-2 bg-black/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    message.confidence >= 0.8
                      ? 'bg-green-500'
                      : message.confidence >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${message.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {formatConfidence(message.confidence)}
              </span>
            </div>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-black/10">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
            >
              {showSources ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              Sources ({message.sources.length})
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-black/10 rounded p-2 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold truncate">
                          {source.document}
                        </p>
                        <p className="text-xs opacity-75">p. {source.page}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium">
                          {Math.round(source.score * 100)}%
                        </p>
                      </div>
                    </div>
                    <p className="opacity-90 line-clamp-2">
                      "{source.excerpt}"
                    </p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs hover:opacity-80"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {message.sender === 'bot' && (
          <div className="flex items-center gap-2 pt-2 border-t border-black/10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs opacity-75">{formatDate(message.timestamp)}</p>
      </div>
    </div>
  );
}
