import { SafetyCheck, ReviewSubmission, ReviewData } from "./types";

const API_BASE_URL = "/api/reviews";

export const checkSafety = async (content: string): Promise<SafetyCheck> => {
  try {
    const response = await fetch(`${API_BASE_URL}/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Employment verification required");
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error("Safety check failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Safety check error:", error);
    // Return a default safety check for offline mode
    return {
      isToxic: false,
      hasPII: false,
      toxicityScore: 0,
      piiDetected: [],
      warnings: [],
    };
  }
};

export const submitReview = async (reviewData: ReviewData): Promise<ReviewSubmission> => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          requiresVerification: true,
          error: "Employment verification required",
        };
      }
      if (response.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        };
      }
      throw new Error("Review submission failed");
    }

    const result = await response.json();
    return {
      success: true,
      reviewId: result.reviewId,
    };
  } catch (error) {
    console.error("Review submission error:", error);
    return {
      success: false,
      error: "Failed to submit review. Please try again.",
    };
  }
};

export const getAvailableTags = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tags`);
    if (!response.ok) {
      throw new Error("Failed to fetch tags");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching tags:", error);
    // Return default tags for offline mode
    return [
      "frontend",
      "backend",
      "blockchain",
      "ai",
      "defi",
      "security",
      "performance",
      "documentation",
      "testing",
      "deployment",
    ];
  }
};

export const getAvailableTimeframes = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/timeframes`);
    if (!response.ok) {
      throw new Error("Failed to fetch timeframes");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching timeframes:", error);
    // Return default timeframes for offline mode
    return [
      "Last 24 hours",
      "Last week",
      "Last month",
      "Last 3 months",
      "Last 6 months",
      "Last year",
      "All time",
    ];
  }
};
