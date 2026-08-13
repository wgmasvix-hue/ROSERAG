'use client';

import React, { useState, useCallback } from 'react';
import { Search, Loader, AlertCircle, ExternalLink } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { searchDocuments } from '@/lib/api';
import { debounce, formatDate } from '@/lib/utils';

export default function SearchPanel() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setSearching,
  } = useChatStore();

  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        setError(null);
        const results = await searchDocuments(query, 10);
        setSearchResults(results);
        setHasSearched(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        setSearching(true);
        setError(null);
        const results = await searchDocuments(searchQuery, 10);
        setSearchResults(results);
        setHasSearched(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
      } finally {
        setSearching(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4">
        <h1 className="heading-3">Search Documents</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search across all institutional documents in DARE
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search documents, authors, topics..."
              className="flex-1 input-base"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary flex items-center justify-center gap-2 px-6"
            >
              {isSearching ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              📄 All Types
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              📅 Any Date
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              ⭐ Any Relevance
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {error && (
          <div className="p-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-lg flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!hasSearched && !searchQuery && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-dare-100 dark:bg-dare-900 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-dare-600 dark:text-dare-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start Searching
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              Enter keywords to search across all documents in the DARE repository
            </p>
          </div>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-dare-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Searching documents...
              </p>
            </div>
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No results found for "{searchQuery}"
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Try different keywords or browse collections
            </p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {searchResults.length} document
              {searchResults.length !== 1 ? 's' : ''}
            </p>

            {searchResults.map((result) => (
              <div
                key={result.id}
                className="card-hover p-4 space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white hover:text-dare-600 dark:hover:text-dare-400">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {result.title}
                      </a>
                    </h3>
                    {result.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        By {result.author}
                      </p>
                    )}
                  </div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Open document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {result.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {result.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                  {result.date && <span>📅 {result.date}</span>}
                  {result.document_type && (
                    <span>📄 {result.document_type}</span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-dare-500"
                        style={{ width: `${result.score * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(result.score * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
