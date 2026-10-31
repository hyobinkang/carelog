# 케어로그 CareLog

외국인 요양보호사가 모국어(베트남어·영어) 또는 서툰 한국어로 쓴 관찰 메모를
AI가 **한국어 돌봄 기록 초안**으로 번역·구조화하고, **위험 신호**(낙상·발열·통증 등)를
자동 표시하는 웹 서비스 시제품입니다. 담당자가 원문과 대조해 검토·확정해야
정식 기록이 됩니다.

> 2026 AI 라이프 솔루션 챌린지 출품작 (아이디어 챌린지 "케어브릿지" 기반)
> 모든 대상자·기록은 가상 데이터입니다.

## 핵심 흐름

1. **요양보호사**: 대상자 선택 → 모국어로 메모 입력
2. **AI**: 한국어 번역·정제 → 8개 표준 항목 구조화 → 위험 신호 판별
   (LLM + 키워드 규칙 **이중 판별**로 누락 최소화)
3. **담당자**: 원문·초안 나란히 검토 → 수정 → 확정 → 대상자별 기록 조회

## 기술 구성

- Next.js 16 (App Router, API Routes) + Tailwind CSS 4
- AI: Anthropic Claude 또는 OpenAI (환경변수로 자동 감지, 둘 다 없으면 모의 모드)
- DB: Supabase Postgres (없으면 로컬 `.data/records.json` — 개발용)

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000 — 키 없이 모의 AI 모드로 동작
```

실제 AI를 쓰려면 `.env.local`에 키 하나만 넣으면 됩니다 (`.env.example` 참고):

```bash
ANTHROPIC_API_KEY=sk-ant-...   # 또는 OPENAI_API_KEY=sk-...
```

## 배포 (Vercel + Supabase, 약 20분)

1. **GitHub**: 이 폴더를 새 저장소로 푸시
   ```bash
   git remote add origin https://github.com/<계정>/carelog.git
   git push -u origin main
   ```
2. **Supabase**: 새 프로젝트 생성 → SQL Editor에 `supabase.sql` 내용 붙여넣고 실행
   → Settings > API에서 `URL`과 `service_role` 키 복사
3. **Vercel**: Add New Project → GitHub 저장소 import → Environment Variables에 입력
   - `ANTHROPIC_API_KEY` (또는 `OPENAI_API_KEY`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   → Deploy. 생성된 URL이 공모전 제출용 **테스트 URL**입니다.

> ⚠ Vercel 배포 시 Supabase 설정은 필수입니다. 파일 저장소는 서버리스에서
> 유지되지 않습니다. `service_role` 키는 서버 코드에서만 쓰이며 브라우저에
> 노출되지 않습니다.

## 프로젝트 구조

```
app/
  page.tsx               # 역할 선택 랜딩
  caregiver/page.tsx     # 요양보호사: 메모 입력 (모바일 우선, 다국어 병기)
  staff/page.tsx         # 담당자: 검토 대기 / 확정 기록 목록
  staff/[id]/page.tsx    # 검토·수정·확정 화면 (원문 항상 병기)
  api/records/           # 기록 생성(AI 파이프라인 호출)·조회·수정·확정
lib/
  ai.ts                  # LLM 번역·구조화·위험 판별 (+모의 모드, 실패 시 규칙 격하)
  risk.ts                # 위험 신호 키워드 규칙 (한·베·영)
  store.ts               # Supabase/파일 이중 저장소
  patients.ts            # 가상 대상자 시드
supabase.sql             # DB 스키마
```

## 범위 제한 (시제품)

- 로그인·권한 분리 없음 — 역할은 화면 전환으로 시연 (확장 계획: 기관 계정)
- 음성 입력(STT), 다국어 피드백, 기관 전산 연동은 확장 기능으로 설계에만 반영
- 개인정보 보호: 가상 데이터 전용, 실제 운영 시 식별정보 가명화 전제
