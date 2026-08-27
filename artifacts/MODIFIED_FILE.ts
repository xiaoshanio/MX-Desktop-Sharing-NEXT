import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * 用户。role='admin' 只有初始化时产生的那一个（之后可由管理员提升他人）。
 *
 * 这张表被 currentUser() 在**每个请求**上 select *，所以刻意不放大字段：
 * 头像和卡片背景的字节存在 user_assets 里，这里只留「有没有／什么时候换的」，
 * 后者同时当 URL 上的缓存版本号用。
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** 第三方登录（GitHub/Google）建出来的账号没有密码，所以可空。 */
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
    isDisabled: boolean("is_disabled").notNull().default(false),
    /** 邮箱验证码登录过、或第三方回传 verified 时写入。 */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    /** 卡片底色。null = 按 id 哈希随机取一档（见 lib/identity.ts）。 */
    cardAccent: text("card_accent"),
    /** 有自定义头像/卡片背景时非空，值同时作为图片 URL 的版本号。 */
    avatarUpdatedAt: timestamp("avatar_updated_at", { withTimezone: true }),
    bannerUpdatedAt: timestamp("banner_updated_at", { withTimezone: true }),
    /** 首次进房的「推流地址在哪」引导只弹一次，弹过就记在这里。 */
    ingressTipSeenAt: timestamp("ingress_tip_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

/**
 * 头像 / 卡片背景的字节。和 users 分表是因为 users 每个请求都要全表字段查一遍，
 * 把几百 KB 的 base64 塞进去等于每个请求都白读一遍（Neon 按 CU-hours 计费）。
 *
 * 只有 /api/users/[id]/image 这一个端点读它。
 */
export const userAssets = pgTable(
  "user_assets",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["avatar", "banner"] }).notNull(),
    mimeType: text("mime_type").notNull(),
    /** base64（不含 data: 前缀）。上传前前端已按 lib/images.ts 的上限压过。 */
    data: text("data").notNull(),
    byteSize: integer("byte_size").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_assets_pk").on(t.userId, t.kind)],
);

/**
 * 第三方服务凭据，全部落库、AES-256-GCM 加密，**不走环境变量**。
 *
 * 一张表覆盖四种服务，因为它们的形状是一样的：一个可以公开的标识 + 一个必须加密的密钥。
 *   github / google  publicValue = Client ID，secretEnc = Client Secret
 *   turnstile        publicValue = Site Key，  secretEnc = Secret Key
 *   resend           publicValue = 发件地址，  secretEnc = API Key
 *
 * secret_enc 任何接口都不回传明文，只回 maskSecret() 的掩码。
 */
