"use client";

import React, { useState, useEffect } from "react";
import { TimeframeWidgetProps } from "@/lib/review/types";
import { getAvailableTimeframes } from "@/lib/review/api";
import { ChevronDown } from "lucide-react";

export const TimeframeWidget: React.FC<TimeframeWidgetProps> = ({
  selectedTimeframe,
  onTimeframeChange,
  availableTimeframes: propAvailableTimeframes,
}) => {
  const [availableTimeframes, setAvailableTimeframes] = useState<string[]>(
    propAvailableTimeframes || []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!propAvailableTimeframes) {
      loadAvailableTimeframes();
    }
  }, [propAvailableTimeframes]);

  const loadAvailableTimeframes = async () => {
    setIsLoading(true);
    try {
      const timeframes = await getAvailableTimeframes();
      setAvailableTimeframes(timeframes);
    } catch (error) {
      console.error("Failed to load timeframes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeSelect = (timeframe: string) => {
    onTimeframeChange(timeframe);
    setIsOpen(false);
  };

  const defaultTimeframes = [
    "Last 24 hours",
    "Last week",
    "Last month",
    "Last 3 months",
    "Last 6 months",
    "Last year",
    "All time",
  ];

  const timeframesToUse = availableTimeframes.length > 0 ? availableTimeframes : defaultTimeframes;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-grayscale-100 mb-2">
        Timeframe
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left bg-black-scale-400 border border-purple rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple text-white"
          disabled={isLoading}
        >
          <div className="flex items-center justify-between">
            <span className={selectedTimeframe ? "text-white" : "text-grayscale-600"}>
              {selectedTimeframe || "Select a timeframe"}
            </span>
            <ChevronDown
              size={16}
              className={`text-grayscale-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-black-scale-400 border border-purple rounded-lg shadow-lg">
            <div className="py-1">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-grayscale-600">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple"></div>
                    <span>Loading timeframes...</span>
                  </div>
                </div>
              ) : (
                timeframesToUse.map((timeframe) => (
                  <button
                    key={timeframe}
                    type="button"
                    onClick={() => handleTimeframeSelect(timeframe)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-purple/20 focus:outline-none focus:bg-purple/20 ${
                      selectedTimeframe === timeframe
                        ? "bg-purple/20 text-purple"
                        : "text-grayscale-100"
                    }`}
                  >
                    {timeframe}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
