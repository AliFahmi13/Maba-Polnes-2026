# Vocabulary Learning History Integration

## Overview
The vocabulary feature now tracks learning history! When users study flashcards, their progress is automatically recorded and displayed in the Kosakata page with proper review scheduling.

## Features

### ✅ Automatic Tracking
- Every time you rate a flashcard (Lupa/Sulit/Ingat/Mudah), it's recorded
- History shows when you last studied each word
- Calculates next review date based on spaced repetition

### ✅ Smart Review Scheduling
Review intervals based on your rating:
- **Lupa (Forgot)**: 1 day
- **Sulit (Hard)**: 3 days  
- **Ingat (Good)**: 7 days
- **Mudah (Easy)**: 14 days

### ✅ Progress Tracking
- "Dipelajari" tab shows words you've studied
- "Perlu Review" tab shows words needing review
- Visual indicators for due reviews (highlighted)

## How It Works

### 1. Study Flashcards
```
User studies flashcard → Rates it → System records:
- Word studied
- Rating given
- Current timestamp
- Calculated next review date
```

### 2. View Progress
```
Kosakata page loads:
- Fetches all flashcards
- Fetches learning history
- Merges data to show:
  ✓ Last studied date
  ✓ Next review date
  ✓ Study status
```

### 3. Filter by Status
- **Semua**: All vocabulary words
- **Dipelajari**: Only words you've studied
- **Perlu Review**: Words that need review (not implemented in filter yet, but shown in "Dipelajari")

## Database Schema

### user_vocabulary_history Table
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
  UNIQUE(user_id, word)
);
```

**Key Points:**
- Each user has their own learning history
- UNIQUE constraint on (user_id, word) = one record per word per user
- Upsert pattern: inserts new or updates existing

## API Methods

### getVocabularyHistory()
```javascript
const history = await window.EnglisifySupabase.getVocabularyHistory();
// Returns: Array of learning history records for current user
// Example: [
//   {
//     word: 'apple',
//     last_studied: '2024-01-15T10:30:00Z',
//     next_review: '2024-01-22T10:30:00Z',
//     review_count: 3,
//     rating: 'good'
//   }
// ]
```

### recordVocabularyReview(word, rating)
```javascript
await window.EnglisifySupabase.recordVocabularyReview('apple', 'good');
// Automatically called when rating flashcards
// Updates or creates history record
// Calculates next review based on rating
```

## Integration Points

### Flashcard Page (flashcard.js)
When user rates a card:
```javascript
// Records to both local storage AND Supabase
window.Englisify.recordFlashcardReview(card, rating); // Local
window.EnglisifySupabase.recordVocabularyReview(card.word, rating); // Cloud
```

### Vocabulary Page (kosakata.js)
On page load:
```javascript
1. Load all flashcards
2. Load learning history
3. Merge data:
   - Match flashcard words with history
   - Show "last studied" and "next review"
   - Mark as "dipelajari" if history exists
4. Render with status indicators
```

## User Experience

### Before Studying
```
Word: apple
Status: Belum dipelajari
Last Studied: -
Next Review: -
```

### After Studying (rated "Good")
```
Word: apple
Status: dipelajari
Last Studied: Hari ini
Next Review: 7 hari lagi
```

### When Review is Due
```
Word: apple
Status: dipelajari (highlighted)
Last Studied: 7 hari lalu
Next Review: Hari ini ⚠️
```

## Setup Instructions

### 1. Run Database Migration
```sql
-- Run this in Supabase SQL Editor
-- Already included in supabase-schema.sql
```

The schema file now includes:
- user_vocabulary_history table
- RLS policies (users can only see their own history)
- Update trigger for updated_at column

### 2. Test the Feature
1. Login to the app
2. Go to Flashcard page
3. Study some cards and rate them
4. Go to Kosakata page
5. Click "Dipelajari" tab
6. You should see the studied words with dates!

### 3. Verify Data
Check in Supabase Dashboard:
```sql
SELECT * FROM user_vocabulary_history 
WHERE user_id = auth.uid()
ORDER BY last_studied DESC;
```

## Display Format

### Relative Dates
- **Hari ini**: Today
- **Besok**: Tomorrow  
- **Kemarin**: Yesterday
- **3 hari lalu**: 3 days ago
- **7 hari lagi**: In 7 days

### Status Indicators
- **Belum dipelajari**: Never studied (gray)
- **dipelajari**: Studied (normal)
- **due-soon** class: Review is due (highlighted/colored)

## Features in Detail

### "Dipelajari" Tab
Shows only words with learning history:
- Sorted by last studied (most recent first)
- Shows actual study dates
- Shows calculated review dates
- Empty state: "Belum ada kata yang dipelajari. Belajar flashcard untuk melihat riwayat."

### "Perlu Review" Tab
Currently shows all words needing review:
- Can be enhanced to filter by next_review <= now()
- Visual indicator (due-soon class) for overdue reviews

### Detail View
Click "Lihat Detail" shows:
- Word, IPA, type, level
- Meaning and example
- Study history if available

## Spaced Repetition Logic

The system uses a simple spaced repetition algorithm:

```javascript
Rating → Interval
forgot → 1 day   (need immediate review)
hard   → 3 days  (difficult word)
good   → 7 days  (standard interval)
easy   → 14 days (mastered word)
```

Future enhancements could include:
- Exponential backoff (intervals increase each time)
- Difficulty tracking per word
- Adaptive scheduling based on performance
- Review streaks and statistics

## Troubleshooting

### History not showing
**Check:**
1. User is logged in
2. user_vocabulary_history table exists
3. RLS policies are active
4. Flashcards were rated after this update

### Dates not updating
**Check:**
1. Browser console for errors
2. Network tab for failed API calls
3. Supabase logs for permission errors

### "Dipelajari" tab empty
**Normal if:**
- You haven't studied any flashcards yet
- You only used flashcards before this update
**Solution:** Study some flashcards now!

## Performance Notes

- History is loaded once on page load
- Cached in memory (historyMap)
- No extra API calls during interactions
- Efficient lookup using Map data structure

## Security

- RLS policies ensure users only see their own history
- UNIQUE constraint prevents duplicate records
- Upsert pattern safely handles concurrent updates
- No sensitive data exposed

## Future Enhancements

Potential improvements:
- [ ] Weekly/monthly study statistics
- [ ] Study streak tracking
- [ ] Review success rate
- [ ] Most difficult words
- [ ] Study time tracking
- [ ] Export study history
- [ ] Review reminders/notifications
- [ ] Adjust intervals based on performance
- [ ] Word mastery levels
- [ ] Practice mode for due reviews only
