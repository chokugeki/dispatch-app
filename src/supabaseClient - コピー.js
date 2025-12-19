import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://llymmwbsjuybxbmazdpc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1td2JzanV5YnhibWF6ZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg4MDIsImV4cCI6MjA4MTYyNDgwMn0.eBtRZzD8oiyvyLGjFVhslA7o4_C3BE41VyznJamSS3E'

export const supabase = createClient(supabaseUrl, supabaseKey);
