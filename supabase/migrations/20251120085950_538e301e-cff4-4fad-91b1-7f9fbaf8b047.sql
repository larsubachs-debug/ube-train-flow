-- Fix security warning: Add search_path to function
CREATE OR REPLACE FUNCTION update_user_stats_on_workout_completion()
RETURNS TRIGGER AS $$
DECLARE
  last_completion_date date;
  days_between integer;
BEGIN
  -- Get the user's last workout date before this one
  SELECT last_workout_date INTO last_completion_date
  FROM user_stats
  WHERE user_id = NEW.user_id;
  
  -- If no stats record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_workouts, current_streak, last_workout_date, total_volume_kg)
    VALUES (NEW.user_id, 1, 1, NEW.completion_date, 0);
    RETURN NEW;
  END IF;
  
  -- Calculate days between workouts
  days_between := NEW.completion_date - last_completion_date;
  
  -- Update user stats
  UPDATE user_stats
  SET 
    total_workouts = total_workouts + 1,
    last_workout_date = NEW.completion_date,
    -- Update streak: reset to 1 if gap > 1 day, increment if consecutive, keep same if same day
    current_streak = CASE 
      WHEN days_between > 1 THEN 1
      WHEN days_between = 1 THEN current_streak + 1
      WHEN days_between = 0 THEN current_streak -- Same day, don't change
      ELSE 1
    END,
    -- Update longest streak if current streak is higher
    longest_streak = GREATEST(
      COALESCE(longest_streak, 0),
      CASE 
        WHEN days_between > 1 THEN 1
        WHEN days_between = 1 THEN current_streak + 1
        WHEN days_between = 0 THEN current_streak
        ELSE 1
      END
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';