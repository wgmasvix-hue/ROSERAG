'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';
import SearchPanel from '@/components/SearchPanel';
import CollectionsPanel from '@/components/CollectionsPanel';
import { useChatStore } from '@/lib/store';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { activeTab, theme } = useChatStore();

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dare-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dare-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading DARE AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          {activeTab === 'chat' && <ChatPanel />}
          {activeTab === 'search' && <SearchPanel />}
          {activeTab === 'collections' && <CollectionsPanel />}
        </main>
      </div>
    </div>
  );
}
