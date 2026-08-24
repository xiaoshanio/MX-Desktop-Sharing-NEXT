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

/** 用户。role='admin' 只有初始化时产生的那一个（之后可由管理员提升他人）。 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
    isDisabled: boolean("is_disabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
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
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, { fields: [rooms.ownerId], references: [users.id] }),
  node: one(livekitNodes, { fields: [rooms.nodeId], references: [livekitNodes.id] }),
  members: many(roomMembers),
  ingress: many(roomIngress),
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
