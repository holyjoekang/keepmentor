# Google Sheets → Supabase PostgreSQL

기존 `holyjoekang/keepmentor` 저장소와 Vercel 프로젝트, `keepmentor.vercel.app` 도메인을 유지합니다. 새 Supabase 프로젝트만 저장소로 연결합니다. 무료 플랜의 용량, 일시중지, 백업 조건은 Supabase의 현재 요금 정책을 확인하세요.

## 구조와 호환성

- `lib/schema.ts`의 11개 컬렉션을 `km_*` 테이블로 옮깁니다. MentorMeetings도 포함합니다.
- 각 테이블은 기존 `id` 기본키, 정렬·페이지 조회용 `seq`, 전체 기록을 보존하는 `data jsonb`를 가집니다. 문자열·숫자·불리언·배열·객체와 기존 관계 ID를 그대로 보존합니다. 이번 전환은 관계형 컬럼 및 외래키로 재설계하는 작업을 포함하지 않습니다.
- 기존 Next.js API의 로그인, 세션 쿠키, `lib/actions.ts` 권한 검사를 유지합니다. 클라이언트는 DB에 직접 접근하지 않습니다.
- RLS를 켜고 anon/authenticated의 테이블·RPC 접근을 금지합니다. 서버만 service_role/secret key를 사용합니다. 기존 접근 코드는 기존 형식대로 복사됩니다. DB 키를 브라우저·Git·채팅에 넣지 마세요.
- 기본 `STORAGE_PROVIDER=sheets`로 기존 배포를 유지합니다. 명시적으로 `supabase`로 설정한 후에는 연결 실패 시 Sheets로 자동 전환하지 않습니다.

## 1. 프로젝트 준비

1. Supabase에서 무료 PostgreSQL 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/migrations/202611080001_keepmentor.sql`을 실행합니다. 비어 있는 전용 프로젝트를 권장합니다.
3. 안전한 로컬/클라우드 환경변수로 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, 기존 `GAS_URL`, `GAS_SECRET`을 제공합니다. Vercel에 이미 저장된 비밀값은 해당 프로젝트에서 안전하게 재사용하세요. `.env.local`을 사용하는 경우 Git에 추가하지 마세요.
4. 기존 Vercel `SESSION_SECRET`은 유지합니다. 세션 연속성을 위해 불필요하게 바꾸지 마세요.

## 2. 사전 점검 (쓰기 없음)

Node.js 24에서 프로젝트 루트(`/workspace/keepmentor`)를 사용합니다.

```bash
node --env-file=.env.local scripts/migrate-sheets-to-supabase.mjs
```

환경변수를 이미 주입한 경우 `--env-file=.env.local`을 생략합니다. 원본·대상 건수와 미복사 건수만 출력하고 DB에 쓰지 않습니다. 다른 값으로 같은 ID가 존재하거나 대상에만 있는 기록이 있으면 중단합니다. 원본 ID 중복도 중단합니다. 과거 버전에서 생성되지 않은 시트만 빈 컬렉션으로 처리합니다.

## 3. 백업 및 복사

1. 실제 복사 전 기존 앱의 사용자·배치 등 **Sheets에 쓰는 모든 경로를 중단**합니다. 이 스크립트 자체가 서비스 쓰기를 잠그지는 않습니다. 사용자에게 유지보수 시간을 알리고 운영 접근을 제한하세요.
2. Git 체크아웃 밖의 접근 제한된 백업 경로를 지정합니다. 백업에는 개인정보와 접근 코드가 포함되므로 안전하게 보관합니다.

```bash
node --env-file=.env.local scripts/migrate-sheets-to-supabase.mjs --apply --backup /private/path/keepmentor-before-db.json
node --env-file=.env.local scripts/migrate-sheets-to-supabase.mjs --verify
```

`--apply`는 0600 권한으로 새 백업 파일을 만든 후 누락된 ID만 삽입합니다. 기존 백업을 덮어쓰지 않습니다. 같은 ID·같은 값은 건너뛰고, 값이 다른 기록은 덮어쓰지 않습니다. 완료 후 양쪽을 새로 읽어 모든 ID·필드 값이 같은지 검증하며, 복사 도중 원본이 바뀌면 실패합니다. 일부만 복사된 뒤 실패한 경우 원인을 해결한 후 새 백업 파일 경로로 재실행할 수 있습니다. 기존 Sheets 데이터는 수정·삭제하지 않습니다.

## 4. 기존 Vercel 앱 전환

검증이 통과할 때까지 쓰기 중단을 유지합니다.

1. 변경한 소스를 기존 GitHub 저장소의 브랜치에 올리고 검토·병합합니다.
2. 같은 Vercel 프로젝트에 다음 서버 설정을 추가합니다: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_PROVIDER=supabase`. 기존 `NEXT_PUBLIC_MODE=live`, `SESSION_SECRET`, 연락처 설정은 유지합니다. 데모 배포였다면 `NEXT_PUBLIC_MODE=live`가 필요합니다.
3. 기존 프로젝트를 Redeploy합니다. 빌드 시점 변수인 `NEXT_PUBLIC_MODE`도 반영되어야 합니다.
4. `/setup`에서 Supabase 연결 성공을 확인합니다. 기존 사용자로 로그인하고 기존 멘토링·회차·실험·미팅을 확인합니다. 미리보기 배포도 운영 DB에 쓰기 가능하므로 미리보기에는 별도 테스트 DB를 사용하세요.
5. 운영 쓰기를 허용하기 전에 최종 `--verify`를 실행합니다. 이후 쓰기 중단을 해제하고 테스트 기록을 만들어 저장·새로고침 후 유지 여부 및 멘티/기관 권한을 확인합니다.
6. 모든 기능을 확인한 후 Vercel의 `GAS_URL`, `GAS_SECRET`은 제거할 수 있습니다. 원본 Sheets와 백업은 보존합니다.

기존 사용자 이전에는 `/api/setup`으로 새 관리자를 만들지 않습니다. 완전히 새로운 DB에서만 별도 `SETUP_SECRET`을 서버에 설정하고 `/setup`에서 초기 관리자를 등록합니다. DB 키를 초기 등록 폼에 입력하지 마세요. 사용자가 이미 있으면 초기 등록은 거절되며, 등록 후 `SETUP_SECRET`은 제거합니다.

## 복구

Supabase에서 새 쓰기가 발생하기 전이라면 `STORAGE_PROVIDER=sheets`로 되돌려 같은 Vercel 프로젝트를 재배포할 수 있습니다. 새 쓰기가 발생한 후에는 단순히 되돌리면 새 데이터가 유실되어 보입니다. 이 경우 먼저 쓰기를 중단하고 변경 데이터를 조정해야 합니다. 자동 역방향 동기화는 제공하지 않습니다.

## 검증과 한계

`node --test tests/*.test.mjs`는 DB 어댑터의 페이지 조회·쓰기·원자적 수정 요청·오류 처리와 이전 CLI의 dry-run·백업·충돌·재개·원본 변경 검출을 검증합니다. 실제 Supabase, Google Sheets, Vercel 운영 검증에는 해당 프로젝트 접근권한이 필요합니다.
