-- Feedback / Bug reports table
create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  email         text not null,
  type          text not null check (type in ('bug', 'mejora', 'consulta')),
  title         text not null,
  description   text not null,
  status        text not null default 'nuevo' check (status in ('nuevo', 'en_revision', 'resuelto')),
  admin_reply   text,
  created_at    timestamptz not null default now()
);

-- RLS: users can only insert and read their own rows; admins read all
alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admin can read all feedback"
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.email = 'stevengalocr@gmail.com'
    )
  );

create policy "Admin can update all feedback"
  on public.feedback for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.email = 'stevengalocr@gmail.com'
    )
  );
