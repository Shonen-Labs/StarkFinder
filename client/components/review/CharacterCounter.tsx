"use client";

import React from "react";
import { CharacterCounterProps } from "@/lib/review/types";
import { getCharacterCountColor, formatCharacterCount } from "@/lib/review/utils";

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentLength,
  maxLength,
  warningThreshold = 0.8,
  criticalThreshold = 0.95,
}) => {
  const ratio = currentLength / maxLength;
  const colorClass = getCharacterCountColor(
    currentLength,
    maxLength,
    warningThreshold,
    criticalThreshold
  );

  const getProgressColor = () => {
    if (ratio >= criticalThreshold) {
      return "bg-orange-bright";
    }
    if (ratio >= warningThreshold) {
      return "bg-purple";
    }
    return "bg-purple-light";
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className={colorClass === 'text-red-500' ? 'text-orange-bright' : colorClass === 'text-yellow-500' ? 'text-purple' : 'text-grayscale-100'}>
          {formatCharacterCount(currentLength, maxLength)}
        </span>
        {ratio >= warningThreshold && (
          <span className="text-xs text-grayscale-600">
            {ratio >= criticalThreshold ? "Character limit reached!" : "Approaching limit"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-black-scale-400 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>

      {/* Visual indicators */}
      <div className="flex justify-between text-xs text-grayscale-600">
        <span>0</span>
        <span>{Math.floor(maxLength * warningThreshold)}</span>
        <span>{Math.floor(maxLength * criticalThreshold)}</span>
        <span>{maxLength}</span>
      </div>
    </div>
  );
};
