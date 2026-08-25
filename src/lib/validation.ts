import { z } from "zod";

/**
 * 纯 schema 模块：不 import 任何本项目的其他文件。
 * 校验失败如何转成 HTTP 响应见 http.ts 的 parseOr400。
 */

/** wss:// 或 ws://（自建）都收，顺手剥掉尾巴上的斜杠和路径。 */
export const wsUrlSchema = z
  .string()
  .trim()
  .min(1, "LiveKit 地址不能为空")
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "不是合法的 LiveKit 地址" });
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
  .min(3, "邮箱格式不对")
  .max(254, "邮箱太长")
  .regex(EMAIL_RE, "邮箱格式不对");

export const nodeCredentialsSchema = z.object({
  wsUrl: wsUrlSchema,
  apiKey: z.string().trim().min(3, "API Key 太短"),
  apiSecret: z.string().trim().min(8, "API Secret 太短"),
});

export const createNodeSchema = nodeCredentialsSchema.extend({
  name: z.string().trim().min(1, "给节点起个名字").max(60),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码"),
});

export const registerSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(1).max(60),
  password: z.string().min(8, "密码至少 8 位"),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "房间名不能为空").max(80),
  /** 省略 = 用内置节点（前提是管理员开了 allowPublic） */
  nodeId: z.string().uuid().optional(),
  /** 或者建房时现场接一套自己的凭据进来 */
  newNode: createNodeSchema.optional(),
  viewerCanPublish: z.boolean().default(false),
  tokenTtlSeconds: z.number().int().min(300).max(86400).default(21600),
});

/**
 * 房主改房间设置。目前只有 OBS 直播闸门一项，所以是必填 —— 后面加字段时改成
 * 全 optional + 「至少给一项」的校验。
 */
export const updateRoomSchema = z.object({
  obsEnabled: z.boolean(),
});

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
