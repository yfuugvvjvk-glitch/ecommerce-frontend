import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './tailwind.css';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import AIChatbot from '@/components/AIChatbot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Full-Stack E-Commerce App',
  description: 'Modern full-stack e-commerce application with AI features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AIChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
