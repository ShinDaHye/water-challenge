-- Supabase 프로젝트 생성 후, SQL Editor에서 이 파일 내용을 한 번 실행하세요.
-- date 컬럼은 일부러 text로 둡니다. 앱 코드가 "YYYY-MM-DD" 문자열로
-- 비교/정렬(todayStr, lastNDates 등)하기 때문에, postgres의 date 타입으로 바꾸면
-- postgres.js가 이를 JS Date 객체로 돌려줘서 기존 로직이 깨집니다.

create table if not exists friends (
  id bigint generated always as identity primary key,
  name text unique not null,
  daily_goal_ml integer not null default 2000,
  emoji text not null default '💧'
);

create table if not exists logs (
  id bigint generated always as identity primary key,
  friend_id bigint not null references friends(id) on delete cascade,
  date text not null,
  amount_ml integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_logs_friend_date on logs(friend_id, date);

create table if not exists daily_goal_overrides (
  friend_id bigint not null references friends(id) on delete cascade,
  date text not null,
  goal_ml integer not null,
  primary key (friend_id, date)
);

create table if not exists stickers (
  id bigint generated always as identity primary key,
  friend_id bigint not null references friends(id) on delete cascade,
  date text not null,
  created_at timestamptz not null default now(),
  unique (friend_id, date)
);

-- src/lib/friends-config.ts 에 등록돼 있던 초기 친구 시드 (이미 있으면 건너뜀)
insert into friends (name, daily_goal_ml, emoji) values
  ('세은', 1500, '🐳'),
  ('정빈', 1000, '🐬'),
  ('다혜', 1000, '🐠')
on conflict (name) do nothing;
