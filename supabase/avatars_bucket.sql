-- Run this once in the Supabase SQL Editor.
-- Creates a public storage bucket for profile photos, and adds the
-- avatarUrl column to store each user's current photo URL.
-- The bucket is public so avatar images can be displayed directly (header,
-- sidebar, etc.) without needing short-lived signed URLs. Uploads still go
-- through the server (service role), so writes are not open to the public.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

alter table users add column if not exists "avatarUrl" text;
