/**
 * 上传前在浏览器里把图片缩小。
 *
 * 服务端有硬上限（lib/images.ts），但把「太大了」丢回给用户是很差的体验 ——
 * 手机拍的照片动辄 5MB，谁也不想为了换个头像先去找压缩工具。
 * 所以这里先用 canvas 缩到目标尺寸再编码，绝大多数图片压完只有几十 KB。
 *
 * 输出 WebP：同画质下比 JPEG 小三成左右，且服务端和所有目标浏览器都认。
 * 不支持 WebP 编码的老浏览器上 toDataURL 会静默回退成 PNG —— 那也在服务端的白名单里。
 *
 * 抛出来的 Error 消息是**消息键**（`img.*`），由 humanizeError 按当前语言渲染 ——
 * 这个模块没有 React 上下文，拿不到 t。
 */

export type ImageKind = "avatar" | "banner";

/** 目标像素尺寸。头像是正方形小图，背景是卡片顶部的横幅。 */
const TARGETS: Record<ImageKind, { width: number; height: number; quality: number }> = {
  avatar: { width: 256, height: 256, quality: 0.9 },
  banner: { width: 960, height: 540, quality: 0.82 },
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      // 释放 blob URL，否则每换一次图都漏一份内存
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("img.notDecodable"));
    };
    image.src = url;
  });
}

/**
 * 把 File 处理成 base64 的 data URL。
 *
 * 缩放方式是「等比填满目标框再居中裁掉多余部分」（cover），而不是压扁成目标比例：
 * 头像被压扁会很难看，而 cover 的裁切和 CSS 里 object-fit: cover 的呈现一致，
 * 所以用户在预览里看到的就是最终效果。
 */
export async function prepareImage(file: File, kind: ImageKind): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("img.notImage");
  }
  // 先卡一道极端大小：50MB 的文件光解码就能把标签页搞崩
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("img.tooBig");
  }

  const target = TARGETS[kind];
  const image = await loadImage(file);

  // 比目标还小的图不放大 —— 放大只会变模糊且体积变大
  const scale = Math.min(
    1,
    Math.max(target.width / image.naturalWidth, target.height / image.naturalHeight),
  );
  const drawWidth = Math.round(image.naturalWidth * scale);
  const drawHeight = Math.round(image.naturalHeight * scale);

  const canvasWidth = Math.min(target.width, drawWidth);
  const canvasHeight = Math.min(target.height, drawHeight);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("img.noCanvas");

  context.imageSmoothingQuality = "high";
  // 居中裁切：把缩放后的图画在画布中间，超出的部分自然被裁掉
  context.drawImage(
    image,
    Math.round((canvasWidth - drawWidth) / 2),
    Math.round((canvasHeight - drawHeight) / 2),
    drawWidth,
    drawHeight,
  );

  const dataUrl = canvas.toDataURL("image/webp", target.quality);
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("img.encodeFailed");
  }
  return dataUrl;
}
