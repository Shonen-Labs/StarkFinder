import React from "react";

export default function OfficialResponseBlock({ body, author, publishedAt }: { body: string; author: string; publishedAt: string }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200">
      <div className="mb-2 text-xs opacity-80">Official response from {author} • {new Date(publishedAt).toLocaleString()}</div>
      <p className="whitespace-pre-line leading-6">{body}</p>
    </div>
  );
}
