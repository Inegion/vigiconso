import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'xxx';
const supabaseAnonKey = 'xxxxx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
