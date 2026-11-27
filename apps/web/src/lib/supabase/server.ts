// 웹 서버 코드 전용 Supabase 연결. apps/web에서 Supabase SDK를 import하는 곳은 이 파일 하나뿐이다.
// (CLAUDE.md 예외: 비밀키·쿠키 세션은 packages/shared에 둘 수 없어 웹 서버 코드에서만 허용, docs/decisions.md 2026-11-27)
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = () => requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const publishableKey = () =>
  requiredEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v)
    throw new Error(`환경변수 ${name}가 없어요 (apps/web/.env.example 참고)`);
  return v;
}

export interface AuthedClient {
  /** 요청한 사용자 권한으로 동작. RLS가 적용돼 본인 데이터만 읽고 쓴다 */
  supabase: SupabaseClient;
  user: User;
}

/**
 * 요청한 사용자를 확인한다. 데스크톱은 `Authorization: Bearer <access token>`, 웹은 쿠키 세션.
 * 로그인하지 않았거나 토큰이 잘못됐으면 null.
 */
export async function getAuthedClient(
  request: Request,
): Promise<AuthedClient | null> {
  const auth = request.headers.get('authorization');
  const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    const supabase = createClient(url(), publishableKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return error || !data.user ? null : { supabase, user: data.user };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url(), publishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Route Handler 밖(서버 컴포넌트)에서는 쿠키를 쓸 수 없어 무시한다
        }
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : { supabase, user: data.user };
}

/** 비밀키 권한. RLS를 우회하므로 서명 업로드 주소 발급처럼 꼭 필요한 곳에서만 쓴다 */
export function createAdminClient(): SupabaseClient {
  return createClient(url(), requiredEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const RECORDS_BUCKET = 'records';
