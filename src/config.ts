/**
 * Collegamento a Supabase (login e schede condivise PT ↔ clienti).
 * Sono chiavi PUBBLICHE (anon): la sicurezza è nelle regole del database
 * (supabase/schema.sql). Con URL vuoto l'app funziona solo sul dispositivo,
 * senza login (i test automatici usano questa modalità tramite
 * EXPO_PUBLIC_SUPABASE_URL='').
 */
const env = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const SUPABASE_URL =
  env !== undefined ? env : 'https://dwwqzdomphpuuwebozth.supabase.co';
export const SUPABASE_ANON_KEY =
  env !== undefined
    ? (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '')
    : 'sb_publishable_SuyiwtbrUc7Ruab_JOOqrg_T6VIqjXo';
