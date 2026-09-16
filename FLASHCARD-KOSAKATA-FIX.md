# Fix: Flashcard & Kosakata Tidak Muncul

## 🔍 Masalah
- Halaman **Flashcard** tidak menampilkan kartu
- Halaman **Kosakata** tidak menampilkan data vocabulary

## 🎯 Penyebab
Data flashcard belum ada di database Supabase, atau schema belum sesuai.

## ✅ Solusi Lengkap

### **Opsi 1: Setup Lengkap Sekaligus (RECOMMENDED)**

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Englisify Anda
   - Klik **SQL Editor** di sidebar kiri

2. **Jalankan Complete Setup**
   - Klik **New Query**
   - Buka file `sql/complete-setup.sql`
   - Copy semua isinya
   - Paste ke SQL Editor
   - Klik **Run** atau tekan `Ctrl + Enter`

3. **Verifikasi**
   - Lihat output di bagian bawah
   - Seharusnya muncul:
     ```
     status: "Setup complete!"
     total_flashcards: 50
     ```
   - Cek juga breakdown per level (A1, A2, B1, B2, C1, C2)

4. **Test di Browser**
   - Refresh halaman Flashcard
   - Refresh halaman Kosakata
   - Seharusnya data sudah muncul

---

### **Opsi 2: Setup Bertahap (Jika Opsi 1 Gagal)**

#### **Step 1: Buat Schema**
```sql
-- Jalankan ini di SQL Editor Supabase
```
Copy isi file `Maba-Polnes-2026/supabase-schema.sql` dan jalankan.

#### **Step 2: Insert Data Flashcard**
```sql
-- Jalankan ini setelah Step 1 selesai
```
Copy isi file `sql/seed-flashcards.sql` dan jalankan.

#### **Step 3: Verifikasi Data**
```sql
select count(*) from public.flashcard;
select * from public.flashcard limit 10;
```

---

## 🔎 Troubleshooting

### **Masalah: Error "duplicate key value violates unique constraint"**
**Solusi:** Data sudah ada. Hapus dulu atau skip seed:
```sql
truncate table public.flashcard restart identity;
-- Lalu jalankan seed lagi
```

### **Masalah: Error "permission denied"**
**Solusi:** Pastikan RLS (Row Level Security) sudah di-setup dengan benar.
- Cek apakah policy "Anyone can read flashcards" sudah ada
- Jika belum, jalankan ulang schema dari complete-setup.sql

### **Masalah: Flashcard masih kosong setelah seed**
**Penyebab:** Browser belum reload atau cache
**Solusi:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear localStorage:
   - Buka Console browser (F12)
   - Ketik: `localStorage.clear()`
   - Refresh lagi

### **Masalah: Error di Console "getFlashcards error"**
**Debug:**
1. Buka Console browser (F12)
2. Lihat error detail
3. Cek apakah:
   - Supabase URL benar di `js/supabase.js`
   - API key valid
   - Table name sesuai: `flashcard` (bukan `flashcards`)

---

## 📊 Expected Results

### **Flashcard Page**
- Tombol "Mulai Flashcard" harus muncul
- Setelah klik, kartu vocabulary ditampilkan
- Bisa flip kartu (klik untuk balik)
- Rating buttons muncul di bawah

### **Kosakata Page**
- Tabel vocabulary terisi
- Kolom: Kata, Arti, Jenis, Terakhir Dipelajari, Review Berikutnya
- Bisa filter: Semua / Dipelajari / Perlu Review
- Bisa search kata

### **Data Count per Level**
- A1: ~10 kata
- A2: ~8 kata  
- B1: ~10 kata
- B2: ~8 kata
- C1: ~8 kata
- C2: ~8 kata
- **Total: ~50 kata**

---

## 🧪 Quick Test Query

Jalankan ini di Supabase SQL Editor untuk cek apakah data ada:

```sql
-- Check table exists
select exists (
  select from information_schema.tables 
  where table_schema = 'public' 
  and table_name = 'flashcard'
) as table_exists;

-- Count flashcards
select count(*) as total from public.flashcard;

-- Sample data
select level, word, meaning from public.flashcard limit 5;

-- Check RLS policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies 
where tablename = 'flashcard';
```

---

## 📝 Notes

1. **Schema Updated**: File `supabase-schema.sql` sudah diupdate dengan `unique` constraint pada kolom `word`
2. **Seed Data**: File `complete-setup.sql` berisi schema + data sekaligus
3. **Browser Cache**: Kadang perlu hard refresh untuk melihat perubahan
4. **RLS**: Flashcard table harus punya policy "Anyone can read" agar bisa diakses tanpa login

---

## 🚀 Next Steps Setelah Fix

1. Test flashcard learning flow
2. Test vocabulary search & filter
3. Test user vocabulary history tracking
4. Add more vocabulary via seed jika perlu

---

## 💡 Tips

- Bookmark SQL Editor Supabase untuk akses cepat
- Simpan query yang sering dipakai
- Monitor Console browser untuk debug
- Check Network tab untuk lihat API calls ke Supabase
