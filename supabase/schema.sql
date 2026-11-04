-- GRG Personal Trainer — schema Supabase
-- Incolla tutto in Supabase → SQL Editor → Run. Si può rieseguire senza danni.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'client' check (role in ('client','pt')),
  invite_code text unique not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  pt_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles(id),
  name text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans add column if not exists expires_at date;

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  date timestamptz not null,
  exercises jsonb not null default '[]'
);

alter table public.sessions add column if not exists plan_id text;

-- funzioni di appoggio (security definer: evitano ricorsioni nelle policy)
create or replace function public.is_pt_of(uid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles c, profiles p
                 where c.id = uid and c.pt_id = p.id and p.id = auth.uid() and p.role = 'pt');
$$;

create or replace function public.my_pt() returns uuid
language sql security definer set search_path = public stable as $$
  select pt_id from profiles where id = auth.uid();
$$;

-- alla registrazione crea il profilo; il codice PT (se valido) collega al PT
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare pt uuid;
begin
  select id into pt from profiles
   where role = 'pt' and invite_code = upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  insert into profiles (id, email, name, pt_id)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''), pt);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- collegarsi (o scollegarsi) a un PT dopo la registrazione
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

-- sicurezza a livello di riga
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.sessions enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or pt_id = auth.uid() or id = public.my_pt());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- l'utente può cambiare solo il proprio nome (non ruolo, codice o PT)
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

create or replace function public.my_role() returns text
language sql security definer set search_path = public stable as $$
  select role from profiles where id = auth.uid();
$$;

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

drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (user_id = auth.uid() or public.is_pt_of(user_id));
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions for delete to authenticated
  using (user_id = auth.uid());

grant execute on function public.join_pt(text), public.leave_pt() to authenticated;

-- PER DIVENTARE PT (una volta, dopo esserti registrato nell'app):
--   update public.profiles set role = 'pt' where email = 'LA-TUA-EMAIL';
