import React from "react";
import type { ReviewStatus } from "./types";

export default function ModerationBanner({ status }: { status: ReviewStatus }) {
  if (status === "published") return null;
  const styles: Record<Exclude<ReviewStatus, "published">, string> = {
    needs_review: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
    blocked: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40",
    deleted: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:border-gray-700",
  };
  const label: Record<Exclude<ReviewStatus, "published">, string> = {
    needs_review: "Needs moderator review",
    blocked: "Blocked for policy reasons",
    deleted: "Deleted (410)",
  };
  const style = styles[status as Exclude<ReviewStatus, "published">];
  return <div className={`rounded-lg border p-3 text-xs ${style}`}>{label[status as Exclude<ReviewStatus, "published">]}</div>;
}
