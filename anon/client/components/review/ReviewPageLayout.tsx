import React from "react";

type Props = { children: React.ReactNode };

export default function ReviewPageLayout({ children }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
