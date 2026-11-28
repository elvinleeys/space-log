import { describe, expect, it } from 'vitest';
import { challengeFor, createVerifier } from './pkce';

describe('PKCE', () => {
  it('검증값은 43자 이상이고 허용된 문자만 쓴다', () => {
    const verifier = createVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]{43,128}$/);
    expect(createVerifier()).not.toBe(verifier);
  });

  it('RFC 7636 예시 값과 challenge가 같다', () => {
    expect(challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });
});
