export interface ReviewData {
  content: string;
  tags: string[];
  timeframe: string;
  userId: string;
  timestamp: Date;
}

export interface SafetyCheck {
  isToxic: boolean;
  hasPII: boolean;
  toxicityScore: number;
  piiDetected: string[];
  warnings: string[];
}

export interface ReviewSubmission {
  success: boolean;
  reviewId?: string;
  requiresVerification?: boolean;
  error?: string;
}

export interface ReviewComposerProps {
  onSubmit: (data: ReviewData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ReviewData>;
  maxLength?: number;
  requiredTags?: string[];
}

export interface SafetyIndicatorProps {
  safetyCheck: SafetyCheck;
  isChecking: boolean;
  onDismiss?: () => void;
}

export interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
  maxTags?: number;
}

export interface TimeframeWidgetProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  availableTimeframes?: string[];
}

export interface ReviewFormData {
  content: string;
  tags: string[];
  timeframe: string;
}
