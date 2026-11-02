-- Security Advisor fix: the sessions rules function is only meant to run as a trigger.
-- This stops signed-in and anonymous users from calling it directly through the API.
-- The trigger keeps working: it doesn't need the caller to have execute permission.
-- Run in Supabase > SQL Editor.

revoke execute on function public.check_session_rules() from public, anon, authenticated;
