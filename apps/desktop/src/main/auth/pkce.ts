import { createHash, randomBytes } from 'node:crypto';

/** PKCE 검증값. 앱 메모리에만 두고 로그에 남기지 않는다 */
export function createVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/** 검증값에서 만드는 확인값 (S256). 로그인 페이지에는 이 값만 넘긴다 */
export function challengeFor(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createState(): string {
  return randomBytes(16).toString('base64url');
}
