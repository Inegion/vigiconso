import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvwieacdkqokusvzfbpq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d2llYWNka3Fva3VzdnpmYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjA0MjMsImV4cCI6MjA4MTYzNjQyM30.CNF_q3VEtSOlCQvmnII3yXdOjSQglNHZTTpNzEWYbaM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
