-- GRG Personal Trainer — schema Supabase (sicuro)
-- Incolla tutto in Supabase → SQL Editor → Run. Si può rieseguire senza danni.
-- Le regole di sicurezza sono verificate automaticamente da tests/security.test.ts.

-- ───────────────────────── tabelle ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'client' check (role in ('client','pt')),
  invite_code text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  pt_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles(id),
  name text not null,
  exercises jsonb not null default '[]',
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plans add column if not exists expires_at date;

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  plan_id text,
  date timestamptz not null,
  exercises jsonb not null default '[]'
);
alter table public.sessions add column if not exists plan_id text;

-- limiti di dimensione: nessuno può riempire il database di dati enormi
alter table public.profiles drop constraint if exists profiles_limits;
alter table public.profiles add constraint profiles_limits check (char_length(name) <= 80);
alter table public.plans drop constraint if exists plans_limits;
alter table public.plans add constraint plans_limits check (
  char_length(id) <= 40 and char_length(name) <= 100
  and jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) <= 100
  and pg_column_size(exercises) <= 100000);
alter table public.sessions drop constraint if exists sessions_limits;
alter table public.sessions add constraint sessions_limits check (
  char_length(id) <= 40 and char_length(plan_name) <= 100
  and jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) <= 100
  and pg_column_size(exercises) <= 100000);

-- ───────────────────────── funzioni ─────────────────────────
-- security definer + search_path fisso: evitano ricorsioni nelle policy e dirottamenti

create or replace function public.is_pt_of(uid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles c, profiles p
                 where c.id = uid and c.pt_id = p.id and p.id = auth.uid() and p.role = 'pt');
$$;

create or replace function public.my_pt() returns uuid
language sql security definer set search_path = public stable as $$
  select pt_id from profiles where id = auth.uid();
$$;

create or replace function public.my_role() returns text
language sql security definer set search_path = public stable as $$
  select role from profiles where id = auth.uid();
$$;

-- il codice invito lo vede solo il suo proprietario (non è leggibile da altri)
create or replace function public.my_invite_code() returns text
language sql security definer set search_path = public stable as $$
  select invite_code from profiles where id = auth.uid() and role = 'pt';
$$;

-- alla registrazione crea il profilo (SEMPRE come atleta); il codice PT, se valido, collega al PT
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare pt uuid;
begin
  select id into pt from profiles
   where role = 'pt' and invite_code = upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  insert into profiles (id, email, name, pt_id)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'name',''), 80), pt);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- chi crea una scheda è sempre chi è loggato (non si può falsificare "creata dal PT")
create or replace function public.set_created_by() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then new.created_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists plans_set_created_by on public.plans;
create trigger plans_set_created_by before insert on public.plans
  for each row execute function public.set_created_by();

create or replace function public.join_pt(code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare pt uuid;
begin
  select id into pt from profiles where role = 'pt' and invite_code = upper(trim(code)) and id <> auth.uid();
  if pt is null then return false; end if;
  update profiles set pt_id = pt where id = auth.uid();
  return true;
end $$;

create or replace function public.leave_pt() returns void
language sql security definer set search_path = public as $$
  update profiles set pt_id = null where id = auth.uid();
$$;

-- il PT può scollegare un proprio ragazzo
create or replace function public.remove_client(client uuid) returns void
language sql security definer set search_path = public as $$
  update profiles set pt_id = null
   where id = client and pt_id = auth.uid() and (select role from profiles where id = auth.uid()) = 'pt';
$$;

-- ───────────────────────── permessi ─────────────────────────
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.sessions enable row level security;

-- niente accesso per chi non è loggato; accesso minimo per gli utenti
revoke all on public.profiles, public.plans, public.sessions from anon, authenticated;
grant select (id, email, name, role, pt_id, created_at) on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;      -- solo il nome: non ruolo, codice o PT
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, delete on public.sessions to authenticated;

-- funzioni: solo utenti loggati
revoke all on function public.is_pt_of(uuid), public.my_pt(), public.my_role(), public.my_invite_code(),
  public.join_pt(text), public.leave_pt(), public.remove_client(uuid),
  public.handle_new_user(), public.set_created_by() from public, anon, authenticated;
grant execute on function public.is_pt_of(uuid), public.my_pt(), public.my_role(), public.my_invite_code(),
  public.join_pt(text), public.leave_pt(), public.remove_client(uuid) to authenticated;

-- ───────────────────────── regole righe (RLS) ─────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or pt_id = auth.uid() or id = public.my_pt());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- le schede le leggono l'atleta e il suo PT; le scrivono solo il PT (per i suoi
-- ragazzi) e chi è PT (per sé). L'atleta non può modificarle.
drop policy if exists plans_all on public.plans;
drop policy if exists plans_select on public.plans;
drop policy if exists plans_write on public.plans;
create policy plans_select on public.plans for select to authenticated
  using (owner_id = auth.uid() or public.is_pt_of(owner_id));
