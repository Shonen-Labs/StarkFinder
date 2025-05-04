'use client';

import dynamic from 'next/dynamic';

const TelegramMiniApp = dynamic(() => import('./TelegramMiniApp'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-white">Loading...</div>
    </div>
  ),
});

export default function Page() {
  return <TelegramMiniApp />;
}
