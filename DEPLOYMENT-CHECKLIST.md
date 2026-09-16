# Kosakata Supabase Integration - Deployment Checklist

## Pre-Deployment Steps

### 1. ✅ Database Schema Update
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Run the entire `supabase-schema.sql` file
- [ ] Verify the `user_vocabulary` table is created
- [ ] Check that RLS policies are active

### 2. ✅ Verify Table Structure
Expected columns in `user_vocabulary`:
```
- id (bigint, primary key)
- user_id (uuid, foreign key)
- word (text)
- meaning (text)
- type (text, default 'noun')
- last_studied (timestamptz)
- next_review (timestamptz)
- status (text, default 'review')
- created_at (timestamptz)
- updated_at (timestamptz)
```

### 3. ✅ Test RLS Policies
Run this query to check policies:
```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'user_vocabulary';
```

Expected policies:
- Users can read their own vocabulary (SELECT)
- Users can insert their own vocabulary (INSERT)
- Users can update their own vocabulary (UPDATE)
- Users can delete their own vocabulary (DELETE)

## Deployment Steps

### 1. ✅ Backup Current Data (Optional)
If users have existing vocabulary in localStorage:
```javascript
// Run in browser console before deployment
const vocab = localStorage.getItem('englisify-vocabulary');
console.log('Backup:', vocab);
// Save this output
```

### 2. ✅ Deploy New Files
Upload these modified files to your hosting:
- `js/supabase.js` (updated with vocabulary methods)
- `js/kosakata.js` (rewritten for Supabase)
- `supabase-schema.sql` (updated with vocabulary table)

### 3. ✅ Test After Deployment
- [ ] Login to the application
- [ ] Navigate to Kosakata page
- [ ] Add a test word
- [ ] Verify it appears in the list
- [ ] Refresh the page - word should persist
- [ ] Mark word as studied
- [ ] Delete the test word
- [ ] Check browser console for any errors

## Post-Deployment Verification

### 1. Check Database
```sql
-- Verify data is being saved
SELECT * FROM user_vocabulary LIMIT 10;

-- Check for any orphaned records
SELECT v.* FROM user_vocabulary v
LEFT JOIN auth.users u ON v.user_id = u.id
WHERE u.id IS NULL;
```

### 2. Check User Experience
- [ ] New users can add vocabulary
- [ ] Existing users see empty list (or migrated data)
- [ ] Search functionality works
- [ ] Filter tabs work (Semua, Dipelajari, Perlu Review)
- [ ] Audio pronunciation works
- [ ] Modal opens and closes correctly
- [ ] Toast notifications appear

### 3. Performance Check
- [ ] Page loads in < 2 seconds
- [ ] Adding word is responsive
- [ ] No console errors
- [ ] No network errors in DevTools

## Rollback Plan

If issues occur, rollback by:

### 1. Restore Old Files
```bash
# Restore from git
git checkout HEAD -- js/kosakata.js js/supabase.js
```

### 2. Keep Database Table
The `user_vocabulary` table can stay in the database - it won't affect the old code.

### 3. Restore localStorage (if needed)
```javascript
// In browser console
localStorage.setItem('englisify-vocabulary', 'BACKUP_DATA_HERE');
```

## Migration Script (Optional)

If you need to migrate existing localStorage data to Supabase:

```javascript
// Run this in browser console while logged in
async function migrateVocabulary() {
  const localData = localStorage.getItem('englisify-vocabulary');
  if (!localData) {
    console.log('No local vocabulary found');
    return;
  }
  
  const vocab = JSON.parse(localData);
  console.log(`Found ${vocab.length} words to migrate`);
  
  for (const item of vocab) {
    try {
      await window.EnglisifySupabase.addVocabulary(
        item.word,
        item.meaning,
        item.type || 'noun'
      );
      console.log(`Migrated: ${item.word}`);
    } catch (error) {
      console.error(`Failed to migrate ${item.word}:`, error);
    }
  }
  
  console.log('Migration complete!');
}

// Run the migration
migrateVocabulary();
```

## Common Issues

### Issue: "Gagal memuat kosakata"
**Solution:**
1. Check if user is logged in
2. Verify table exists in Supabase
3. Check RLS policies
4. Look for errors in browser console

### Issue: Empty vocabulary list
**Solution:**
1. This is expected for new integration
2. Users need to add new words
3. Or run migration script for existing data

### Issue: "Gagal menambahkan kata"
**Solution:**
1. Verify user is authenticated
2. Check table structure matches schema
3. Verify RLS policies allow INSERT
4. Check network tab for API errors

### Issue: Changes not persisting
**Solution:**
1. Check if RLS policies are correct
2. Verify user_id matches auth.uid()
3. Check Supabase logs for errors
4. Ensure internet connection is stable

## Support Contacts

- Supabase Dashboard: https://app.supabase.com
- Project URL: https://nyzlrtjzfzskcdnrvyzo.supabase.co
- Documentation: See `VOCABULARY-SUPABASE-INTEGRATION.md`

## Success Criteria

Deployment is successful when:
- ✅ Users can add vocabulary words
- ✅ Words persist after page refresh
- ✅ Words can be marked as studied
- ✅ Words can be deleted
- ✅ No console errors
- ✅ No data loss
- ✅ RLS protects user data
- ✅ Performance is acceptable
