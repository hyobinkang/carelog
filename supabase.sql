-- 케어로그 시제품 스키마
-- Supabase 프로젝트 > SQL Editor에 붙여넣고 실행하세요.
create table if not exists care_records (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  lang text not null check (lang in ('vi', 'en', 'ko')),
  original_text text not null,
  translation_ko text not null default '',
  back_translation text,
  fields jsonb not null default '{}',
  risks jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  ai_mode text not null default 'live',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists idx_care_records_status on care_records (status, created_at desc);
create index if not exists idx_care_records_patient on care_records (patient_id, created_at desc);

-- 서버(서비스 롤 키)로만 접근: RLS를 켜고 공개 정책은 만들지 않는다.
alter table care_records enable row level security;
