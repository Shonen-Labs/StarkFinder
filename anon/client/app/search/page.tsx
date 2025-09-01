'use client';

import { useState, useRef, useEffect } from 'react';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import { Nav } from '@/components/ui/nav';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export type SearchCategory = 'all' | 'companies' | 'users' | 'protocols' | 'trading' | 'research';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  tags: string[];
  url?: string;
  verified?: boolean;
  tvl?: string;
  volume24h?: string;
  followers?: number;
}

// Mock data for demonstration
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Starknet Foundation',
    description: 'The foundation behind the Starknet Layer 2 scaling solution for Ethereum',
    category: 'companies',
    tags: ['Layer 2', 'Scaling', 'ZK-STARK'],
    verified: true,
    followers: 25000
  },
  {
    id: '2',
    title: 'JediSwap',
    description: 'Community-led AMM on Starknet providing efficient token swaps',
    category: 'protocols',
    tags: ['DEX', 'AMM', 'DeFi'],
    verified: true,
    tvl: '$12.5M',
    volume24h: '$2.1M'
  },
  {
    id: '3',
    title: 'mySwap',
    description: 'The first AMM on Starknet with advanced trading features',
    category: 'protocols',
    tags: ['DEX', 'AMM', 'Trading'],
    verified: true,
    tvl: '$8.3M',
    volume24h: '$1.8M'
  },
  {
    id: '4',
    title: 'Starknet Alpha Research',
    description: 'Deep dive into Starknet\'s roadmap and upcoming Cairo 1.0 features',
    category: 'research',
    tags: ['Research', 'Cairo', 'Technical Analysis'],
  },
  {
    id: '5',
    title: 'Alice Chen',
    description: 'Core developer at Starknet, specializing in Cairo smart contracts',
    category: 'users',
    tags: ['Developer', 'Cairo', 'Smart Contracts'],
    followers: 3200
  },
  {
    id: '6',
    title: 'StarkEx Trading Bot',
    description: 'Automated trading strategies optimized for Starknet DEXs',
    category: 'trading',
    tags: ['Bot', 'Trading', 'Automation'],
  }
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Initialize page with animations
  useGSAP(() => {
    if (!isInitialized) {
      // Set initial states
      gsap.set([headerRef.current, searchSectionRef.current], {
        opacity: 0,
        y: 30
      });

      // Entrance animation sequence
      const tl = gsap.timeline({
        onComplete: () => setIsInitialized(true)
      });

      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2
      })
      .to(searchSectionRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.4");
    }
  }, [isInitialized]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    
    // Animate results out if they exist
    if (results.length > 0) {
      gsap.to(resultsRef.current, {
        opacity: 0.3,
        scale: 0.98,
        duration: 0.2,
        ease: "power2.out"
      });
    }
    
    // Simulate API call delay
    setTimeout(() => {
    let filteredResults: SearchResult[];
    
    if (query.trim() === '') {
        filteredResults = [];
    } else {
        filteredResults = mockResults.filter(result =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase()) ||
            result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
    }
    
    setResults(filteredResults);
    setIsLoading(false);

      // Animate results in
      if (filteredResults.length > 0) {
        gsap.fromTo(resultsRef.current, 
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            duration: 0.6, 
            ease: "power3.out",
            delay: 0.1
          }
        );
      }
    }, 300);
  };

  const handleCategoryChange = (category: SearchCategory) => {
    setSelectedCategory(category);
    
    // Animate filter change
    gsap.to(resultsRef.current, {
      opacity: 0.7,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        let filteredResults;
        
        if (searchQuery.trim() === '') {
          // Show sample results for category exploration
          filteredResults = category === 'all' ? mockResults.slice(0, 3) : mockResults.filter(result => result.category === category);
        } else {
          // Filter search results by category
          const searchFiltered = mockResults.filter(result =>
            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          
          filteredResults = category === 'all' ? searchFiltered : searchFiltered.filter(result => result.category === category);
        }
        
        setResults(filteredResults);
        
        gsap.to(resultsRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power3.out"
        });
      }
    });
  };

  const filteredResults = selectedCategory === 'all' 
    ? results 
    : results.filter(result => result.category === selectedCategory);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#121212] text-[#FFFAFA] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      <Nav />
      
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 font-['Neutral_Face'] leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Discover
            </span>
            <br />
            <span className="text-white">
              The Starknet Universe
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Navigate the future of Layer 2 scaling. Find companies, protocols, developers, 
            and opportunities shaping the Starknet ecosystem.
          </p>
        </div>

        {/* Search Interface */}
        <div ref={searchSectionRef} className="space-y-8">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search companies, protocols, developers, research..."
            isLoading={isLoading}
          />
          
          <SearchFilters 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            resultCounts={{
              all: mockResults.length,
              companies: mockResults.filter(r => r.category === 'companies').length,
              users: mockResults.filter(r => r.category === 'users').length,
              protocols: mockResults.filter(r => r.category === 'protocols').length,
              trading: mockResults.filter(r => r.category === 'trading').length,
              research: mockResults.filter(r => r.category === 'research').length,
            }}
          />

          <div ref={resultsRef}>
            <SearchResults 
              results={filteredResults}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </div>

          {/* Getting Started Section - shown when no search */}
          {!searchQuery && results.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-6 font-['Neutral_Face']">
                  Start Exploring
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Begin your journey through the Starknet ecosystem by searching for projects, 
                  developers, or browse by category to discover what's building the future of scaling.
                </p>
                
                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Top Protocols', desc: 'Explore leading DeFi platforms', category: 'protocols' as SearchCategory },
                    { title: 'Key Companies', desc: 'Meet ecosystem builders', category: 'companies' as SearchCategory },
                    { title: 'Latest Research', desc: 'Stay updated on developments', category: 'research' as SearchCategory }
                  ].map((card, index) => (
                    <button
                      key={index}
                      onClick={() => handleCategoryChange(card.category)}
                      className="p-6 bg-gray-800/30 border border-gray-700/50 rounded-xl 
                        hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-300
                        transform hover:scale-105 hover:shadow-xl hover:shadow-black/20
                        group"
                    >
                      <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}