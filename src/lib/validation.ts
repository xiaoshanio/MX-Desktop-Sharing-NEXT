import { z } from "zod";

/**
 * 纯 schema 模块：不 import 任何本项目的其他文件。
 *
 * 校验失败的 message 写的是**消息键**（`valid.*`，见 i18n/messages/en.ts），
 * 不是成品文案 —— 这个模块拿不到请求语言，翻译由 http.ts 的 parseOr400 + route()
 * 在同一处完成。保持零依赖也是为此：它只描述数据，不描述呈现。
 */

/** wss:// 或 ws://（自建）都收，顺手剥掉尾巴上的斜杠和路径。 */
export const wsUrlSchema = z
  .string()
  .trim()
  .min(1, "valid.wsUrlRequired")
  .transform((raw, ctx) => {
    let value = raw;
    // 用户经常从控制台复制成 https://xxx.livekit.cloud，替他改掉
    if (value.startsWith("https://")) value = `wss://${value.slice("https://".length)}`;
    if (value.startsWith("http://")) value = `ws://${value.slice("http://".length)}`;
    if (!/^wss?:\/\//.test(value)) value = `wss://${value}`;

    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "valid.wsUrlInvalid" });
      return z.NEVER;
    }
    return `${parsed.protocol}//${parsed.host}`;
  });

/**
 * 邮箱。**故意比 zod 的 .email() 宽一点：允许无点的单标签域名**，
 * 这样 `admin@localhost`（ADMIN_EMAIL 的默认值）能正常登录。
 *
 * zod 的 .email() 要求域名带点，会把默认管理员邮箱判成非法 —— 结果是账户建得出来
 * 却永远登不进去。既然本站要支持内网/自建部署，localhost 这类地址就是合法输入。
 */
const EMAIL_LABEL = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
const EMAIL_RE = new RegExp(
  `^[a-z0-9!#$%&'*+/=?^_\`{|}~.-]+@${EMAIL_LABEL}(?:\\.${EMAIL_LABEL})*$`,
  "i",
);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "valid.emailFormat")
  .max(254, "valid.emailTooLong")
  .regex(EMAIL_RE, "valid.emailFormat");

export const nodeCredentialsSchema = z.object({
  wsUrl: wsUrlSchema,
  apiKey: z.string().trim().min(3, "valid.apiKeyShort"),
  apiSecret: z.string().trim().min(8, "valid.apiSecretShort"),
});

export const createNodeSchema = nodeCredentialsSchema.extend({
  name: z.string().trim().min(1, "valid.nodeName").max(60),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "valid.passwordRequired"),
  /** Turnstile 的一次性 token。没配人机验证时前端不会带，服务端也会放行。 */
  captchaToken: z.string().trim().max(4096).optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(1).max(60),
  password: z.string().min(8, "valid.passwordShort"),
  captchaToken: z.string().trim().max(4096).optional(),
});

/** 请求邮箱验证码。人机验证在这一步是硬要求（配了的话）—— 否则等于开放的发信接口。 */
export const requestEmailCodeSchema = z.object({
  email: emailSchema,
  captchaToken: z.string().trim().max(4096).optional(),
});

export const verifyEmailCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, "valid.codeSixDigits"),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "valid.roomName").max(80),
  /** 省略 = 用内置节点（前提是管理员开了 allowPublic） */
  nodeId: z.string().uuid().optional(),
  /** 或者建房时现场接一套自己的凭据进来 */
  newNode: createNodeSchema.optional(),
  viewerCanPublish: z.boolean().default(false),
  tokenTtlSeconds: z.number().int().min(300).max(86400).default(21600),
});

/**
 * 房主改房间设置。
 *
 * 全部字段可选 + 「至少给一项」：这样前端可以只发自己动过的那一个开关，
 * 不必把整份设置回传（回传等于两个标签页同时打开设置时后保存的会把前一个覆盖掉）。
 */
export const updateRoomSchema = z
  .object({
    obsEnabled: z.boolean().optional(),
    /** true = 连「仅观看」的成员也能从浏览器共享屏幕 */
    viewerCanPublish: z.boolean().optional(),
  })
  .refine(
    (value) => value.obsEnabled !== undefined || value.viewerCanPublish !== undefined,
    { message: "valid.atLeastOneSetting" },
  );

