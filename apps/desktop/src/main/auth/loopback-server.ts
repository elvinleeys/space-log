import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

export interface Loopback {
  port: number;
  /** 콜백으로 일회용 코드가 오면 끝난다. close()로 닫히면 null */
  code: Promise<string | null>;
  close(): void;
}

type ExtraHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) => boolean;

const page = (message: string) =>
  `<!doctype html><meta charset="utf-8"><title>Spacelog</title><p>${message}</p>`;

/** 로그인 콜백을 받는 임시 서버. 127.0.0.1에만 연다 */
export function startLoopback(
  state: string,
  extra?: ExtraHandler,
): Promise<Loopback> {
  return new Promise((resolve, reject) => {
    let done: (code: string | null) => void = () => {};
    const code = new Promise<string | null>((r) => (done = r));

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (url.pathname === '/callback') {
        const received = url.searchParams.get('code');
        if (url.searchParams.get('state') !== state || !received) {
          res
            .writeHead(400)
            .end(
              page(
                '로그인 요청을 확인하지 못했어요. 앱에서 다시 시도해 주세요.',
              ),
            );
          return;
        }
        res.end(page('로그인했어요. 이 창은 닫아도 돼요.'));
        done(received);
        return;
      }
      if (extra?.(req, res, url)) return;
      res.writeHead(404).end(page('없는 주소예요.'));
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: (server.address() as AddressInfo).port,
        code,
        close: () => {
          done(null);
          server.close();
          server.closeAllConnections();
        },
      });
    });
  });
}
