import { randomBytes } from "node:crypto";

// 去掉容易看错的 0/O/1/I/L
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/**
 * 生成房间短码，同时用作 LiveKit 侧的 room name。
 * 单独放一个无依赖的模块，方便直接测，也避免测试被迫加载数据库。
 */
export function generateRoomCode(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}
