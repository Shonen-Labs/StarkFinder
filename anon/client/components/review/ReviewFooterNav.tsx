import React from "react";

type Props = { prevHref?: string; nextHref?: string; backHref?: string };

export default function ReviewFooterNav({ prevHref, nextHref, backHref }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {prevHref && (
          <a className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-neutral-900 dark:hover:bg-neutral-800" href={prevHref}>
            ← Previous
          </a>
        )}
        {nextHref && (
          <a className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-neutral-900 dark:hover:bg-neutral-800" href={nextHref}>
            Next →
          </a>
        )}
      </div>
      {backHref && (
        <a className="text-sm text-indigo-600 hover:underline dark:text-indigo-400" href={backHref}>Back to company</a>
      )}
    </div>
  );
}
