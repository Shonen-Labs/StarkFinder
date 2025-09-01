import React from "react";
import type { ReviewData } from "./types";

type Props = { review: ReviewData };

const statusMap: Record<ReviewData["status"], { label: string; className: string }> = {
  published: { label: "Published", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  needs_review: { label: "Needs review", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  blocked: { label: "Blocked", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  deleted: { label: "Deleted", className: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export default function ReviewHeader({ review }: Props) {
  const date = new Date(review.publishedAt).toLocaleString();
  const status = statusMap[review.status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {review.title && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{review.title}</h2>
        )}
        <p className="text-xs text-gray-500">Published {date}</p>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
    </div>
  );
}
