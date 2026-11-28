import { app, safeStorage } from 'electron';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Tokens } from './fake-web';

const file = () => join(app.getPath('userData'), 'session.bin');
let memory: Tokens | null = null;

export function saveTokens(tokens: Tokens) {
  memory = tokens;
  // OS 암호화를 쓸 수 없으면 파일에 쓰지 않는다 (평문 저장 금지). 이때는 앱을 켤 때마다 다시 로그인한다.
  if (!safeStorage.isEncryptionAvailable()) return;
  writeFileSync(file(), safeStorage.encryptString(JSON.stringify(tokens)));
}

export function loadTokens(): Tokens | null {
  if (memory) return memory;
  try {
    memory = JSON.parse(safeStorage.decryptString(readFileSync(file())));
  } catch {
    memory = null;
  }
  return memory;
}

export function clearTokens() {
  memory = null;
  rmSync(file(), { force: true });
}
