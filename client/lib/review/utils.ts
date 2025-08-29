import { SafetyCheck } from "./types";

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const getCharacterCountColor = (
  currentLength: number,
  maxLength: number,
  warningThreshold: number = 0.8,
  criticalThreshold: number = 0.95
): string => {
  const ratio = currentLength / maxLength;

  if (ratio >= criticalThreshold) {
    return "text-orange-bright";
  }

  if (ratio >= warningThreshold) {
    return "text-purple";
  }

  return "text-grayscale-100";
};

export const getSafetyIndicatorColor = (safetyCheck: SafetyCheck): string => {
  if (safetyCheck.isToxic || safetyCheck.hasPII) {
    return "text-orange-bright";
  }

  if (safetyCheck.toxicityScore > 0.5) {
    return "text-purple";
  }

  return "text-grayscale-100";
};

export const getSafetyIndicatorIcon = (safetyCheck: SafetyCheck): string => {
  if (safetyCheck.isToxic || safetyCheck.hasPII) {
    return "⚠️";
  }

  if (safetyCheck.toxicityScore > 0.5) {
    return "⚠️";
  }

  return "✅";
};

export const formatCharacterCount = (current: number, max: number): string => {
  return `${current}/${max}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + "...";
};

export const generateReviewId = (): string => {
  return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