export const serviceCredentials = pgTable("service_credentials", {
  service: text("service", { enum: ["github", "google", "turnstile", "resend"] }).primaryKey(),
  publicValue: text("public_value").notNull(),
  secretEnc: text("secret_enc").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  /** 服务特有的杂项，如 resend 的 fromName。 */
  meta: jsonb("meta"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 第三方账号绑定。同一个第三方账号只能绑一个本站用户。 */
export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider", { enum: ["github", "google"] }).notNull(),
    /** 第三方侧的稳定用户 id（GitHub 的数字 id / Google 的 sub），不是邮箱。 */
    providerAccountId: text("provider_account_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("oauth_accounts_provider_idx").on(t.provider, t.providerAccountId),
    index("oauth_accounts_user_idx").on(t.userId),
  ],
);

/**
 * OAuth 往返的一次性 state。存哈希，明文只在授权 URL 和 cookie 里。
 * 同时带 PKCE 的 code_verifier —— Google 支持 PKCE，能挡住授权码被截获后换 token。
 */
export const oauthStates = pgTable(
  "oauth_states",
  {
    id: text("id").primaryKey(),
    provider: text("provider", { enum: ["github", "google"] }).notNull(),
    codeVerifier: text("code_verifier").notNull(),
    /** 登录完要去哪，只接受站内相对路径。 */
    nextPath: text("next_path").notNull().default("/dashboard"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("oauth_states_expires_idx").on(t.expiresAt)],
);

/**
 * 邮箱验证码。存 sha256，明文只在邮件里。
 * attempts 用来防爆破：同一条码试错超过上限就作废，不给人慢慢猜 6 位数的机会。
 */
export const emailCodes = pgTable(
  "email_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_codes_email_idx").on(t.email, t.createdAt)],
);

/** 会话。id 存的是 token 的 sha256，明文 token 只在 cookie 里。 */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** 全局 KV。'initialized' 这一行是首次初始化的门闩。 */
export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * LiveKit 节点 = 一套 LiveKit Cloud（或自建 LiveKit）凭据。
 *
 * kind='builtin'  管理员初始化时写入，owner_id 为 null，全站共享，配额也共享；
 *                 allow_public 决定普通用户建房时能不能选它。
 * kind='user'     普通用户自己接进来的 LiveKit Cloud 项目，配额烧的是他自己的账号。
 *
 * api_secret 一律 AES-256-GCM 加密存储，任何接口都不回传给前端。
 */
export const livekitNodes = pgTable(
  "livekit_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["builtin", "user"] }).notNull().default("user"),
    /** wss://xxx.livekit.cloud */
    wsUrl: text("ws_url").notNull(),
    apiKey: text("api_key").notNull(),
    apiSecretEnc: text("api_secret_enc").notNull(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").notNull().default(true),
    /** 仅对 builtin 有意义：是否开放给普通用户建房 */
    allowPublic: boolean("allow_public").notNull().default(false),
    /** 内置节点的兜底闸门，null = 不限。防止共享配额被一个人烧穿。 */
    maxRooms: integer("max_rooms"),
    /** 凭据体检结果 */
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastCheckOk: boolean("last_check_ok"),
    lastCheckError: text("last_check_error"),
    /** 探测到的能力，如 { listRooms: true, ingress: true } */
    capabilities: jsonb("capabilities"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("livekit_nodes_owner_idx").on(t.ownerId),
    // 同一个人不要把同一套凭据重复接两遍
    uniqueIndex("livekit_nodes_owner_key_idx").on(t.ownerId, t.wsUrl, t.apiKey),
  ],
);

/**
 * 房间。code 同时用作 LiveKit 侧的 room name。
 * 因为 code 全库唯一，所以即便多个房间落在同一个 builtin 节点上也不会撞名。
 */
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => livekitNodes.id, { onDelete: "restrict" }),
    /** 观众默认只订阅不发布 */
    viewerCanPublish: boolean("viewer_can_publish").notNull().default(false),
    /**
     * OBS 直播闸门（房主开关）。false = 这个房间不接受 WHIP 推流：
     * 生成/轮换推流地址的接口直接 400，已生成的地址在关闭那一刻就被 deleteIngress 作废。
     * 只管 OBS 那条路，浏览器直接共享屏幕走的是另一条（WebRTC 直连），不受它影响。
     */
    obsEnabled: boolean("obs_enabled").notNull().default(true),
    /** 签发的 join token 有效期，默认 6h */
    tokenTtlSeconds: integer("token_ttl_seconds").notNull().default(21600),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rooms_code_idx").on(t.code),
    index("rooms_owner_idx").on(t.ownerId),
    index("rooms_node_idx").on(t.nodeId),
  ],
);

/** 频道可用线路。rooms.node_id 保留为主线路的兼容字段；此表记录额外线路。 */
export const roomNodes = pgTable(
  "room_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id").notNull().references(() => livekitNodes.id, { onDelete: "cascade" }),
    addedBy: uuid("added_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("room_nodes_room_node_idx").on(t.roomId, t.nodeId),
    index("room_nodes_room_idx").on(t.roomId),
    index("room_nodes_node_idx").on(t.nodeId),
  ],
);

/** 指定频道 + 指定用户的线路授权；授权不会跨频道生效。 */
export const nodeAccessGrants = pgTable(
  "node_access_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id").notNull().references(() => livekitNodes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    grantedBy: uuid("granted_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("node_access_grants_unique_idx").on(t.roomId, t.nodeId, t.userId),
    index("node_access_grants_room_user_idx").on(t.roomId, t.userId),
  ],
);

/** 成员表就是鉴权的唯一依据：不在这张表里，签不出 token，也就订阅不到任何 track。 */
export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "publisher", "viewer"] }).notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("room_members_pk").on(t.roomId, t.userId),
    index("room_members_user_idx").on(t.userId),
  ],
);

/**
 * 房间黑名单。被踢的人进这张表，之后即使拿到邀请链接也进不来。
 *
 * 和「删掉 room_members 那一行」是两件事：删行只是当下踢出去，
 * 对方拿着有效的邀请链接可以立刻自己加回来。黑名单是那道补上的门。
 */
export const roomBans = pgTable(
  "room_bans",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bannedBy: uuid("banned_by").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("room_bans_pk").on(t.roomId, t.userId),
    index("room_bans_user_idx").on(t.userId),
  ],
);

/**
 * 同步视频播放器。由房主/管理员创建，房里的人一起看同一个地址。
 *
 * 库里只存「有这么一个播放器、放的是哪个地址」；**播放进度不落库** ——
 * 播放位置、暂停状态、时钟对齐全部走 LiveKit 的 data channel 点对点广播
 * （见 components/SyncPlayer.tsx）。视频字节由浏览器直连源站按 Range 拉取，
 * 既不经过本服务，也不经过 LiveKit。
 */
