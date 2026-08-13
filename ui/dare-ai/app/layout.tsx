import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DARE AI Assistant - Intelligent Document Discovery',
  description:
    'Conversational AI for institutional knowledge discovery in DARE Repository',
  keywords: [
    'DARE',
    'repository',
    'AI',
    'assistant',
    'search',
    'academic',
    'documents',
  ],
  authors: [{ name: 'ROSERAG Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://repo.dare.co.zw/ai',
    title: 'DARE AI Assistant',
    description: 'Conversational AI for institutional knowledge discovery',
    siteName: 'DARE Repository',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
