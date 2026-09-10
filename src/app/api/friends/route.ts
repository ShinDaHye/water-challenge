import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { todayStr } from "@/lib/date";
import { getAchievedDates, getEffectiveGoal } from "@/lib/achievements";

export async function GET() {
  const today = todayStr();

  const friends = await sql<
    { id: number; name: string; emoji: string; dailyGoalMl: number }[]
  >`SELECT id, name, emoji, daily_goal_ml as "dailyGoalMl" FROM friends ORDER BY id ASC`;

  const result = await Promise.all(
    friends.map(async (f) => {
      const totalRows = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount_ml), 0)::int as total FROM logs
        WHERE friend_id = ${f.id} AND date = ${today}
      `;
      const todayMl = totalRows[0]?.total ?? 0;
      const todayGoalMl = await getEffectiveGoal(f.id, today, f.dailyGoalMl);
      const achievedDates = await getAchievedDates(f.id);
      return {
        ...f,
        todayMl,
        todayGoalMl,
        todayAchieved: achievedDates.includes(today),
        stickerCount: achievedDates.length,
        achievedDates,
      };
    })
  );

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

  const existing = await sql`SELECT id FROM friends WHERE name = ${name}`;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "이미 있는 이름이에요" },
      { status: 409 }
    );
  }

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO friends (name, daily_goal_ml, emoji)
    VALUES (${name}, ${dailyGoalMl}, ${emoji})
    RETURNING id
  `;

  return NextResponse.json({ id: inserted[0].id }, { status: 201 });
}
