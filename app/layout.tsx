import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './tailwind.css';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { GiftProvider } from '@/lib/gift-context';
import AIChatbot from '@/components/AIChatbot';
import ChatSystem from '@/components/chat/ChatSystem';
import { SITE_CONFIG } from '@/lib/site-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" dir="ltr">
      <body className={inter.className}>
        <AuthProvider>
          <GiftProvider>
            {children}
            <AIChatbot />
            <ChatSystem />
          </GiftProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
