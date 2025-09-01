import React from "react";

export default function TimeframePill({ from, to }: { from?: string; to?: string }) {
  const label = `Worked: ${from ?? "?"}-${to ?? "?"}`;
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
      {label}
    </span>
  );
}
