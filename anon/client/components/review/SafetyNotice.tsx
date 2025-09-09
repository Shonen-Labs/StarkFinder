import React from "react";

export default function SafetyNotice({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
      Some personal details were automatically masked to protect anonymity.
    </div>
  );
}
