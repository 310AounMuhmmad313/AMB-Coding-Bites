
const SUPABASE_URL = "https://iqwzenixvymqftkoccbq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_LHNTANIUAghcSDCIjndXUQ_mHJm7hiZ";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
