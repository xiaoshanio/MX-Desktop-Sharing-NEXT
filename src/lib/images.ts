import { badRequest } from "./http";

/**
 * 头像 / 卡片背景的上传校验。
 *
 * 图片以 base64 存在数据库里（见 schema 的 user_assets），所以上限必须卡死：
 * base64 会把体积放大约 4/3，而 Neon 是按流量和 CU-hours 计费的。前端在
 * canvas 里已经缩过一遍，这里是不信前端的那道闸。
 */

/** 解码后的原始字节上限。前端压过之后正常只有几十 KB。 */
export const MAX_AVATAR_BYTES = 256 * 1024;
export const MAX_BANNER_BYTES = 1024 * 1024;

/** 只收位图，且必须是浏览器和邮件客户端都认的那几种。SVG 不收 —— 它能带脚本。 */
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export type DecodedImage = { mimeType: string; base64: string; byteSize: number };

/**
 * 解析 `data:image/png;base64,xxxx` 形式的字符串。
 *
 * 刻意不接受裸 URL：那会变成一个「服务端替你去取任意地址」的洞（SSRF），
 * 而且外链图会在对方删图后变成裂图。所有图片都必须是自己库里的字节。
 */
export function decodeDataUrl(input: string, limit: number): DecodedImage {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(input.trim());
  if (!match) throw badRequest("图片格式不对：需要 base64 的 data URL");

  const mimeType = match[1]!.toLowerCase();
  const base64 = match[2]!;
  if (!ALLOWED.has(mimeType)) {
    throw badRequest(`不支持这种图片格式（${mimeType}），请用 PNG / JPEG / WebP`);
  }

  // 先按 base64 长度估算，避免为了知道大小而把一个超大串真的解出来占内存
  const estimated = Math.floor((base64.length * 3) / 4);
  if (estimated > limit) {
    throw badRequest(`图片太大了（约 ${Math.round(estimated / 1024)} KB），上限 ${Math.round(limit / 1024)} KB`);
  }

  const buf = Buffer.from(base64, "base64");
  if (buf.byteLength === 0) throw badRequest("图片是空的");
  if (buf.byteLength > limit) {
    throw badRequest(`图片太大了（${Math.round(buf.byteLength / 1024)} KB），上限 ${Math.round(limit / 1024)} KB`);
  }

  // 校验魔数：光看 mime 声明不够，改个前缀就能把任意文件当图片塞进来
  if (!looksLikeImage(buf, mimeType)) {
    throw badRequest("文件内容不是声明的图片格式");
  }

  return { mimeType, base64, byteSize: buf.byteLength };
}

function looksLikeImage(buf: Buffer, mimeType: string): boolean {
  if (buf.byteLength < 12) return false;
  switch (mimeType) {
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/webp":
      // RIFF....WEBP
      return buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
    default:
      return false;
  }
}
