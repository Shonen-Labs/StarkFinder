import React from "react";

type Props = {
  aiSummary?: string;
  related?: Array<{ id: string; title: string; href: string }>;
  trendingTags?: string[];
};

export default function RelatedContentSidebar({ aiSummary, related, trendingTags }: Props) {
  return (
    <aside className="space-y-4">
      {aiSummary && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="mb-2 text-xs font-medium text-gray-500">AI summary</div>
          <p className="text-gray-800 dark:text-gray-200">{aiSummary}</p>
        </div>
      )}
      {!!related?.length && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="mb-2 text-xs font-medium text-gray-500">Related reviews</div>
          <ul className="list-inside list-disc text-sm">
            {related!.map((r) => (
              <li key={r.id}>
                <a className="text-indigo-600 hover:underline dark:text-indigo-400" href={r.href}>{r.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!trendingTags?.length && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <div className="mb-2 text-xs font-medium text-gray-500">Trending tags</div>
          <div className="flex flex-wrap gap-2">
            {trendingTags!.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-neutral-800 dark:text-gray-300">#{t}</span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
