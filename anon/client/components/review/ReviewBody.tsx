import React, { useState } from "react";

export default function ReviewBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 600;
  const safeBody = body; // assume pre-sanitized upstream; keep plain text rendering
  const text = expanded || safeBody.length <= maxChars ? safeBody : safeBody.slice(0, maxChars) + "…";
  return (
    <div>
      <p className="whitespace-pre-line text-sm leading-7 text-gray-800 dark:text-gray-200">{text}</p>
      {safeBody.length > maxChars && (
        <button
          type="button"
          onClick={() => setExpanded((v: boolean) => !v)}
          className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
