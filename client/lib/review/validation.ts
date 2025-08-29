import { z } from "zod";

export const reviewFormSchema = z.object({
  content: z
    .string()
    .min(10, "Review must be at least 10 characters long")
    .max(5000, "Review cannot exceed 5000 characters"),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Cannot select more than 10 tags"),
  timeframe: z.string().min(1, "Timeframe is required"),
});

export type ReviewFormSchema = z.infer<typeof reviewFormSchema>;

export const validateContent = (content: string): string[] => {
  const errors: string[] = [];

  if (content.length < 10) {
    errors.push("Review must be at least 10 characters long");
  }

  if (content.length > 5000) {
    errors.push("Review cannot exceed 5000 characters");
  }

  return errors;
};

export const validateTags = (tags: string[]): string[] => {
  const errors: string[] = [];

  if (tags.length === 0) {
    errors.push("At least one tag is required");
  }

  if (tags.length > 10) {
    errors.push("Cannot select more than 10 tags");
  }

  return errors;
};
