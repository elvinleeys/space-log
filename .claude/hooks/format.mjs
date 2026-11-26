// PostToolUse(Write|Edit|MultiEdit): Claude가 코드 파일을 쓰거나 고치면 Prettier → ESLint --fix 를 자동 실행한다.
// Prettier는 .prettierrc.json, ESLint는 eslint.config.mjs 규칙을 따른다.
// 자동으로 못 고친 ESLint 오류는 exit 2로 Claude에게 알려 바로 고치게 한다.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PRETTIER_EXT = /\.(js|jsx|mjs|cjs|ts|tsx|mts|cts|json|css)$/i;
const ESLINT_EXT = /\.(js|jsx|mjs|cjs|ts|tsx|mts|cts)$/i;

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const file = input.tool_input?.file_path;
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  if (!file || !fs.existsSync(file)) process.exit(0);

  const rel = path.relative(root, path.resolve(file));
  // 프로젝트 밖, node_modules, lock 파일, 문서(md)는 건드리지 않음
  if (rel.startsWith('..') || path.isAbsolute(rel) || /(^|[\\/])node_modules[\\/]/.test(rel) || /package-lock\.json$/.test(rel)) process.exit(0);
  if (!PRETTIER_EXT.test(rel)) process.exit(0);

  const bin = (p) => path.join(root, 'node_modules', p);
  const run = (script, args) => execFileSync(process.execPath, [bin(script), ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  if (fs.existsSync(bin('prettier/bin/prettier.cjs'))) {
    try { run('prettier/bin/prettier.cjs', ['--write', '--log-level', 'warn', rel]); }
    catch (e) { console.error(`Prettier 실패 (${rel}):\n${(e.stderr || e.message).slice(0, 2000)}`); process.exit(2); }
  }

  if (ESLINT_EXT.test(rel) && fs.existsSync(bin('eslint/bin/eslint.js'))) {
    try { run('eslint/bin/eslint.js', ['--fix', '--no-warn-ignored', rel]); }
    catch (e) {
      // exit 1 = 자동으로 못 고친 오류가 남음 → Claude가 고치도록 전달
      console.error(`ESLint 오류 (${rel}):\n${(e.stdout || e.stderr || e.message).slice(0, 3000)}`);
      process.exit(2);
    }
  }
});
