# Vocabulary Integration - Final Version

## Overview
The vocabulary (kosakata) feature is now fully integrated with a simplified architecture:
- ✅ Uses the **global `flashcard` table** (not user_flashcards)
- ✅ Tracks learning history per user
- ✅ Smart review scheduling with spaced repetition
- ✅ All users can add words (visible to everyone)
- ✅ Each user has private learning history

## Architecture

### Data Tables

**1. `public.flashcard` (Global Vocabulary)**
- Stores all vocabulary words
- Visible to everyone (public read)
- Authenticated users can add words (public insert)
- Words added by any user appear for all users

**2. `public.user_vocabulary_history` (Private Progress)**
- Tracks each user's learning history
- Private to each user (RLS protected)
- Records study sessions and review dates
- One record per user per word

### Key Benefits
- ✅ **Simple architecture** - Only one flashcard table
- ✅ **Shared vocabulary** - Everyone benefits from added words
- ✅ **Private progress** - Your history is yours alone
- ✅ **No duplication** - Single source of truth for words
- ✅ **Easy maintenance** - Less tables, less complexity

## Features

### 1. View All Vocabulary
- Shows all flashcards from global table
- Search and filter functionality
- Audio pronunciation
- Displays your personal learning progress

### 2. Add New Words
- Any authenticated user can add words
- Words become available to ALL users
- Marked with level='custom' for user-added content
- Instantly appears in both vocabulary and flashcard views

### 3. Track Learning Progress
- Study flashcards → Automatically recorded
- Shows "Last Studied" and "Next Review" dates
- Filter by "Dipelajari" (studied) vs "Semua" (all)
- Visual indicators for due reviews

### 4. Smart Review Scheduling
Spaced repetition based on your rating:
- **Lupa (Forgot)**: Review in 1 day
- **Sulit (Hard)**: Review in 3 days
- **Ingat (Good)**: Review in 7 days
- **Mudah (Easy)**: Review in 14 days

## Database Schema

### flashcard table
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

