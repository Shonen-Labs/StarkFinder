// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StarknetProvider } from "@/lib/StarknetProvider";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";


export const metadata: Metadata = {
title: "Stark Finder",
description: "The only platform you need for all things Starknet. Discover and interact with Starknet applications effortlessly",
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
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StarknetProvider>
            <Analytics />
            {children}
          </StarknetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
