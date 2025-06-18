# Streak Logic Analysis for LifeMap Application

## Current Streak Implementation Locations

### 1. DashboardContent.tsx - `getStreakCount()` function
```typescript
function getStreakCount(entries: any[]): number {
  if (entries.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    const hasEntry = entries.some(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.toDateString() === checkDate.toDateString();
    });
    
    if (hasEntry) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
```

### 2. HomeContent.tsx - `getStreakCount()` function
```typescript
const getStreakCount = (): number => {
  if (entries.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const checkDateString = formatDateForDatabase(checkDate);
    
    const hasEntry = entries.some(entry => entry.date === checkDateString);
    
    if (hasEntry) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
```

## Issues Identified

### 1. **Inconsistent Date Comparison Methods**
- **DashboardContent.tsx**: Uses `entryDate.toDateString() === checkDate.toDateString()`
- **HomeContent.tsx**: Uses `entry.date === checkDateString` with `formatDateForDatabase()`

### 2. **Database Schema Mismatch**
- **DashboardContent.tsx**: Compares against `entry.created_at` (timestamp)
- **HomeContent.tsx**: Compares against `entry.date` (YYYY-MM-DD string)
- **Database Schema**: Shows `journal_entries` table has both `date` (text) and `created_at` (timestamp)

### 3. **Timezone Issues**
- Using `new Date()` without timezone consideration
- `toDateString()` uses local timezone which can cause inconsistencies
- No timezone normalization for date comparisons

### 4. **Logic Flaw: Starting from Today**
- Both functions start checking from today (`i = 0`)
- If user hasn't made an entry today, streak immediately breaks
- Should consider whether to include today or start from yesterday

### 5. **Performance Issues**
- Loops through 30 days and for each day, searches through all entries
- No optimization for sorted entries
- Could be O(n*m) complexity where n=days, m=entries

## Recommended Fixes

### 1. **Standardize Date Handling**
```typescript
// Use consistent date formatting
const formatDateForComparison = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Always use the `date` field from database, not `created_at`
const hasEntry = entries.some(entry => entry.date === checkDateString);
```

### 2. **Fix Timezone Issues**
```typescript
// Get today in user's timezone, normalized to start of day
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

### 3. **Optimize Performance**
```typescript
// Pre-process entries into a Set for O(1) lookup
const entryDates = new Set(entries.map(entry => entry.date));

const getStreakCount = (): number => {
  if (entries.length === 0) return 0;
  
  const entryDates = new Set(entries.map(entry => entry.date));
  let streak = 0;
  const today = new Date();
  
  // Start from yesterday if no entry today, or from today if there is one
  const todayString = getTodayString();
  let startDay = entryDates.has(todayString) ? 0 : 1;
  
  for (let i = startDay; i < 365; i++) { // Check up to a year
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const checkDateString = formatDateForComparison(checkDate);
    
    if (entryDates.has(checkDateString)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
```

### 4. **Handle Edge Cases**
- What if user is in different timezone?
- What if entry was created just after midnight?
- Should streak include today if entry exists?
- What's the maximum reasonable streak to check?

## Current Behavior Analysis

Based on the current implementation:

1. **DashboardContent.tsx**: 
   - Checks against `created_at` timestamp
   - Uses `toDateString()` which includes timezone
   - Starts from today (i=0)
   - Breaks immediately if no entry today

2. **HomeContent.tsx**:
   - Checks against `date` field (correct approach)
   - Uses proper date formatting
   - Also starts from today
   - More consistent with database schema

## Recommendation

The **HomeContent.tsx** implementation is closer to correct, but both need the fixes mentioned above. The main issue is that both implementations will show streak=0 if the user hasn't journaled today, even if they had a long streak until yesterday.