import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StarknetProvider } from "@/lib/StarknetProvider";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Stark Finder",
  description:
    "The only platform you need for all things Starknet. Discover and interact with Starknet applications effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet" />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <StarknetProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <Analytics />
                {children}
              </Suspense>
            </StarknetProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
