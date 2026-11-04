-- 기존 배포 DB용 마이그레이션 (2026-11-03)
-- Supabase > SQL Editor에 전체 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전합니다(멱등).

-- 1) 지원 언어 확장 (네팔어·인도네시아어·우즈베크어)
alter table care_records drop constraint if exists care_records_lang_check;
alter table care_records
  add constraint care_records_lang_check
  check (lang in ('vi', 'en', 'ko', 'id', 'ne', 'uz'));

-- 2) 공유 범위 컬럼 (담당자가 확정 시 결정)
alter table care_records
  add column if not exists share_scope text not null default 'internal'
  check (share_scope in ('internal', 'family'));

-- 3) 반려 상태 + 보완 요청 사유
alter table care_records drop constraint if exists care_records_status_check;
alter table care_records
  add constraint care_records_status_check
  check (status in ('draft', 'confirmed', 'returned'));
alter table care_records add column if not exists return_note text;

-- 4) 반려 사유의 작성자 언어 자동 번역본
alter table care_records add column if not exists return_note_translated text;

-- 5) 반려 이력 로그 (재검토 시 과거 반려 사유 참고)
alter table care_records add column if not exists return_history jsonb not null default '[]';
