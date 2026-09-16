# Vocabulary System - Complete Implementation

## ✅ Fixed Issues

### 1. User-Created Words → localStorage
- Words added by users now saved to **localStorage** (not database)
- Private to each user's browser
- Can be deleted by user
- Marked with "(custom)" label

### 2. Learning History → Working Now
- Added extensive logging to track history recording
- Fixed upsert mechanism for vocabulary reviews
- Console logs show when history is recorded
- History properly displays in "Dipelajari" tab

## Architecture

```
┌─────────────────────────────────────────┐
│         VOCABULARY SOURCES              │
├─────────────────────────────────────────┤
│                                         │
│  1. Database Flashcards (public)        │
│     - Seeded words (A1-C2)             │
│     - Read-only for users              │
│                                         │
│  2. localStorage Words (private)        │
│     - User-added custom words          │
│     - Stored locally in browser        │
│     - Can be deleted                   │
│                                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      LEARNING HISTORY (database)        │
├─────────────────────────────────────────┤
│                                         │
│  user_vocabulary_history table          │
│  - Tracks study sessions               │
│  - Private per user (RLS)              │
│  - Records: word, dates, rating        │
│  - One record per user per word        │
│                                         │
└─────────────────────────────────────────┘


## How It Works

### Data Flow

**1. Load Vocabulary Page**
```
User opens Kosakata
  ↓
Load flashcards from database
Load user words from localStorage  
Load learning history from database
  ↓
Merge all data:
  - Flashcards + history = show study status
  - User words + history = show study status
  ↓
Display in table with filters
```

**2. Add New Word**
```
User clicks "Tambah Kata Baru"
  ↓
Fills form: word, meaning, type
  ↓
Save to localStorage (key: 'englisify-user-vocabulary')
  ↓
Reload vocabulary list
  ↓
New word appears with "(custom)" label
```

**3. Study Flashcards**
```
User studies flashcard
  ↓
Rates it (Lupa/Sulit/Ingat/Mudah)
  ↓
flashcard.js calls:
  - window.Englisify.recordFlashcardReview() [local]
  - window.EnglisifySupabase.recordVocabularyReview() [database]
  ↓
Database upserts user_vocabulary_history:
  - INSERT if word not studied before
  - UPDATE if word already exists
  ↓
Calculates next review date based on rating
```

**4. View Progress**
```
User clicks "Dipelajari" tab
  ↓
Filters vocab where status === 'dipelajari'
  ↓
Shows only words with learning history
  ↓
Displays:
  - Last studied date
  - Next review date
  - Visual indicator if due
```

## Database Schema

### flashcard table (Read-Only)
```sql
CREATE TABLE public.flashcard (
  id bigint PRIMARY KEY,
  level text NOT NULL,
  word text NOT NULL,
  ipa text DEFAULT '',
  type text DEFAULT 'noun',
  meaning text NOT NULL,
  example text DEFAULT ''
);

-- RLS: Anyone can read
```

### user_vocabulary_history table (User-Private)
```sql
CREATE TABLE public.user_vocabulary_history (
  id bigint PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  word text NOT NULL,
  last_studied timestamptz DEFAULT now(),
  next_review timestamptz DEFAULT (now() + interval '1 day'),
  review_count int DEFAULT 1,
  rating text DEFAULT 'good',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, word)  -- Important for upsert!
);

