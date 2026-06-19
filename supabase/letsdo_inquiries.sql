create extension if not exists pgcrypto;

create table if not exists public.website_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  company text not null,
  job_title text,
  email text not null,
  interest_area text not null,
  message text,

  source_page text not null default 'website',
  source_section text not null default 'form',
  referrer text,

  status text not null default 'new',
  notes text,
  is_read boolean not null default false
);

create index if not exists idx_website_inquiries_created_at
  on public.website_inquiries (created_at desc);

create index if not exists idx_website_inquiries_status
  on public.website_inquiries (status);

create index if not exists idx_website_inquiries_email
  on public.website_inquiries (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_website_inquiries_updated_at on public.website_inquiries;

create trigger trg_website_inquiries_updated_at
before update on public.website_inquiries
for each row
execute function public.set_updated_at();

alter table public.website_inquiries enable row level security;

drop policy if exists "website_inquiries_block_select" on public.website_inquiries;
drop policy if exists "website_inquiries_block_insert" on public.website_inquiries;
drop policy if exists "website_inquiries_block_update" on public.website_inquiries;
drop policy if exists "website_inquiries_block_delete" on public.website_inquiries;

create policy "website_inquiries_block_select"
on public.website_inquiries
for select
using (false);

create policy "website_inquiries_block_insert"
on public.website_inquiries
for insert
with check (false);

create policy "website_inquiries_block_update"
on public.website_inquiries
for update
using (false);

create policy "website_inquiries_block_delete"
on public.website_inquiries
for delete
using (false);
