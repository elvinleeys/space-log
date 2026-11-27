import { describe, expect, it } from 'vitest';
import {
  defaultTitle,
  fileExtension,
  validateCreateRecordRequest,
} from './create-record';

const base = { collected_from: 'desktop' } as const;

describe('validateCreateRecordRequest', () => {
  it('메모: 글이 있으면 통과, 파일 형식은 null', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'memo',
      information_content: '  안녕  ',
    });
    expect(r).toMatchObject({
      ok: true,
      fileType: null,
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
    ).toMatchObject({ ok: false });
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

  it('형식·수집 경로가 목록에 없으면 INVALID_INPUT', () => {
    expect(
      validateCreateRecordRequest({ ...base, record_type: 'audio' }),
    ).toMatchObject({ code: 'INVALID_INPUT' });
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

  it('파일: 정상이면 확장자를 돌려준다 (대문자 확장자 포함)', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'file',
      file: { name: '보고서.PDF', size: 1000 },
    });
    expect(r).toMatchObject({ ok: true, fileType: 'pdf' });
  });

  it('파일: 10MB 초과는 FILE_TOO_LARGE, 정확히 10MB는 통과', () => {
    const tooBig = {
      ...base,
      record_type: 'file',
      file: { name: 'a.pdf', size: 10 * 1024 * 1024 + 1 },
    };
    expect(validateCreateRecordRequest(tooBig)).toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
    const max = {
      ...base,
      record_type: 'file',
      file: { name: 'a.pdf', size: 10 * 1024 * 1024 },
    };
    expect(validateCreateRecordRequest(max)).toMatchObject({ ok: true });
  });

  it('파일: 지원하지 않는 형식·확장자 없음은 UNSUPPORTED_FILE_TYPE', () => {
    for (const name of ['a.exe', 'README']) {
      const r = validateCreateRecordRequest({
        ...base,
        record_type: 'file',
        file: { name, size: 10 },
      });
      expect(r).toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE' });
    }
  });

  it('캡처는 png·jpg·jpeg만', () => {
    const pdf = {
      ...base,
      record_type: 'capture',
      file: { name: 'a.pdf', size: 10 },
    };
    expect(validateCreateRecordRequest(pdf)).toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
    const png = {
      ...base,
      record_type: 'capture',
      file: { name: 'a.png', size: 10 },
    };
    expect(validateCreateRecordRequest(png)).toMatchObject({
      ok: true,
      fileType: 'png',
    });
  });

  it('파일 정보가 없거나 크기가 이상하면 INVALID_INPUT', () => {
    for (const file of [
      undefined,
      { name: 'a.pdf' },
      { name: 'a.pdf', size: 0 },
      { name: 'a.pdf', size: 1.5 },
    ]) {
      const r = validateCreateRecordRequest({
        ...base,
        record_type: 'file',
        file,
      });
      expect(r).toMatchObject({ code: 'INVALID_INPUT' });
    }
  });

  it('파일 없는 기록에 파일을 보내면 INVALID_INPUT', () => {
    const r = validateCreateRecordRequest({
      ...base,
      record_type: 'memo',
      information_content: 'a',
      file: { name: 'a.pdf', size: 1 },
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

describe('defaultTitle', () => {
  it('직접 쓴 제목 > 파일 이름 > 글 첫 줄 > 주소 순', () => {
    expect(
      defaultTitle({
        ...base,
        record_type: 'memo',
        title: '제목',
        information_content: '본문',
      }),
    ).toBe('제목');
    expect(
      defaultTitle({
        ...base,
        record_type: 'file',
        file: { name: 'a.pdf', size: 1 },
      }),
    ).toBe('a.pdf');
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
        record_type: 'url',
        source_url: 'https://a.com',
      }),
    ).toBe('https://a.com');
  });

  it('첫 줄은 100자로 자른다', () => {
    expect(
      defaultTitle({
        ...base,
        record_type: 'memo',
        information_content: 'a'.repeat(150),
      }),
    ).toHaveLength(100);
  });
});

describe('fileExtension', () => {
  it('확장자를 소문자로, 없거나 점으로 시작하면 빈 값', () => {
    expect(fileExtension('A.B.PNG')).toBe('png');
    expect(fileExtension('noext')).toBe('');
    expect(fileExtension('.env')).toBe('');
  });
});
