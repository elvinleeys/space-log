// 공통 ESLint 규칙: JS 권장 + TypeScript 권장. 포맷(띄어쓰기·따옴표 등)은 Prettier가 맡으므로 겹치는 규칙은 끈다.
// Next.js 설치 후 apps/web 전용 규칙(eslint-config-next)은 여기에 추가한다.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/out/**', '**/build/**', 'survey/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  prettier,
);
