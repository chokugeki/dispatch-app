import { createClient } from '@supabase/supabase-js'

// Use Vite environment variables when available.
// Local development: create a `.env.local` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Example:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://llymmwbsjuybxbmazdpc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1td2JzanV5YnhibWF6ZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg4MDIsImV4cCI6MjA4MTYyNDgwMn0.eBtRZzD8oiyvyLGjFVhslA7o4_C3BE41VyznJamSS3E'

export const supabase = createClient(supabaseUrl, supabaseKey);
