import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL 환경변수가 없어요. .env.local에 Supabase 커넥션 풀러 URL을 넣어주세요. (.env.local.example 참고)"
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __waterSql: ReturnType<typeof postgres> | undefined;
}

// Supabase의 Transaction pooler(pgbouncer)는 prepared statement를 지원하지 않아 prepare: false 필요
const sql =
  globalThis.__waterSql ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalThis.__waterSql = sql;

export default sql;
