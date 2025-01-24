import React from 'react';
import { CheckCircle, Circle, XCircle, Loader2 } from 'lucide-react';

interface StepItem {
  title: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  description?: React.ReactNode;
}

interface StepsProps {
  items: StepItem[];
}

export const Steps: React.FC<StepsProps> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {item.status === 'complete' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {item.status === 'processing' && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {item.status === 'error' && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            {item.status === 'pending' && (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`font-medium ${
              item.status === 'processing' ? 'text-blue-500' :
              item.status === 'complete' ? 'text-green-700' :
              item.status === 'error' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {item.title}
            </span>
            {item.description && (
              <div className="mt-1">{item.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 