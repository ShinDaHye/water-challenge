import { NextResponse } from "next/server";
import sql from "@/lib/db";

// Supabase 무료 플랜은 7일간 API 요청이 없으면 프로젝트를 자동 일시정지시킨다.
// Vercel Cron이 이 라우트를 주기적으로 호출해서 Supabase에 활동 기록을 남겨준다.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`SELECT 1`;

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
