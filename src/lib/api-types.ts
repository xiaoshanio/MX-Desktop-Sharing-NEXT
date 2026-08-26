/** 前端视角的响应类型。和 src/app/api/* 的返回结构保持一致。 */

import type { CardAccent } from "./identity";

export type NodeSummary = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  isMine: boolean;
  isEnabled: boolean;
  lastCheckOk: boolean | null;
  capabilities: { listRooms: boolean; ingress: boolean } | null;
  webhookUrl: string;
};

export type RoomRow = {
  code: string;
  name: string;
  isActive: boolean;
  role: string;
  nodeName: string;
  nodeKind: string;
  /** 成员总数 */
  memberCount: number;
  /** 其中此刻在线的人数（来自 webhook 落库的 presence，不含 OBS 占位参与者） */
  onlineCount: number;
};

export type RoomDetail = {
  code: string;
  name: string;
  isActive: boolean;
  isOwner: boolean;
  canPublish: boolean;
  /** OBS 直播闸门。false = 不接受 WHIP 推流（浏览器共享不受影响）。 */
  obsEnabled: boolean;
  /** true = 连「仅观看」的成员也能共享屏幕 */
  viewerCanPublish: boolean;
  node: { name: string; kind: string; ingressAvailable: boolean | null };
};

export type Member = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  isOnline: boolean;
  /** 卡片呈现用 —— 见 lib/identity.ts */
  cardAccent: CardAccent;
  avatarAt: string | null;
  bannerAt: string | null;
};

export type Ban = {
  userId: string;
  email: string;
  displayName: string;
  reason: string | null;
  createdAt: string;
};

/** 同步播放器。sourceUrl 只是给后进房的人用的初始片源，进度走 data channel。 */
export type SyncPlayerRow = {
  id: string;
  name: string;
  sourceUrl: string | null;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  /** 我是不是创建者 —— 决定我是同步的时钟基准还是跟随者 */
  isMine: boolean;
};

export type MyProfile = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  cardAccent: CardAccent;
  avatarAt: string | null;
  bannerAt: string | null;
  hasPassword: boolean;
  emailVerified: boolean;
};

/** 登录页开局问的那份配置。密钥不在里面，只有公开的 site key。 */
export type AuthProviders = {
  oauth: Array<{ provider: "github" | "google" }>;
  turnstileSiteKey: string | null;
  emailCodeEnabled: boolean;
  /** false = 站点关闭了注册，登录页不显示「注册」页签。真正的拦截在服务端。 */
  registrationEnabled: boolean;
};

/** 管理后台 →「站点」分区。 */
export type SiteSettings = {
  registrationEnabled: boolean;
};

export type ServiceRow = {
  service: "github" | "google" | "turnstile" | "resend";
  publicValue: string;
  secretMask: string;
  isEnabled: boolean;
  meta: { fromName?: string };
  updatedAt: string;
};

export type Invite = {
  id: string;
  role: string;
  useCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type LogRow = {
  id: number;
  action: string;
  actor: string | null;
  createdAt: string;
};

export type AdminNode = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  isEnabled: boolean;
  allowPublic: boolean;
  maxRooms: number | null;
  activeRooms: number;
  lastCheckOk: boolean | null;
  lastCheckError: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: string;
};
