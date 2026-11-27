-- 기본 테이블: 사용자(app_user), 그룹(record_group), 정보 기록(information_record), 기록 파일 버킷
-- 기준 문서: docs/database.md. 사용자 테이블은 예약어 user를 피해 app_user로 둔다 (docs/decisions.md 2026-11-27)

-- 트리거 함수처럼 API로 노출하면 안 되는 함수를 두는 곳
create schema if not exists private;

-- ── 사용자 ──────────────────────────────────────────────
create table public.app_user (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);

-- ── 그룹 (행성) ─────────────────────────────────────────
create table public.record_group (
  group_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_user (user_id) on delete cascade,
  name text not null,
  color text,
  is_default boolean not null default false,
  ai_search_excluded boolean not null default false,
  created_at timestamptz not null default now(),
  -- 기록이 '같은 주인의 그룹'만 참조하도록 복합 외래 키에서 쓴다
  unique (group_id, owner_id)
);

create index record_group_owner_id_idx on public.record_group (owner_id);
-- '분류 안 된 기록'은 사용자마다 1개
create unique index record_group_one_default_per_owner on public.record_group (owner_id) where is_default;

-- ── 정보 기록 (별) ──────────────────────────────────────
create table public.information_record (
  record_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_user (user_id) on delete cascade,
  group_id uuid not null,
  suggested_group_id uuid references public.record_group (group_id) on delete set null,
  record_type text not null check (record_type in ('memo', 'highlight', 'url', 'video', 'file', 'capture')),
  title text,
  information_content text,
  source_url text,
  file_path text,
  file_type text,
  file_size integer check (file_size > 0 and file_size <= 10485760),
  original_context text,
  summary text,
  summary_detail jsonb,
  status text not null default 'uploading'
    check (status in ('uploading', 'queued', 'processing', 'done', 'failed', 'deleting')),
  error_message text,
  collected_from text not null check (collected_from in ('desktop', 'web', 'mcp')),
  embedding_model text,
  created_at timestamptz not null default now(),
  -- 남의 그룹에 기록을 넣을 수 없게 DB에서도 막는다. 그룹 삭제는 기록을 먼저 옮기거나 지운 뒤에만 가능
  foreign key (group_id, owner_id) references public.record_group (group_id, owner_id) on delete restrict
);

create index information_record_owner_created_idx on public.information_record (owner_id, created_at desc);
create index information_record_group_id_idx on public.information_record (group_id);
create index information_record_suggested_group_id_idx on public.information_record (suggested_group_id);
-- 가공 서버가 재처리할 기록(queued·processing)을 찾을 때 쓴다
create index information_record_status_idx on public.information_record (status) where status in ('queued', 'processing');

-- ── 권한: 로그인한 사용자만, 자기 것만 ─────────────────
alter table public.app_user enable row level security;
alter table public.record_group enable row level security;
alter table public.information_record enable row level security;

revoke all on public.app_user, public.record_group, public.information_record from anon;
grant select, update on public.app_user to authenticated;
grant select, insert, update, delete on public.record_group, public.information_record to authenticated;

create policy "app_user: 본인 조회" on public.app_user for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "app_user: 본인 수정" on public.app_user for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "record_group: 본인 조회" on public.record_group for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "record_group: 본인 생성" on public.record_group for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "record_group: 본인 수정" on public.record_group for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "record_group: 본인 삭제" on public.record_group for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "information_record: 본인 조회" on public.information_record for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "information_record: 본인 생성" on public.information_record for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "information_record: 본인 수정" on public.information_record for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "information_record: 본인 삭제" on public.information_record for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ── 가입 시 사용자 복사 + 기본 그룹 생성 ───────────────
-- 구글은 name·picture를, 다른 공급자는 full_name·avatar_url을 줄 수 있어 둘 다 읽는다
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_user (user_id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    coalesce(new.raw_user_meta_data ->> 'picture', new.raw_user_meta_data ->> 'avatar_url'),
    new.email
  );
  insert into public.record_group (owner_id, name, is_default)
  values (new.id, '분류 안 된 기록', true);
  return new;
end;
$$;

-- 인증 정보가 바뀌면 사진·이메일만 다시 복사한다. 표시 이름은 사용자가 바꿀 수 있어 덮어쓰지 않는다
create function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.app_user
  set avatar_url = coalesce(new.raw_user_meta_data ->> 'picture', new.raw_user_meta_data ->> 'avatar_url'),
      email = new.email
  where user_id = new.id;
  return new;
end;
$$;

revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function private.handle_auth_user_updated() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create trigger on_auth_user_updated
  after update of raw_user_meta_data, email on auth.users
  for each row execute function private.handle_auth_user_updated();

-- ── 기록 파일 버킷 ──────────────────────────────────────
-- 비공개. 업로드는 웹 API가 발급한 서명 업로드 주소로만 한다. 크기·형식 제한을 버킷에도 건다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'records',
  'records',
  false,
  10485760,
  array[
    'text/csv',
    'text/plain',
    'text/markdown',
    'text/html',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/svg+xml'
  ]
);
