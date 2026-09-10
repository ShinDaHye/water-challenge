"use client";

import { useState } from "react";

type Friend = {
  id: number;
  name: string;
  emoji: string;
  dailyGoalMl: number;
};

type FriendManagerProps = {
  friends: Friend[];
  onChange: () => void | Promise<void>;
  onClose: () => void;
};

export default function FriendManager({
  friends,
  onChange,
  onClose,
}: FriendManagerProps) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💧");
  const [newGoal, setNewGoal] = useState("2000");
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editGoal, setEditGoal] = useState("");

  async function addFriend() {
    setError(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        emoji: newEmoji,
        dailyGoalMl: Number(newGoal),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "추가에 실패했어요");
      return;
    }
    setNewName("");
    setNewEmoji("💧");
    setNewGoal("2000");
    await onChange();
  }

  function startEdit(f: Friend) {
    setEditId(f.id);
    setEditName(f.name);
    setEditEmoji(f.emoji);
    setEditGoal(String(f.dailyGoalMl));
  }

  async function saveEdit() {
    if (editId == null) return;
    setError(null);
    const res = await fetch(`/api/friends/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        emoji: editEmoji,
        dailyGoalMl: Number(editGoal),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "수정에 실패했어요");
      return;
    }
    setEditId(null);
    await onChange();
  }

  async function deleteFriend(id: number, name: string) {
    if (!confirm(`${name}님을 삭제할까요? 기록도 함께 삭제돼요.`)) return;
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await onChange();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto overflow-x-hidden rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-sky-900 dark:text-sky-100">
            친구 관리
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {friends.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-sky-100 p-3 dark:border-sky-900"
            >
              {editId === f.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="w-12 min-w-0 shrink-0 rounded-lg border border-sky-200 px-2 py-1 text-center dark:border-sky-800 dark:bg-zinc-900"
                    />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-sky-200 px-2 py-1 dark:border-sky-800 dark:bg-zinc-900"
                    />
                    <input
                      type="number"
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      className="w-20 min-w-0 shrink-0 rounded-lg border border-sky-200 px-2 py-1 dark:border-sky-800 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 rounded-lg bg-sky-500 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex-1 rounded-lg bg-sky-100 py-1.5 text-sm font-medium text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sky-900 dark:text-sky-100">
                    <span className="mr-1">{f.emoji}</span>
                    <span className="font-medium">{f.name}</span>
                    <span className="ml-2 text-sm text-sky-500">
                      {f.dailyGoalMl}ml
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(f)}
                      className="rounded-lg bg-sky-100 px-2 py-1 text-sm text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteFriend(f.id, f.name)}
                      className="rounded-lg bg-red-50 px-2 py-1 text-sm text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-sky-100 pt-4 dark:border-sky-900">
          <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-100">
            친구 추가
          </h3>
          <div className="mt-2 flex gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="🐳"
              className="w-12 min-w-0 shrink-0 rounded-lg border border-sky-200 px-2 py-1 text-center dark:border-sky-800 dark:bg-zinc-900"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름"
              className="min-w-0 flex-1 rounded-lg border border-sky-200 px-2 py-1 dark:border-sky-800 dark:bg-zinc-900"
            />
            <input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="목표(ml)"
              className="w-20 min-w-0 shrink-0 rounded-lg border border-sky-200 px-2 py-1 dark:border-sky-800 dark:bg-zinc-900"
            />
          </div>
          <button
            onClick={addFriend}
            className="mt-2 w-full rounded-lg bg-sky-500 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
