-- Cloud-Based Student Project Repository - Supabase schema
-- Run this in the Supabase SQL editor (or via supabase db push).

-- ============ TABLES ============

create table if not exists public.users (
  "userId" uuid primary key references auth.users (id) on delete cascade,
  "fullName" text not null,
  email text not null unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  department text not null default '',
  "indexNumber" text default '',
  programme text default '',
  "levelYear" text default '',
  contact text default '',
  active boolean not null default true,
  "dateCreated" timestamptz not null default now()
);

create table if not exists public.projects (
  "projectId" uuid primary key default gen_random_uuid(),
  title text not null,
  "authorName" text not null,
  department text not null,
  "academicYear" text not null,
  abstract text not null,
  keywords text[] not null default '{}',
  "pdfUrl" text not null,
  "pdfPath" text not null,
  "githubUrl" text,
  "sourceCodeZipUrl" text,
  "sourceCodeZipPath" text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  "uploadDate" timestamptz not null default now(),
  "downloadCount" integer not null default 0,
  "viewCount" integer not null default 0,
  "helpfulCount" integer not null default 0,
  "helpfulBy" uuid[] not null default '{}',
  "uploaderId" uuid not null references public.users ("userId") on delete cascade
);

create table if not exists public.downloads (
  "downloadId" uuid primary key default gen_random_uuid(),
  "userId" uuid references public.users ("userId") on delete set null,
  "projectId" uuid not null references public.projects ("projectId") on delete cascade,
  "downloadDate" timestamptz not null default now()
);

create table if not exists public.bookmarks (
  "bookmarkId" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.users ("userId") on delete cascade,
  "projectId" uuid not null references public.projects ("projectId") on delete cascade,
  "bookmarkDate" timestamptz not null default now(),
  unique ("userId", "projectId")
);

create table if not exists public.notifications (
  "notificationId" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.users ("userId") on delete cascade,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  "dateCreated" timestamptz not null default now()
);

-- Useful indexes
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_uploader_idx on public.projects ("uploaderId");
create index if not exists projects_department_idx on public.projects (department);
create index if not exists bookmarks_user_idx on public.bookmarks ("userId");
create index if not exists notifications_user_idx on public.notifications ("userId");
create index if not exists downloads_project_idx on public.downloads ("projectId");

-- ============ ROW LEVEL SECURITY ============
-- The app routes all writes through server actions using the service role key,
-- which bypasses RLS. These policies protect against direct client access.

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.downloads enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;

-- Helper: check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where "userId" = auth.uid() and role = 'admin'
  );
$$;

-- USERS: read own profile; admins read all; users update own profile (not role/active)
create policy "users_select_own" on public.users
  for select using (auth.uid() = "userId" or public.is_admin());

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = "userId" and role = 'student');

create policy "users_update_own" on public.users
  for update using (auth.uid() = "userId")
  with check (auth.uid() = "userId" and role = (select role from public.users where "userId" = auth.uid()));

-- PROJECTS: anyone reads approved; uploader/admin read own pending/rejected
create policy "projects_select_approved" on public.projects
  for select using (
    status = 'Approved'
    or auth.uid() = "uploaderId"
    or public.is_admin()
  );

-- Only service role (server actions) creates/updates/deletes projects; no client policies for write.

-- DOWNLOADS: authenticated users can log downloads for themselves; admins can read
create policy "downloads_insert_authed" on public.downloads
  for insert with check (auth.uid() is not null and ("userId" is null or "userId" = auth.uid()));

create policy "downloads_select_admin" on public.downloads
  for select using (public.is_admin());

-- BOOKMARKS: users manage only their own
create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = "userId" or public.is_admin());

create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = "userId");

create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = "userId" or public.is_admin());

-- NOTIFICATIONS: users read/update their own
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = "userId");

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = "userId");

-- ============ STORAGE ============
-- Create a private bucket named "projects" in the Supabase dashboard (Storage),
-- or run: insert into storage.buckets (id, name, public) values ('projects', 'projects', false);
-- Files are uploaded and signed by the server (service role), so no public storage policies are needed.
insert into storage.buckets (id, name, public)
values ('projects', 'projects', false)
on conflict (id) do nothing;
