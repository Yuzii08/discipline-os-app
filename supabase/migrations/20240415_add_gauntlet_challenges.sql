-- 1. Create the challenges table to track global or squad-specific events
CREATE TABLE IF NOT EXISTS public.challenges (
    challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(20) DEFAULT 'GLOBAL' CHECK (challenge_type IN ('GLOBAL', 'SQUAD', 'PERSONAL')),
    penalty_logic VARCHAR(20) DEFAULT 'NONE' CHECK (penalty_logic IN ('NONE', 'GAUNTLET')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the user_challenges junction table to track who is enrolled
CREATE TABLE IF NOT EXISTS public.user_challenges (
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(challenge_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, challenge_id)
);

-- RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by everyone" ON public.challenges 
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own challenge enrollments" ON public.user_challenges 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Challenge enrollments are viewable by authenticated" ON public.user_challenges 
    FOR SELECT USING (auth.role() = 'authenticated');


-- 3. Trigger Function: The Gauntlet Reset Logic
CREATE OR REPLACE FUNCTION public.handle_failed_mission_gauntlet()
RETURNS TRIGGER AS $$
DECLARE
    is_in_gauntlet BOOLEAN;
BEGIN
    -- Only act if the mission is explicitly moving to a FAILED status
    IF NEW.status = 'FAILED' AND OLD.status != 'FAILED' THEN
        -- Check if the user is currently ACTIVE in a GAUNTLET challenge
        SELECT EXISTS (
            SELECT 1 
            FROM public.user_challenges uc
            JOIN public.challenges c ON uc.challenge_id = c.challenge_id
            WHERE uc.user_id = NEW.user_id 
              AND uc.status = 'ACTIVE'
              AND c.penalty_logic = 'GAUNTLET'
              AND CURRENT_TIMESTAMP BETWEEN c.start_date AND c.end_date
        ) INTO is_in_gauntlet;

        -- If true, apply the Gauntlet penalty: reset weekly_discipline_score to 0
        IF is_in_gauntlet THEN
            UPDATE public.users
            SET weekly_discipline_score = 0
            WHERE user_id = NEW.user_id;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Bind the Trigger to mission_completions
DROP TRIGGER IF EXISTS on_mission_failed_gauntlet ON public.mission_completions;
CREATE TRIGGER on_mission_failed_gauntlet
    AFTER UPDATE ON public.mission_completions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_failed_mission_gauntlet();

-- 5. Seed an Initial Gauntlet Challenge so the UI has something to fetch dynamically
INSERT INTO public.challenges (challenge_id, title, description, challenge_type, penalty_logic, start_date, end_date)
VALUES (
    uuid_generate_v4(),
    'WINTER ARC GAUNTLET',
    'Failure to execute all operations prior to 23:59 results in immediate loss of all weekly discipline progress.',
    'GLOBAL',
    'GAUNTLET',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days'
) ON CONFLICT DO NOTHING;