export const syncPlayers = pgTable(
  "sync_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 当前片源。存下来是为了后进房的人在房主心跳到达之前就能先把源加载上。 */
    sourceUrl: text("source_url"),
    access: text("access", { enum: ["members", "publishers", "owner"] }).notNull().default("members"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sync_players_room_idx").on(t.roomId, t.createdAt)],
);

/** 一人一房一个 WHIP 地址。stream_key 加密存，只在创建/显式索取时解密回显。 */
export const roomIngress = pgTable(
  "room_ingress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ingressId: text("ingress_id").notNull(),
    participantIdentity: text("participant_identity").notNull(),
    whipUrl: text("whip_url").notNull(),
    streamKeyEnc: text("stream_key_enc").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    // 未撤销的 ingress，每个 (房间,用户) 只允许一条
    uniqueIndex("room_ingress_active_idx")
      .on(t.roomId, t.userId)
      .where(sql`${t.revokedAt} is null`),
    index("room_ingress_ingress_id_idx").on(t.ingressId),
  ],
);

/** 在线状态由 LiveKit webhook 写入，前端不要轮询这张表（见 README 里 Neon CU-hours 那节）。 */
export const roomPresence = pgTable(
  "room_presence",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    identity: text("identity").notNull(),
    kind: text("kind", { enum: ["ingress", "user"] }).notNull().default("user"),
    isOnline: boolean("is_online").notNull().default(false),
    lastEvent: text("last_event"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("room_presence_pk").on(t.roomId, t.identity)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_room_idx").on(t.roomId, t.createdAt),
    index("audit_logs_actor_idx").on(t.actorId, t.createdAt),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

/**
 * 登录失败记录，用于限流。成功登录后清空该 identifier 的行。
 * 没有 Redis，就用一张窄表 + 时间窗口计数，够用且不引入额外依赖。
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** 归一化后的邮箱 */
    identifier: text("identifier").notNull(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempts_ident_idx").on(t.identifier, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);

/**
 * 邀请链接。token 只在链接里出现，库里存 sha256。
 * 房主不必知道对方邮箱就能拉人——凭链接注册/登录后自动入房。
 */
export const roomInvites = pgTable(
  "room_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    role: text("role", { enum: ["publisher", "viewer"] }).notNull().default("viewer"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** null = 不限次数 */
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("room_invites_token_idx").on(t.tokenHash),
    index("room_invites_room_idx").on(t.roomId),
  ],
);

/**
 * 已处理的 webhook 事件 id，用于去重。
 * LiveKit 会重试投递，重复的 participant_joined 会把在线状态写乱。
 */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(),
    nodeId: uuid("node_id").references(() => livekitNodes.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("webhook_events_received_idx").on(t.receivedAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  nodes: many(livekitNodes),
  rooms: many(rooms),
  memberships: many(roomMembers),
}));

export const livekitNodesRelations = relations(livekitNodes, ({ one, many }) => ({
  owner: one(users, { fields: [livekitNodes.ownerId], references: [users.id] }),
  rooms: many(rooms),
  roomBindings: many(roomNodes),
  accessGrants: many(nodeAccessGrants),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, { fields: [rooms.ownerId], references: [users.id] }),
  node: one(livekitNodes, { fields: [rooms.nodeId], references: [livekitNodes.id] }),
  members: many(roomMembers),
  ingress: many(roomIngress),
  nodeBindings: many(roomNodes),
  nodeAccessGrants: many(nodeAccessGrants),
}));

export const roomNodesRelations = relations(roomNodes, ({ one }) => ({
  room: one(rooms, { fields: [roomNodes.roomId], references: [rooms.id] }),
  node: one(livekitNodes, { fields: [roomNodes.nodeId], references: [livekitNodes.id] }),
  addedByUser: one(users, { fields: [roomNodes.addedBy], references: [users.id] }),
}));

export const nodeAccessGrantsRelations = relations(nodeAccessGrants, ({ one }) => ({
  room: one(rooms, { fields: [nodeAccessGrants.roomId], references: [rooms.id] }),
  node: one(livekitNodes, { fields: [nodeAccessGrants.nodeId], references: [livekitNodes.id] }),
  user: one(users, { fields: [nodeAccessGrants.userId], references: [users.id] }),
  grantedByUser: one(users, { fields: [nodeAccessGrants.grantedBy], references: [users.id] }),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, { fields: [roomMembers.roomId], references: [rooms.id] }),
  user: one(users, { fields: [roomMembers.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type LivekitNode = typeof livekitNodes.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type RoomMember = typeof roomMembers.$inferSelect;
export type RoomIngress = typeof roomIngress.$inferSelect;
export type RoomNode = typeof roomNodes.$inferSelect;
export type NodeAccessGrant = typeof nodeAccessGrants.$inferSelect;
export type ServiceCredential = typeof serviceCredentials.$inferSelect;
export type SyncPlayer = typeof syncPlayers.$inferSelect;
export type UserAssetKind = "avatar" | "banner";
export type OauthProvider = "github" | "google";
