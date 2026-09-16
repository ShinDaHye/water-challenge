import sql from "./db";

export type AchievedDate = {
  date: string;
  leaveType: string | null;
};

// stickers 테이블에 이미 기록된 날짜들을 오래된 순으로 반환 (물 양은 다시 계산하지 않음).
// 그날 연차/반차 프리셋으로 적립된 기록이 있으면 leaveType에 그 라벨이 담긴다.
export async function getAchievedDates(friendId: number): Promise<AchievedDate[]> {
  const rows = await sql<{ date: string }[]>`
    SELECT date FROM stickers WHERE friend_id = ${friendId} ORDER BY date ASC
  `;
  const leaveRows = await sql<{ date: string; leave_type: string }[]>`
    SELECT DISTINCT ON (date) date, leave_type
    FROM logs
    WHERE friend_id = ${friendId} AND leave_type IS NOT NULL
  `;
  const leaveByDate = new Map(leaveRows.map((r) => [r.date, r.leave_type]));

  return rows.map((r) => ({
    date: r.date,
    leaveType: leaveByDate.get(r.date) ?? null,
  }));
}

// 그날 섭취량 합이 목표량을 넘겼는데 아직 스티커가 없다면 하나 발급.
// 이미 스티커가 있으면 조용히 무시(같은 날 두 번 붙지 않음).
export async function syncStickerForDate(
  friendId: number,
  date: string,
  dailyGoalMl: number
): Promise<void> {
  const totalRows = await sql<{ total: number }[]>`
    SELECT COALESCE(SUM(amount_ml), 0)::int as total FROM logs WHERE friend_id = ${friendId} AND date = ${date}
  `;
  const total = totalRows[0]?.total ?? 0;

  if (total >= dailyGoalMl) {
    await sql`
      INSERT INTO stickers (friend_id, date) VALUES (${friendId}, ${date})
      ON CONFLICT (friend_id, date) DO NOTHING
    `;
  }
}
