import React from "react";
import type { Company } from "./types";

type Props = { company: Company };

export default function CompanyHeaderCompact({ company }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
      <div>
        <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {company.name}
        </div>
        <div className="text-xs text-gray-500">/{company.slug}</div>
      </div>
      <div className="flex items-center gap-2">
        {company.isClaimed && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Claimed
          </span>
        )}
        {company.isFollowed && (
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            Following
          </span>
        )}
      </div>
    </div>
  );
}
