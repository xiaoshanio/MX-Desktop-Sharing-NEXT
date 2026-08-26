/**
 * 把品牌标记渲染成 PNG，供邮件里的 <img> 用。
 *
 * 为什么需要这一步：邮件里的 LOGO 不能用 SVG —— Gmail、QQ 邮箱、163 这些
 * 主流客户端会直接拦掉 <img src="*.svg">，收件人看到的是一个裂图。而项目
 * 刻意不引任何图形库（构建要保持 hermetic，见 CLAUDE.md 里的 no-webfonts 约定），
 * 所以这里自己扫描线光栅化 + 手写 PNG 编码。
 *
 * 标记本身只有四个多边形加一条圆头折线，光栅化不需要通用图形引擎：
 * 多边形用射线法判内外，折线用「到线段的距离 <= 半宽」，圆头端点天然就是这个定义。
 * 每像素 4x4 超采样拿到覆盖率，再按绘制顺序 alpha 合成。
 *
 * 只在标记本身改动时才需要重跑：
 *   node scripts/render-logo-png.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/* ---- 标记几何。和 src/components/BrandMark.tsx 里的路径逐点一致（32 单位网格）---- */
const GRID = 32;
const FACES = [
  { points: [[6, 17.8], [6, 22.3], [16, 27.3], [16, 22.8]], color: [0x3c, 0x2d, 0x8d] },
  { points: [[26, 17.8], [26, 22.3], [16, 27.3], [16, 22.8]], color: [0x56, 0x40, 0xc9] },
  { points: [[16, 12.8], [26, 17.8], [16, 22.8], [6, 17.8]], color: [0x9a, 0x8c, 0xdf] },
];
const SIGNAL = {
  points: [[7, 11.2], [16, 6.7], [25, 11.2]],
  width: 3.6,
  color: [0x56, 0x40, 0xc9],
};

const SIZE = 256; // 邮件里按 64px 显示，4x 给高清屏留余量
const SUBSAMPLES = 4; // 每轴，即每像素 16 个采样点

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    // 射线法：只统计跨越 y 的边，交点在 x 右侧则翻转
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToPolyline(x, y, points) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    // 投影到线段上并夹到 [0,1]，夹的那一下就是圆头端点的语义
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    best = Math.min(best, Math.hypot(x - px, y - py));
  }
  return best;
}

/** 某个形状在这个像素里的覆盖率 0–1。 */
function coverage(px, py, test) {
  let hits = 0;
  for (let sy = 0; sy < SUBSAMPLES; sy++) {
    for (let sx = 0; sx < SUBSAMPLES; sx++) {
      // 采样点取子格中心，避免正好落在边界上产生条纹
      const x = ((px + (sx + 0.5) / SUBSAMPLES) / SIZE) * GRID;
      const y = ((py + (sy + 0.5) / SUBSAMPLES) / SIZE) * GRID;
      if (test(x, y)) hits++;
    }
  }
  return hits / (SUBSAMPLES * SUBSAMPLES);
}

const shapes = [
  ...FACES.map((face) => ({
    color: face.color,
    test: (x, y) => insidePolygon(x, y, face.points),
  })),
  {
    color: SIGNAL.color,
    test: (x, y) => distanceToPolyline(x, y, SIGNAL.points) <= SIGNAL.width / 2,
  },
];

/* ---- 光栅化成 RGBA ---- */
const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (const shape of shapes) {
      const c = coverage(px, py, shape.test);
      if (c === 0) continue;
      // 按绘制顺序 source-over 合成（预乘后再存回直通值）
      const [sr, sg, sb] = shape.color;
      const outA = c + a * (1 - c);
      r = (sr * c + r * a * (1 - c)) / outA;
      g = (sg * c + g * a * (1 - c)) / outA;
      b = (sb * c + b * a * (1 - c)) / outA;
      a = outA;
    }
    const offset = (py * SIZE + px) * 4;
    rgba[offset] = Math.round(r);
    rgba[offset + 1] = Math.round(g);
    rgba[offset + 2] = Math.round(b);
    rgba[offset + 3] = Math.round(a * 255);
  }
}

/* ---- PNG 编码 ---- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // 位深
ihdr[9] = 6; // 颜色类型 6 = RGBA
ihdr[10] = 0; // deflate
ihdr[11] = 0; // 标准过滤
ihdr[12] = 0; // 非隔行

// 每条扫描线前面加一个过滤类型字节（0 = None）
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "logo-mark-email.png");
writeFileSync(out, png);
console.log(`已写出 ${out}（${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(1)} KB）`);