-- Policies
- SELECT: Anyone can read (true)
- INSERT: Authenticated users can add (auth.uid() is not null)
```

### user_vocabulary_history table
```sql
CREATE TABLE public.user_vocabulary_history (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  word text NOT NULL,
  last_studied timestamptz NOT NULL DEFAULT now(),
  next_review timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  review_count int NOT NULL DEFAULT 1,
  rating text NOT NULL DEFAULT 'good',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Policies
- SELECT: Users can read their own (auth.uid() = user_id)
- INSERT: Users can insert their own (auth.uid() = user_id)
- UPDATE: Users can update their own (auth.uid() = user_id)
- DELETE: Users can delete their own (auth.uid() = user_id)
```

## API Reference

### EnglisifySupabase.getFlashcards()
```javascript
const flashcards = await window.EnglisifySupabase.getFlashcards();
// Returns: Array of ALL flashcards from global table
```

### EnglisifySupabase.addFlashcard(flashcard)
```javascript
const result = await window.EnglisifySupabase.addFlashcard({
  word: 'journey',
  meaning: 'perjalanan',
  type: 'noun',
  level: 'custom',
  ipa: '/ˈdʒɜːrni/',
  example: '"We went on a long journey."'
});
// Returns: Array with newly created flashcard
// Note: Word becomes visible to ALL users
```

### EnglisifySupabase.getVocabularyHistory()
```javascript
const history = await window.EnglisifySupabase.getVocabularyHistory();
// Returns: Array of YOUR learning history records
```

### EnglisifySupabase.recordVocabularyReview(word, rating)
```javascript
await window.EnglisifySupabase.recordVocabularyReview('apple', 'good');
// Records or updates your study session for this word
// Automatically called when rating flashcards
```

## User Flows

### Flow 1: Study Existing Words
```
1. User opens Kosakata page
2. Sees all words (seeded + user-added)
3. Clicks "Belajar Sekarang" → Goes to Flashcard
4. Studies cards, rates them
5. Returns to Kosakata → Sees progress in "Dipelajari" tab
```

### Flow 2: Add New Word
```
1. User clicks "Tambah Kata Baru"
2. Fills form: word, meaning, type
3. Submits → Added to global flashcard table
4. Word now visible to ALL users
5. Appears in both Vocabulary and Flashcard views
```

### Flow 3: Review Due Words
```
1. User opens "Dipelajari" tab
2. Sees words with review dates
3. Words due for review are highlighted
4. Clicks "Review Lagi" → Goes to Flashcard
5. Studies and rates cards
6. Next review date recalculated
```

## Setup Instructions

### 1. Run Database Schema
```bash
# Open Supabase Dashboard → SQL Editor
# Run the complete supabase-schema.sql file
```

This creates:
- ✅ flashcard table with INSERT policy
- ✅ user_vocabulary_history table
- ✅ All RLS policies
- ✅ Triggers for updated_at

### 2. (Optional) Seed Initial Data
```bash
# Run sql/seed-flashcards.sql
# Adds initial vocabulary words for all users
```

### 3. Test the Integration
1. Login to the app
2. Go to Kosakata page → See all flashcards
3. Click "Tambah Kata Baru" → Add a test word
4. Go to Flashcard page → Study some cards
5. Return to Kosakata → Click "Dipelajari" tab
6. See your progress with dates!

## Important Notes

### Public vs Private
- **Flashcard words**: PUBLIC (everyone sees)
- **Learning history**: PRIVATE (only you see)

### Adding Words
- Any logged-in user can add words
- Added words are visible to ALL users
- Good for collaborative learning
- Words marked with level='custom'

### Data Ownership
- Flashcards: Community owned
- History: User owned
- No way to "delete" public flashcards (by design)
- Can reset your own history

## User Experience

### Tab: "Semua" (All)
Shows all flashcards:
- From seed data (levels A1-C2)
- User-added words (level='custom')
- With your personal study status

### Tab: "Dipelajari" (Studied)
Shows only words you've studied:
- Your last study date
- Your next review date
- Visual indicator if review is due
- Empty if you haven't studied yet

### Tab: "Perlu Review" (Need Review)
Currently same as "Dipelajari":
- Can be enhanced to show only overdue reviews
- Filter by: next_review <= now()

## Display Format

### Status Indicators
- **Belum dipelajari**: Never studied by you
- **Hari ini**: Studied today
- **3 hari lalu**: Studied 3 days ago
- **7 hari lagi**: Review in 7 days
- **⚠️ Highlighted**: Review is due now

### Word Details
Click "Lihat Detail" to see:
- Word, IPA, type, level
- Full meaning and example
- Your study history (if any)

## Security & Privacy

### Row Level Security (RLS)
- **flashcard**: Anyone can read, auth users can insert
- **user_vocabulary_history**: Users see only their own

### Data Isolation
- Your learning history is completely private
- No user can see another user's progress
- UNIQUE constraint prevents duplicates

### Authentication Required
- Must be logged in to add words
- Must be logged in to see study history
- Anonymous users can still view words

## Performance Considerations

- Flashcards loaded once on page load
- History loaded once and cached in memory
- Efficient Map lookup for history data
- No N+1 query problems
- Minimal API calls during interactions

## Migration Notes

### From Previous Versions
If you had user_flashcards:
1. Data is separate (not migrated automatically)
2. user_flashcards is no longer used
3. Users should re-add important words to global table
4. Or run a migration script to copy data

### Fresh Installation
1. Run supabase-schema.sql
2. Run seed-flashcards.sql (optional)
3. Ready to use!

## Troubleshooting

### Can't add words
**Check:**
- User is logged in
- INSERT policy exists on flashcard table
- Browser console for errors

### History not showing
**Check:**
- user_vocabulary_history table exists
- RLS policies are active
- User has studied flashcards after this update

### Words not appearing
**Check:**
- flashcard table has data
- Run seed-flashcards.sql if empty
- Check SELECT policy allows public read

## Future Enhancements

Potential improvements:
- [ ] Upvote/downvote for community words
- [ ] Report inappropriate content
- [ ] Word contributors tracking
- [ ] Featured words of the day
- [ ] Study statistics dashboard
- [ ] Export/import vocabulary lists
- [ ] Mobile responsive optimizations
- [ ] Offline support with sync

## Comparison to Previous Version

### Before (user_flashcards)
- ❌ Each user had separate flashcard list
- ❌ Duplicate words across users
- ❌ No sharing of user-added words
- ✅ Full control over own flashcards

### Now (flashcard only)
- ✅ Single source of vocabulary
- ✅ Shared learning community
- ✅ Everyone benefits from additions
- ⚠️ Public words can't be privately deleted

## Summary

This final version provides:
- **Simple** - One flashcard table, easy to understand
- **Shared** - Community vocabulary benefits everyone
- **Private** - Your progress is yours alone
- **Smart** - Spaced repetition for effective learning
- **Integrated** - Works seamlessly with flashcards

Perfect for collaborative learning environments! 🎓
