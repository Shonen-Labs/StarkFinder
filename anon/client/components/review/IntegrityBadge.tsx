import React from "react";

export default function IntegrityBadge({ cid, hash, verifyUrl }: { cid: string; hash: string; verifyUrl?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-neutral-800">CID: {cid}</span>
      <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-neutral-800">Hash: {hash.slice(0, 10)}…</span>
      {verifyUrl && (
        <a href={verifyUrl} className="text-indigo-600 hover:underline dark:text-indigo-400" target="_blank" rel="noreferrer">
          Verify
        </a>
      )}
    </div>
  );
}
