-- NOURA security foundation
-- Run this migration only after reviewing it in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.noura_role as enum ('client', 'coach');

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role public.noura_role not null default 'client',
    display_name text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.coach_client_assignments (
    coach_id uuid not null references public.profiles(id) on delete cascade,
    client_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (coach_id, client_id),
    constraint coach_cannot_be_own_client check (coach_id <> client_id)
);

create table public.challenge_enrollments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    challenge_key text not null default 'reset-14',
    starts_on date not null default current_date,
    tour_seen boolean not null default false,
    holy_moment_seen_on date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, challenge_key)
);

create table public.challenge_days (
    id uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.challenge_enrollments(id) on delete cascade,
    day_number smallint not null check (day_number between 1 and 14),
    journal text not null default '',
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (enrollment_id, day_number)
);

create table public.foundation_entries (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    why_text text not null default '',
    nourish text[] not null default array[]::text[],
    flow_text text not null default '',
    safety_text text not null default '',
    updated_at timestamptz not null default now()
);

create table public.anamneses (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    sleep_text text not null default '',
    energy_text text not null default '',
    cycle_text text not null default '',
    stress_text text not null default '',
    digestion_text text not null default '',
    goals_text text not null default '',
    consented_at timestamptz,
    updated_at timestamptz not null default now()
);

create table public.daily_protocols (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    protocol_date date not null,
    reflection text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, protocol_date)
);