create policy plans_write on public.plans for all to authenticated
  using (public.is_pt_of(owner_id) or (owner_id = auth.uid() and public.my_role() = 'pt'))
  with check (public.is_pt_of(owner_id) or (owner_id = auth.uid() and public.my_role() = 'pt'));

-- gli allenamenti li registra solo il proprietario; li legge anche il suo PT
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id));
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions for delete to authenticated
  using (user_id = auth.uid());


-- ───────────────────────── diario alimentare ─────────────────────────
-- un record per persona e per giorno (elenco dei pasti in JSON) + obiettivi e alimenti creati a mano
create table if not exists public.nutrition_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  entries jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
create table if not exists public.nutrition_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  goals jsonb,
  foods jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.nutrition_days drop constraint if exists nutrition_days_limits;
alter table public.nutrition_days add constraint nutrition_days_limits check (
  jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 100 and pg_column_size(entries) <= 60000);
alter table public.nutrition_prefs drop constraint if exists nutrition_prefs_limits;
alter table public.nutrition_prefs add constraint nutrition_prefs_limits check (
  jsonb_typeof(foods) = 'array' and jsonb_array_length(foods) <= 300 and pg_column_size(foods) <= 100000
  and (goals is null or (jsonb_typeof(goals) = 'object' and pg_column_size(goals) <= 4000)));

alter table public.nutrition_days enable row level security;
alter table public.nutrition_prefs enable row level security;
revoke all on public.nutrition_days, public.nutrition_prefs from anon, authenticated;
grant select, insert, update, delete on public.nutrition_days to authenticated;
grant select, insert, update on public.nutrition_prefs to authenticated;

-- i pasti li scrive solo il proprietario; li legge anche il suo PT
drop policy if exists nutrition_days_select on public.nutrition_days;
create policy nutrition_days_select on public.nutrition_days for select to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id));
drop policy if exists nutrition_days_write on public.nutrition_days;
create policy nutrition_days_write on public.nutrition_days for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- gli obiettivi (e gli alimenti creati a mano) li scrive il proprietario oppure il suo PT
drop policy if exists nutrition_prefs_select on public.nutrition_prefs;
create policy nutrition_prefs_select on public.nutrition_prefs for select to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id));
drop policy if exists nutrition_prefs_insert on public.nutrition_prefs;
create policy nutrition_prefs_insert on public.nutrition_prefs for insert to authenticated
  with check (user_id = auth.uid() or public.is_pt_of(user_id));
drop policy if exists nutrition_prefs_update on public.nutrition_prefs;
create policy nutrition_prefs_update on public.nutrition_prefs for update to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id))
  with check (user_id = auth.uid() or public.is_pt_of(user_id));

-- PER DIVENTARE PT (una volta, dopo esserti registrato nell'app):
--   update public.profiles set role = 'pt' where email = 'LA-TUA-EMAIL';
