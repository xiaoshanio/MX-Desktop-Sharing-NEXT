# MX Desktop Sharing

基于 LiveKit 的桌面共享。核心设计：**一房一节点，一人一推流地址**。

- **房间绑定 LiveKit 节点**。建房时指定用哪套 LiveKit 凭据，这个房间的媒体流量和免费额度就烧在那个节点上。
- **普通用户自带节点**。用户接入自己的 LiveKit Cloud 项目，各烧各的额度，互不抢占。
- **内置节点兜底**。管理员可把任一节点「设为内置」供全站共享，能开关是否对普通用户开放、限制房间数。
- **鉴权在协议层**。不在成员表里 → 签不出 token → 连不上 room → 订阅不到任何 track。不是前端过滤。
- **OBS 走 WHIP 直通**。`enableTranscoding: false`，不消耗每月 60 分钟的 transcode 额度。
- **两个环境变量就能跑**。管理员账户自动创建，加密密钥自动供给，LiveKit 在网页里配。

部署本站到 Vercel 见 [DEPLOY.md](DEPLOY.md)。

## 快速开始

只需要两个环境变量。复制 `.env.example` 为 `.env.local`（Next **不读** `.env.example`
本身，改那个文件不生效），填这两项：

```bash
DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
ADMIN_PASSWORD=换成你自己的密码
```

**引号可以不加** —— 加与不加解析结果完全一样。唯一例外是值里含 `#`：不加引号会被当成
注释截断且不报错，那种情况要加。`ADMIN_PASSWORD` 必须非空，留成 `""` 等于没设，
管理员账户不会被创建。

然后建表、启动：

```bash
npm install
npm run db:migrate
npm run dev
```

打开 `http://localhost:3000`，用 `admin@localhost` + 上面的密码登录 ——
**管理员账户在首次启动时自动创建，没有安装向导**。

登录后到侧栏「LiveKit 节点」→「接入节点」配一个 LiveKit 节点（怎么拿凭据见下一节）。
LiveKit 不占用任何环境变量。

其他命令：`npm test`（62 项）、`npm run typecheck`、`npm run build`。

### 登录报错了？

**先打开 `/api/health`** —— 它逐项报告每个环节的状态，不需要登录，比对着报错猜快得多。

```bash
curl -s http://localhost:3000/api/health | python -m json.tool
```

登录接口按原因分开了状态码：

| 返回 | 含义 |
| --- | --- |
| `503 not_configured` | 数据库连不上，或 `DATABASE_URL` 没配 |
| `503 admin_not_configured` | 库是通的，但 `ADMIN_PASSWORD` 为空，管理员账户没建出来 |
| `401 invalid_credentials` | 账户存在，密码不对 |
| `429 rate_limited` | 同一邮箱 15 分钟内失败 8 次（同 IP 30 次） |

一个容易误判的坑：**忘了 `npm run db:migrate` 的症状是「数据库连得上但登录挂掉」**。
因为限流表 `login_attempts` 在第二个迁移里，而登录是第一个碰它的接口。
`/api/health` 会明确提示「表还没建齐」。

### 环境变量清单

