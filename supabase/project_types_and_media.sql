-- Run this once in the Supabase SQL Editor.
-- Adds support for multiple project submission formats: a project type tag,
-- an optional live/external URL (website, hosted demo, Figma, etc.), an
-- optional image gallery, and makes the PDF fields optional so a project can
-- be submitted with just a website link, images, or code instead of a PDF.

alter table projects add column if not exists "projectType" text not null default 'Other';
alter table projects add column if not exists "liveUrl" text;
alter table projects add column if not exists "images" text[];

alter table projects alter column "pdfUrl" drop not null;
alter table projects alter column "pdfPath" drop not null;
