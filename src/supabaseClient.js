import { createClient } from '@supabase/supabase-js'

// Use Vite environment variables when available.
// You can configure a Cloudflare Worker (or other proxy) and set its URL to `VITE_WORKER_URL`.
// If `VITE_WORKER_URL` is set, the client will use that as the base URL so requests go through the proxy.
// Fallback: use the direct Supabase project URL via `VITE_SUPABASE_URL`.
// Local development: create a `.env.local` with one of the following as needed:
// VITE_WORKER_URL=https://<your-worker>.workers.dev
// or
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

// const workerUrl = import.meta.env.VITE_WORKER_URL
// const supabaseUrl = (workerUrl && workerUrl.trim() !== '') ? workerUrl : (import.meta.env.VITE_SUPABASE_URL || 'https://llymmwbsjuybxbmazdpc.supabase.co')
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://llymmwbsjuybxbmazdpc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1td2JzanV5YnhibWF6ZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg4MDIsImV4cCI6MjA4MTYyNDgwMn0.eBtRZzD8oiyvyLGjFVhslA7o4_C3BE41VyznJamSS3E'

export const supabase = createClient(supabaseUrl, supabaseKey);

// Expose supabase for debug in browser console when running client-side.
if (typeof window !== 'undefined') {
	// eslint-disable-next-line no-undef
	window.supabase = supabase;
}
