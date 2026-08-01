# Supabase 연결 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에 로그인 후 **New Project** 클릭
2. 프로젝트 이름(예: `richlink`), 비밀번호, 리전(가까운 지역 권장: Northeast Asia — Seoul)을 설정하고 생성
3. 생성이 끝나면 좌측 메뉴 **Project Settings → API** 로 이동

여기서 아래 두 값을 확인합니다:

| 항목 | 위치 |
|---|---|
| `Project URL` | API 설정 상단, `https://xxxxx.supabase.co` 형태 |
| `anon public` key | Project API keys 목록의 `anon` `public` 키 |

## 2. `.env.local` 파일 만들기

프로젝트 루트(`package.json`이 있는 위치)에 `.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

그리고 방금 확인한 값을 채워 넣습니다.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......
```

**주의**
- 키 앞뒤에 따옴표나 공백을 넣지 않습니다.
- `NEXT_PUBLIC_` 접두사가 붙은 값은 브라우저에 노출되는 값입니다. `anon` 키는 원래 공개되어도 되는 키이며(RLS로 보호됨), 절대 `service_role` 키를 `NEXT_PUBLIC_`으로 넣지 않습니다.
- `.env.local`은 `.gitignore`에 이미 포함되어 있어 git에 커밋되지 않습니다.

## 3. 데이터베이스 스키마 적용

Supabase 대시보드 좌측 메뉴 **SQL Editor** → **New query**로 이동한 뒤, 이 프로젝트의 `supabase/schema.sql` 내용을 전체 붙여넣고 **Run**을 클릭합니다.

이 스크립트가 하는 일:
- `profiles`, `listings`, `inquiries`, `favorites` 등 전체 테이블 생성
- Row Level Security(RLS) 정책 적용 (역할별 접근 제어)
- `listing-images` Storage 버킷 생성
- `increment_view_count` 함수 생성

실행 후 좌측 **Table Editor**에서 테이블들이 생성되었는지 확인합니다.

### 최초 관리자 계정 만들기

1. 사이트에서 일반 가입 절차로 회원가입 (분양담당자로 가입됨, 승인대기 상태)
2. Supabase **SQL Editor**에서 아래 쿼리 실행 (이메일만 본인 것으로 교체):

```sql
update profiles
set role = 'admin', is_approved = true
where email = 'your-email@example.com';
```

이제 이 계정으로 로그인하면 `/admin` 하위 관리자 페이지에 접근할 수 있습니다.

### 초기 데모 매물 한번에 넣기 (빈 화면 방지)

배포 직후에는 매물이 하나도 없어 검색결과가 비어 보입니다. `supabase/seed.sql`에 지금 프로토타입에 있는 데모 매물 6개를 그대로 넣는 스크립트를 준비해뒀습니다.

⚠️ `listings.agency_id`는 실제 로그인 계정(`auth.users`)을 가리키는 외래키라서, 계정 없이 매물만 임의로 밀어넣을 수는 없습니다. 순서대로 진행하세요.

1. 위에서 만든 담당자 계정의 `id`를 확인
   ```sql
   select id from profiles where email = '담당자이메일@example.com';
   ```
2. `supabase/seed.sql`을 열어 `'여기에-담당자-UUID-붙여넣기'` 6곳을 방금 확인한 UUID로 모두 교체
3. SQL Editor에 전체 붙여넣고 **Run** — 매물 6개 + 시공사 정보가 한 번에 등록되고, `is_approved = true`로 바로 검색결과에 노출됩니다

이후 실제 매물을 대량으로 등록해야 할 때는 같은 패턴으로 INSERT문을 늘리거나, Table Editor의 **Import data from CSV** 기능으로 엑셀에서 정리한 데이터를 한 번에 업로드할 수도 있습니다 (컬럼명을 `listings` 테이블과 맞춰야 합니다).

## 3-1. 이메일 인증(본인 확인) 켜기 — 인증코드(OTP) 방식

회원가입 폼에서 이메일 옆 "코드 발송" 버튼을 누르면 6자리 인증코드가 담긴 메일이 발송되고, 사용자가 그 코드를 화면에 직접 입력해 본인 확인을 하는 방식입니다.

