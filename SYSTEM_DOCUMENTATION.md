# Cadence OS (formerly Discipline OS) - System Documentation

This document explains exactly how the Task/Mission system and the Discipline Point (XP) system operate as of the current build.

---

## 1. The Task System

Cadence operates using two parallel task tracks: **Routines** and **Missions**. 

### A. Routines (Habits)
- **What they are:** Recurring daily actions (e.g., "Drink Water", "Morning Stretch").
- **How they are managed:** Handled by `habitService.ts`. You create a Routine and assign it a category (`BODY`, `MIND`, `WORK`, `ROUTINE`).
- **Daily Generation:** Every time you open the app, it runs a database RPC (`ensure_today_habit_completions`) that checks if today's instances of your Routines exist. If not, it generates them as "PENDING".
- **Completion:** Toggling a routine updates its status to "DONE" in the database via `toggleHabitDone`.

### B. Missions (Genesis Protocol)
- **What they are:** High-impact, specific tasks generated primarily by the AI "Performance Coach".
- **Generation Logic:** When you use the "Genesis Protocol", the app asks Gemini AI to build a highly optimized schedule of 5 to 8 missions, breaking down massive time blocks into smaller sprints (max 90 mins each).
- **Daily Initialization:** Handled by `missionService.ts`. The app runs `generate_daily_completions` on the database to ensure your current active missions have a "PENDING" row for today.
- **Completion:** Completing a mission triggers `handleMissionComplete`, which calculates your points and updates the backend.

---

## 2. The Discipline Point (XP) System

The point system relies on a calculation that rewards consistency (streaks), difficulty, and social accountability (squads).

### A. The Core Formula
When you complete a mission, your score is calculated using this exact formula (found in `useUserStore.ts`):

\`\`\`javascript
Score Delta = Base Points × Difficulty Multiplier × Streak Bonus × Squad Multiplier
\`\`\`

#### 1. Base Points
Every mission is assigned a base value based on its length and importance (e.g., 50 points, 100 points).

#### 2. Difficulty Multiplier
The harder the mission, the higher the multiplier:
- **EASY:** 1.0x
- **MEDIUM:** 1.5x
- **HARD:** 2.0x
- **ELITE:** 3.0x

#### 3. Streak Bonus
Consistency is rewarded. For every day you maintain a streak, you gain an extra 5% bonus, capping out at a maximum of 50% extra points (1.5x).
- **Calculation:** `Math.min(1.0 + (currentStreak * 0.05), 1.5)`
- *Example:* A 10-day streak gives you a 1.5x multiplier on all points earned.

#### 4. Squad Multiplier
If you are operating in a Squad (community), you receive a multiplier to your points, encouraging social accountability. Default is 1.0x.

### B. Optimistic UI & Server Verification
To ensure the app feels lightning fast:
1. **Optimistic Update:** The moment you tap "Complete", the app does the math locally and instantly bumps your score and updates the UI.
2. **Server Verification:** In the background, it silently calls a secure Supabase Edge Function (`calculate-discipline-score`). The server verifies the completion, stops hackers from faking points, calculates the *exact* score on the database side, and returns the verified total.
3. **Sync:** If there is any discrepancy, the app quietly syncs to the server's exact score.

### C. Ranking Tiers
As your Discipline Score grows, you ascend through the ranks. The UI detects rank-ups instantly:
- **Novice:** 0 - 999
- **Acolyte:** 1,000 - 4,999
- **Vanguard:** 5,000 - 14,999
- **Oracle:** 15,000 - 49,999
- **Archon:** 50,000+
