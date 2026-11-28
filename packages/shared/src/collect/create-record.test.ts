import { describe, expect, it } from 'vitest';
import {
  defaultTitle,
  fileBaseName,
  fileExtension,
  validateCreateRecordRequest,
} from './create-record';

const base = { collected_from: 'desktop' } as const;
const MB = 1024 * 1024;
const fileRec = (files: unknown, extra: object = {}) => ({
  ...base,
  record_type: 'file',
  files,
  ...extra,
});

describe('validateCreateRecordRequest · 파일 없는 기록', () => {
  it('메모: 글이 있으면 통과, 파일 형식은 빈 배열', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'memo',
      information_content: '  안녕  ',
    });
    expect(r).toMatchObject({
      ok: true,
      fileTypes: [],
      value: { information_content: '안녕' },
    });
  });

  it('메모·하이라이트: 글이 비면 INVALID_INPUT', () => {
    for (const record_type of ['memo', 'highlight']) {
      const r = validateCreateRecordRequest({
        ...base,
        record_type,
        information_content: '   ',
      });
      expect(r).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    }
  });

  it('URL·영상: http(s) 주소가 필요', () => {
    expect(
      validateCreateRecordRequest({ ...base, record_type: 'url' }),
    ).toMatchObject({
      ok: false,
    });
    expect(
      validateCreateRecordRequest({
        ...base,
        record_type: 'video',
        source_url: 'javascript:alert(1)',
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    expect(
      validateCreateRecordRequest({
        ...base,
        record_type: 'video',
        source_url: 'https://youtu.be/x',
      }),
    ).toMatchObject({ ok: true });
  });

  it('형식·수집 경로가 목록에 없거나 본문이 없으면 INVALID_INPUT', () => {
    expect(
      validateCreateRecordRequest({ ...base, record_type: 'audio' }),
    ).toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect(
      validateCreateRecordRequest({
        record_type: 'memo',
        collected_from: 'phone',
        information_content: 'a',
      }),
    ).toMatchObject({ code: 'INVALID_INPUT' });
    expect(validateCreateRecordRequest(null)).toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('파일 없는 기록에 files를 보내면 INVALID_INPUT', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'memo',
      information_content: 'a',
      files: [{ name: 'a.pdf', size: 1 }],
    });
    expect(r).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('group_id가 uuid가 아니면 GROUP_NOT_FOUND', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'memo',
      information_content: 'a',
      group_id: 'x',
    });
    expect(r).toMatchObject({ code: 'GROUP_NOT_FOUND' });
  });
});

