import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'llama-benchy | Apple-Styled LLM Benchmarker',
  description: 'A macOS Tahoe inspired benchmark control suite for OpenAI-compatible LLM inference backends (vLLM, SGLang, llama.cpp).',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0e' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script src="/neutralino.js" async={false} />
      </head>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
