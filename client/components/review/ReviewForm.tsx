"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReviewFormData, SafetyCheck } from "@/lib/review/types";
import { reviewFormSchema } from "@/lib/review/validation";
import { checkSafety } from "@/lib/review/api";
import { debounce } from "@/lib/review/utils";
import { CharacterCounter } from "./CharacterCounter";
import { SafetyIndicator } from "./SafetyIndicator";
import { TagSelector } from "./TagSelector";
import { TimeframeWidget } from "./TimeframeWidget";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ReviewFormData>;
  maxLength?: number;
  isSubmitting?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  maxLength = 5000,
  isSubmitting = false,
}) => {
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck>({
    isToxic: false,
    hasPII: false,
    toxicityScore: 0,
    piiDetected: [],
    warnings: [],
  });
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      content: initialData?.content || "",
      tags: initialData?.tags || [],
      timeframe: initialData?.timeframe || "",
    },
  });

  const watchedContent = watch("content");
  const watchedTags = watch("tags");
  const watchedTimeframe = watch("timeframe");

  // Debounced safety check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSafetyCheck = useCallback(
    debounce(async (content: string) => {
      if (content.length < 10) {
        setSafetyCheck({
          isToxic: false,
          hasPII: false,
          toxicityScore: 0,
          piiDetected: [],
          warnings: [],
        });
        return;
      }

      setIsCheckingSafety(true);
      try {
        const result = await checkSafety(content);
        setSafetyCheck(result);
      } catch (error) {
        console.error("Safety check failed:", error);
      } finally {
        setIsCheckingSafety(false);
      }
    }, 500),
    [setSafetyCheck, setIsCheckingSafety, checkSafety]
  );

  // Trigger safety check when content changes
  useEffect(() => {
    debouncedSafetyCheck(watchedContent);
  }, [watchedContent, debouncedSafetyCheck]);

  const handleFormSubmit = async (data: ReviewFormData) => {
    // Check if there are safety warnings
    if (safetyCheck.isToxic || safetyCheck.hasPII) {
      const confirmed = window.confirm(
        "This content has been flagged for potential issues. Are you sure you want to submit?"
      );
      if (!confirmed) {
        return;
      }
    }

    await onSubmit(data);
  };

  const handleTagsChange = (tags: string[]) => {
    setValue("tags", tags, { shouldValidate: true });
  };

  const handleTimeframeChange = (timeframe: string) => {
    setValue("timeframe", timeframe, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Content Textarea */}
      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-grayscale-100">
          Review Content
        </label>
        <textarea
          id="content"
          {...register("content")}
          rows={8}
          placeholder="Write your review here..."
          className="w-full px-4 py-3 bg-black-scale-400 border border-purple rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple resize-vertical text-white placeholder-grayscale-600"
          maxLength={maxLength}
        />
        {errors.content && (
          <p className="text-sm text-orange-bright">{errors.content.message}</p>
        )}

        {/* Character Counter */}
        <CharacterCounter
          currentLength={watchedContent.length}
          maxLength={maxLength}
        />
      </div>

      {/* Safety Indicator */}
      {showSafetyWarning && (
        <SafetyIndicator
          safetyCheck={safetyCheck}
          isChecking={isCheckingSafety}
          onDismiss={() => setShowSafetyWarning(false)}
        />
      )}

      {/* Tag Selector */}
      <div className="space-y-2">
        <TagSelector
          selectedTags={watchedTags}
          onTagsChange={handleTagsChange}
          maxTags={10}
        />
        {errors.tags && (
          <p className="text-sm text-orange-bright">{errors.tags.message}</p>
        )}
      </div>

      {/* Timeframe Widget */}
      <div className="space-y-2">
        <TimeframeWidget
          selectedTimeframe={watchedTimeframe}
          onTimeframeChange={handleTimeframeChange}
        />
        {errors.timeframe && (
          <p className="text-sm text-orange-bright">{errors.timeframe.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-purple text-purple hover:bg-purple hover:text-white"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting || isCheckingSafety}
          className="min-w-[100px] bg-purple hover:bg-purple-light text-white font-bold"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </form>
  );
};
