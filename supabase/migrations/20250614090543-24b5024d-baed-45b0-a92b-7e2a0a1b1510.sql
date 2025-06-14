
-- Add email column to profiles table to store user emails
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user email from auth.users table
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

-- Update existing profiles with email addresses where missing
UPDATE public.profiles 
SET email = get_user_email(id) 
WHERE email IS NULL;
