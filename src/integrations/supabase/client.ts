import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vigjnshinceevqbcvdpj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2puc2hpbmNlZXZxYmN2ZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODg4MzAsImexCjA.dbUVVJtH68dA7Kh8a_famATfFrnZTOLEWpsSg3vun64';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);