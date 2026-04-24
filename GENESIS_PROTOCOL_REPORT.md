# The Genesis Protocol - Feature Report

**Overview**
The Genesis Protocol is the core onboarding and mission-generation engine of Cadence OS. Instead of asking users to manually type out a to-do list, the Genesis Protocol acts as an elite "Performance Coach" that builds a highly tailored, non-negotiable 5-hour (300-minute) daily protocol.

It operates in three distinct steps: **Interrogation (Questions)**, **Energy Allocation**, and **Architect Synthesis (AI Generation)**.

---

## Step 1: The Interrogation (Onboarding Questions)

Users are asked three critical questions to determine their vector, discipline level, and vulnerabilities. Every question allows for a specific sub-input to give the AI extreme context.

### Question 1: WHAT ARE YOU WORKING ON? *(Determines the primary objective)*
- **Exam prep — JEE / NEET / UPSC / Boards** *(Custom input: Which exam + weak subjects?)*
- **Coding / Building something — app, project, freelancing** *(Custom input: What are you building?)*
- **Physical fitness — gym, running, weight loss, sport** *(Custom input: Your target?)*
- **Learning a new skill — language, music, design, writing** *(Custom input: What skill + current level?)*
- **Career / Business — startup, content creation, job prep** *(Custom input: What's the goal?)*

### Question 2: HOW CONSISTENT HAVE YOU BEEN LATELY? *(Sets difficulty/tone)*
- **Barely** — I keep breaking my own plans
- **Okay-ish** — 2 to 3 days a week, then I fall off
- **Decent** — I show up most days but could be sharper
- **Very consistent** — I want to push to the next level

### Question 3: WHAT KILLS YOUR FOCUS MOST? *(Determines the Counter-Strike tactic)*
- **Phone / social media** — Instagram, YouTube, reels *(Custom input: Which app is worst?)*
- **I never start** — I procrastinate until it's too late *(Custom input: What triggers it?)*
- **Low energy** — I'm tired, unmotivated, or sleep-deprived *(Custom input: Root cause?)*
- **No clear plan** — I sit down and don't know what to do *(Custom input: Describe it)*
- **I lose momentum** — I start well but drift after day 2 *(Custom input: When does it happen?)*

---

## Step 2: Energy Allocation

Once the vector is set, users allocate exactly **5 hours (300 minutes)** across three domains using claymorphism sliders.
1. **BODY:** Physical foundation (workouts, running, stretching).
2. **MIND:** Core skill acquisition and learning (reading, active recall, studying).
3. **WORK:** High-leverage execution (coding, writing, business tasks).

*The UI actively enforces that the percentages must equal exactly 100%.*

---

## Step 3: Architect Synthesis (AI Generation)

The inputs are securely passed to a Supabase Edge Function (`generate-initial-protocol`) running **Gemini 2.5 Flash**.

### The AI Prompt Rules:
1. **Output:** 5 to 8 hyper-specific missions formatted as a JSON array.
2. **Chunking:** No single mission can exceed 90 minutes. Large blocks (e.g., 150 minutes of WORK) are explicitly forced to split into smaller, intense sprints ("Sprint 1", "Sprint 2").
3. **Math Guard:** The sum of all task durations MUST equal exactly 300 minutes. The server has an "Auto-Heal" function that automatically adjusts the longest task if the AI hallucinates the math.
4. **The Counter-Strike:** The AI must generate one specific task with a duration of `0 minutes` titled `Counter-Strike: [Tactic]`. This tactic is directly aimed at defeating the user's answer to Question 3 (What kills your focus most).

### Fallback Mechanism
Cadence OS ensures the user is never stuck. If the AI service is down or there is no network connection, the client application instantly falls back to a **Local Protocol Builder**. 
- If they picked Exam Prep -> *Active Recall Deep Session*
- If they picked Phone Distraction -> *Phone Lockdown — Device in Another Room*

---

## Outcome
The generated missions are presented in a sleek "Reveal Tray" where the user must press "Accept Protocol". Upon acceptance, these missions are written directly to their daily dashboard as "PENDING" tasks, ready to be executed for Discipline Points.
