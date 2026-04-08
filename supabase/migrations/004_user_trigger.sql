-- Automatické vytvoření uživatelského profilu při registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname text;
BEGIN
  -- Použij nickname z metadat, nebo část emailu
  v_nickname := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'nickname'), ''),
    split_part(new.email, '@', 1)
  );

  -- Zajistit unikátnost nicknamu
  WHILE EXISTS (SELECT 1 FROM public.users WHERE nickname = v_nickname) LOOP
    v_nickname := v_nickname || floor(random() * 900 + 100)::text;
  END LOOP;

  INSERT INTO public.users (id, email, nickname, elo_rating)
  VALUES (new.id, new.email, v_nickname, 1200)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id, preferred_language)
  VALUES (new.id, 'cs')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.statistics (
    user_id, games_played, games_won, games_lost,
    total_score, average_score, longest_word_score,
    highest_single_turn_score, current_win_streak, best_win_streak
  )
  VALUES (new.id, 0, 0, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN others THEN
  -- Nezapadnout celý signup při chybě triggeru
  RAISE WARNING 'handle_new_user failed for %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
