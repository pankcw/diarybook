-- Jalankan di Supabase → SQL Editor
create table public.diaries (
  user_id uuid primary key references auth.users on delete cascade,
  title text not null default 'My Little Diary',
  created_at timestamptz not null default now()
);
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  page_no int not null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, page_no)
);

-- Row Level Security: tiap pengguna hanya mengakses datanya sendiri
alter table public.diaries enable row level security;
alter table public.pages enable row level security;
create policy "diaries own" on public.diaries for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pages own" on public.pages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage untuk foto (bucket publik: siapa pun yang punya URL bisa melihat gambar;
-- hanya pemilik yang bisa mengunggah/menghapus di foldernya)
insert into storage.buckets (id, name, public) values ('diary-media', 'diary-media', true)
  on conflict do nothing;
create policy "media upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'diary-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'diary-media' and (storage.foldername(name))[1] = auth.uid()::text);
