'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { currentUser, type Me } from '@/lib/client';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

export function useOptionalMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { currentUser().then(setMe).catch(() => undefined); }, []);
  return me;
}

export function PubNav({ me }: { me?: Me | null }) {
  return (
    <header className="pub-nav">
      <div className="in">
        <div className="row" style={{ gap: 28 }}>
          <Link href="/" aria-label="Keep Mentor 홈"><Logo size={30} /></Link>
          <nav className="row hide-sm" style={{ gap: 22 }}>
            <Link href="/" className="nl">방법론</Link>
            <Link href="/#flow" className="nl">진행 절차</Link>
            <Link href="/cases" className="nl">사례</Link>
            <Link href="/solutions" className="nl">도입 안내</Link>
            <Link href="/about" className="nl">소개</Link>
            <Link href="/#foundations" className="nl">근거</Link>
          </nav>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <Link href={me ? '/home' : '/login'} className="nl" style={{ fontWeight: 600 }}>{me ? '내 멘토링' : '로그인'}</Link>
          <Link href="/solutions#contact" className="btn indigo">도입 문의</Link>
          <details className="mobile-menu"><summary aria-label="사이트 메뉴">메뉴 ☰</summary><nav aria-label="모바일 메뉴">
            <Link href="/">방법론</Link><Link href="/cases">사례</Link><Link href="/solutions">도입 안내</Link><Link href="/about">소개</Link><Link href="/home">내 멘토링</Link><Link href="/meetings">멘토 회의</Link><Link href="/solutions#contact">도입 문의</Link>
          </nav></details>
        </div>
      </div>
    </header>
  );
}

export function PubFooter() {
  return (
    <footer className="ed-foot">
      <div className="pw">
        <div className="cols">
          <div>
            <Logo size={30} />
            <p style={{ marginTop: 14, maxWidth: 360 }}>진단 → 처방 → 실험 → 점검. 사람이 먼저 쓰고 AI는 보완하는 스타트업 멘토링 방법론과 운영 도구.</p>
          </div>
          <div>
            <h5>방법론</h5>
            <Link href="/#flow">진행 절차</Link>
            <Link href="/#diagnosis">진단 기준</Link>
            <Link href="/#stages">단계와 관문</Link>
            <Link href="/#kpi">성과 측정</Link>
            <Link href="/cases">사례집</Link>
          </div>
          <div>
            <h5>도입</h5>
            <Link href="/solutions">도입 패키지</Link>
            <Link href="/solutions#process">도입 절차</Link>
            <Link href="/solutions#faq">자주 묻는 질문</Link>
            <Link href="/solutions#contact">도입 문의</Link>
          </div>
          <div>
            <h5>이용</h5>
            <Link href="/about">Keep Mentor 소개</Link>
            <Link href="/login">로그인</Link>
            <Link href="/guide">Claude 프로젝트 지침</Link>
          </div>
        </div>
        <div className="base">
          Keep Mentor · Keep 브랜드의 멘토링 서비스. 소개한 방법론의 저자·기관과 제휴 관계는 없습니다. 사진: Unsplash.
        </div>
      </div>
    </footer>
  );
}
