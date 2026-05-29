import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nyjtnaoavgdxdljzozmd.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55anRuYW9hdmdkeGRsanpvem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTEwNDIsImV4cCI6MjA5NDkyNzA0Mn0.EOajBv5iMiPMUOY_p5dX9HpcmxKL6HlZUCtxAkygG0s';

/**
 * Checks if Supabase credentials are valid and ready to pull/push data.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl &&
    supabaseUrl !== '' &&
    !supabaseUrl.includes('dummy') &&
    supabaseAnonKey &&
    supabaseAnonKey !== '' &&
    !supabaseAnonKey.includes('dummy')
  );
};

// Graceful client fallback
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://nyjtnaoavgdxdljzozmd.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'dummy-key-placeholder'
);
