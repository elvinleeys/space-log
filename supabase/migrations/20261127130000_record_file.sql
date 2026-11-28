-- 기록 1개에 파일 여러 개(최대 10개)를 붙일 수 있게 파일 정보를 record_file 테이블로 옮긴다.
-- 화면 이름(제목 + 번호)은 저장하지 않고 position으로 만든다 (docs/decisions.md 2026-11-27)

-- record_file이 '같은 주인의 기록'만 참조하도록 복합 외래 키에서 쓴다
alter table public.information_record
  add constraint information_record_record_owner_key unique (record_id, owner_id);

create table public.record_file (
  file_id uuid primary key default gen_random_uuid(),
  record_id uuid not null,
  owner_id uuid not null references public.app_user (user_id) on delete cascade,
  -- 사용자가 넣은 순서. 화면 이름 '제목1', '제목2'의 번호
  position smallint not null check (position between 1 and 10),
  -- 사용자가 올린 원래 파일 이름 (이미지를 줄여 올리면 확장자가 .jpg로 바뀐 이름)
  original_name text not null,
  file_path text not null unique,
  file_type text not null,
  file_size integer not null check (file_size > 0 and file_size <= 10485760),
  created_at timestamptz not null default now(),
  unique (record_id, position),
  foreign key (record_id, owner_id)
    references public.information_record (record_id, owner_id) on delete cascade
);

create index record_file_owner_id_idx on public.record_file (owner_id);

alter table public.record_file enable row level security;
revoke all on public.record_file from anon;
grant select, insert, update, delete on public.record_file to authenticated;

create policy "record_file: 본인 조회" on public.record_file for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "record_file: 본인 생성" on public.record_file for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "record_file: 본인 수정" on public.record_file for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "record_file: 본인 삭제" on public.record_file for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- 이미 있는 파일 기록(파일 1개)을 record_file로 옮긴다. 경로는 예전 규칙(user_id/record_id.확장자) 그대로 둔다
insert into public.record_file (record_id, owner_id, position, original_name, file_path, file_type, file_size)
select
  record_id,
  owner_id,
  1,
  coalesce(title, regexp_replace(file_path, '^.*/', '')),
  file_path,
  coalesce(file_type, lower(regexp_replace(file_path, '^.*\.', ''))),
  file_size
from public.information_record
where file_path is not null and file_size is not null;

alter table public.information_record
  drop column file_path,
  drop column file_type,
  drop column file_size;
