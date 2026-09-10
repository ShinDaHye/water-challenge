import db from "./db";

// 특정 날짜에 목표량 임시 조정(daily_goal_overrides)이 있으면 그 값을, 없으면 기본 목표량을 반환
export function getEffectiveGoal(
  friendId: number,
  date: string,
  defaultGoalMl: number
): number {
  const row = db
    .prepare(
      `SELECT goal_ml FROM daily_goal_overrides WHERE friend_id = ? AND date = ?`
    )
    .get(friendId, date) as { goal_ml: number } | undefined;
  return row?.goal_ml ?? defaultGoalMl;
}

// stickers 테이블에 이미 기록된 날짜들을 오래된 순으로 반환 (물 양은 다시 계산하지 않음)
export function getAchievedDates(friendId: number): string[] {
  return (
    db
      .prepare(`SELECT date FROM stickers WHERE friend_id = ? ORDER BY date ASC`)
      .all(friendId) as { date: string }[]
  ).map((r) => r.date);
}

// 그날 섭취량 합이 그날의 목표량(임시 조정 반영)을 넘겼는데 아직 스티커가 없다면 하나 발급.
// 이미 스티커가 있으면 조용히 무시(같은 날 두 번 붙지 않음, 목표를 나중에 낮춰도 이미 받은 스티커는 유지).
export function syncStickerForDate(
  friendId: number,
  date: string,
  defaultGoalMl: number
): void {
  const total = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount_ml), 0) as total FROM logs WHERE friend_id = ? AND date = ?`
      )
      .get(friendId, date) as { total: number }
  ).total;

  const goal = getEffectiveGoal(friendId, date, defaultGoalMl);

  if (total >= goal) {
    db.prepare(
      `INSERT OR IGNORE INTO stickers (friend_id, date) VALUES (?, ?)`
    ).run(friendId, date);
  }
}
