import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Keep Mentor',
  description: '진단 → 처방 → 실험 → 점검. 사람이 먼저 쓰고 AI는 보완하는 스타트업 멘토링 기록 앱',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