1. Supabase 대시보드 **Authentication → Email Templates → Magic Link (또는 OTP)** 템플릿 이동
2. 템플릿 본문에 인증코드 변수 **`{{ .Token }}`** 이 포함되어 있는지 확인 (기본 템플릿에 이미 포함되어 있습니다). 필요하면 "인증코드: {{ .Token }}" 형태로 문구를 다듬어도 됩니다
3. 별도의 Redirect URL 등록은 필요 없습니다 (사용자가 화면에서 직접 코드를 입력하는 방식이라 이메일의 링크를 클릭하지 않습니다)

이렇게 설정하면 (`app/(auth)/signup/page.tsx`에 이미 구현됨):
1. 이메일 입력 → "코드 발송" 클릭 → `supabase.auth.signInWithOtp()` 호출 → 인증코드 메일 발송
2. 사용자가 메일함에서 코드 확인 → 화면에 코드 입력 → "인증코드 확인" 클릭 → `supabase.auth.verifyOtp()` 로 검증
3. 검증 성공 시 이름/연락처/비밀번호 등 나머지 정보 입력 → `supabase.auth.updateUser({ password })`로 비밀번호 설정 + `profiles` 행 생성(`is_approved: false`)
4. 이후 로그인하려면 **관리자 승인**을 거쳐야 합니다 (이메일 인증은 가입 과정에서 이미 완료된 상태)

**발신 메일 커스터마이징(선택)**: 기본 발신은 시간당 발송량 제한이 있고 발신자가 Supabase로 표시됩니다. 실서비스에서는 **Authentication → SMTP Settings**에 Resend/Postmark/SendGrid 같은 SMTP를 연결하면 `noreply@richlink.co.kr`처럼 자체 도메인으로 발송할 수 있습니다.

## 4. 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속 후:
- 회원가입 → Supabase **Authentication → Users**에 계정이 생성되는지 확인
- `Table Editor → profiles`에 프로필 행이 함께 생성되는지 확인 (`is_approved = false` 상태)
- 위 SQL로 관리자 승인 후 `/admin/users`에서 다른 가입자를 승인해볼 수 있습니다

## 5. 자주 발생하는 오류

| 증상 | 원인 / 해결 |
|---|---|
| `Invalid API key` | `.env.local` 값이 잘못됨. URL/키를 다시 복사해 붙여넣고 개발 서버 재시작(`npm run dev`) |
| 로그인은 되는데 데이터가 안 보임 | RLS 정책 때문일 수 있음. `schema.sql`의 정책이 전부 적용됐는지 SQL Editor에서 재확인 |
| 이미지 업로드 실패 | `storage.buckets`에 `listing-images` 버킷이 생성됐는지, Storage 정책이 적용됐는지 확인 |
| 환경변수를 바꿨는데 반영이 안 됨 | Next.js는 `.env.local` 변경 시 dev 서버를 재시작해야 반영됩니다 |

## 6. 배포하기 (GitHub → Vercel → Supabase 순서)

### 1) GitHub에 코드 올리기
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<계정명>/richlink.git
git push -u origin main
```

### 2) Vercel에서 프로젝트 연결
1. https://vercel.com 에서 GitHub 계정으로 로그인
2. **Add New → Project** → 방금 올린 `richlink` 저장소 선택 → **Import**
3. **Environment Variables**에 `.env.local`과 동일한 값 등록
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 클릭 → 배포 완료 후 `https://richlink-xxxx.vercel.app` 같은 실제 주소가 발급됩니다

### 3) 배포 주소를 다시 Supabase에 등록 (★ 빠뜨리기 쉬운 단계)
방금 받은 Vercel 주소를 Supabase **Authentication → URL Configuration**에 등록해야 이메일 인증 링크가 정상 동작합니다.
- **Site URL**: `https://richlink-xxxx.vercel.app`
- **Redirect URLs**: `https://richlink-xxxx.vercel.app/auth/callback` 추가 (로컬 주소는 남겨둔 채 추가만 하면 로컬/배포 둘 다 동작합니다)

이후 `git push`할 때마다 Vercel이 자동으로 재배포합니다. 커스텀 도메인(`richlink.co.kr` 등)을 연결하면 Vercel **Settings → Domains**에서 추가하고, 위 URL 설정도 그 도메인으로 다시 맞춰주면 됩니다.
