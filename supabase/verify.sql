-- Controlli di sicurezza: incollali in Supabase → SQL Editor dopo aver eseguito schema.sql.
-- 1) Tutte le tabelle devono avere rls_attiva = true
select relname as tabella, relrowsecurity as rls_attiva
from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';

-- 2) "anon" (chi non ha fatto login) non deve avere NESSUN permesso: deve restituire 0 righe
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon';

-- 3) Le schede devono avere le policy plans_select e plans_write (l'atleta non scrive)
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1, 2;

-- 4) Nessun utente deve essere PT per sbaglio (devono comparire solo i tuoi account)
select email, role from public.profiles where role = 'pt';
