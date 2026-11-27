import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spacelog',
  description: '흩어진 기록을 한곳에 저장하고 필요할 때 찾는 개인 기록 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
