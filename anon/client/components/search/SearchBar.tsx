'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import gsap from 'gsap';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, placeholder = "Search...", isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    
    // Animate clear action
    if (inputRef.current) {
      gsap.fromTo(inputRef.current, 
        { scale: 0.98 },
        { scale: 1, duration: 0.2, ease: "power2.out" }
      );
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    
    // Animate focus
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Animate blur
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        ref={containerRef}
        className="relative group transition-all duration-300"
      >
        {/* Animated gradient background */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-cyan-400/10 
          transition-opacity duration-300 blur-sm -z-10
          ${isFocused ? 'opacity-100' : 'opacity-0'}
        `} />
        
        {/* Search Icon */}
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
          <Search className={`h-6 w-6 transition-all duration-300 ${
            isFocused ? 'text-blue-400 scale-110' : 'text-gray-400'
          }`} />
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full h-16 pl-16 pr-16 text-lg bg-gray-800/40 backdrop-blur-md border-2 rounded-2xl 
            transition-all duration-300 font-medium
            placeholder:text-gray-500 text-white
            focus:outline-none focus:bg-gray-800/60
            hover:bg-gray-800/50
            ${isFocused 
              ? 'border-blue-400/50 shadow-xl shadow-blue-500/10' 
              : 'border-gray-700/50 hover:border-gray-600/50'
            }
          `}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 
              p-2 rounded-full hover:bg-gray-700/50 transition-all duration-300
              text-gray-400 hover:text-white hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Enhanced Popular Searches */}
      {query === '' && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-4 font-medium">Discover popular searches:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { term: 'JediSwap', category: 'DEX' },
              { term: 'mySwap', category: 'AMM' },
              { term: 'Starknet Foundation', category: 'Company' },
              { term: 'Cairo', category: 'Language' },
              { term: 'StarkEx', category: 'Protocol' }
            ].map(({ term, category }) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="group px-4 py-2 bg-gray-800/30 hover:bg-gray-700/40 
                  rounded-xl border border-gray-700/50 hover:border-gray-600/50
                  transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                  backdrop-blur-sm"
              >
                <span className="text-gray-300 group-hover:text-white font-medium text-sm">
                  {term}
                </span>
                <span className="text-xs text-gray-500 ml-2 group-hover:text-gray-300">
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}