'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Search,
  BookOpen,
  Plus,
  Trash2,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ConversationItem {
  id: string;
  title: string;
  date: Date;
}

export default function Sidebar() {
  const {
    sidebarOpen,
    activeTab,
    setActiveTab,
    messages,
    clearMessages,
  } = useChatStore();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'chat':
        return <MessageCircle className="w-5 h-5" />;
      case 'search':
        return <Search className="w-5 h-5" />;
      case 'collections':
        return <BookOpen className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const tabItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'collections', label: 'Collections', icon: BookOpen },
  ];

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      {/* New Conversation Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            clearMessages();
            setActiveTab('chat');
          }}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-2 mb-6">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conversation History */}
        {activeTab === 'chat' && conversations.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-3">
              History
            </p>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg truncate transition-colors"
                  title={conv.title}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Quick Tips */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="bg-dare-50 dark:bg-dare-900/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-dare-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-dare-900 dark:text-dare-100 mb-1">
                Quick Tips
              </p>
              <ul className="text-xs text-dare-700 dark:text-dare-200 space-y-1">
                <li>• Ask questions naturally</li>
                <li>• Use filters to refine</li>
                <li>• Check source citations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
