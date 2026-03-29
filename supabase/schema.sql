-- Discipline OS Database Schema & RLS Policies

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 1. Table Definitions
-----------------------------------------------------------

-- Core Users Table (Synched with auth.users via triggers or app logic)
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    global_rank_tier VARCHAR(20) DEFAULT 'Novice',
    discipline_score DECIMAL(10,2) DEFAULT 0.0,
    expo_push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master templates for user missions
CREATE TABLE IF NOT EXISTS public.missions (
    mission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    category VARCHAR(10) CHECK (category IN ('BODY', 'MIND', 'WORK')),
    difficulty VARCHAR(10) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'ELITE')),
    title VARCHAR(255) NOT NULL,
    expected_duration_mins INT,
    base_reward_points INT NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    cron_schedule VARCHAR(50), -- e.g., 'daily', 'weekly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mission_completions (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES public.missions(mission_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    start_image_url TEXT,
    end_image_url TEXT,
    is_grace_period BOOLEAN DEFAULT FALSE,
    points_earned DECIMAL(10,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historic daily score logs for charting/AI analysis
CREATE TABLE IF NOT EXISTS public.discipline_scores (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    daily_total_score DECIMAL(10,2) DEFAULT 0.0,
    UNIQUE(user_id, target_date)
);

-- Squads (Social Accountability Groups)
CREATE TABLE IF NOT EXISTS public.squads (
    squad_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    total_squad_score DECIMAL(10,2) DEFAULT 0.0,
    active_strikes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Squad Memberships
CREATE TABLE IF NOT EXISTS public.squad_members (
    squad_id UUID REFERENCES public.squads(squad_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (squad_id, user_id)
);


-----------------------------------------------------------
-- 2. Postgres Functions (RPCs)
-----------------------------------------------------------

-- Increment Discipline Score atomically
CREATE OR REPLACE FUNCTION increment_discipline_score(user_id_param UUID, score_delta DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_score DECIMAL;
BEGIN
    UPDATE public.users
    SET discipline_score = discipline_score + score_delta
    WHERE user_id = user_id_param
    RETURNING discipline_score INTO new_score;

    -- Also update or insert today's individual discipline_scores log
    INSERT INTO public.discipline_scores (user_id, target_date, daily_total_score)
    VALUES (user_id_param, CURRENT_DATE, score_delta)
    ON CONFLICT (user_id, target_date)
    DO UPDATE SET daily_total_score = public.discipline_scores.daily_total_score + score_delta;

    RETURN new_score;
END;
$$;

-----------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-----------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- users
-- Anyone can read user profiles (necessary for leaderboards/squads)
CREATE POLICY "Users are viewable by everyone" ON public.users 
    FOR SELECT USING (true);
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = user_id);

-- missions
-- Users can manage their own mission templates
CREATE POLICY "Users can manage own missions" ON public.missions 
    FOR ALL USING (auth.uid() = user_id);

-- mission_completions
-- Users can view and manage their own pending/completed missions
CREATE POLICY "Users can manage own completions" ON public.mission_completions 
    FOR ALL USING (auth.uid() = user_id);
-- Squad mates can view completions if joined (Needs complex join, simplified to authenticated reads for global feeds temporarily)
CREATE POLICY "Completions are viewable by authenticated" ON public.mission_completions 
    FOR SELECT USING (auth.role() = 'authenticated');

-- discipline_scores
CREATE POLICY "Users can manage own scores" ON public.discipline_scores 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Scores are viewable by authenticated" ON public.discipline_scores 
    FOR SELECT USING (auth.role() = 'authenticated');

-- squads
CREATE POLICY "Squads are viewable by everyone" ON public.squads 
    FOR SELECT USING (true);

-- squad_members
CREATE POLICY "Squad members are viewable by everyone" ON public.squad_members 
    FOR SELECT USING (true);


-----------------------------------------------------------
-- 4. Triggers (Optional Helper)
-----------------------------------------------------------
-- Function to automatically create a public user profile when 
-- a user signs up through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if not exists (fallback for manual inserts in app layer)
    INSERT INTO public.users (user_id, username, global_rank_tier, current_streak, max_streak, discipline_score)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 6)), 
        'Novice', 
        0, 
        0, 
        0
    ) ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
