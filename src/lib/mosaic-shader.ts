/**
 * 首页收尾那张卡的背景：WebGL2 马赛克波纹。
 *
 * 画面是纯片元着色器算出来的 —— 没有贴图、没有几何体，一个全屏三角形对，
 * 每个格子的颜色由 (列, 行, 时间) 直接哈希+正弦算出来。因此它没有任何资源要下载，
 * 缩放到任何尺寸都不会糊，跑在 GPU 上主线程几乎不动。
 *
 * 配色不是原样照搬参考稿的粉红，而是全部换成本站的鸢尾紫主色系
 * （tokens.css 的 --mx-accent / --mx-info / --mx-mark-* 那一族）：
 * 底色是中调鸢尾紫，三条横向光带从外到内是「天蓝 / 淡紫 / 品红 → 紫 → 深靛 → 近黑」。
 * 亮度上限被压住（见 main 末尾的 min），保证盖在上面的白字始终读得清。
 *
 * 兜底路径有三条，任何一条走到都退回 CSS 条纹（.mx-land__stage-fallback）：
 * 用户要求减少动效、拿不到 webgl2 上下文、着色器编译或链接失败。
 */

/** 每格一个稳定随机数（哈希，非贴图）。 */
const HASH = `
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/** 偶发亮块用的 9 色调色板：深靛 → 鸢尾 → 淡紫 → 天蓝 → 青 → 品红。 */
const PALETTE = `
vec3 blockPalette(float index){
  if (index < 0.11) return vec3(0.071, 0.047, 0.149);
  if (index < 0.22) return vec3(0.235, 0.176, 0.553);
  if (index < 0.33) return vec3(0.337, 0.251, 0.788);
  if (index < 0.44) return vec3(0.494, 0.427, 0.867);
  if (index < 0.55) return vec3(0.604, 0.549, 0.874);
  if (index < 0.66) return vec3(0.176, 0.435, 0.839);
  if (index < 0.77) return vec3(0.361, 0.584, 0.933);
  if (index < 0.88) return vec3(0.059, 0.608, 0.557);
  return vec3(0.820, 0.404, 0.741);
}
`;

export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
/** 0 = 浅色主题，1 = 深色主题。整体压暗并往深靛底色靠，不换色相。 */
uniform float u_dark;
out vec4 fragColor;
${HASH}
${PALETTE}

vec3 patternColor(float column, float row, float time){
  // 1) 底色：中调鸢尾紫，按格子随机数 + 慢速正弦漂移
  float cellNoise = hash12(vec2(column, row));
  float colorDrift = 0.5 + 0.5 * sin(time * 0.31 + cellNoise * 6.28318);
  vec3 color = mix(vec3(0.416,0.353,0.804), vec3(0.310,0.267,0.667), colorDrift);
  if (cellNoise > 0.22) color = mix(color, vec3(0.475,0.420,0.847), 0.55);
  if (cellNoise > 0.42) color = mix(color, vec3(0.294,0.243,0.643), 0.62);
  if (cellNoise > 0.60) color = mix(color, vec3(0.361,0.353,0.812), 0.52);
  if (cellNoise > 0.76) color = mix(color, vec3(0.235,0.196,0.549), 0.68);
  if (cellNoise > 0.89) color = mix(color, vec3(0.545,0.494,0.878), 0.72);

  // 2) 三条水平「光带」：中心线随 column 做双正弦摆动 → 波浪感
  float tide = time * 0.54;
  float centerA =  6.0 + 2.8*sin(column*0.72 - tide*1.12) + 0.75*sin(column*0.23 + tide*0.46);
  float centerB = 14.5 + 3.1*sin(column*0.61 - tide*0.88 + 2.2) + 0.90*sin(column*0.19 + tide*0.39);
  float centerC = 23.0 + 2.6*sin(column*0.68 - tide*0.73 + 4.1) + 0.65*sin(column*0.27 + tide*0.34);
  float distanceA = abs(row - centerA);
  float distanceB = abs(row - centerB);
  float distanceC = abs(row - centerC);
  float widthPulse = 0.22 * sin(tide*0.67 + column*0.16);

  // 3) 每条光带 4 层 smoothstep 从外到内套色：亮边 → 紫 → 深靛 → 近黑
  float aOuter  = 1.0 - smoothstep(3.25 + widthPulse, 4.05 + widthPulse, distanceA);
  float aMiddle = 1.0 - smoothstep(2.15, 2.90, distanceA);
  float aInner  = 1.0 - smoothstep(0.75, 1.55, distanceA);
  float aCore   = 1.0 - smoothstep(0.12, 0.62, distanceA);
  color = mix(color, vec3(0.361,0.584,0.933), aOuter);
  color = mix(color, vec3(0.176,0.435,0.839), aMiddle);
  color = mix(color, vec3(0.161,0.106,0.412), aInner);
  color = mix(color, vec3(0.055,0.039,0.118), aCore);

  float bOuter  = 1.0 - smoothstep(3.30 - widthPulse, 4.10 - widthPulse, distanceB);
  float bMiddle = 1.0 - smoothstep(2.15, 2.95, distanceB);
  float bInner  = 1.0 - smoothstep(0.75, 1.55, distanceB);
  float bCore   = 1.0 - smoothstep(0.12, 0.62, distanceB);
  color = mix(color, vec3(0.718,0.671,0.910), bOuter);
  color = mix(color, vec3(0.494,0.427,0.867), bMiddle);
  color = mix(color, vec3(0.141,0.098,0.353), bInner);
  color = mix(color, vec3(0.055,0.039,0.118), bCore);

  float cOuter  = 1.0 - smoothstep(3.20, 4.00, distanceC);
  float cMiddle = 1.0 - smoothstep(2.10, 2.90, distanceC);
  float cInner  = 1.0 - smoothstep(0.75, 1.55, distanceC);
  float cCore   = 1.0 - smoothstep(0.12, 0.62, distanceC);
  color = mix(color, vec3(0.820,0.404,0.741), cOuter);
  color = mix(color, vec3(0.404,0.267,0.788), cMiddle);
  color = mix(color, vec3(0.129,0.086,0.325), cInner);
  color = mix(color, vec3(0.047,0.035,0.106), cCore);

  // 4) 约 2.2% 的格子闪出高饱和色块
  float accent = step(0.978, cellNoise) * (0.35 + 0.18*sin(time*0.43 + column));
  color = mix(color, blockPalette(fract(cellNoise*4.73)), accent);
  return color;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float columnCount = 20.0;   // 横向 20 格
  float rowCount    = 56.0;   // 纵向 56 格
  float column = floor(uv.x * columnCount);   // floor = 硬边马赛克
  float row    = floor(uv.y * rowCount);

  vec3 color = patternColor(column * 0.5, row * 0.5, u_time);
  float tintSeed = hash12(vec2(column, row));
  vec3 gaplessTint = mix(vec3(0.337,0.251,0.788), vec3(0.176,0.435,0.839), tintSeed);
  color = mix(color, gaplessTint, 0.10);        // 10% 统一色调，压掉杂色
  color = min(color, vec3(0.780,0.740,0.930));  // 限亮，保证白字可读

  // 深色主题：整体压暗并往 --mx-bg-base 那档深靛靠，色相不动
  color *= mix(1.0, 0.60, u_dark);
  color = mix(color, vec3(0.075,0.070,0.110), u_dark * 0.26);

  fragColor = vec4(color, 1.0);
}
`;

