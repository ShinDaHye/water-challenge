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
  const amountMl = Number(body?.amountMl);

  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    return NextResponse.json(
      { error: "amountMl은 0보다 큰 숫자여야 해요" },
      { status: 400 }
    );
  }

  const today = todayStr();
  db.prepare(
    `INSERT INTO logs (friend_id, date, amount_ml) VALUES (?, ?, ?)`
  ).run(friendId, today, amountMl);

  syncStickerForDate(friendId, today, friend.dailyGoalMl);

  return NextResponse.json({ ok: true });
}
