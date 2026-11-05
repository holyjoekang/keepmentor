# Keep Mentor

이 앱은 스타트업 멘토링을 기록합니다. 멘토링은 **진단 → 처방 → 실험 → 점검** 순서로 진행하고, 기록은 사람이 먼저 쓰고 AI는 그 뒤에 보완합니다.

- 방법론: 코어 7축·12문항, 증거등급(E0~E4)에 따른 점수 상한, 단계 관문, 레드플래그, 실험 카드
- AI 연계: 앱은 Claude API를 호출하지 않습니다. 대신 작업별 데이터 패킷을 만들어 주고, 멘토가 별도 Claude 프로젝트에서 처리한 결과를 다시 붙여 넣습니다.
- 사람 점검 지점: 아래 항목은 반드시 사람이 직접 씁니다. 이 칸이 비어 있으면 AI 패킷을 만들거나 다음 단계로 넘어갈 수 없습니다.
  - 멘토: 회차별 핵심 3줄, 단계 전환 근거
  - 멘티: 회차마다 "내가 이해한 핵심"과 "이번 2주에 할 일"

## 모드

| 모드 | 저장 위치 | 용도 |
| --- | --- | --- |
| `demo` (기본) | 브라우저 localStorage | Vercel에 바로 올려 시연합니다. 데모 사용자 3명(멘토·멘티·기관)과 예시 데이터가 들어 있습니다. |
| `live` | Google Sheets (Apps Script 웹앱) | 실제 프로토타입 운영에 씁니다. |

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 데모 모드로 열립니다.

## Vercel 배포

1. Vercel → Add New → Project에서 이 GitHub 저장소를 Import합니다. 프레임워크는 Next.js로 자동 인식됩니다.
2. 처음에는 환경변수 없이 배포해도 됩니다. 이 경우 데모 모드로 동작합니다.
3. live 모드로 쓰려면 아래 환경변수를 설정한 뒤 Redeploy합니다.

| 변수 | 값 |
| --- | --- |
| `NEXT_PUBLIC_MODE` | `live` |
| `GAS_URL` | Apps Script 웹앱 배포 URL (`.../exec`) |
| `GAS_SECRET` | Apps Script 스크립트 속성 `SECRET`과 같은 값 |
| `SESSION_SECRET` | 로그인 쿠키 서명용 임의의 긴 문자열 |

## Google Sheets 연결 (live 모드)

1. 새 Google 스프레드시트를 만들고, 확장 프로그램 → Apps Script에 `gas/Code.gs` 내용을 붙여 넣습니다.
2. 프로젝트 설정 → 스크립트 속성에 `SECRET`을 추가합니다.
3. 배포 → 새 배포 → 웹 앱으로 배포합니다. 실행 계정은 "나", 액세스는 "모든 사용자"로 설정하고, 나온 URL을 `GAS_URL`에 넣습니다. 요청마다 SECRET을 확인하므로 URL만으로는 데이터에 접근할 수 없습니다.
4. 시트를 만들고 첫 관리자를 등록하는 작업을 1회 실행합니다.

```bash
curl -X POST https://<your-app>.vercel.app/api/setup -H 'Content-Type: application/json' -d '{"secret":"<GAS_SECRET>","admin_email":"you@example.com","admin_name":"관리자","admin_code":"<접근코드>"}'
```

5. 관리자로 로그인해 관리 화면에서 프로그램과 사용자(멘토·멘티)를 등록하고, 각자에게 접근 코드를 전달합니다.

시트 구조는 `lib/schema.ts`에 정의되어 있습니다. 시트는 Users, Programs, Companies, Engagements, Assessments, Sessions, Experiments, AIJobs, PanelRuns, AuditLog입니다.

## Claude 프로젝트 연계

1. 앱의 "Claude 프로젝트 지침" 화면(`/guide`)에 있는 텍스트를 Claude 프로젝트의 지침에 붙여 넣습니다.
2. 멘토링 건 → AI 작업함에서 작업 유형을 고르고 패킷을 만든 뒤 복사합니다. 작업 유형은 다섯 가지입니다.
   - J1 사전 브리핑
   - J2 회차 일지 정리
   - J3 증거등급 검토
   - J4 종합 리포트
   - J5 전문가 패널
3. Claude 프로젝트의 대화에 패킷을 붙여 넣습니다. 회의록은 앱에 올리지 않고, 그 대화에만 첨부합니다.
4. Claude 응답 전체를 "결과 가져오기"에 붙여 넣고, 검증·미리보기를 거쳐 멘토가 확정합니다.

패킷에는 실명, 연락처, 사업자번호가 들어가지 않으며 기업명은 "A사"로 바뀝니다. 나중에 API로 자동화할 때는 `lib/packets.ts`의 패킷 생성·검증 함수를 그대로 쓰고, 복사·붙여넣기 단계만 바꾸면 됩니다.

## 구조

```
app/            화면 (Next.js App Router)과 API 라우트 (/api/login, /api/rpc, /api/setup)
components/     UI
lib/methodology.ts  방법론 상수 (문항, 증거등급, 관문, 이슈 코드)
lib/scoring.ts      점수·병목·레드플래그·단계 계산
lib/packets.ts      AI 패킷 생성과 결과 검증, 사람 점검 규칙
lib/actions.ts      비즈니스 규칙과 권한 (live는 서버, demo는 브라우저에서 같은 코드 실행)
lib/store.ts        저장소 어댑터 (Apps Script / localStorage)
gas/Code.gs         Google Apps Script 저장소
```
