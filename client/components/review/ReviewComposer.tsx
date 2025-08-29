"use client";

import React, { useState } from "react";
import { ReviewComposerProps, ReviewData, ReviewSubmission } from "@/lib/review/types";
import { submitReview } from "@/lib/review/api";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ReviewComposer: React.FC<ReviewComposerProps> = ({
  onSubmit,
  onCancel,
  initialData,
  maxLength = 5000,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmploymentVerification, setShowEmploymentVerification] = useState(false);

  const handleSubmit = async (formData: { content: string; tags: string[]; timeframe: string }) => {
    setIsSubmitting(true);

    try {
      // Create review data
      const reviewData: ReviewData = {
        content: formData.content,
        tags: formData.tags,
        timeframe: formData.timeframe,
        userId: "current-user-id", // This should come from auth context
        timestamp: new Date(),
      };

      // Submit review
      const result: ReviewSubmission = await submitReview(reviewData);

      if (result.success) {
        // Optimistic UI update
        toast.success("Review submitted successfully!", {
          description: `Review ID: ${result.reviewId}`,
        });

        // Call the parent onSubmit
        await onSubmit(reviewData);
      } else {
        if (result.requiresVerification) {
          setShowEmploymentVerification(true);
          toast.error("Employment verification required", {
            description: "Please verify your employment to submit reviews.",
          });
        } else {
          toast.error("Failed to submit review", {
            description: result.error || "Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmploymentVerification = () => {
    // This would typically redirect to an employment verification page
    toast.info("Redirecting to employment verification...");
    // For now, we'll just close the modal
    setShowEmploymentVerification(false);
  };

  if (showEmploymentVerification) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-black-scale-300 border border-purple rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-orange-bright mb-4">
              Employment Verification Required
            </h2>
            <p className="text-grayscale-100 mb-6">
              To submit reviews, you need to verify your employment status.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleEmploymentVerification}
                className="w-full bg-purple hover:bg-purple-light text-white font-bold"
              >
                Verify Employment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmploymentVerification(false)}
                className="w-full border-purple text-purple hover:bg-purple hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-black-scale-300 border border-purple rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Write a Review
          </h2>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-grayscale-100 hover:text-white hover:bg-purple/20"
            >
              ✕
            </Button>
          )}
        </div>
        
        <ReviewForm
          onSubmit={handleSubmit}
          onCancel={onCancel}
          initialData={initialData}
          maxLength={maxLength}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