create table public.meals (
    id uuid primary key default gen_random_uuid(),
    protocol_id uuid not null references public.daily_protocols(id) on delete cascade,
    position smallint not null default 0 check (position >= 0),
    label text not null,
    food_text text not null default '',
    satiety smallint not null default 5 check (satiety between 1 and 10),
    mood_text text not null default '',
    carbs_grams numeric(7,2) not null default 0 check (carbs_grams >= 0),
    protein_grams numeric(7,2) not null default 0 check (protein_grams >= 0),
    fat_grams numeric(7,2) not null default 0 check (fat_grams >= 0),
    leftovers boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index coach_client_assignments_client_idx
    on public.coach_client_assignments (client_id);
create index challenge_enrollments_user_idx
    on public.challenge_enrollments (user_id);
create index challenge_days_enrollment_idx
    on public.challenge_days (enrollment_id);
create index daily_protocols_user_date_idx
    on public.daily_protocols (user_id, protocol_date);
create index meals_protocol_idx
    on public.meals (protocol_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger challenge_enrollments_set_updated_at
before update on public.challenge_enrollments
for each row execute function public.set_updated_at();

create trigger challenge_days_set_updated_at
before update on public.challenge_days
for each row execute function public.set_updated_at();

create trigger foundation_entries_set_updated_at
before update on public.foundation_entries
for each row execute function public.set_updated_at();

create trigger anamneses_set_updated_at
before update on public.anamneses
for each row execute function public.set_updated_at();

create trigger daily_protocols_set_updated_at
before update on public.daily_protocols
for each row execute function public.set_updated_at();

create trigger meals_set_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

    insert into public.challenge_enrollments (user_id)
    values (new.id);

    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'coach'
    );
$$;

create or replace function public.coach_can_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select public.is_coach()
       and exists (
           select 1
           from public.coach_client_assignments
           where coach_id = (select auth.uid())
             and client_id = target_user_id
       );
$$;

revoke all on function public.is_coach() from public;
revoke all on function public.coach_can_access(uuid) from public;
grant execute on function public.is_coach() to authenticated;
grant execute on function public.coach_can_access(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.coach_client_assignments enable row level security;
alter table public.challenge_enrollments enable row level security;
alter table public.challenge_days enable row level security;
alter table public.foundation_entries enable row level security;
alter table public.anamneses enable row level security;
alter table public.daily_protocols enable row level security;
alter table public.meals enable row level security;

create policy "profiles_read_self_or_assigned"
on public.profiles for select
to authenticated
using (
    id = (select auth.uid())
    or public.coach_can_access(id)
);

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "assignments_read_participants"
on public.coach_client_assignments for select
to authenticated
using (
    coach_id = (select auth.uid())
    or client_id = (select auth.uid())
);

create policy "enrollments_read_self_or_assigned"
on public.challenge_enrollments for select
to authenticated
using (
    user_id = (select auth.uid())
    or public.coach_can_access(user_id)
);

create policy "enrollments_update_self"
on public.challenge_enrollments for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "days_read_self_or_assigned"
on public.challenge_days for select
to authenticated
using (
    exists (
        select 1
        from public.challenge_enrollments enrollment
        where enrollment.id = enrollment_id
          and (
              enrollment.user_id = (select auth.uid())
              or public.coach_can_access(enrollment.user_id)
          )
    )
);

create policy "days_insert_self"
on public.challenge_days for insert
to authenticated
with check (
    exists (
        select 1
        from public.challenge_enrollments enrollment
        where enrollment.id = enrollment_id
          and enrollment.user_id = (select auth.uid())
    )
);

create policy "days_update_self"
on public.challenge_days for update
to authenticated
using (
    exists (
        select 1
        from public.challenge_enrollments enrollment
        where enrollment.id = enrollment_id
          and enrollment.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.challenge_enrollments enrollment
        where enrollment.id = enrollment_id
          and enrollment.user_id = (select auth.uid())
    )
);

create policy "foundation_read_self_or_assigned"
on public.foundation_entries for select
to authenticated
using (
    user_id = (select auth.uid())
    or public.coach_can_access(user_id)
);

create policy "foundation_insert_self"
on public.foundation_entries for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "foundation_update_self"
on public.foundation_entries for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "anamneses_read_self_or_assigned"
on public.anamneses for select
to authenticated
using (
    user_id = (select auth.uid())
    or public.coach_can_access(user_id)
);

create policy "anamneses_insert_self"
on public.anamneses for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "anamneses_update_self"
on public.anamneses for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "protocols_read_self_or_assigned"
on public.daily_protocols for select
to authenticated
using (
    user_id = (select auth.uid())
    or public.coach_can_access(user_id)
);

create policy "protocols_insert_self"
on public.daily_protocols for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "protocols_update_self"
on public.daily_protocols for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "protocols_delete_self"
on public.daily_protocols for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "meals_read_self_or_assigned"
on public.meals for select
to authenticated
using (
    exists (
        select 1
        from public.daily_protocols protocol
        where protocol.id = protocol_id
          and (
              protocol.user_id = (select auth.uid())
              or public.coach_can_access(protocol.user_id)
          )
    )
);

create policy "meals_insert_self"
on public.meals for insert
to authenticated
with check (
    exists (
        select 1
        from public.daily_protocols protocol
        where protocol.id = protocol_id
          and protocol.user_id = (select auth.uid())
    )
);

create policy "meals_update_self"
on public.meals for update
to authenticated
using (
    exists (
        select 1
        from public.daily_protocols protocol
        where protocol.id = protocol_id
          and protocol.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.daily_protocols protocol
        where protocol.id = protocol_id
          and protocol.user_id = (select auth.uid())
    )
);

create policy "meals_delete_self"
on public.meals for delete
to authenticated
using (
    exists (
        select 1
        from public.daily_protocols protocol
        where protocol.id = protocol_id
          and protocol.user_id = (select auth.uid())
    )
);

-- Table grants complement RLS. In particular, clients cannot change their role.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.coach_client_assignments to authenticated;

grant select on public.challenge_enrollments to authenticated;
grant update (tour_seen, holy_moment_seen_on) on public.challenge_enrollments to authenticated;
grant select, insert, update on public.challenge_days to authenticated;
grant select, insert, update on public.foundation_entries to authenticated;
grant select, insert, update on public.anamneses to authenticated;
grant select, insert, update, delete on public.daily_protocols to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