export const addMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["publisher", "viewer"]).default("viewer"),
});

export const createInviteSchema = z.object({
  role: z.enum(["publisher", "viewer"]).default("viewer"),
  /** null = 永不过期 */
  expiresInHours: z.number().int().min(1).max(24 * 30).nullable().default(24),
  /** null = 不限次数 */
  maxUses: z.number().int().min(1).max(1000).nullable().default(null),
});

export const updateNodeSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  /** 换密钥：两个都给才生效 */
  apiKey: z.string().trim().min(3).optional(),
  apiSecret: z.string().trim().min(8).optional(),
});

export const adminUpdateNodeSchema = z.object({
  isEnabled: z.boolean().optional(),
  allowPublic: z.boolean().optional(),
  maxRooms: z.number().int().positive().max(10000).nullable().optional(),
  /** 把这个节点提升为「内置节点」（全站共享）。同时只能有一个。 */
  makeBuiltin: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["admin", "user"]).optional(),
  isDisabled: z.boolean().optional(),
});

/**
 * 站点级开关。
 *
 * 字段可选 + 「至少给一项」，和 updateRoomSchema 同一个理由：前端只发自己动过的
 * 那一个开关，以后再加开关也不会互相覆盖。
 */
export const adminUpdateSettingsSchema = z
  .object({
    registrationEnabled: z.boolean().optional(),
  })
  .refine((value) => value.registrationEnabled !== undefined, {
    message: "valid.atLeastOneSetting",
  });

/* ============================================================
   成员权限 / 黑名单
   ============================================================ */

/** 房主右键成员卡片改权限。owner 不在可选项里 —— 转让房主是另一件事。 */
export const updateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["publisher", "viewer"]),
});

/* ============================================================
   个人中心
   ============================================================ */

/**
 * 改自己的资料。
 *
 * 头像和背景收 base64 的 data URL（字节校验在 lib/images.ts）：
 * 传 null 表示「删掉，回到默认底色」，不传表示「这次不动它」。
 * 两者必须能区分，所以用 .nullable().optional() 而不是简单的 optional。
 *
 * 底色档位这里是**手抄**的一份，没有 import identity.ts —— 本模块刻意保持零项目内依赖
 * （见文件头）。抄重了会漂移，所以 tests/validation.test.mts 里有一条断言把两份钉在一起。
 */
export const CARD_ACCENT_VALUES = [
  "iris",
  "azure",
  "teal",
  "lime",
  "amber",
  "rose",
  "magenta",
  "slate",
] as const;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "valid.displayName").max(60).optional(),
  cardAccent: z.enum(CARD_ACCENT_VALUES).nullable().optional(),
  avatar: z.string().max(700_000).nullable().optional(),
  banner: z.string().max(2_800_000).nullable().optional(),
});

/* ============================================================
   同步播放器
   ============================================================ */

export const createSyncPlayerSchema = z.object({
  name: z.string().trim().min(1, "valid.playerName").max(60),
});

/**
 * 换片源。
 *
 * 只收 http(s)：播放器是在**浏览器里**直接对这个地址发 Range 请求的，
 * 别的协议浏览器也取不到。地址本身不做可达性校验 —— 那要服务端去请求一次，
 * 既慢又等于给了一个 SSRF 探测口子。取不到时播放器会把 CORS/Range 的报错显示出来。
 */
export const updateSyncPlayerSchema = z.object({
  sourceUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "valid.sourceUrlScheme")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

/* ============================================================
   管理后台 → 第三方服务
   ============================================================ */

export const upsertServiceSchema = z.object({
  service: z.enum(["github", "google", "turnstile", "resend"]),
  /** Client ID / Site Key / 发件地址 */
  publicValue: z.string().trim().min(1, "valid.fieldRequired").max(400),
  /** 留空 = 保留库里已有的密钥 */
  secret: z.string().trim().max(4096).optional(),
  isEnabled: z.boolean().default(true),
  fromName: z.string().trim().max(80).optional(),
});