export interface MosaicHandle {
  /** 深浅主题切换时调一下 —— 只改一个 uniform，不重建上下文。 */
  setDark(dark: boolean): void;
  destroy(): void;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source.trim() + "\n");
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error("[mosaic] 着色器编译失败：", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

/**
 * 起一块马赛克背景。
 *
 * `host` 是负责决定尺寸的那个元素（卡片本身），canvas 只跟着它走 —— 这样圆角裁切、
 * 响应式高度都归 CSS 管，这里不掺和布局。拿不到上下文就返回 null，调用方去开兜底层。
 */
export function startMosaic(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  dark: boolean,
): MosaicHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = vs && fs ? gl.createProgram() : null;
  if (!vs || !fs || !program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[mosaic] 着色器链接失败：", gl.getProgramInfoLog(program));
    return null;
  }

  // 全屏两个三角形，画面全部由片元着色器负责
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uDark = gl.getUniformLocation(program, "u_dark");

  let darkNow = dark ? 1 : 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75); // DPR 封顶 1.75，省 GPU
    const width = Math.max(1, Math.floor(host.clientWidth * dpr));
    const height = Math.max(1, Math.floor(host.clientHeight * dpr));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const sizeWatcher = new ResizeObserver(resize);
  sizeWatcher.observe(host);

  // 滚出视口就停画：这张卡在页面最底部，多数时间根本看不见
  let visible = true;
  const viewWatcher = new IntersectionObserver(([entry]) => {
    visible = entry ? entry.isIntersecting : true;
  });
  viewWatcher.observe(host);

  let frame = 0;
  let start = 0;
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    if (!start) start = now;
    if (!visible) return;
    resize();
    gl.useProgram(program);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uDark, darkNow);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  frame = requestAnimationFrame(draw);

  return {
    setDark(next: boolean) {
      darkNow = next ? 1 : 0;
    },
    destroy() {
      cancelAnimationFrame(frame);
      sizeWatcher.disconnect();
      viewWatcher.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      // 开发环境 effect 会跑两遍，不主动还上下文的话很快就撞到浏览器的 WebGL 上限
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}




