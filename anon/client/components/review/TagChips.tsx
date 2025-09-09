import React from "react";

export default function TagChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
          #{t}
        </span>
      ))}
    </div>
  );
}
