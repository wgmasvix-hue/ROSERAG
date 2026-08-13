import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
  error?: string;
}

export interface Source {
  document: string;
  page: number;
  excerpt: string;
  score: number;
  url?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  author?: string;
  date?: string;
  excerpt?: string;
  score: number;
  url: string;
  document_type?: string;
}

export interface Collection {
  uuid: string;
  name: string;
  description?: string;
  itemCount?: number;
  url?: string;
}

export interface ChatState {
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  isSearching: boolean;
  setSearching: (searching: boolean) => void;

  // Collections
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;
  selectedCollection: Collection | null;
  setSelectedCollection: (collection: Collection | null) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: 'chat' | 'search' | 'collections';
  setActiveTab: (tab: 'chat' | 'search' | 'collections') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // User
  userId: string;
  setUserId: (id: string) => void;
  userName?: string;
  setUserName: (name: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Messages
        messages: [],
        addMessage: (message) =>
          set((state) => ({
            messages: [
              ...state.messages,
              {
                ...message,
                id: `msg_${Date.now()}`,
                timestamp: new Date(),
              },
            ],
          })),
        clearMessages: () => set({ messages: [] }),
        isLoading: false,
        setLoading: (loading) => set({ isLoading: loading }),

        // Search
        searchQuery: '',
        setSearchQuery: (query) => set({ searchQuery: query }),
        searchResults: [],
        setSearchResults: (results) => set({ searchResults: results }),
        isSearching: false,
        setSearching: (searching) => set({ isSearching: searching }),

        // Collections
        collections: [],
        setCollections: (collections) => set({ collections }),
        selectedCollection: null,
        setSelectedCollection: (collection) =>
          set({ selectedCollection: collection }),

        // UI
        sidebarOpen: true,
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        activeTab: 'chat',
        setActiveTab: (tab) => set({ activeTab: tab }),
        theme: 'light',
        setTheme: (theme) => set({ theme }),

        // User
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        setUserId: (id) => set({ userId: id }),
        userName: undefined,
        setUserName: (name) => set({ userName: name }),
      }),
      {
        name: 'dare-ai-store',
        partialize: (state) => ({
          theme: state.theme,
          userId: state.userId,
          userName: state.userName,
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
        }),
      }
    )
  )
);

// Selectors
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsLoading = (state: ChatState) => state.isLoading;
export const selectSearchResults = (state: ChatState) => state.searchResults;
export const selectCollections = (state: ChatState) => state.collections;
export const selectTheme = (state: ChatState) => state.theme;
