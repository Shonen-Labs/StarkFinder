"use client";

import React from "react";
import { SafetyIndicatorProps } from "@/lib/review/types";
import { getSafetyIndicatorIcon } from "@/lib/review/utils";
import { X } from "lucide-react";

export const SafetyIndicator: React.FC<SafetyIndicatorProps> = ({
  safetyCheck,
  isChecking,
  onDismiss,
}) => {
  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-purple/10 border border-purple rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple"></div>
        <span className="text-sm text-purple">Checking content safety...</span>
      </div>
    );
  }

  if (!safetyCheck.isToxic && !safetyCheck.hasPII && safetyCheck.warnings.length === 0) {
    return null;
  }

  const icon = getSafetyIndicatorIcon(safetyCheck);

  const getBackgroundColor = () => {
    if (safetyCheck.isToxic || safetyCheck.hasPII) {
      return "bg-orange-bright/10 border-orange-bright";
    }
    return "bg-purple/10 border-purple";
  };

  const getTextColor = () => {
    if (safetyCheck.isToxic || safetyCheck.hasPII) {
      return "text-orange-bright";
    }
    return "text-purple";
  };

  return (
    <div className={`p-3 border rounded-lg ${getBackgroundColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <h4 className={`font-medium ${getTextColor()}`}>
              {safetyCheck.isToxic || safetyCheck.hasPII ? "Content Warning" : "Content Advisory"}
            </h4>
            <div className="mt-1 space-y-1">
              {safetyCheck.isToxic && (
                <p className="text-sm text-orange-bright">
                  This content may contain toxic language. Please review before submitting.
                </p>
              )}
              {safetyCheck.hasPII && (
                <p className="text-sm text-orange-bright">
                  Personal information detected. Please remove any personal details before submitting.
                </p>
              )}
              {safetyCheck.piiDetected.length > 0 && (
                <div className="text-sm text-orange-bright">
                  <p>Detected potential PII:</p>
                  <ul className="list-disc list-inside ml-2">
                    {safetyCheck.piiDetected.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {safetyCheck.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-purple">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-grayscale-600 hover:text-grayscale-100 transition-colors"
            aria-label="Dismiss warning"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
