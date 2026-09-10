import { formatMD } from "@/lib/date";

type StickerBoardProps = {
  name: string;
  achievedDates: string[];
  onClose: () => void;
};

const TOTAL_SLOTS = 30;
const GRID_COLS = 8;

export default function StickerBoard({
  name,
  achievedDates,
  onClose,
}: StickerBoardProps) {
  const stickerCount = achievedDates.length;
  const filled = Math.min(stickerCount, TOTAL_SLOTS);
  const isComplete = stickerCount >= TOTAL_SLOTS;
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-sky-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sky-900 shadow"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 상단: 하늘 + 언덕 + 오리 연못 */}
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-b from-sky-300 to-sky-200">
          <div className="absolute left-[8%] top-[8%] h-6 w-14 rounded-full bg-white/90" />
          <div className="absolute right-[10%] top-[14%] h-5 w-12 rounded-full bg-white/90" />

          <div className="absolute left-3 top-3 -rotate-6 rounded bg-white/85 px-2 py-0.5 text-xs font-semibold text-sky-900 shadow">
            이름: {name}
          </div>

          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-24 w-full"
          >
            <path d="M0 28 Q 20 10 40 24 T 80 20 T 100 26 V40 H0 Z" fill="#bfe3a0" />
            <path d="M0 34 Q 25 22 55 32 T 100 30 V40 H0 Z" fill="#9ed17f" />
          </svg>

          <div className="absolute inset-x-0 bottom-0 flex h-14 items-end justify-center gap-1 bg-sky-400/70 px-4">
            <span className="pb-1 text-lg">🌿</span>
            <span className="text-2xl">🐤</span>
            <span className="text-3xl">🦆</span>
            <span className="pb-1 text-lg">🌿</span>
          </div>
        </div>

        {/* 중간: 방울 스티커 그리드 */}
        <div className="bg-gradient-to-b from-sky-400 to-sky-500 px-4 py-4">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
          >
            {slots.map((num) => {
              const earned = num <= filled;
              return (
                <div
                  key={num}
                  className={`relative flex aspect-square items-center justify-center rounded-full shadow-inner ${
                    earned ? "bg-sky-400/20" : "bg-sky-300/60"
                  }`}
                >
                  {earned ? (
                    <div className="relative flex h-[115%] w-[115%] items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="absolute inset-0 h-full w-full drop-shadow"
                      >
                        <path
                          d="M12 2C12 2 5 10.5 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 10.5 12 2 12 2Z"
                          fill="white"
                        />
                      </svg>
                      <span className="relative mt-[18%] text-[9px] font-bold text-sky-700">
                        {formatMD(achievedDates[num - 1])}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-sky-50">{num}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단: 오리 가족 */}
        <div className="flex items-end justify-center gap-1 bg-sky-500 px-4 pb-3 pt-2">
          <span className="pb-1 text-lg">🌿</span>
          <span className="text-3xl">🦆</span>
          <span className="text-xl">🐥</span>
          <span className="text-xl">🐥</span>
          <span className="text-xl">🐥</span>
          <span className="text-xl">🐥</span>
          <span className="pb-1 text-lg">🌿</span>
        </div>

        <div className="bg-white px-5 py-4 text-center">
          {isComplete ? (
            <p className="font-semibold text-sky-900">
              🎉 판을 다 채웠어요! 최고예요!
            </p>
          ) : (
            <p className="text-sky-800">
              <span className="font-bold">{stickerCount}</span> / {TOTAL_SLOTS}개 모았어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
