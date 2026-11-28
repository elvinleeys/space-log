import { defineConfig } from 'vitest/config';

// 루트에서 `npm run test`를 돌릴 때 쓴다.
// 데스크톱은 '@' 경로 별칭이 있어 자기 설정(apps/desktop/vitest.config.mts)으로 돌리고, 나머지는 기본 설정으로 돌린다
export default defineConfig({
  test: {
    projects: [
      'apps/desktop/vitest.config.mts',
      {
        test: {
          name: 'shared-web',
          include: ['packages/**/*.test.ts', 'apps/web/**/*.test.ts'],
        },
      },
    ],
  },
});
