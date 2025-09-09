import React from "react";

export default function AuthorAnonBadge({ verified }: { verified: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      {verified ? "Verified employee (ZK)" : "Anonymous"}
    </div>
  );
}
