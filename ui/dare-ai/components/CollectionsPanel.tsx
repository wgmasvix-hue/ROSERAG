'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Loader, AlertCircle, ExternalLink } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { fetchCollections } from '@/lib/api';
import { Collection } from '@/lib/store';

export default function CollectionsPanel() {
  const { collections, setCollections } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCollections();
        setCollections(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load collections';
        setError(errorMessage);
        console.error('Collections error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [setCollections]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-2">
        <h1 className="heading-3">Collections</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and explore all collections in the DARE repository
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {error && (
          <div className="p-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-lg flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error Loading Collections</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-dare-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading collections...
              </p>
            </div>
          </div>
        )}

        {!isLoading && collections.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dare-100 dark:bg-dare-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-dare-600 dark:text-dare-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No collections available
            </p>
          </div>
        )}

        {collections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection) => (
              <CollectionCard key={collection.uuid} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <div className="card-hover p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
            {collection.name}
          </h3>
        </div>
        {collection.url && (
          <a
            href={collection.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Open collection"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {collection.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {collection.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
        {collection.itemCount !== undefined && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            📄 {collection.itemCount} item
            {collection.itemCount !== 1 ? 's' : ''}
          </span>
        )}
        <button
          className="text-sm px-3 py-1.5 bg-dare-100 text-dare-700 dark:bg-dare-900 dark:text-dare-100 rounded hover:bg-dare-200 dark:hover:bg-dare-800 transition-colors"
        >
          Browse
        </button>
      </div>
    </div>
  );
}
