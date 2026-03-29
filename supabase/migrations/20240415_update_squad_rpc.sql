-- Update increment_discipline_score to check squad completions
CREATE OR REPLACE FUNCTION increment_discipline_score(user_id_param UUID, score_delta DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_score DECIMAL;
    user_squad_id UUID;
    total_squad_members INT := 0;
    active_squad_members INT := 0;
    multiplier DECIMAL := 1.0;
    final_delta DECIMAL;
BEGIN
    -- 1. Grab the user's current squad
    SELECT squad_id INTO user_squad_id FROM public.users WHERE user_id = user_id_param;

    -- 2. If the user is in a squad, check 100% completion rule
    IF user_squad_id IS NOT NULL THEN
        -- Count total members in the squad
        SELECT COUNT(*) INTO total_squad_members 
        FROM public.squad_members 
        WHERE squad_id = user_squad_id;

        -- Count members who have at least one 'COMPLETED' mission today
        SELECT COUNT(DISTINCT mc.user_id) INTO active_squad_members
        FROM public.squad_members sm
        JOIN public.mission_completions mc ON sm.user_id = mc.user_id
        WHERE sm.squad_id = user_squad_id 
          AND mc.status = 'COMPLETED' 
          AND mc.target_date = CURRENT_DATE;

        -- If everyone in the squad (and at least 1 person exists) has completed something, apply 1.2x boost
        IF total_squad_members > 0 AND total_squad_members = active_squad_members THEN
            multiplier := 1.2;
        END IF;
    END IF;

    -- 3. Apply multiplier to the incoming delta
    final_delta := score_delta * multiplier;

    -- 4. Update ledger
    UPDATE public.users
    SET discipline_score = discipline_score + final_delta,
        weekly_discipline_score = weekly_discipline_score + final_delta
    WHERE user_id = user_id_param
    RETURNING discipline_score INTO new_score;

    -- 5. Insert or Update Historic Logs
    INSERT INTO public.discipline_scores (user_id, target_date, daily_total_score)
    VALUES (user_id_param, CURRENT_DATE, final_delta)
    ON CONFLICT (user_id, target_date)
    DO UPDATE SET daily_total_score = public.discipline_scores.daily_total_score + final_delta;

    -- Optional: If squad exists, update total squad score log
    IF user_squad_id IS NOT NULL THEN
        UPDATE public.squads
        SET total_squad_score = total_squad_score + final_delta
        WHERE squad_id = user_squad_id;
    END IF;

    RETURN new_score;
END;
$$;
