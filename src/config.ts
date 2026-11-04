/**
 * Collegamento a Supabase (login e schede condivise PT ↔ clienti).
 * Sono chiavi PUBBLICHE (anon): la sicurezza è nelle regole del database
 * (supabase/schema.sql). Se restano vuote l'app funziona solo sul dispositivo,
 * senza login.
 */
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
