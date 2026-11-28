import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_SIZE as MAX_FILE_BYTES,
  validateCreateRecordRequest,
} from '@space-log/shared';
import {
  classifyUrl,
  itemLabel,
  toCreateRecordRequest,
  validateFile,
  validateFiles,
  type CollectItem,
} from '.';

describe('validateFile', () => {
  it.each(['csv', 'txt', 'md', 'jpeg', 'jpg', 'png', 'svg', 'html', 'pdf'])(
    '%s 파일은 통과',
    (ext) => {
      expect(validateFile(`a.${ext}`, 100)).toBe('ok');
    },
  );

  it('대문자 확장자도 통과', () => {
    expect(validateFile('보고서.PDF', 100)).toBe('ok');
  });

  it.each(['a.zip', 'a.docx', '확장자없음', '.gitignore'])(
    '%s 는 지원하지 않는 형식',
    (name) => {
      expect(validateFile(name, 100)).toBe('unsupported');
    },
  );

  it('정확히 10MB는 통과, 1바이트 넘으면 막는다', () => {
    expect(validateFile('a.png', MAX_FILE_BYTES)).toBe('ok');
    expect(validateFile('a.png', MAX_FILE_BYTES + 1)).toBe('tooLarge');
  });

  it('형식과 크기가 모두 틀리면 형식을 먼저 알린다', () => {
    expect(validateFile('a.zip', MAX_FILE_BYTES + 1)).toBe('unsupported');
  });
});

describe('classifyUrl', () => {
  it('일반 주소는 URL 기록', () => {
    expect(classifyUrl(' https://example.com/post ')).toEqual({
      kind: 'url',
      url: 'https://example.com/post',
    });
  });

  it.each([
    'https://www.youtube.com/watch?v=1',
    'https://youtu.be/1',
    'https://m.youtube.com/watch?v=1',
  ])('%s 는 영상 링크', (url) => {
    expect(classifyUrl(url)?.kind).toBe('video');
  });

  it('가공 서버가 자막을 못 가져오는 영상 사이트는 URL 기록으로 본다', () => {
    expect(classifyUrl('https://vimeo.com/123')?.kind).toBe('url');
  });

  it.each([
    '그냥 글',
    'https://a.com 뒤에 글',
    'file:///etc/passwd',
    'javascript:alert(1)',
  ])('%s 는 주소가 아니다', (text) => {
    expect(classifyUrl(text)).toBeNull();
  });
});

describe('validateFiles', () => {
  const file = (size = 100) => ({ name: 'a.pdf', size });

  it('10개까지 통과, 11개는 막는다', () => {
    expect(validateFiles(Array(10).fill(file()))).toBe('ok');
    expect(validateFiles(Array(11).fill(file()))).toBe('tooMany');
  });

  it('하나라도 형식이 틀리면 막는다', () => {
    expect(validateFiles([file(), { name: 'a.zip', size: 1 }])).toBe(
      'unsupported',
    );
  });

  it('합쳐서 50MB를 넘으면 막는다', () => {
    expect(validateFiles(Array(5).fill(file(MAX_FILE_BYTES)))).toBe('ok');
    expect(
      validateFiles([...Array(5).fill(file(MAX_FILE_BYTES)), file(1)]),
    ).toBe('totalTooLarge');
  });
});

describe('itemLabel', () => {
  it('파일이 여러 개면 첫 이름과 나머지 개수', () => {
    const files = [
      { name: 'a.pdf', size: 1 },
      { name: 'b.pdf', size: 1 },
      { name: 'c.pdf', size: 1 },
    ];
    expect(itemLabel({ kind: 'file', files })).toBe('a.pdf 외 2개');
    expect(itemLabel({ kind: 'file', files: [files[0]] })).toBe('a.pdf');
  });
});

describe('toCreateRecordRequest', () => {
  const groupId = '00000000-0000-4000-8000-000000000001';
  const items: CollectItem[] = [
    { kind: 'file', files: [{ name: 'a.pdf', size: 10, path: '/tmp/a.pdf' }] },
    { kind: 'capture', name: '화면 캡처.png', size: 10, dataUrl: 'data:,' },
    { kind: 'url', url: 'https://example.com/a' },
    { kind: 'video', url: 'https://youtu.be/1' },
    { kind: 'highlight', text: '문장', sourceUrl: 'https://example.com' },
    { kind: 'highlight', text: '출처 없는 문장' },
    { kind: 'memo', text: '메모' },
  ];

  it.each(items)('$kind 는 서버 검사를 통과한다', (item) => {
    const result = validateCreateRecordRequest(
      toCreateRecordRequest(item, groupId),
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        record_type: item.kind,
        collected_from: 'desktop',
        group_id: groupId,
      },
    });
  });

  it('본문은 메모·하이라이트에만 넣는다', () => {
    for (const item of items) {
      const hasContent = item.kind === 'memo' || item.kind === 'highlight';
      expect(
        toCreateRecordRequest(item).information_content !== undefined,
      ).toBe(hasContent);
    }
  });

  it('파일은 이름과 크기만 보낸다 (경로는 보내지 않는다)', () => {
    expect(toCreateRecordRequest(items[0]).files).toEqual([
      { name: 'a.pdf', size: 10 },
    ]);
  });
});
