// PostToolUse(ExitPlanMode): plan mode 계획이 승인되면, 코드 작성 전에 GitHub 이슈를 만든다.
// 제목 = 계획의 첫 '# ' 제목, 내용 = 계획 전체, 담당자 = 본인(@me), Project의 'In progress' 칸에 넣는다.
// gh 미설치·권한 없음·네트워크 오류는 알림만 하고 작업은 막지 않는다 (항상 exit 0).
import { execFileSync } from 'node:child_process';

const PROJECT_OWNER = 'elvinleeys';
const PROJECT_NUMBER = '5';
const STATUS_FIELD = 'Status';
const STATUS_OPTION = 'In progress';
const MAX_BODY = 65000; // GitHub 이슈 본문 한도(65,536자) 아래로

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const gh = (args, input) =>
  execFileSync('gh', args, {
    cwd,
    input,
    encoding: 'utf8',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();

const done = (msg) => {
  console.log(
    JSON.stringify({
      systemMessage: msg,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: msg,
      },
    }),
  );
  process.exit(0);
};

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const plan = input.tool_input?.plan ?? input.tool_response?.plan;
  if (typeof plan !== 'string' || !plan.trim()) process.exit(0);

  const heading = plan.match(/^#\s+(.+)$/m)?.[1];
  const title = (heading ?? plan.trim().split('\n')[0]).trim().slice(0, 200);
  const body =
    plan.length > MAX_BODY
      ? `${plan.slice(0, MAX_BODY)}\n\n…(계획이 길어 뒷부분 생략)`
      : plan;

  let url;
  try {
    url = gh(
      [
        'issue',
        'create',
        '--title',
        title,
        '--body-file',
        '-',
        '--assignee',
        '@me',
      ],
      body,
    );
  } catch (e) {
    done(
      `[plan-issue] 이슈 생성 실패: ${String(e.stderr || e.message).trim()}`,
    );
  }
  const num = url.match(/\/issues\/(\d+)/)?.[1] ?? '?';

  try {
    const projectId = gh([
      'project',
      'view',
      PROJECT_NUMBER,
      '--owner',
      PROJECT_OWNER,
      '--format',
      'json',
      '--jq',
      '.id',
    ]);
    const field = JSON.parse(
      gh([
        'project',
        'field-list',
        PROJECT_NUMBER,
        '--owner',
        PROJECT_OWNER,
        '--format',
        'json',
        '--jq',
        `.fields[] | select(.name=="${STATUS_FIELD}")`,
      ]),
    );
    const option = field.options.find((o) => o.name === STATUS_OPTION);
    if (!option) throw new Error(`'${STATUS_OPTION}' 칸을 찾지 못함`);
    const itemId = gh([
      'project',
      'item-add',
      PROJECT_NUMBER,
      '--owner',
      PROJECT_OWNER,
      '--url',
      url,
      '--format',
      'json',
      '--jq',
      '.id',
    ]);
    gh([
      'project',
      'item-edit',
      '--id',
      itemId,
      '--project-id',
      projectId,
      '--field-id',
      field.id,
      '--single-select-option-id',
      option.id,
    ]);
  } catch (e) {
    done(
      `[plan-issue] 이슈 #${num} 생성(${url}), 하지만 Project '${STATUS_OPTION}' 칸 이동 실패: ${String(e.stderr || e.message).trim()}`,
    );
  }

  done(
    `[plan-issue] 이슈 #${num} 생성, Project '${STATUS_OPTION}' 칸에 추가: ${url}\n이 작업의 PR 설명에 'Closes #${num}'을 적을 것.`,
  );
});
