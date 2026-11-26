// PostToolUse(Bash|PowerShell): Claude가 git pull/fetch 한 뒤, 원격에서 지워진(PR 머지 후 자동 삭제된) 로컬 브랜치를 정리한다.
// git branch -d(안전 삭제)만 사용: 현재 브랜치에 합쳐지지 않은 브랜치는 지우지 않는다.
import { execFileSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const cmd = input.tool_input?.command;
  if (typeof cmd !== 'string' || !/\bgit\s+(?:-\S+\s+)*(pull|fetch)\b/.test(cmd)) process.exit(0);

  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  try { git('fetch', '--prune', '--quiet'); } catch { process.exit(0); } // 오프라인 등은 조용히 넘어감

  let current = '';
  try { current = git('branch', '--show-current'); } catch {}
  const gone = git('for-each-ref', '--format=%(refname:short)|%(upstream:track)', 'refs/heads')
    .split('\n')
    .map((l) => l.split('|'))
    .filter(([name, track]) => name && track === '[gone]' && name !== current)
    .map(([name]) => name);

  const deleted = [];
  const kept = [];
  for (const b of gone) {
    try { git('branch', '-d', b); deleted.push(b); } catch { kept.push(b); }
  }
  if (!deleted.length && !kept.length) process.exit(0);

  const msg = [
    deleted.length && `머지된 로컬 브랜치 삭제: ${deleted.join(', ')}`,
    kept.length && `원격에서 지워졌지만 현재 브랜치에 합쳐지지 않아 남겨둠: ${kept.join(', ')}`,
  ].filter(Boolean).join('\n');
  console.log(JSON.stringify({ systemMessage: msg }));
});
