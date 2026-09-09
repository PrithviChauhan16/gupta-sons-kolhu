// supabaseClient.js
const SUPABASE_URL = "https://zeguqfiingzgvpgmfgvq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZ3VxZmlpbmd6Z3ZwZ21mZ3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjA3NDAsImV4cCI6MjEwNDA5Njc0MH0.WSsMsbmt8yxCdvKOs8jJ20uB2ZvorTiSPvIhJOWyWk4";

// Use supabaseClient instead of supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);