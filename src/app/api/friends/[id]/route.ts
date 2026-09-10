import { NextResponse } from "next/server";
import db from "@/lib/db";
import { lastNDates, todayStr } from "@/lib/date";
import { getAchievedDates, getEffectiveGoal } from "@/lib/achievements";

const HISTORY_DAYS = 28;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  const friend = db
    .prepare(
      `SELECT id, name, emoji, daily_goal_ml as dailyGoalMl FROM friends WHERE id = ?`
    )
    .get(friendId) as
    | { id: number; name: string; emoji: string; dailyGoalMl: number }
    | undefined;

  if (!friend) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const dates = lastNDates(HISTORY_DAYS);
  const rows = db
    .prepare(
      `SELECT date, SUM(amount_ml) as total FROM logs
       WHERE friend_id = ? AND date >= ?
       GROUP BY date`
    )
    .all(friendId, dates[0]) as { date: string; total: number }[];

  const totalsByDate = new Map(rows.map((r) => [r.date, r.total]));
  const achievedDates = getAchievedDates(friendId);
  const achievedSet = new Set(achievedDates);

  const history = dates.map((date) => ({
    date,
    amountMl: totalsByDate.get(date) ?? 0,
    achieved: achievedSet.has(date),
  }));

  const today = todayStr();
  const todayMl = totalsByDate.get(today) ?? 0;
  const todayGoalMl = getEffectiveGoal(friendId, today, friend.dailyGoalMl);

  return NextResponse.json({
    ...friend,
    todayMl,
    todayGoalMl,
    todayAchieved: achievedDates.includes(today),
    stickerCount: achievedDates.length,
    achievedDates,
    history,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  const friend = db
    .prepare(`SELECT id FROM friends WHERE id = ?`)
    .get(friendId);
  if (!friend) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
    }
    updates.push("name = ?");
    values.push(name);
  }

  if (body?.emoji !== undefined) {
    const emoji = String(body.emoji).trim();
    if (!emoji) {
      return NextResponse.json({ error: "이모지를 입력해주세요" }, { status: 400 });
    }
    updates.push("emoji = ?");
    values.push(emoji);
  }

  if (body?.dailyGoalMl !== undefined) {
    const dailyGoalMl = Number(body.dailyGoalMl);
    if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) {
      return NextResponse.json(
        { error: "목표량은 0보다 큰 숫자여야 해요" },
        { status: 400 }
      );
    }
    updates.push("daily_goal_ml = ?");
    values.push(dailyGoalMl);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "변경할 값이 없어요" }, { status: 400 });
  }

  db.prepare(`UPDATE friends SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values,
    friendId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  const friend = db
    .prepare(`SELECT id FROM friends WHERE id = ?`)
    .get(friendId);
  if (!friend) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const deleteTx = db.transaction(() => {
    db.prepare(`DELETE FROM logs WHERE friend_id = ?`).run(friendId);
    db.prepare(`DELETE FROM daily_goal_overrides WHERE friend_id = ?`).run(friendId);
    db.prepare(`DELETE FROM stickers WHERE friend_id = ?`).run(friendId);
    db.prepare(`DELETE FROM friends WHERE id = ?`).run(friendId);
  });
  deleteTx();

  return NextResponse.json({ ok: true });
}
