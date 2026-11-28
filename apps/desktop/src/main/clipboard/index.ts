import { clipboard } from 'electron';
import type { ClipboardContent } from '../../ipc';

// 크롬 계열 브라우저는 복사할 때 페이지 주소를 이 형식으로 함께 넣는다. 다른 브라우저에서는 읽을 수 없다
const SOURCE_URL_TYPE =
  'electron application/osclipboard;format="org.chromium.source-url"';

async function readAs(
  item: Electron.ClipboardItem,
  type: string,
): Promise<Blob | null> {
  if (!item.types.includes(type)) return null;
  const data = await item.getType(type);
  return data instanceof Blob ? data : null;
}

export async function readClipboard(): Promise<ClipboardContent> {
  const [item] = await clipboard.read();
  if (!item) return {};

  const image = await readAs(item, 'image/png');
  if (image) {
    const base64 = Buffer.from(await image.arrayBuffer()).toString('base64');
    return {
      image: { dataUrl: `data:image/png;base64,${base64}`, size: image.size },
    };
  }

  const text = (await clipboard.readText()).trim();
  if (!text) return {};
  let sourceUrl: string | undefined;
  try {
    const url = (await (await readAs(item, SOURCE_URL_TYPE))?.text())?.trim();
    if (url && /^https?:\/\//.test(url)) sourceUrl = url;
  } catch {
    // 출처 주소를 못 읽으면 빈칸으로 둔다
  }
  return { text, sourceUrl };
}