describe('validateCreateRecordRequest · 파일 기록', () => {
  it('여러 파일: 넣은 순서대로 확장자를 돌려준다 (대문자 확장자 포함)', () => {
    const r = validateCreateRecordRequest(
      fileRec([
        { name: '보고서.PDF', size: 1000 },
        { name: '표.png', size: 10 },
      ]),
    );
    expect(r).toMatchObject({ ok: true, fileTypes: ['pdf', 'png'] });
  });

  it('파일 기록의 메모는 original_context로 받는다', () => {
    const r = validateCreateRecordRequest(
      fileRec([{ name: 'a.pdf', size: 1 }], {
        original_context: '같이 적은 메모',
      }),
    );
    expect(r).toMatchObject({
      ok: true,
      value: { original_context: '같이 적은 메모' },
    });
  });

  it('파일·URL·영상·캡처에 information_content를 보내면 INVALID_INPUT', () => {
    expect(
      validateCreateRecordRequest(
        fileRec([{ name: 'a.pdf', size: 1 }], { information_content: '메모' }),
      ),
    ).toMatchObject({ code: 'INVALID_INPUT' });
    expect(
      validateCreateRecordRequest({
        ...base,
        record_type: 'url',
        source_url: 'https://a.com',
        information_content: '메모',
      }),
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('chat 기록은 수집으로 만들 수 없다 (챗봇 기록으로 저장 전용)', () => {
    expect(
      validateCreateRecordRequest({
        ...base,
        record_type: 'chat',
        information_content: '답변',
      }),
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('파일이 없거나 빈 배열이면 INVALID_INPUT', () => {
    for (const files of [undefined, [], { name: 'a.pdf', size: 1 }]) {
      expect(validateCreateRecordRequest(fileRec(files))).toMatchObject({
        code: 'INVALID_INPUT',
      });
    }
  });

  it('10개까지 통과, 11개는 TOO_MANY_FILES', () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ name: `${i}.png`, size: 1 }));
    expect(validateCreateRecordRequest(fileRec(many(10)))).toMatchObject({
      ok: true,
    });
    expect(validateCreateRecordRequest(fileRec(many(11)))).toMatchObject({
      code: 'TOO_MANY_FILES',
    });
  });

  it('파일 하나가 10MB 초과면 FILE_TOO_LARGE, 정확히 10MB는 통과', () => {
    expect(
      validateCreateRecordRequest(
        fileRec([{ name: 'a.pdf', size: 10 * MB + 1 }]),
      ),
    ).toMatchObject({ code: 'FILE_TOO_LARGE' });
    expect(
      validateCreateRecordRequest(fileRec([{ name: 'a.pdf', size: 10 * MB }])),
    ).toMatchObject({
      ok: true,
    });
  });

  it('합계 50MB까지 통과, 넘으면 RECORD_TOO_LARGE', () => {
    const files = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        name: `${i}.pdf`,
        size: 10 * MB,
      }));
    expect(validateCreateRecordRequest(fileRec(files(5)))).toMatchObject({
      ok: true,
    });
    expect(
      validateCreateRecordRequest(
        fileRec([...files(5), { name: 'x.txt', size: 1 }]),
      ),
    ).toMatchObject({ code: 'RECORD_TOO_LARGE' });
  });

  it('지원하지 않는 형식·확장자 없음은 UNSUPPORTED_FILE_TYPE', () => {
    for (const name of ['a.exe', 'README']) {
      expect(
        validateCreateRecordRequest(fileRec([{ name, size: 10 }])),
      ).toMatchObject({
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }
  });

  it('캡처는 여러 장 가능, png·jpg·jpeg만', () => {
    const cap = (files: unknown) => ({
      ...base,
      record_type: 'capture',
      files,
    });
    expect(
      validateCreateRecordRequest(
        cap([
          { name: 'a.png', size: 1 },
          { name: 'b.jpg', size: 1 },
        ]),
      ),
    ).toMatchObject({ ok: true, fileTypes: ['png', 'jpg'] });
    expect(
      validateCreateRecordRequest(cap([{ name: 'a.pdf', size: 1 }])),
    ).toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });

  it('파일 이름·크기가 이상하면 INVALID_INPUT', () => {
    for (const f of [
      { name: '', size: 1 },
      { name: 'a.pdf' },
      { name: 'a.pdf', size: 0 },
      { name: 'a.pdf', size: 1.5 },
    ]) {
      expect(validateCreateRecordRequest(fileRec([f]))).toMatchObject({
        code: 'INVALID_INPUT',
      });
    }
  });
});

describe('defaultTitle (DB에 저장할 제목)', () => {
  it('직접 쓴 제목이 있으면 그대로', () => {
    expect(
      defaultTitle({
        ...base,
        record_type: 'memo',
        title: '제목',
        information_content: '본문',
      }),
    ).toBe('제목');
  });

  it('파일 기록은 빈 제목을 저장하지 않는다 (화면에서 첫 파일 이름으로 보여 줌)', () => {
    expect(
      defaultTitle({
        ...base,
        record_type: 'file',
        files: [{ name: '보고서.pdf', size: 1 }],
      }),
    ).toBeUndefined();
  });

  it('메모는 첫 줄(100자까지), 링크는 주소', () => {
    expect(
      defaultTitle({
        ...base,
        record_type: 'memo',
        information_content: '첫 줄\r\n둘째 줄',
      }),
    ).toBe('첫 줄');
    expect(
      defaultTitle({
        ...base,
        record_type: 'memo',
        information_content: 'a'.repeat(150),
      }),
    ).toHaveLength(100);
    expect(
      defaultTitle({
        ...base,
        record_type: 'url',
        source_url: 'https://a.com',
      }),
    ).toBe('https://a.com');
  });
});

describe('fileExtension · fileBaseName', () => {
  it('확장자를 소문자로, 없거나 점으로 시작하면 빈 값', () => {
    expect(fileExtension('A.B.PNG')).toBe('png');
    expect(fileExtension('noext')).toBe('');
    expect(fileExtension('.env')).toBe('');
  });

  it('확장자를 뺀 이름', () => {
    expect(fileBaseName('우주기록 시안.v2.pdf')).toBe('우주기록 시안.v2');
    expect(fileBaseName('noext')).toBe('noext');
  });
});
