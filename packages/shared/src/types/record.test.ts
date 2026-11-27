import { describe, expect, it } from 'vitest';
import { displayFileName, displayRecordTitle } from './record';

const files = (names: string[]) =>
  names.map((original_name, i) => ({ position: i + 1, original_name }));

describe('displayFileName', () => {
  it("제목 '우주기록 시안' + 파일 10개 → 우주기록 시안1 … 우주기록 시안10", () => {
    const fs = files(Array.from({ length: 10 }, (_, i) => `img${i}.png`));
    expect(fs.map((f) => displayFileName('우주기록 시안', f, 10))).toEqual(
      Array.from({ length: 10 }, (_, i) => `우주기록 시안${i + 1}`),
    );
  });

  it('파일이 1개면 번호 없이 제목만', () => {
    expect(
      displayFileName(
        '우주기록 시안',
        { position: 1, original_name: 'a.png' },
        1,
      ),
    ).toBe('우주기록 시안');
  });

  it('제목이 비어 있으면 각 파일의 원래 이름', () => {
    for (const title of [null, undefined, '', '   ']) {
      expect(
        displayFileName(title, { position: 2, original_name: '표.png' }, 3),
      ).toBe('표.png');
    }
  });
});

describe('displayRecordTitle', () => {
  it('제목이 있으면 제목', () => {
    expect(displayRecordTitle('우주기록 시안', files(['a.pdf']))).toBe(
      '우주기록 시안',
    );
  });

  it('제목이 비면 첫 번째(position 1) 파일 이름, 확장자 제외', () => {
    const fs = [
      { position: 2, original_name: '둘째.png' },
      { position: 1, original_name: '보고서.pdf' },
    ];
    expect(displayRecordTitle(null, fs)).toBe('보고서');
  });

  it('제목도 파일도 없으면 빈 값', () => {
    expect(displayRecordTitle(null, [])).toBe('');
  });
});
