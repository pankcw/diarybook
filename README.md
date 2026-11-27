# My Little Diary

Buku diary digital (HTML + CSS + JavaScript murni) dengan Supabase sebagai backend.

**Sudah ada:** sampul yang bisa dibuka/ditutup, judul sampul yang bisa diedit, balik halaman 3D, tambah halaman, login per pengguna, editor tulisan tangan (bold/italic/underline, font, ukuran, warna, rata teks, daftar, emoji, tanggal, foto, sticky note), auto-save (debounce) + tombol simpan + status Saving/Saved/Failed, RLS.

**Belum ada (tahap berikutnya):** music player & playlist, daftar isi, bookmark, pencarian, kalender, mood tracker, tema, tempat sampah, statistik.

## 1. Buat project Supabase
1. Daftar di supabase.com → **New project**.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run** (membuat tabel, RLS, dan bucket foto).
3. **Authentication → Providers → Email** harus aktif. Untuk uji coba cepat, matikan *Confirm email*.

## 2. Hubungkan ke website
Buka `js/config.js`, isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari **Project Settings → API**.
Gunakan hanya anon/publishable key. **Jangan pernah** menaruh `service_role` key di frontend.

## 3. Deploy ke GitHub Pages
1. Buat repository baru, unggah semua isi folder ini (`index.html` harus di root).
2. **Settings → Pages → Deploy from a branch → main / (root)** → Save.
3. Salin URL Pages (`https://username.github.io/repo/`) ke **Supabase → Authentication → URL Configuration → Site URL**.

## Struktur
`index.html` · `css/style.css` · `js/config.js` · `js/main.js` · `supabase/schema.sql`
