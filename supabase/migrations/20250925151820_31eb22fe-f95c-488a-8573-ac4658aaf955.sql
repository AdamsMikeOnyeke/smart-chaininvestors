-- Fix missing profiles for existing users (if any)
INSERT INTO public.profiles (id, username, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Fix missing user balances for existing users (if any)
INSERT INTO public.user_balances (user_id, balance)
SELECT 
  au.id,
  0 as balance
FROM auth.users au
LEFT JOIN public.user_balances ub ON au.id = ub.user_id
WHERE ub.user_id IS NULL;