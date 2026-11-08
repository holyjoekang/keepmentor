'use client';

import { useId, useState } from 'react';

export function downloadMarkdown(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').slice(0, 100) || '회의록'}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MarkdownNotes({ value, onChange, filename = '회의록' }: { value: string; onChange: (text: string) => void; filename?: string }) {
  const id = useId();
  const [error, setError] = useState('');
  return (
    <div style={{ marginTop: 14 }}>
      <label htmlFor={id}>회의록 Markdown 편집</label>
      <p className="small muted"># 제목, ## 소제목, - 목록 형식으로 편집합니다. 저장하면 회차에 보관되고 .md 파일로 내려받을 수 있습니다.</p>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false}
        style={{ minHeight: 240, fontFamily: 'monospace', fontSize: 13 }} />
      <div className="row">
        <label style={{ margin: 0 }}>파일 가져오기 (.md)
          <input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { setError('2MB 이하의 Markdown 파일을 선택하세요.'); return; }
            try { onChange(await file.text()); setError(''); } catch { setError('파일을 읽을 수 없습니다.'); }
          }} />
        </label>
        <button type="button" disabled={!value.trim()} onClick={() => downloadMarkdown(value, filename)}>.md 다운로드</button>
      </div>
      {error && <div className="alert error">{error}</div>}
    </div>
  );
}