| 变量 | 必填 | 默认 / 说明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon 连接串 |
| `ADMIN_PASSWORD` | ✅ | 必须非空。改这个值并重启即可改密码 |
| `ADMIN_EMAIL` | | `admin@localhost` |
| `CREDENTIAL_ENCRYPTION_KEY` | | 不填则首次启动自动生成并存库（见 [DEPLOY.md](DEPLOY.md#关于自动生成的加密密钥) 的取舍说明） |
| `NEXT_PUBLIC_APP_URL` | | 不填则从请求头推导 |
| `CRON_SECRET` | | 保护定时清理端点 |


---

# 部署一个 LiveKit 节点

本站不自带媒体服务器。每个房间都要绑定一个 LiveKit 节点，节点有两种来源。

**先说结论**：绝大多数人应该用方式一。方式二只在你已经有服务器、且愿意额外部署
Ingress 服务时才值得。

| | 方式一 · LiveKit Cloud | 方式二 · 自建 |
| --- | --- | --- |
| 耗时 | 约 3 分钟 | 半天起 |
| 费用 | 免费 Build 计划，不绑卡 | 服务器 + 带宽 |
| OBS 推流（Ingress） | **开箱可用** | **要单独部署 Ingress + Redis** |
| 额度 | 有硬顶（见文末实算） | 只受你的带宽限制 |
| 需要域名/证书 | 不需要 | 需要 CA 签发证书，自签不行 |

## 方式一 · LiveKit Cloud（推荐）

### 1. 注册并建 project

打开 [cloud.livekit.io](https://cloud.livekit.io) 注册。免费的 **Build** 计划不需要绑卡。

建一个 project，名字随意。创建完会得到一个形如 `wss://xxx.livekit.cloud` 的地址 ——
这是后面要填的第一个值。

### 2. 创建 API Key

项目里进 **Settings → Keys → 新建 API Key**，会得到：

- `API Key`（形如 `APIxxxxxxxx`）
- `API Secret`

> **API Secret 只显示一次。** 关掉弹窗就再也看不到了。先复制出来。
> 真丢了也不要紧：在 LiveKit 控制台删掉这个 key 重建一个，然后回本站用「换密钥」更新即可。

### 3. 接入本站

登录本站 → 侧栏 **「LiveKit 节点」→「接入节点」**，填三个值：

| 字段 | 填什么 |
| --- | --- |
| 节点名称 | 随便起，只给你自己看 |
| LiveKit 地址 | `wss://xxx.livekit.cloud` |
| API Key | 上一步的 key |
| API Secret | 上一步的 secret |

点保存。**本站会拿这套凭据实地打一次 LiveKit API 做体检，填错了不会存进库。**
体检做两件事：

- `listRooms` —— 探测地址和凭据对不对。**失败则拒绝保存**。
- `listIngress` —— 探测能不能生成 OBS 推流地址。**失败只降级不阻断**（房间仍可用浏览器共享，
  只是拿不到 WHIP 地址）。

结果会记在节点的 `capabilities` 上，「LiveKit 节点」页面每行都会标出 Ingress 是否可用。
任何时候都可以点「检测」重测。

### 4. 配 webhook（推荐）

不配也能用，只是服务端不会记录上线/下线（前端仍然实时看得到画面和人数，因为那走的是
LiveKit SDK 事件，不依赖 webhook）。

「LiveKit 节点」页面里每个你自己的节点下面都会显示**它专属的** webhook 地址，形如：

```
https://你的站点/api/webhooks/livekit/<nodeId>
```

复制它，填到 LiveKit 控制台 → 该项目 → **Settings → Webhooks**。

> 为什么每个节点地址不同：webhook 的签名是用发送方那套 API key/secret 签的。
> 多节点场景必须先从 URL 里知道是哪个节点发来的，才能选对密钥验签。
> 路径里的 `nodeId` 就是干这个的。

### 5. 建房验证

回「房间」页面建一个房间，节点选你刚接入的那个。进房后：

- 「从浏览器共享」按钮 → 不装 OBS 也能推
- 「OBS 推流地址」面板 → 点「生成推流地址」，拿到 Server + Bearer Token

## 方式二 · 自建 LiveKit

### ⚠️ 先看这条，否则会白干

**自建的 `livekit-server` 不包含 Ingress。** Ingress 是独立服务，靠 Redis 与
livekit-server 通信。也就是说：

- 只用**浏览器共享屏幕** → 不需要 Ingress，装个 livekit-server 就够
- 想要 **OBS/WHIP 推流** → 必须额外部署 Ingress 服务 + Redis，并且在 livekit-server
  侧配 `whip_base_url` 指向它

本站会在体检时探测出 Ingress 不可用，并在建房后的界面上明确提示「拿不到 OBS 推流地址」。

### 本地开发快速起一个

```bash
livekit-server --dev --bind 0.0.0.0
```

安装：macOS `brew install livekit`；Linux `curl -sSL https://get.livekit.io | bash`；
Windows 从 GitHub Releases 下载。

`--dev` 模式用固定凭据 **`devkey` / `secret`**，只适合本地。接入本站时地址填
`ws://localhost:7880`（本站的地址校验支持 `ws://`，专为自建/内网留的）。

### 生产部署

官方提供了配置生成器，比手写配置省事得多：

```bash
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate
```

它会按你输入的域名产出一个目录，里面有 `docker-compose.yaml`、`livekit.yaml`、
`caddy.yaml`、`redis.conf` 和启动脚本。

`livekit.yaml` 的关键项：

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true      # 云环境下通过 STUN 发现真实公网 IP
redis:
  address: redis:6379        # 生产强烈建议上 redis
keys:
  APIyourkey: your_secret_here   # 就是一个 key: secret 的映射
turn:
  enabled: true
  domain: turn.example.com   # 必须与证书匹配
  tls_port: 443              # 前面没有负载均衡时用 443
```

`keys:` 就是一个映射表，没有专门的生成命令 —— 自己造一个足够随机的 secret 即可：

```bash
openssl rand -base64 32
```

需要开放的端口：

| 端口 | 协议 | 用途 |
| --- | --- | --- |
| 7880 | TCP | 信令（前面挂 HTTPS/TLS 终结） |
| 7881 | TCP | WebRTC 媒体的 TCP 回退 |
| 50000–60000 | UDP | WebRTC 媒体 |
| 3478 或 5349 | TCP | 内置 TURN over TLS（无 LB 时设 443） |
| 443 | UDP | 可选 TURN/UDP，穿透严格防火墙用 |
| 6789 | TCP | 可选 Prometheus 指标 |

两个容易踩的点：

- **必须 CA 签发的证书**，自签证书不工作。终端形如 `wss://livekit.example.com`。
- **Docker 下用 host networking**，别做逐端口的 bridge 映射，否则媒体端口范围会出问题。

### 部署 Ingress（只有要 OBS 推流才需要）

- 独立服务，**Redis 地址必须与 livekit-server 用的是同一个**
- 每实例建议 **≥ 4 CPU / 4 GB 内存**
- 端口：RTMP `1935/TCP`、WHIP `8080/TCP`、WHIP over UDP `7885/UDP`
- 配置项：`api_key`、`api_secret`、`ws_url`、`redis`
  （或用 `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL` 环境变量）
- **livekit-server 侧还要配 `whip_base_url`**（要 RTMP 再加 `rtmp_base_url`），
  否则服务端生成不出 ingress 地址
- 多实例要挂负载均衡：RTMP 走 TCP LB，WHIP 走 HTTP 反代

好消息：**WHIP 直通（bypass transcoding）几乎不吃 CPU** —— 官方原文是
"a WHIP session with transcoding bypassed consumes minimal resources"。
本站默认就是直通（`enableTranscoding: false`），所以自建 Ingress 的机器压力比想象中小。
真正吃 CPU 的是 RTMP 和开了转码的 WHIP，它们随分辨率和层数线性增长。

## OBS 怎么填

拿到推流地址后：

1. OBS → 设置 → 直播 → **服务选 `WHIP`**
2. **Server** = 面板里的 Server
3. **Bearer Token** = 面板里的 Bearer Token（就是 Stream Key 的 WHIP 叫法）

WHIP 直通没有服务端 simulcast。要多档清晰度，得在 **OBS 32.1.0+** 自己开（支持 1–4 层）。

## 节点接入常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 地址填成了 `https://` | 不用改，本站自动转成 `wss://`，也会剥掉多余的路径和尾斜杠 |
| 保存时报「连不上或凭据无效」 | `listRooms` 探测失败。检查地址是否是该 project 的、key/secret 是否配对、secret 有没有复制全 |
| Ingress 显示「—」不可用 | Cloud：项目未启用 Ingress，或 Ingress 并发已满（免费层只有 2 个）。自建：没部署 Ingress，或 `whip_base_url` 没配 |
| 这套凭据已经接入过了 | 同一用户 + 同一地址 + 同一 key 只允许接一次，去列表里找现有那条 |
| 请求突然全部失败 | 免费层额度打满了。**超额是直接失败、不计费**，等下个月或换节点 |
| Secret 丢了 | LiveKit 控制台重建 key，回本站用「换密钥」更新（会先体检新凭据再写入） |

---

## 架构

```
浏览器 ──── Next.js on Vercel ──── Neon Postgres
             (登录/房间/成员/签 token)
                    │
                    │ server SDK（用该房间所属节点的凭据）
                    ▼
          LiveKit 节点 A / B / C …        ← 媒体面，每个房间只落在一个节点上
                    ▲
                    │ WHIP（直通，不转码）
                  OBS
```

| 路径 | 作用 |
| --- | --- |
| `src/db/schema.ts` | 12 张表。`livekit_nodes` 是整个架构的核心 |
| `src/lib/livekit.ts` | 节点 → SDK client、签 token、建 WHIP ingress、凭据体检 |
| `src/lib/nodes.ts` | 节点选取与「谁能用哪个节点」的判定 |
| `src/lib/rooms.ts` | 成员判定（`requireMember` / `requireRoomOwner`） |
| `src/lib/invites.ts` | 邀请链接的签发与原子兑换 |
| `src/lib/crypto.ts` | 凭据 AES-256-GCM 加解密 |
| `src/lib/bootstrap.ts` | 启动引导：建管理员、供给密钥。惰性触发，幂等 |
| `src/app/api/rooms/[code]/token/route.ts` | 鉴权收口 |
| `src/app/api/webhooks/livekit/[nodeId]/route.ts` | 上线检测，按节点验签 |
| `src/app/api/health/route.ts` | 配置诊断，排查入口 |

## 界面

自成一套设计系统，没有 UI 框架依赖，也没有 Tailwind ——
只有 CSS 自定义属性 + 一层薄薄的 React 原语。

| 路径 | 作用 |
| --- | --- |
| `src/styles/tokens.css` | 全部设计变量（`--mx-*`）。浅色是 `:root`，深色是 `[data-theme="dark"]` |
| `src/styles/base.css` | 重置 + 排版工具类 |
| `src/styles/components.css` | 原语样式（按钮、表单、卡片、表格、弹窗…） |
| `src/styles/shell.css` | 应用外壳：顶栏、侧栏、状态栏 |
| `src/styles/pages.css` | 页面级组合：登录页、统计块、视频舞台 |
| `src/ui/` | React 原语，只消费 token，从不写死颜色尺寸 |
| `src/components/AppShell.tsx` | 顶栏 + 可折叠侧栏 + 主区 + 状态栏；<1024px 侧栏变抽屉 |
| `src/components/BrandMark.tsx` | 品牌标记（等距立方体 + 上行信号），见下 |
| `src/lib/theme.ts` | 主题持久化 + 首屏防闪脚本 |

两个刻意的取舍：

- **主题在首屏之前定好**。`themeBootstrapScript` 内联进 `<head>`，在第一次绘制前就把
  `data-theme` 打到 `<html>` 上，所以不会有一闪的白底。
- **视频舞台恒定深色**。`--mx-stage-bg` 在两个主题下都是近黑 —— 画面周围的亮色边框会
  影响对画面本身的判读。

### 品牌标记

一个等距立方体（房间绑定的那个 LiveKit 节点）加上方掀起的折角（推出去的流）。
两个形状共用同一条 2:1 等距斜率，所以折角的两臂与立方体顶面棱严格平行。

`src/components/BrandMark.tsx` 是唯一事实来源；三个面的颜色走
`--mx-mark-{top,right,left,signal}`，按主题分别定义 —— 用透明度做明暗会在深色底下
把光照关系倒过来。`public/` 下另有独立文件：`logo-mark.svg`（浅色底）、
`logo-mark-dark.svg`、`logo-tile.svg`（带底板，给 favicon / 应用图标）、
`logo-glyph.svg`（单色）、`logo-lockup.svg`（横向组合）。


## 鉴权模型

签 token 前必须先过 `requireMember`。签出来的 grant 是：

```ts
{ roomJoin: true, room: <该房间的 code>, canSubscribe: true, canPublish: <按角色> }
```

`room` 只能写一个房间名，所以这张 token 物理上无法用于订阅别的房间。
不给 `roomCreate` / `roomAdmin` / `roomList` —— 房间由服务端建好。

踢人必须三件事一起做，否则踢不干净（已实现）：删成员行（之后签不出新 token）、
`RemoveParticipant`（断掉当前连接，因为已签发的 token 在过期前仍然有效）、
删他的 ingress（否则他的 OBS 还能继续往房里推）。

## 免费额度能用多久

这是「为什么要让用户自带节点」的全部理由。LiveKit Cloud 免费 Build 计划按 **project** 计额度，
超出后请求直接失败、不计费，且同一账号下多个免费项目**共享**额度：

- 5,000 WebRTC 参与者分钟
- 50 GB 下行带宽
- 100 并发参与者、Ingress / Egress 各 2 并发
- 60 transcode 分钟（**这就是必须走 WHIP 而不是 RTMP 的原因** —— RTMP 输入必定转码，一个月只够推 1 小时）

关键一点：ingress / egress participant **不计**连接分钟，所以消耗连接分钟的只有观众。

按观众码率算下来（50 GB 下行是主要瓶颈）：

| 推流码率 | 每观众分钟耗流量 | 50 GB 能撑的观众分钟 | 折合观众小时 |
| --- | --- | --- | --- |
| 4 Mbps（1080p 高码率） | 30 MB | 1,667 | ≈ 28 h |
| 2.5 Mbps（1080p 常规） | 18.75 MB | 2,667 | ≈ 44 h |
| 1.5 Mbps（720p） | 11.25 MB | 4,444 | ≈ 74 h |
| 0.8 Mbps | 6 MB | 5,000（触及分钟上限） | ≈ 83 h |

**约 1.33 Mbps 是分水岭**：高于它，50 GB 带宽先撞墙；低于它，5,000 分钟先撞墙。

换成「实际能开多久会」—— 观众小时要除以人数：

- 1 人分享 + 1 人看，1080p：约 **44 小时/月**
- 1 人分享 + 3 人看，1080p：约 **15 小时/月**
- 1 人分享 + 9 人看，1080p：约 **5 小时/月**

结论：单个免费 project 是**试点额度，不是产品额度**。所以本项目把节点做成一等公民 ——
每个用户接自己的 LiveKit Cloud project，额度就从「站长的一份」变成「每人一份」。
内置节点只用来兜底体验，务必给它设 `maxRooms`。

## 已知限制

- WHIP 直通**没有服务端 simulcast**，需要在 OBS 32.1.0+ 自己开多层。
- 自建 LiveKit 要用 OBS 推流，必须额外部署 Ingress + Redis（见上文方式二）。
- 没有密钥轮换工具：`CREDENTIAL_ENCRYPTION_KEY` 一旦更换，已存的节点凭据全部解不开。
- 没有额度看板，只能靠上面的实算表自己估。

取舍原因和其余待办见 [TASKS.md](TASKS.md)。

## 参考

- [LiveKit 配额与限制](https://docs.livekit.io/cloud/quotas-and-limits/)
- [LiveKit 定价](https://livekit.io/pricing)
- [自建部署](https://docs.livekit.io/transport/self-hosting/deployment/) · [本地运行](https://docs.livekit.io/home/self-hosting/local/) · [Ingress](https://docs.livekit.io/home/self-hosting/ingress/)
