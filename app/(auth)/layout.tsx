import Navbar from '@/components/Navbar';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <main className="flex items-center justify-center px-4 py-12" role="main">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
