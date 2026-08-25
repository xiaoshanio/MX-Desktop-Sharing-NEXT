/** 前端视角的响应类型。和 src/app/api/* 的返回结构保持一致。 */

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
};

export type RoomDetail = {
  code: string;
  name: string;
  isActive: boolean;
  isOwner: boolean;
  canPublish: boolean;
  node: { name: string; kind: string; ingressAvailable: boolean | null };
};

export type Member = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  isOnline: boolean;
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
