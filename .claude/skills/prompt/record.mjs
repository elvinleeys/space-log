// 오늘 이 프로젝트에서 보낸 내 prompt를 모아 문서의 오늘 날짜 섹션에 중복 없이 덧붙인다.
// 사용: node .claude/skills/prompt/record.mjs <문서 경로>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const doc = process.argv[2];
if (!doc) { console.error('문서 경로가 필요합니다'); process.exit(1); }

const pad = (n) => String(n).padStart(2, '0');
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = localDate(new Date());
const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
const norm = (t) => t.replace(/\r/g, '').trim();

// Claude Code는 cwd의 영문·숫자 외 문자를 '-'로 바꾼 폴더에 세션 기록을 둔다
const dir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/[^A-Za-z0-9]/g, '-'));
if (!fs.existsSync(dir)) { console.error(`대화 기록 폴더 없음: ${dir}`); process.exit(1); }

function promptText(e) {
  if (e.type !== 'user' || e.isMeta || e.isSidechain || e.isCompactSummary) return null;
  if (!e.timestamp || localDate(new Date(e.timestamp)) !== today) return null;
  const c = e.message?.content;
  let t;
  if (typeof c === 'string') t = c;
  else if (Array.isArray(c) && !c.some((b) => b.type === 'tool_result')) {
    t = c.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }
  if (!t) return null;
  t = norm(t);
  const cmd = t.match(/<command-name>(.*?)<\/command-name>/);
  if (cmd) {
    if (cmd[1] === '/prompt') return null;
    const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1].trim();
    return args ? `${cmd[1]} ${args}` : cmd[1];
  }
  // 시스템이 user 역할로 넣는 메시지
  if (/^(<local-command-|<task-notification>|<system-reminder>|Caveat:|\[Request interrupted)/.test(t)) return null;
  // shortcut: 5글자 미만은 '응','ㅇㅇ','계속' 같은 짧은 응답으로 보고 제외, 오탐이 생기면 기준 조정
  if ([...t].length < 5) return null;
  return t;
}

const found = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.jsonl')) continue;
  const p = path.join(dir, f);
  if (fs.statSync(p).mtime < midnight) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    const t = promptText(e);
    if (t) found.push({ t, ts: e.timestamp });
  }
}
found.sort((a, b) => a.ts.localeCompare(b.ts));

const content = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8').replace(/\r/g, '') : '';
const header = `## ${today}`;
const at = content.split('\n').indexOf(header);
// 오늘 섹션의 기존 항목: 빈 줄로 구분된 인용 블록, '> ' 를 벗겨 원문으로 복원
const existing = new Set(
  at < 0 ? [] : content.split('\n').slice(at + 1).join('\n').split(/\n{2,}/)
    .map((b) => norm(b.split('\n').map((l) => l.replace(/^> ?/, '')).join('\n'))),
);

const added = [];
for (const { t } of found) if (!existing.has(t)) { existing.add(t); added.push(t); }

if (!added.length) { console.log('추가할 새 prompt가 없습니다.'); process.exit(0); }

const quote = (t) => t.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
let out = content.trimEnd();
if (at < 0) out += `${out ? '\n\n' : ''}${header}`;
out += `\n\n${added.map(quote).join('\n\n')}\n`;
fs.writeFileSync(doc, out);
console.log(`${added.length}개 추가:\n\n${added.map(quote).join('\n\n')}`);
