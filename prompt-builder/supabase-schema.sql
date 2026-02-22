-- Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Prompts table
create table if not exists prompts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS on prompts
alter table prompts enable row level security;

-- Users can read their own prompts
create policy "Users can view own prompts"
  on prompts for select
  using (auth.uid() = user_id);

-- Users can insert their own prompts
create policy "Users can insert own prompts"
  on prompts for insert
  with check (auth.uid() = user_id);

-- Users can update their own prompts
create policy "Users can update own prompts"
  on prompts for update
  using (auth.uid() = user_id);

-- Users can delete their own prompts
create policy "Users can delete own prompts"
  on prompts for delete
  using (auth.uid() = user_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
