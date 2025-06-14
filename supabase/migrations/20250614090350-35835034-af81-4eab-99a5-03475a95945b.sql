
-- Create a function to get user email by user_id since we can't directly query auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$$;

-- Update the profiles table to store email for easier access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create a function to update profiles with email when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username',
    NEW.email
  );
  
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;

-- Update existing profiles with email addresses
UPDATE public.profiles 
SET email = get_user_email(id) 
WHERE email IS NULL;
