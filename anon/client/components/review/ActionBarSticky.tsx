"use client";
import React, { useState } from "react";

type Props = { initialLikes?: number; initialDislikes?: number; initiallyBookmarked?: boolean };

export default function ActionBarSticky({ initialLikes = 0, initialDislikes = 0, initiallyBookmarked = false }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);

  return (
    <div className="sticky bottom-4 z-10 mt-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-neutral-900/80">
  <button className="rounded-full px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800" onClick={() => setLikes((v: number) => v + 1)}>
        👍 {likes}
      </button>
  <button className="rounded-full px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800" onClick={() => setDislikes((v: number) => v + 1)}>
        👎 {dislikes}
      </button>
  <button className="rounded-full px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800" onClick={() => setBookmarked((b: boolean) => !b)}>
        {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
      </button>
      <button className="rounded-full px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800" onClick={() => navigator.clipboard.writeText(location.href)}>
        ↗ Share
      </button>
      <button className="rounded-full px-3 py-1 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30">
        Report
      </button>
    </div>
  );
}
