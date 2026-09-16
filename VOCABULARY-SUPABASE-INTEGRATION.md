# Vocabulary Supabase Integration

## Overview
The vocabulary (kosakata) feature has been integrated with Supabase to store user vocabulary data in the cloud instead of localStorage.

## Changes Made

### 1. Database Schema (`supabase-schema.sql`)
Added a new table `user_vocabulary` with the following structure:
- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to auth.users (UUID)
- `word`: English word
- `meaning`: Indonesian translation
- `type`: Word type (noun, verb, adjective)
- `last_studied`: Timestamp of last study session
- `next_review`: Timestamp for next review
- `status`: Current status ('review' or 'dipelajari')
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Row Level Security (RLS)**: Users can only access their own vocabulary.

### 2. Supabase Client (`js/supabase.js`)
Added new methods:
- `getVocabulary()`: Fetch all vocabulary for the current user
- `addVocabulary(word, meaning, type)`: Add a new vocabulary word
- `updateVocabulary(id, updates)`: Update an existing vocabulary word
- `deleteVocabulary(id)`: Delete a vocabulary word

### 3. Vocabulary Logic (`js/kosakata.js`)
Completely rewritten to use Supabase instead of localStorage:
- Loads vocabulary from Supabase on page load
- All CRUD operations now interact with the database
- Async/await pattern for database operations
- Better error handling and user feedback
- Relative date formatting for last studied and next review dates

## Setup Instructions

### 1. Run Database Schema
Execute the updated `supabase-schema.sql` in your Supabase SQL Editor:
```sql
-- The schema file will create the user_vocabulary table
-- and set up Row Level Security policies
```

### 2. (Optional) Seed Test Data
If you want to add sample vocabulary for testing:
1. Get your user UUID from Supabase Dashboard → Authentication → Users
2. Edit `sql/seed-vocabulary.sql` and replace `YOUR-USER-UUID` with your actual UUID
3. Uncomment the INSERT statement
4. Run the SQL in Supabase SQL Editor

### 3. Test the Integration
1. Login to the application
2. Navigate to the Kosakata page
3. Try adding a new word
4. Try marking a word as studied
5. Try deleting a word
6. Refresh the page to verify data persists

## Features

### User-Specific Data
- Each user has their own private vocabulary list
- Vocabulary is synced across devices when logged in
- No data sharing between users (enforced by RLS)

### Real-Time Operations
- Add new vocabulary words
- Mark words as studied (updates status and next review date)
- Delete unwanted words
- Search and filter vocabulary
- Audio pronunciation (uses browser's speech synthesis)

### Smart Review Scheduling
- New words: Review in 1 day
- Studied words: Review in 14 days
- Automatic timestamp tracking

## Migration Notes

### From localStorage to Supabase
- Old vocabulary data stored in `englisify-vocabulary` localStorage key will NOT be automatically migrated
- Users will start with an empty vocabulary list after the update
- If migration is needed, you can export localStorage data and import it via SQL

### User Authentication Required
- Users must be logged in to use the vocabulary feature
- Unauthenticated users will see empty results
- Add word button will show error if not logged in

## API Reference

### EnglisifySupabase.getVocabulary()
```javascript
const vocab = await window.EnglisifySupabase.getVocabulary();
// Returns: Array of vocabulary objects
```

### EnglisifySupabase.addVocabulary(word, meaning, type)
```javascript
const result = await window.EnglisifySupabase.addVocabulary(
  'journey',
  'perjalanan',
  'noun'
);
// Returns: Array with the newly created vocabulary object
```

### EnglisifySupabase.updateVocabulary(id, updates)
```javascript
await window.EnglisifySupabase.updateVocabulary(123, {
  status: 'dipelajari',
  next_review: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
});
// Returns: Array with the updated vocabulary object
```

### EnglisifySupabase.deleteVocabulary(id)
```javascript
await window.EnglisifySupabase.deleteVocabulary(123);
// Returns: Empty response on success
```

## Troubleshooting

### "Gagal memuat kosakata" (Failed to load vocabulary)
- Check if user is logged in
- Verify Supabase connection in browser console
- Check if the `user_vocabulary` table exists
- Verify RLS policies are set up correctly

### "Gagal menambahkan kata" (Failed to add word)
- Ensure user is authenticated
- Check browser console for error details
- Verify table structure matches schema

### Data not persisting
- Check if RLS policies are correctly set up
- Verify `auth_user_id` matches the logged-in user
- Check Supabase dashboard for any error logs

## Security

- **Row Level Security**: Enabled on `user_vocabulary` table
- **User Isolation**: Each user can only see and modify their own data
- **Authentication Required**: All operations require valid auth token
- **Input Validation**: Word and meaning fields are required
- **XSS Protection**: All output is HTML-escaped

## Future Enhancements

Potential improvements:
- Bulk import/export functionality
- Spaced repetition algorithm integration
- Word categories and tags
- Study statistics and progress tracking
- Vocabulary quizzes based on stored words
- Integration with flashcard system
