# Quick Fix for "Gagal memuat kosakata" Error

## Problem
The vocabulary page shows "Gagal memuat kosakata" (Failed to load vocabulary) error.

## Most Likely Cause
The `user_vocabulary` table hasn't been created in Supabase yet.

## Solution

### Step 1: Create the Database Table

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the ENTIRE content of `supabase-schema.sql`
6. Click **Run** button (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

### Step 2: Verify Setup

1. Open `verify-vocabulary-setup.html` in your browser
2. Check all status indicators:
   - ✓ Logged In
   - ✓ Connected
   - ✓ Table Exists
3. Click "Test Add Vocabulary" button
4. If successful, go to kosakata.html and refresh

### Step 3: Test the Vocabulary Page

1. Go to kosakata.html
2. You should now see "Belum ada kosakata. Klik tombol 'Tambah Kata Baru' untuk memulai."
3. Click "Tambah Kata Baru"
4. Add a test word
5. The word should appear in the table

## Alternative Fixes

### If you're not logged in:
1. Go to login.html
2. Login with your account
3. Return to kosakata.html

### If the table exists but still shows error:
1. Open browser console (F12)
2. Look for error messages
3. Check if there's a CORS or authentication error
4. Verify your Supabase URL and API key in js/supabase.js

### If you see 404 or permission errors:
1. Check Row Level Security (RLS) policies
2. Run this query in Supabase SQL Editor:
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'user_vocabulary';
```
3. If no policies found, run supabase-schema.sql again

## Common Errors and Solutions

### Error: "relation 'user_vocabulary' does not exist"
**Solution:** Run supabase-schema.sql in Supabase SQL Editor

### Error: "Not logged in"
**Solution:** Login first at login.html

### Error: "new row violates row-level security policy"
**Solution:** RLS policies are too strict. Check that the policy allows INSERT for authenticated users

### Error: Empty table but no error
**Solution:** This is normal for new users. Add vocabulary words manually.

## Debug Checklist

- [ ] Supabase project is accessible
- [ ] `user_vocabulary` table exists in database
- [ ] RLS policies are created (4 policies total)
- [ ] User is logged in
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

## Still Not Working?

Run this SQL query to check your setup:

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_vocabulary'
);

-- Check policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_vocabulary';

-- Count vocabulary items for current user
SELECT COUNT(*) FROM user_vocabulary 
WHERE user_id = auth.uid();
```

If all queries succeed, the problem might be in the frontend. Check browser console for JavaScript errors.
