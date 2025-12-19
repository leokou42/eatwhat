import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Eat What - Decision Maker',
  description: 'Swipe to decide what to eat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased h-screen w-screen bg-gray-50 flex justify-center items-center">
        {/* Mobile container constraint */}
        <div className="w-full max-w-md h-full bg-white relative shadow-2xl overflow-hidden flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
