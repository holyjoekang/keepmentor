'use client';

import { useState } from 'react';
import { TopBar, copyText, downloadText, useMe } from '@/components/ui';
import { PROJECT_INSTRUCTIONS } from '@/lib/guide';

export default function GuidePage() {
  const me = useMe();
  const [copied, setCopied] = useState(false);
  return (
    <>
      <TopBar me={me} />
      <div className="wrap">
        <h1>Claude 프로젝트 설정</h1>
        <div className="card">
          <ol>
            <li>claude.ai에서 새 프로젝트를 만듭니다 (예: "Keep Mentor 멘토링").</li>
            <li>아래 텍스트를 프로젝트의 <strong>지침(Instructions)</strong>에 붙여 넣습니다.</li>
            <li>프로젝트 지식에 설계서(방법론·이슈 코드·업종 템플릿)를 올려 두면 패킷이 짧아도 맥락을 유지합니다.</li>
            <li>기업마다 대화를 따로 열고, 앱에서 만든 패킷을 붙여 넣습니다. 회의록은 그 대화에 첨부합니다.</li>
            <li>Claude 응답 전체를 복사해 앱의 AI 작업함 → 결과 가져오기에 붙여 넣고, 미리보기를 확인한 뒤 확정합니다.</li>
          </ol>
          <div className="alert info small">AI는 초안만 만듭니다. 핵심 요약, 단계 전환 근거, 멘티의 이해 확인은 사람이 직접 씁니다.</div>
        </div>
        <div className="card">
          <div className="row between">
            <h2>프로젝트 지침</h2>
            <div className="row">
              <button onClick={async () => { await copyText(PROJECT_INSTRUCTIONS); setCopied(true); }}>{copied ? '복사됨' : '복사'}</button>
              <button onClick={() => downloadText('keepmentor-claude-project-instructions.md', PROJECT_INSTRUCTIONS)}>.md 다운로드</button>
            </div>
          </div>
          <pre className="packet" style={{ maxHeight: 'none' }}>{PROJECT_INSTRUCTIONS}</pre>
        </div>
      </div>
    </>
  );
}
