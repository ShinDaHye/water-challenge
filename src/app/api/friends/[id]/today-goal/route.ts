import { NextResponse } from "next/server";
import db from "@/lib/db";
import { todayStr } from "@/lib/date";
import { syncStickerForDate } from "@/lib/achievements";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  const friend = db
    .prepare(`SELECT id, daily_goal_ml as dailyGoalMl FROM friends WHERE id = ?`)
    .get(friendId) as { id: number; dailyGoalMl: number } | undefined;
  if (!friend) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const goalMl = Number(body?.goalMl);

  if (!Number.isFinite(goalMl) || goalMl <= 0) {
    return NextResponse.json(
      { error: "목표량은 0보다 큰 숫자여야 해요" },
      { status: 400 }
    );
  }

  const today = todayStr();
  db.prepare(
    `INSERT INTO daily_goal_overrides (friend_id, date, goal_ml) VALUES (?, ?, ?)
     ON CONFLICT (friend_id, date) DO UPDATE SET goal_ml = excluded.goal_ml`
  ).run(friendId, today, goalMl);

  // 목표를 낮춰서 이미 마신 양이 새 목표를 넘겼다면 그 자리에서 스티커 발급
  syncStickerForDate(friendId, today, friend.dailyGoalMl);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  db.prepare(
    `DELETE FROM daily_goal_overrides WHERE friend_id = ? AND date = ?`
  ).run(friendId, todayStr());

  return NextResponse.json({ ok: true });
}
