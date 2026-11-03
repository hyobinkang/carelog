-- 기존 배포 DB용 마이그레이션 (2026-11-03)
-- Supabase > SQL Editor에 붙여넣고 실행하세요.

-- 1) 지원 언어 확장 (네팔어·인도네시아어·우즈베크어)
alter table care_records drop constraint if exists care_records_lang_check;
alter table care_records
  add constraint care_records_lang_check
  check (lang in ('vi', 'en', 'ko', 'id', 'ne', 'uz'));

-- 2) 공유 범위 컬럼 (담당자가 확정 시 결정)
alter table care_records
  add column if not exists share_scope text not null default 'internal'
  check (share_scope in ('internal', 'family'));
