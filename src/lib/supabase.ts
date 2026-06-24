import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://jbgcpamchxdazezunlgz.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImYxZTU5ZTgzLWE0NmItNGU4MS04NWRkLWE5NzQ3ZGM5ZDRiYiJ9.eyJwcm9qZWN0SWQiOiJqYmdjcGFtY2h4ZGF6ZXp1bmxneiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgxOTMzNjA0LCJleHAiOjIwOTcyOTM2MDQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.U_Bj41bEujVXO-gn3gMWT22hKSJE0O4P2Ef7TKlajks';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };