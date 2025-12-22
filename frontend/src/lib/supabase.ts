
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('PLACEHOLDER')) {
    console.error('Supabase keys are missing or invalid in .env file:', {
        url: supabaseUrl,
        key: supabaseAnonKey ? 'Set' : 'Missing'
    });
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
