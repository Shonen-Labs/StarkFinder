// app/tg/layout.tsx
'use client';

import { useEffect } from 'react';
import { getWebAppColors } from './WebApp';

export default function TelegramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const colors = getWebAppColors();
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--tg-theme-${key}`, value);
    });
  }, []);

  return (
    <html lang="en">
      <body>
        <main className="bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
          {children}
        </main>
      </body>
    </html>
  );
}