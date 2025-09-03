"use client";
import React, { useState } from "react";

type Comment = {
  id: string;
  author: string;
  body: string;
  publishedAt: string;
  replies?: Comment[];
};

export default function CommentsSection({ initial }: { initial?: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initial ?? []);
  const [text, setText] = useState("");

  const addComment = () => {
    const t = text.trim();
    if (!t) return;
    setComments((prev: Comment[]) => [
      { id: `${Date.now()}`, author: "anon", body: t, publishedAt: new Date().toISOString() },
      ...prev,
    ]);
    setText("");
  };

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Add a comment</div>
        <textarea
          rows={3}
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="Share your thoughts…"
          className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-neutral-950 dark:text-gray-100"
        />
        <div className="mt-2 flex justify-end">
          <button
            className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            onClick={addComment}
            disabled={!text.trim()}
          >
            Comment
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
  {comments.map((c: Comment) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-neutral-900">
            <div className="mb-1 text-xs text-gray-500">{c.author} • {new Date(c.publishedAt).toLocaleString()}</div>
            <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">{c.body}</p>
            {!!c.replies?.length && (
              <div className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-gray-800">
                {c.replies!.map((r) => (
                  <div key={r.id} className="text-sm">
                    <div className="mb-1 text-xs text-gray-500">{r.author} • {new Date(r.publishedAt).toLocaleString()}</div>
                    <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
