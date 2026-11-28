import type { Metadata, Viewport } from 'next';
// 글자 범위별로 나뉜 Pretendard 가변 글꼴. 화면에 나온 글자의 조각만 받는다 (전체 파일은 2MB)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spacelog',
  description: '흩어진 기록을 한곳에 저장하고 필요할 때 찾는 개인 기록 서비스',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  // iPhone 노치·홈 막대 영역까지 화면을 쓰고, 아래 고정 요소는 pb-safe 등으로 비켜 둔다
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-space font-sans text-fg">{children}</body>
    </html>
  );
}
