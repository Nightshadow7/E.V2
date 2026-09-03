import { createClient } from '@supabase/supabase-js'

// 1. Reemplaza esto con la URL de tu proyecto (La misma que usaste en Python)
const supabaseUrl = 'https://otlksmzuxbnywegfliyb.supabase.co'

// 2. ⚠️ IMPORTANTE: Aquí NO va la "service_role". 
// Ve a Supabase > Settings > API y copia la llave que dice "anon" y "public".
// Es la llave segura para páginas web.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bGtzbXp1eGJueXdlZ2ZsaXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI2OTAsImV4cCI6MjEwMzQ1ODY5MH0.l85qkpT5Xy6ABN2NSR9gI5uRDWVwWq05xr_q4Ted1oI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)