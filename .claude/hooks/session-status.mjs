// SessionStart: 세션 시작 시 현재 브랜치, 나에게 할당된 열린 이슈, main보다 뒤처진 커밋 수를 알려준다.
// 네트워크·gh 미설치 등으로 실패한 항목은 건너뛰고 나머지만 보여준다.
import { execFileSync } from 'node:child_process';

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd, args, timeout = 10000) => {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      timeout,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

const lines = [];
const branch = run('git', ['branch', '--show-current']);
if (branch === null) process.exit(0); // git 저장소가 아니면 조용히 종료
lines.push(`현재 브랜치: ${branch || '(detached HEAD)'}`);

const fetched = run('git', ['fetch', '--quiet', 'origin'], 15000) !== null;
for (const base of ['main']) {
  const behind = run('git', ['rev-list', '--count', `HEAD..origin/${base}`]);
  if (behind === null) continue; // 원격에 해당 브랜치가 없으면 생략
  lines.push(
    Number(behind) > 0
      ? `origin/${base}보다 ${behind}개 커밋 뒤처짐`
      : `origin/${base} 최신 내용 반영됨`,
  );
}
if (!fetched) lines.push('(원격 확인 실패: 마지막으로 받은 정보 기준)');

const issues = run('gh', [
  'issue',
  'list',
  '--assignee',
  '@me',
  '--state',
  'open',
  '--limit',
  '10',
  '--json',
  'number,title',
  '--jq',
  '.[] | "#\\(.number) \\(.title)"',
]);
if (issues === null) lines.push('할당된 이슈: 확인 실패 (gh 로그인 필요)');
else if (!issues) lines.push('할당된 이슈: 없음');
else lines.push('할당된 이슈:', ...issues.split('\n').map((l) => `  ${l}`));

const msg = lines.join('\n');
console.log(
  JSON.stringify({
    systemMessage: msg,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: msg,
    },
  }),
);
