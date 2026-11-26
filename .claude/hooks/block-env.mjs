// PreToolUse(Bash|PowerShell): .env 계열 파일이 git add / commit / push 로 GitHub에 올라가는 것을 막는다.
// .gitignore가 빠졌거나 git add -f 로 강제 추가한 경우를 위한 2차 방어. .env.example 만 허용.
// exit 2 + stderr = 명령 실행 차단, Claude에게 사유 전달
import { execFileSync } from 'node:child_process';

const isEnv = (p) => /^\.env(\.[\w-]+)*$/.test(p.split(/[\\/]/).pop()) && !p.endsWith('.env.example');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const cmd = input.tool_input?.command;
  if (typeof cmd !== 'string' || !/\bgit\b/.test(cmd)) process.exit(0);

  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const git = (...args) => {
    try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { return ''; }
  };
  const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  const found = new Set();

  for (const seg of cmd.split(/&&|\|\||;|\n|\|/)) {
    const m = seg.match(/\bgit\s+((?:-\S+\s+)*)(add|commit|push)\b(.*)/);
    if (!m) continue;
    const [, , sub, rest] = m;
    // shortcut: 공백 기준 단순 분리라 공백 든 경로는 오판 가능, 문제 되면 셸 파서로 교체
    const args = rest.trim().split(/\s+/).filter(Boolean).map((a) => a.replace(/^["']|["']$/g, ''));

    if (sub === 'add') {
      // 실제로 추가될 파일을 dry-run으로 확인 (git add ., -A, -f, 폴더 지정 모두 대응)
      lines(git('add', '--dry-run', ...args)).forEach((l) => {
        const f = l.replace(/^add '(.*)'$/, '$1');
        if (isEnv(f)) found.add(f);
      });
    }
    if (sub === 'commit') {
      lines(git('diff', '--cached', '--name-only')).filter(isEnv).forEach((f) => found.add(f));
      if (args.some((a) => a === '--all' || /^-[a-zA-Z]*a/.test(a))) {
        lines(git('diff', '--name-only')).filter(isEnv).forEach((f) => found.add(f));
      }
    }
    if (sub === 'push') {
      // shortcut: 현재 HEAD 기준으로만 검사, 다른 브랜치를 지정해 push하면 놓칠 수 있음
      lines(git('log', '--name-only', '--format=', 'HEAD', '--not', '--remotes')).filter(isEnv).forEach((f) => found.add(f));
    }
  }

  if (found.size) {
    console.error(
      `보안: ${[...found].join(', ')} 파일이 GitHub에 올라갈 수 있어 명령을 차단했습니다.\n` +
      `.gitignore에 .env* 와 !.env.example 이 있는지 확인하고, 이미 스테이징됐다면 git rm --cached <파일> 로 제외하세요.`,
    );
    process.exit(2);
  }
});
