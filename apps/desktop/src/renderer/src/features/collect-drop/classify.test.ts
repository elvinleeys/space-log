import { describe, expect, it } from 'vitest';
import { classifyDrop } from '.';

describe('classifyDrop', () => {
  it('파일은 파일 기록', () => {
    expect(
      classifyDrop({
        files: [{ name: 'a.pdf', size: 10, path: '/tmp/a.pdf' }],
      }),
    ).toEqual({
      item: {
        kind: 'file',
        files: [{ name: 'a.pdf', size: 10, path: '/tmp/a.pdf' }],
      },
    });
  });

  it('여러 파일을 놓으면 기록 하나에 모두 담는다', () => {
    const files = [
      { name: 'a.pdf', size: 10 },
      { name: 'b.png', size: 20 },
    ];
    expect(classifyDrop({ files })).toEqual({ item: { kind: 'file', files } });
  });

  it('여러 파일 중 하나라도 넣을 수 없으면 오류', () => {
    expect(
      classifyDrop({
        files: [
          { name: 'a.pdf', size: 10 },
          { name: 'b.zip', size: 10 },
        ],
      }),
    ).toEqual({ error: 'unsupported' });
  });

  it('지원하지 않는 파일은 오류', () => {
    expect(classifyDrop({ files: [{ name: 'a.zip', size: 10 }] })).toEqual({
      error: 'unsupported',
    });
  });

  it('브라우저 주소는 URL 기록', () => {
    expect(
      classifyDrop({
        files: [],
        uriList: '# 설명\r\nhttps://example.com/a\r\n',
      }),
    ).toEqual({
      item: { kind: 'url', url: 'https://example.com/a' },
    });
  });

  it('유튜브 주소는 영상 링크', () => {
    expect(classifyDrop({ files: [], text: 'https://youtu.be/abc' })).toEqual({
      item: { kind: 'video', url: 'https://youtu.be/abc' },
    });
  });

  it('글은 받지 않고 클립보드 붙여넣기를 안내한다', () => {
    expect(classifyDrop({ files: [], text: '선택한 문장' })).toEqual({
      error: 'textDrop',
    });
  });

  it('아무것도 없으면 무시', () => {
    expect(classifyDrop({ files: [] })).toBeNull();
  });
});
