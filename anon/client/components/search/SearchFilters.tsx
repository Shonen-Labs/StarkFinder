'use client';

import { Building2, Users, Layers, TrendingUp, FileText, Search } from 'lucide-react';
import { SearchCategory } from '@/app/search/page';

interface SearchFiltersProps {
  selectedCategory: SearchCategory;
  onCategoryChange: (category: SearchCategory) => void;
  resultCounts: Record<SearchCategory, number>;
}

const categoryConfig = {
  all: {
    label: 'All Results',
    icon: Search,
    color: 'text-gray-400',
    bgColor: 'bg-gray-700/50',
    hoverColor: 'hover:bg-gray-600/50',
    activeColor: 'bg-blue-500/20 border-blue-400/50 text-blue-400',
  },
  companies: {
    label: 'Companies',
    icon: Building2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    hoverColor: 'hover:bg-green-500/20',
    activeColor: 'bg-green-500/20 border-green-400/50 text-green-400',
  },
  users: {
    label: 'Users',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    hoverColor: 'hover:bg-purple-500/20',
    activeColor: 'bg-purple-500/20 border-purple-400/50 text-purple-400',
  },
  protocols: {
    label: 'Protocols',
    icon: Layers,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20',
    activeColor: 'bg-blue-500/20 border-blue-400/50 text-blue-400',
  },
  trading: {
    label: 'Trading',
    icon: TrendingUp,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    hoverColor: 'hover:bg-orange-500/20',
    activeColor: 'bg-orange-500/20 border-orange-400/50 text-orange-400',
  },
  research: {
    label: 'Research',
    icon: FileText,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    hoverColor: 'hover:bg-cyan-500/20',
    activeColor: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400',
  },
};

export default function SearchFilters({ selectedCategory, onCategoryChange, resultCounts }: SearchFiltersProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-3 justify-center">
        {(Object.entries(categoryConfig) as [SearchCategory, typeof categoryConfig[SearchCategory]][]).map(
          ([category, config]) => {
            const Icon = config.icon;
            const isActive = selectedCategory === category;
            const count = resultCounts[category];

            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 
                  transition-all duration-200 font-medium text-sm
                  ${isActive 
                    ? config.activeColor 
                    : `${config.bgColor} ${config.hoverColor} border-transparent text-gray-300 hover:text-white`
                  }
                  transform hover:scale-105 active:scale-95
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{config.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                  ${isActive 
                    ? 'bg-current bg-opacity-20' 
                    : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}