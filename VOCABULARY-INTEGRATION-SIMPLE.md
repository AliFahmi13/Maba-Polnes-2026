# Vocabulary Integration (Using Flashcard Table)

## Overview
The vocabulary (kosakata) feature now uses the existing `flashcard` and `user_flashcards` tables instead of creating a separate vocabulary table. This approach is simpler and reuses existing infrastructure.

## How It Works

### Data Source
- **Global Vocabulary**: Reads from `public.flashcard` table (all users see this)
- **User Vocabulary**: Reads from `public.user_flashcards` table (user-specific additions)
- Both are combined and displayed in the vocabulary view

### Key Benefits
- ✅ No new database table needed
- ✅ Reuses existing flashcard infrastructure
- ✅ Words added in vocabulary appear in flashcards automatically
- ✅ Simpler architecture and maintenance
- ✅ Consistent data model across features

## Changes Made

### 1. JavaScript Files

**`js/kosakata.js`**
- Now calls `getFlashcards()` instead of `getVocabulary()`
- Transforms flashcard data to vocabulary format
- Adds words to `user_flashcards` table via `addFlashcard()`
- Simplified status tracking (shows all as "review")

**`js/supabase.js`**
- Added `addFlashcard()` method for creating user flashcards
- Removed separate vocabulary methods (getVocabulary, addVocabulary, etc.)
- Cleaner API surface

### 2. Database Schema

**`supabase-schema.sql`**
- No changes to existing tables
- Uses `public.flashcard` (global flashcards)
- Uses `public.user_flashcards` (user-created flashcards)
- Both already have proper RLS policies

## Features

### View All Vocabulary
- Displays all flashcards as vocabulary words
- Shows: word, meaning, type, pronunciation (IPA)
- Search and filter functionality
- Audio pronunciation via text-to-speech

### Add New Words
- Adds words to `user_flashcards` table with level='custom'
- User-added words are private (RLS protected)
- Automatically appear in both vocabulary and flashcard views

### Actions
- **Belajar di Flashcard**: Go to flashcard page to study
- **Lihat Detail**: Show word details (IPA, example, full meaning)
- **Audio**: Hear pronunciation (if sound enabled)

## Setup Instructions

### Requirements
✅ The flashcard tables must already exist (they should from flashcard feature)
✅ User must be logged in to add new words
✅ No additional schema changes needed

### Testing
1. Login to the application
2. Go to Kosakata page
3. You should see all existing flashcards
4. Click "Tambah Kata Baru"
5. Add a test word
6. It should appear in the list
7. Go to Flashcard page - the word should be there too!

## Data Structure

### Flashcard Table Schema
```sql
CREATE TABLE public.flashcard (
  id bigint PRIMARY KEY,
  level text NOT NULL DEFAULT 'A1',
  word text NOT NULL,
  ipa text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'noun',
  meaning text NOT NULL,
  example text NOT NULL DEFAULT ''
);
```

### User Flashcards Table Schema
```sql
CREATE TABLE public.user_flashcards (
  id bigint PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id),
  level text,
  word text NOT NULL,
  ipa text DEFAULT '',
  type text DEFAULT 'noun',
  meaning text NOT NULL,
  example text DEFAULT ''
);
```

## API Reference

### EnglisifySupabase.getFlashcards()
```javascript
const flashcards = await window.EnglisifySupabase.getFlashcards();
// Returns: Array of all flashcards (global + user-created)
```

### EnglisifySupabase.addFlashcard(flashcard)
```javascript
const result = await window.EnglisifySupabase.addFlashcard({
  word: 'journey',
  meaning: 'perjalanan',
  type: 'noun',
  level: 'custom',
  ipa: '',
  example: '"journey"'
});
// Returns: Array with the newly created flashcard
```

## Differences from Flashcard View

| Feature | Flashcard View | Vocabulary View |
|---------|---------------|-----------------|
| Purpose | Study/review with cards | Browse/search all words |
| Display | One card at a time | Table with all words |
| Actions | Rate difficulty, flip card | View details, go to flashcard |
| Progress | Tracks review progress | Shows all words |
| Filter | By level | By search term |

## Troubleshooting

### "Belum ada kosakata di database"
**Cause:** No flashcards in the database yet
**Solution:** Run the flashcard seed SQL (`sql/seed-flashcards.sql`)

### Can't add new words
**Cause:** Not logged in or `user_flashcards` table doesn't exist
**Solution:** 
1. Make sure you're logged in
2. Run `supabase-schema.sql` if needed
3. Check browser console for errors

### Added word doesn't appear
**Cause:** Might be a caching issue
**Solution:** Refresh the page

### Word appears in vocabulary but not flashcard
**Cause:** Should not happen - they use same data source
**Solution:** Check if filtering by level in flashcard view

## Future Enhancements

Potential improvements:
- Track vocabulary learning progress separately
- Add vocabulary-specific metadata (frequency, difficulty)
- Bulk import vocabulary lists
- Export vocabulary to CSV
- Group vocabulary by topic/category
- Integration with reading test (mark unknown words to vocabulary)
