import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { FRIENDS_CONFIG } from "./friends-config";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "water.db");

declare global {
  // eslint-disable-next-line no-var
  var __waterDb: Database.Database | undefined;
}

const db = global.__waterDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") global.__waterDb = db;

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
    emoji TEXT NOT NULL DEFAULT '💧'
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friend_id INTEGER NOT NULL REFERENCES friends(id),
    date TEXT NOT NULL,
    amount_ml INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_logs_friend_date ON logs(friend_id, date);

  CREATE TABLE IF NOT EXISTS daily_goal_overrides (
    friend_id INTEGER NOT NULL REFERENCES friends(id),
    date TEXT NOT NULL,
    goal_ml INTEGER NOT NULL,
    PRIMARY KEY (friend_id, date)
  );

  CREATE TABLE IF NOT EXISTS stickers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friend_id INTEGER NOT NULL REFERENCES friends(id),
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (friend_id, date)
  );
`);

// friends-config.ts 에 정의된 친구 중 아직 DB에 없는 사람만 추가 (설정값이 바뀌어도 기존 기록은 유지)
const insertFriend = db.prepare(
  "INSERT OR IGNORE INTO friends (name, daily_goal_ml, emoji) VALUES (?, ?, ?)"
);
const seedTx = db.transaction(() => {
  for (const f of FRIENDS_CONFIG) {
    insertFriend.run(f.name, f.dailyGoalMl, f.emoji);
  }
});
seedTx();

// stickers 테이블 도입 이전에 로그만으로 이미 목표를 달성했던 날짜를 1회성으로 이관
// (이후로는 로그가 쌓일 때마다 stickers에 직접 기록되므로, 이 백필은 새로 계산할 일이 없어짐)
const backfillFriends = db
  .prepare(`SELECT id, daily_goal_ml FROM friends`)
  .all() as { id: number; daily_goal_ml: number }[];
const insertSticker = db.prepare(
  `INSERT OR IGNORE INTO stickers (friend_id, date) VALUES (?, ?)`
);
const backfillTx = db.transaction(() => {
  for (const f of backfillFriends) {
    const totals = db
      .prepare(
        `SELECT date, SUM(amount_ml) as total FROM logs WHERE friend_id = ? GROUP BY date`
      )
      .all(f.id) as { date: string; total: number }[];
    const overrides = db
      .prepare(
        `SELECT date, goal_ml FROM daily_goal_overrides WHERE friend_id = ?`
      )
      .all(f.id) as { date: string; goal_ml: number }[];
    const overrideMap = new Map(overrides.map((o) => [o.date, o.goal_ml]));

    for (const t of totals) {
      const goal = overrideMap.get(t.date) ?? f.daily_goal_ml;
      if (t.total >= goal) insertSticker.run(f.id, t.date);
    }
  }
});
backfillTx();

export default db;
