import { NextResponse } from "next/server";
import db from "@/lib/db";
import { todayStr } from "@/lib/date";
import { getAchievedDates, getEffectiveGoal } from "@/lib/achievements";

export async function GET() {
  const today = todayStr();

  const friends = db
    .prepare(
      `SELECT id, name, emoji, daily_goal_ml as dailyGoalMl FROM friends ORDER BY id ASC`
    )
    .all() as { id: number; name: string; emoji: string; dailyGoalMl: number }[];

  const todayTotalStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_ml), 0) as total FROM logs WHERE friend_id = ? AND date = ?`
  );

  const result = friends.map((f) => {
    const todayMl = (todayTotalStmt.get(f.id, today) as { total: number }).total;
    const todayGoalMl = getEffectiveGoal(f.id, today, f.dailyGoalMl);
    const achievedDates = getAchievedDates(f.id);
    return {
      ...f,
      todayMl,
      todayGoalMl,
      todayAchieved: achievedDates.includes(today),
      stickerCount: achievedDates.length,
      achievedDates,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const emoji = typeof body?.emoji === "string" && body.emoji.trim() ? body.emoji.trim() : "💧";
  const dailyGoalMl = Number(body?.dailyGoalMl);

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  }
  if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) {
    return NextResponse.json(
      { error: "목표량은 0보다 큰 숫자여야 해요" },
      { status: 400 }
    );
  }

  const existing = db
    .prepare(`SELECT id FROM friends WHERE name = ?`)
    .get(name);
  if (existing) {
    return NextResponse.json(
      { error: "이미 있는 이름이에요" },
      { status: 409 }
    );
  }

  const result = db
    .prepare(
      `INSERT INTO friends (name, daily_goal_ml, emoji) VALUES (?, ?, ?)`
    )
    .run(name, dailyGoalMl, emoji);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
