export const LEAVE_PRESETS = [
  { label: "연차", ratio: 1 },
  { label: "반차", ratio: 0.5 },
  { label: "반반차", ratio: 0.25 },
] as const;

// 스티커판에서 연차/반차 라벨로 채워지는 비율을 되찾기 위한 헬퍼
export function leaveRatio(leaveType: string | null): number {
  if (!leaveType) return 0;
  return LEAVE_PRESETS.find((p) => p.label === leaveType)?.ratio ?? 1;
}
