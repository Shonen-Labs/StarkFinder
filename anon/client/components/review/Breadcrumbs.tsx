import React from "react";

type Props = { items: Array<{ label: string; href?: string }>; current: string };

export default function Breadcrumbs({ items, current }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600 dark:text-gray-400">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {it.href ? (
              <a href={it.href} className="hover:underline">
                {it.label}
              </a>
            ) : (
              <span>{it.label}</span>
            )}
            <span className="text-gray-400">/</span>
          </li>
        ))}
        <li className="font-medium text-gray-900 dark:text-gray-100">{current}</li>
      </ol>
    </nav>
  );
}
