"use client";

import { useEffect, useState } from "react";
import StickerBoard from "@/components/StickerBoard";
import FriendManager from "@/components/FriendManager";
import { LEAVE_PRESETS } from "@/lib/leave";

type AchievedDate = {
  date: string;
  leaveType: string | null;
};

type Friend = {
  id: number;
  name: string;
  emoji: string;
  dailyGoalMl: number;
  todayMl: number;
  todayLeaveType: string | null;
  todayAchieved: boolean;
  stickerCount: number;
  achievedDates: AchievedDate[];
};

const QUICK_AMOUNTS = [100, 200, 500];

export default function Home() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [boardFriendId, setBoardFriendId] = useState<number | null>(null);
  const [managing, setManaging] = useState(false);
  const [leaveMenuId, setLeaveMenuId] = useState<number | null>(null);

  const boardFriend = friends.find((f) => f.id === boardFriendId) ?? null;

  async function loadFriends() {
    const res = await fetch("/api/friends");
    const data = await res.json();
    setFriends(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFriends();
  }, []);

  async function logWater(
    friendId: number,
    amountMl: number,
    leaveType?: string
  ) {
    setLoggingId(friendId);
    await fetch(`/api/friends/${friendId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl, leaveType }),
    });
    await loadFriends();
    setLoggingId(null);
  }

  return (
    <div className="relative flex flex-1 flex-col items-center bg-sky-50 px-4 py-10 dark:bg-black">
      <button
        onClick={() => setManaging(true)}
        className="absolute right-4 top-4 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-100 dark:bg-zinc-900 dark:text-sky-300 sm:right-6 sm:top-6"
      >
        👥
      </button>

      <div className="w-full max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-sky-900 dark:text-sky-100">
          💧 물 마시기 챌린지
        </h1>
        {/* <p className="mt-2 text-center text-sky-700 dark:text-sky-300">
          오늘도 목표량을 채우고 스티커를 모아봐요!
        </p> */}
        <p className="mt-2 text-center text-xs text-sky-500 dark:text-sky-400">
          ⏰ 기록은 매일 아침 9시에 초기화돼요
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {loading && (
            <p className="col-span-full text-center text-sky-600 dark:text-sky-400">
              불러오는 중...
            </p>
          )}

          {!loading && friends.length === 0 && (
            <p className="col-span-full text-center text-sky-600 dark:text-sky-400">
              아직 등록된 친구가 없어요. 위에서 친구를 추가해보세요!
            </p>
          )}

          {!loading &&
            friends.map((f) => {
              const pct = Math.min(
                100,
                Math.round((f.todayMl / f.dailyGoalMl) * 100)
              );
              return (
                <div
                  key={f.id}
                  className="relative flex flex-col rounded-2xl border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-900 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-sky-900 dark:text-sky-100">
                      <span>{f.emoji}</span>
                      <span>{f.name}</span>
                      {f.todayAchieved && <span>🎉</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() =>
                          setLeaveMenuId(leaveMenuId === f.id ? null : f.id)
                        }
                        className="rounded-full bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                        aria-label="연차/반차 처리"
                      >
                        🌴
                      </button>
                      <button
                        onClick={() => setBoardFriendId(f.id)}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700 transition-colors hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-300"
                      >
                        💧 {f.stickerCount}개
                      </button>
                    </div>
                  </div>

                  {leaveMenuId === f.id && (
                    <>
                      <button
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="닫기"
                        onClick={() => setLeaveMenuId(null)}
                      />
                      <div className="absolute right-4 top-10 z-20 flex flex-col gap-1 rounded-xl border border-amber-200 bg-white p-1.5 shadow-lg dark:border-amber-800 dark:bg-zinc-900">
                        {LEAVE_PRESETS.map(({ label, ratio }) => (
                          <button
                            key={label}
                            onClick={() => {
                              logWater(
                                f.id,
                                Math.round(f.dailyGoalMl * ratio),
                                label
                              );
                              setLeaveMenuId(null);
                            }}
                            disabled={loggingId === f.id}
                            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-950"
                          >
                            🌴 {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {f.todayLeaveType && (
                    <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      🌴 오늘은 {f.todayLeaveType}예요
                    </p>
                  )}

                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-sky-700 dark:text-sky-300">
                      <span>
                        {f.todayMl}ml / {f.dailyGoalMl}ml
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => logWater(f.id, amount)}
                        disabled={loggingId === f.id}
                        className="flex-1 rounded-lg bg-sky-500 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                      >
                        +{amount}ml
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {boardFriend && (
        <StickerBoard
          name={boardFriend.name}
          achievedDates={boardFriend.achievedDates}
          onClose={() => setBoardFriendId(null)}
        />
      )}

      {managing && (
        <FriendManager
          friends={friends}
          onChange={loadFriends}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
