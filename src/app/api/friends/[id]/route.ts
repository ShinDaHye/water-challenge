import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { lastNDates, todayStr } from "@/lib/date";
import { getAchievedDates, getEffectiveGoal } from "@/lib/achievements";

const HISTORY_DAYS = 28;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  const friends = await sql<
    { id: number; name: string; emoji: string; dailyGoalMl: number }[]
  >`SELECT id, name, emoji, daily_goal_ml as "dailyGoalMl" FROM friends WHERE id = ${friendId}`;
  const friend = friends[0];

  if (!friend) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const dates = lastNDates(HISTORY_DAYS);
  const rows = await sql<{ date: string; total: number }[]>`
    SELECT date, SUM(amount_ml)::int as total FROM logs
    WHERE friend_id = ${friendId} AND date >= ${dates[0]}
    GROUP BY date
  `;

  const totalsByDate = new Map(rows.map((r) => [r.date, r.total]));
  const achievedDates = await getAchievedDates(friendId);
  const achievedSet = new Set(achievedDates);

  const history = dates.map((date) => ({
    date,
    amountMl: totalsByDate.get(date) ?? 0,
    achieved: achievedSet.has(date),
  }));

  const today = todayStr();
  const todayMl = totalsByDate.get(today) ?? 0;
  const todayGoalMl = await getEffectiveGoal(friendId, today, friend.dailyGoalMl);

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

  const existing = await sql`SELECT id FROM friends WHERE id = ${friendId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const updates: Record<string, string | number> = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
    }
    updates.name = name;
  }

  if (body?.emoji !== undefined) {
    const emoji = String(body.emoji).trim();
    if (!emoji) {
      return NextResponse.json({ error: "이모지를 입력해주세요" }, { status: 400 });
    }
    updates.emoji = emoji;
  }

  if (body?.dailyGoalMl !== undefined) {
    const dailyGoalMl = Number(body.dailyGoalMl);
    if (!Number.isFinite(dailyGoalMl) || dailyGoalMl <= 0) {
      return NextResponse.json(
        { error: "목표량은 0보다 큰 숫자여야 해요" },
        { status: 400 }
      );
    }
    updates.daily_goal_ml = dailyGoalMl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없어요" }, { status: 400 });
  }

  await sql`UPDATE friends SET ${sql(updates)} WHERE id = ${friendId}`;

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const friendId = Number(id);

  // logs / daily_goal_overrides / stickers는 FK에 걸린 ON DELETE CASCADE로 함께 삭제됨
  const deleted = await sql`DELETE FROM friends WHERE id = ${friendId} RETURNING id`;
  if (deleted.length === 0) {
    return NextResponse.json({ error: "친구를 찾을 수 없어요" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
