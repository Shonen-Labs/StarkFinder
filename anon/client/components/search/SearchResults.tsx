'use client';

import { Building2, Users, Layers, TrendingUp, FileText, ExternalLink, CheckCircle, Eye, DollarSign, BarChart3 } from 'lucide-react';
import { SearchResult } from '@/app/search/page';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  searchQuery?: string;
}

const categoryIcons = {
  companies: Building2,
  users: Users,
  protocols: Layers,
  trading: TrendingUp,
  research: FileText,
  all: FileText,
};

const categoryColors = {
  companies: 'text-green-400 bg-green-500/10',
  users: 'text-purple-400 bg-purple-500/10',
  protocols: 'text-blue-400 bg-blue-500/10',
  trading: 'text-orange-400 bg-orange-500/10',
  research: 'text-cyan-400 bg-cyan-500/10',
  all: 'text-gray-400 bg-gray-500/10',
};

function ResultCard({ result }: { result: SearchResult }) {
  const Icon = categoryIcons[result.category];
  const colorClass = categoryColors[result.category];

  return (
    <div className="group bg-gray-800/30 border border-gray-700 rounded-xl p-6 
      hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200
      transform hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                {result.title}
              </h3>
              {result.verified && (
                <CheckCircle className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${colorClass} capitalize`}>
              {result.category}
            </span>
          </div>
        </div>
        
        {result.url && (
          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
            p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white">
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-4 leading-relaxed">
        {result.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {result.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-md
              border border-gray-600 hover:border-gray-500 transition-colors duration-200"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        {result.tvl && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>TVL: {result.tvl}</span>
          </div>
        )}
        {result.volume24h && (
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>24h Vol: {result.volume24h}</span>
          </div>
        )}
        {result.followers && (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{result.followers.toLocaleString()} followers</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
          <div>
            <div className="w-32 h-6 bg-gray-700 rounded mb-2"></div>
            <div className="w-20 h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
      <div className="w-full h-4 bg-gray-700 rounded mb-2"></div>
      <div className="w-3/4 h-4 bg-gray-700 rounded mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="w-16 h-6 bg-gray-700 rounded"></div>
        <div className="w-20 h-6 bg-gray-700 rounded"></div>
        <div className="w-12 h-6 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export default function SearchResults({ results, isLoading, searchQuery }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-12">
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-12">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {searchQuery ? 'No results found' : 'Start your search'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No results found for "${searchQuery}". Try different keywords or browse categories.`
              : 'Enter a search term to discover companies, protocols, users, and opportunities in the Starknet ecosystem.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Results Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {results.length} {results.length === 1 ? 'Result' : 'Results'}
          {searchQuery && (
            <span className="text-gray-400"> for "{searchQuery}"</span>
          )}
        </h2>
        <p className="text-gray-400">
          Discover the best of the Starknet ecosystem
        </p>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>

      {/* Load More Button (for future pagination) */}
      {results.length > 0 && (
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 
            hover:border-gray-500 rounded-xl text-white transition-all duration-200
            transform hover:scale-105">
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}