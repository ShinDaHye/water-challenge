import sql from "./db";

// 특정 날짜에 목표량 임시 조정(daily_goal_overrides)이 있으면 그 값을, 없으면 기본 목표량을 반환
export async function getEffectiveGoal(
  friendId: number,
  date: string,
  defaultGoalMl: number
): Promise<number> {
  const rows = await sql<{ goal_ml: number }[]>`
    SELECT goal_ml FROM daily_goal_overrides WHERE friend_id = ${friendId} AND date = ${date}
  `;
  return rows[0]?.goal_ml ?? defaultGoalMl;
}

// stickers 테이블에 이미 기록된 날짜들을 오래된 순으로 반환 (물 양은 다시 계산하지 않음)
export async function getAchievedDates(friendId: number): Promise<string[]> {
  const rows = await sql<{ date: string }[]>`
    SELECT date FROM stickers WHERE friend_id = ${friendId} ORDER BY date ASC
  `;
  return rows.map((r) => r.date);
}

export async function syncStickerForDate(
  friendId: number,
  date: string,
  defaultGoalMl: number
): Promise<void> {
  const totalRows = await sql<{ total: number }[]>`
    SELECT COALESCE(SUM(amount_ml), 0)::int as total FROM logs WHERE friend_id = ${friendId} AND date = ${date}
  `;
  const total = totalRows[0]?.total ?? 0;
  const goal = await getEffectiveGoal(friendId, date, defaultGoalMl);

  if (total >= goal) {
    await sql`
      INSERT INTO stickers (friend_id, date) VALUES (${friendId}, ${date})
      ON CONFLICT (friend_id, date) DO NOTHING
    `;
  }
}