-- RLS: Users can only see their own records
```

## localStorage Structure

### englisify-user-vocabulary
```json
[
  {
    "word": "journey",
    "meaning": "perjalanan",
    "type": "noun",
    "ipa": "",
    "example": "\"journey\"",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

## API Methods

### window.EnglisifySupabase.getFlashcards()
```javascript
const flashcards = await window.EnglisifySupabase.getFlashcards();
// Returns: Array of flashcards from database
// Example: [{ id: 1, word: 'apple', meaning: 'apel', ... }]
```

### window.EnglisifySupabase.getVocabularyHistory()
```javascript
const history = await window.EnglisifySupabase.getVocabularyHistory();
// Returns: Array of learning history for current user
// Example: [{
//   word: 'apple',
//   last_studied: '2024-01-15T10:00:00Z',
//   next_review: '2024-01-22T10:00:00Z',
//   rating: 'good'
// }]
```

### window.EnglisifySupabase.recordVocabularyReview(word, rating)
```javascript
await window.EnglisifySupabase.recordVocabularyReview('apple', 'good');
// Upserts record to user_vocabulary_history
// Calculates next_review based on rating
// Console logs: "Recording vocabulary review: { word, rating, intervalDays }"
// Console logs: "Vocabulary review recorded: [result]"
```

## Review Intervals

```
Rating → Interval
forgot → 1 day
hard   → 3 days
good   → 7 days
easy   → 14 days
```

## User Interface

### Vocabulary Table Columns
1. **Kata** - Word with audio button (+ custom label for user words)
2. **Arti** - Meaning in Indonesian
3. **Jenis** - Type tag (kata benda/kerja/sifat)
4. **Terakhir Dipelajari** - Relative date or "Belum dipelajari"
5. **Review Berikutnya** - Relative date or "-"
6. **Actions** - Dropdown menu

### Tab Filters
- **Semua** - All words (database + localStorage)
- **Dipelajari** - Only words with learning history
- **Perlu Review** - Same as Dipelajari (can be enhanced)

### Action Buttons
- **Belajar Sekarang** / **Review Lagi** - Go to flashcard page
- **Lihat Detail** - Show full word info + history
- **Hapus** - Delete user word (only for custom words)

### Visual Indicators
- **(custom)** label - User-created word in localStorage
- **due-soon** class - Review is overdue (next_review <= now)
- **Relative dates** - "Hari ini", "3 hari lalu", "7 hari lagi"

## Debugging

### Check if history is being recorded
```javascript
// Open browser console (F12)
// Study a flashcard and rate it
// You should see:
console.log('Recording vocabulary review:', { word, rating, intervalDays });
console.log('Vocabulary review recorded:', result);
```

### Check history in database
```sql
-- Run in Supabase SQL Editor
SELECT * FROM user_vocabulary_history 
WHERE user_id = auth.uid()
ORDER BY last_studied DESC;
```

### Check localStorage words
```javascript
// In browser console
const words = localStorage.getItem('englisify-user-vocabulary');
console.log(JSON.parse(words));
```

### Check if user is logged in
```javascript
// In browser console
console.log('User ID:', window.EnglisifySupabase.getUserId());
console.log('Has session:', window.EnglisifySupabase.hasSession());
```

## Troubleshooting

### History not showing in "Dipelajari" tab
**Check:**
1. Open browser console (F12)
2. Look for: "Loaded history: X" message
3. If X = 0, no history recorded yet
4. Study some flashcards first
5. Check console for "Recording vocabulary review" messages
6. Refresh Kosakata page after studying

**Common causes:**
- User not logged in
- user_vocabulary_history table doesn't exist
- RLS policies blocking access
- Flashcard rating not triggering recordVocabularyReview

### User words not persisting
**Check:**
- Browser localStorage not disabled
- Not in incognito/private mode
- localStorage quota not exceeded
- Check console for errors

### Can't add words
**Check:**
- Form validation passing
- localStorage available
- Console for JavaScript errors

### Review dates not calculating
**Check:**
- recordVocabularyReview being called (check console)
- No errors in console
- Database accepting upserts
- UNIQUE constraint exists on (user_id, word)

## Setup Instructions

### 1. Run Database Schema
```bash
# Open Supabase Dashboard → SQL Editor
# Run complete supabase-schema.sql file
```

Creates:
- ✅ flashcard table (if not exists)
- ✅ user_vocabulary_history table
- ✅ RLS policies
- ✅ Triggers

### 2. Seed Initial Data (Optional)
```bash
# Run sql/seed-flashcards.sql
# Adds A1-C2 level vocabulary
```

### 3. Test the System

**Test 1: View Vocabulary**
1. Open Kosakata page
2. Should see seeded flashcards
3. All show "Belum dipelajari"

**Test 2: Add Custom Word**
1. Click "Tambah Kata Baru"
2. Add word: "test", meaning: "tes", type: "noun"
3. Should appear with "(custom)" label
4. Refresh page - word should persist

**Test 3: Study & Track**
1. Go to Flashcard page
2. Study some cards
3. Rate them (try different ratings)
4. Open console - see "Recording vocabulary review" logs
5. Go back to Kosakata
6. Click "Dipelajari" tab
7. Should see studied words with dates!

**Test 4: Review Scheduling**
1. Check "Review Berikutnya" column
2. Words rated "Lupa" = 1 hari lagi
3. Words rated "Ingat" = 7 hari lagi
4. Words rated "Mudah" = 14 hari lagi

### 4. Verify Database
```sql
-- Check history was recorded
SELECT 
  word, 
  last_studied, 
  next_review, 
  rating,
  review_count
FROM user_vocabulary_history
WHERE user_id = auth.uid()
ORDER BY last_studied DESC;
```

## Performance

- Flashcards: Loaded once on page load
- localStorage words: Loaded once on page load
- History: Loaded once on page load
- All data cached in memory (historyMap)
- No redundant API calls
- Efficient Map lookup: O(1)

## Security

- **Flashcard words**: Public (anyone can read)
- **User words**: Private (localStorage per browser)
- **Learning history**: Private (RLS by user_id)
- **No XSS**: All output HTML escaped
- **RLS**: Enforced at database level

## Limitations

### localStorage Words
- ❌ Not synced across devices
- ❌ Lost if browser data cleared
- ❌ Limited storage (5-10MB typically)
- ✅ Good for personal, temporary words
- ✅ No database pollution

### Learning History
- ✅ Synced across devices (in database)
- ✅ Persists permanently
- ✅ Protected by RLS
- ❌ Requires login

## Future Enhancements

Possible improvements:
- [ ] Export/import user words as JSON/CSV
- [ ] Sync user words to database (optional)
- [ ] Study statistics dashboard
- [ ] Review calendar/heatmap
- [ ] Filter by review status (overdue/upcoming)
- [ ] Bulk actions (mark multiple as studied)
- [ ] Word difficulty tracking
- [ ] Study streaks
- [ ] Achievements/badges

## Summary

The vocabulary system now:

✅ **Loads words from**:
- Database flashcards (seeded A1-C2)
- localStorage (user-added custom words)

✅ **Tracks progress**:
- Records study sessions to database
- Shows last studied and next review dates
- Filters by "Dipelajari" status

✅ **Smart scheduling**:
- Spaced repetition algorithm
- Different intervals per rating
- Visual indicators for due reviews

✅ **User-friendly**:
- Add custom words easily (localStorage)
- Delete custom words
- Search and filter
- Audio pronunciation
- Detailed word info

Perfect for self-paced vocabulary learning! 🎓
