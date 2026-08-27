[English](README.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [Français](README.fr.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [Tiếng Việt](README.vi.md)

# MX-Desktop-Sharing-NEXT

基於 LiveKit 的桌面分享。核心設計：**一房一節點，一人一推流位址**。

- **房間繫結 LiveKit 節點**。建房時指定用哪套 LiveKit 憑證，這個房間的媒體流量和免費額度就燒在那個節點上。
- **普通使用者自帶節點**。使用者接入自己的 LiveKit Cloud 專案，各燒各的額度，互不搶佔。
- **內建節點兜底**。管理員可把任一節點「設為內建」供全站共用，能開關是否對普通使用者開放、限制房間數。
- **鑑權在協定層**。不在成員表裡 → 簽不出 token → 連不上 room → 訂閱不到任何 track。不是前端過濾。
- **OBS 走 WHIP 直通**。`enableTranscoding: false`，不消耗每月 60 分鐘的 transcode 額度。
- **OBS 直播有開關**。房主可以一鍵關掉本房間的 WHIP 入口：正在推的立刻斷，已發出去的推流位址全部作廢。瀏覽器分享是另一條路，不受它影響。
- **兩個環境變數就能跑**。管理員帳號自動建立，加密金鑰自動供給，LiveKit 在網頁裡設定。

部署本站到 Vercel 見 [DEPLOY.md](DEPLOY.md)。

## 快速開始

只需要兩個環境變數。複製 `.env.example` 為 `.env.local`（Next **不讀** `.env.example`
本身，改那個檔案不生效），填這兩項：

```bash
DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
ADMIN_PASSWORD=換成你自己的密碼
```

**引號可以不加** —— 加與不加解析結果完全一樣。唯一例外是值裡含 `#`：不加引號會被當成
註解截斷且不報錯，那種情況要加。`ADMIN_PASSWORD` 必須非空，留成 `""` 等於沒設，
管理員帳號不會被建立。

然後建資料表、啟動：

```bash
npm install
npm run db:migrate
npm run dev
```

`db:migrate` 會讀 `drizzle/` 下的遷移檔建出 12 張資料表。它和應用讀同一套 env 檔
（`.env.local` 優先於 `.env`）。**部署到 Vercel 時不用手動跑這條** —— 建置流程裡已經
掛了遷移步驟，設好 `DATABASE_URL` 推程式碼即可，詳見 [DEPLOY.md](DEPLOY.md)。

開啟 `http://localhost:3000`，用 `admin@localhost` + 上面的密碼登入 ——
**管理員帳號在首次啟動時自動建立，沒有安裝嚮導**。

登入後到側欄「LiveKit 節點」→「接入節點」設定一個 LiveKit 節點（怎麼拿憑證見下一節）。
LiveKit 不佔用任何環境變數。

其他命令：`npm test`（137 項）、`npm run typecheck`、`npm run build`。
`build` 會先跑一遍資料庫遷移（沒設 `DATABASE_URL` 就跳過）；只想編譯不碰資料庫用
`npm run build:only`。

### 登入報錯了？

**先開啟 `/api/health`** —— 它逐項報告每個環節的狀態，不需要登入，比對著錯誤猜快得多。

```bash
curl -s http://localhost:3000/api/health | python -m json.tool
```

五項依次是：`DATABASE_URL` 有沒有設 → 資料庫連不連得上 → **12 張資料表建沒建** →
`ADMIN_PASSWORD` 有沒有設 → 啟動引導過不過。前面的項沒過時後面的會跳過，
所以永遠只需要修最上面那個紅的。

登入 API 按原因分開了狀態碼：

| 回應 | 含義 |
| --- | --- |
| `503 not_configured` | 資料庫連不上、資料表沒建，或 `DATABASE_URL` 沒設 |
| `503 admin_not_configured` | 資料庫是通的，但 `ADMIN_PASSWORD` 為空，管理員帳號沒建出來 |
| `401 invalid_credentials` | 帳號存在，密碼不對 |
| `429 rate_limited` | 同一信箱 15 分鐘內失敗 8 次（同 IP 30 次） |

最容易誤判的一種：**資料表還沒建**。症狀是 `database` 顯示「連線正常」但凡是碰到資料表的 API
全掛 —— 因為連線和建表是兩件事。`/api/health` 的 `tables` 那一項會直接列出缺哪幾張。
部署時建置流程會自動建表；本機補跑一次就是 `npm run db:migrate`。

跑了 `db:migrate` 但資料表還是沒建出來？檢查 `drizzle/meta/_journal.json` 在不在。
drizzle-kit 找不到它時**不報錯**，而是默默建一個空的然後什麼都不做。
`tests/migrations.test.mts` 就是守這條的。真遇上了，`npm run db:push` 可以繞過遷移檔
直接按 `schema.ts` 建資料表。

### 環境變數清單

| 變數 | 必填 | 預設 / 說明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon 連線字串 |
| `ADMIN_PASSWORD` | ✅ | 必須非空。改這個值並重啟即可改密碼 |
| `ADMIN_EMAIL` | | `admin@localhost` |
| `CREDENTIAL_ENCRYPTION_KEY` | | 不填則首次啟動自動產生並存入資料庫（見 [DEPLOY.md](DEPLOY.md#关于自动生成的加密密钥) 的取捨說明） |
| `NEXT_PUBLIC_APP_URL` | | 不填則從請求標頭推導 |
| `CRON_SECRET` | | 保護定時清理端點 |

### 只給自己人用（關閉註冊）

**管理後臺 →「站點設定」→ 關掉「開放註冊」**。開關存在 `app_config` 資料表裡（鍵
`registration_enabled`），不佔環境變數，改完立刻生效、不用重新部署。鍵不存在時預設
**開放** —— 舊部署升級上來不會突然把人關在門外。

關鍵在於**建帳號有三條路，關的時候必須一起關**，否則等於沒關：

| 入口 | 關閉後的行為 |
| --- | --- |
| 電子郵件密碼註冊 | `POST /api/auth/register` 直接 `403 registration_closed` |
| GitHub / Google | 已經綁過的帳號照常登入；沒綁過、本站也沒這個信箱的，在建帳號那一步被拒 |
| 郵件驗證碼 | 同上 —— 已有帳號照常登入，新信箱不再自動建帳號 |

所以判定沒有寫在三個 route 的入口，而是收在 `src/lib/site-settings.ts` 的
`assertRegistrationOpen()`，由**真的會 insert users 的那兩處**呼叫
（`src/lib/accounts.ts` 的兩個 resolve 函式 + register 路由）。第三方登入和驗證碼登入
本質都是「有帳號就登入，沒有就建一個」，只有後半句該被擋，前半句必須照常放行。

兩個刻意的位置選擇：

- **驗證碼那條擋在「驗證之後」而不是「發碼之前」**。發碼 API 無論信箱在不在資料庫裡都回
  同一個回應（否則它就成了一個查詢使用者名單的 API），在那一步擋會把這個性質破壞掉。
- **register 路由裡擋在人機驗證之前**。Turnstile 的 token 是一次性的，讓它在一個註定
  被拒的請求上燒掉，等於逼使用者重驗一次才能看到「本站點禁止註冊」。

登入頁的「註冊」標籤會跟著消失，換成一句「本站點禁止註冊，只有已有帳號可以登入」——
但那只是提示。前端拿到的 `registrationEnabled` 改成 `true` 也繞不過伺服器端那道。


---

# 部署一個 LiveKit 節點

本站不自帶媒體伺服器。每個房間都要繫結一個 LiveKit 節點，節點有兩種來源。

**先說結論**：絕大多數人應該用方式一。方式二只在你已經有伺服器、且願意額外部署
Ingress 服務時才值得。

| | 方式一 · LiveKit Cloud | 方式二 · 自建 |
| --- | --- | --- |
| 耗時 | 約 3 分鐘 | 半天起 |
| 費用 | 免費 Build 方案，不綁卡 | 伺服器 + 頻寬 |
| OBS 推流（Ingress） | **開箱可用** | **要單獨部署 Ingress + Redis** |
| 額度 | 有硬上限（見文末實算） | 只受你的頻寬限制 |
| 需要網域／憑證 | 不需要 | 需要 CA 簽發憑證，自簽不行 |

## 方式一 · LiveKit Cloud（推薦）

### 1. 註冊並建專案

開啟 [cloud.livekit.io](https://cloud.livekit.io) 註冊。免費的 **Build** 方案不需要綁卡。

建一個 project，名稱隨意。建立完會得到一個形如 `wss://xxx.livekit.cloud` 的位址 ——
這是後面要填的第一個值。

### 2. 建立 API Key

專案裡進 **Settings → Keys → 新建 API Key**，會得到：

- `API Key`（形如 `APIxxxxxxxx`）
- `API Secret`

> **API Secret 只顯示一次。** 關掉對話框就再也看不到了。先複製出來。
> 真丟了也不要緊：在 LiveKit 控制臺刪掉這個 key 重建一個，然後回本站用「換金鑰」更新即可。

### 3. 接入本站

登入本站 → 側欄 **「LiveKit 節點」→「接入節點」**，填三個值：

| 欄位 | 填什麼 |
| --- | --- |
| 節點名稱 | 隨便取，只給你自己看 |
| LiveKit 位址 | `wss://xxx.livekit.cloud` |
| API Key | 上一步的 key |
| API Secret | 上一步的 secret |

點儲存。**本站會拿這套憑證實地打一次 LiveKit API 做檢測，填錯了不會存進資料庫。**
檢測做兩件事：

- `listRooms` —— 探測位址和憑證對不對。**失敗則拒絕儲存**。
- `listIngress` —— 探測能不能產生 OBS 推流位址。**失敗只降級不阻斷**（房間仍可用瀏覽器分享，
  只是拿不到 WHIP 位址）。

結果會記在節點的 `capabilities` 上，「LiveKit 節點」頁面每行都會標出 Ingress 是否可用。
任何時候都可以點「檢測」重測。

### 4. 設定 webhook（推薦）

不設定也能用，只是伺服器端不會記錄上線／下線（前端仍然即時看得到畫面和人數，因為那走的是
LiveKit SDK 事件，不依賴 webhook）。

「LiveKit 節點」頁面裡每個你自己的節點下面都會顯示**它專屬的** webhook 位址，形如：

```
https://你的站點/api/webhooks/livekit/<nodeId>
```

複製它，填到 LiveKit 控制臺 → 該專案 → **Settings → Webhooks**。

> 為什麼每個節點位址不同：webhook 的簽章是用發送方那套 API key/secret 簽的。
> 多節點場景必須先從 URL 裡知道是哪個節點發來的，才能選對金鑰驗簽。
> 路徑裡的 `nodeId` 就是幹這個的。

### 5. 建房驗證

回「房間」頁面建一個房間，節點選你剛接入的那個。進房後：

- 「從瀏覽器分享」按鈕 → 不裝 OBS 也能推
- 「OBS 推流位址」面板 → 點「產生推流位址」，拿到 Server + Bearer Token
- 同一面板頂上的「OBS 直播」開關 → 房主關掉它，這個房間就不再接受 WHIP 推流

## 方式二 · 自建 LiveKit

### ⚠️ 先看這條，否則會白做

**自建的 `livekit-server` 不包含 Ingress。** Ingress 是獨立服務，靠 Redis 與
livekit-server 通訊。也就是說：

- 只用**瀏覽器分享螢幕** → 不需要 Ingress，裝個 livekit-server 就夠
- 想要 **OBS/WHIP 推流** → 必須額外部署 Ingress 服務 + Redis，並且在 livekit-server
  側設定 `whip_base_url` 指向它

本站會在檢測時探測出 Ingress 不可用，並在建房後的介面上明確提示「拿不到 OBS 推流位址」。

### 本機開發快速起一個

```bash
livekit-server --dev --bind 0.0.0.0
```

安裝：macOS `brew install livekit`；Linux `curl -sSL https://get.livekit.io | bash`；
Windows 從 GitHub Releases 下載。

`--dev` 模式用固定憑證 **`devkey` / `secret`**，只適合本機。接入本站時位址填
`ws://localhost:7880`（本站的位址驗證支援 `ws://`，專為自建／內網留的）。

### 生產部署

官方提供了設定產生器，比手寫設定省事得多：

```bash
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate
```

它會按你輸入的網域產出一個目錄，裡面有 `docker-compose.yaml`、`livekit.yaml`、
`caddy.yaml`、`redis.conf` 和啟動指令碼。

`livekit.yaml` 的關鍵項：

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true      # 雲端環境下透過 STUN 發現真實公網 IP
redis:
  address: redis:6379        # 生產強烈建議上 redis
keys:
  APIyourkey: your_secret_here   # 就是一個 key: secret 的對應
turn:
  enabled: true
  domain: turn.example.com   # 必須與憑證相符
  tls_port: 443              # 前面沒有負載平衡時用 443
```

`keys:` 就是一個對應表，沒有專門的產生命令 —— 自己造一個足夠隨機的 secret 即可：

```bash
openssl rand -base64 32
```

需要開放的連接埠：

| 連接埠 | 協定 | 用途 |
| --- | --- | --- |
| 7880 | TCP | 訊號（前面掛 HTTPS/TLS 終結） |
| 7881 | TCP | WebRTC 媒體的 TCP 回退 |
| 50000–60000 | UDP | WebRTC 媒體 |
| 3478 或 5349 | TCP | 內建 TURN over TLS（無 LB 時設 443） |
| 443 | UDP | 可選 TURN/UDP，穿透嚴格防火牆用 |
| 6789 | TCP | 可選 Prometheus 指標 |

兩個容易踩的點：

- **必須 CA 簽發的憑證**，自簽憑證不能用。端點形如 `wss://livekit.example.com`。
- **Docker 下用 host networking**，別做逐連接埠的 bridge 對應，否則媒體連接埠範圍會出問題。

### 部署 Ingress（只有要 OBS 推流才需要）

- 獨立服務，**Redis 位址必須與 livekit-server 用的是同一個**
- 每個實例建議 **≥ 4 CPU / 4 GB 記憶體**
- 連接埠：RTMP `1935/TCP`、WHIP `8080/TCP`、WHIP over UDP `7885/UDP`
- 設定項：`api_key`、`api_secret`、`ws_url`、`redis`
  （或用 `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL` 環境變數）
- **livekit-server 側還要設定 `whip_base_url`**（要 RTMP 再加 `rtmp_base_url`），
  否則伺服器端產生不出 ingress 位址
- 多實例要掛負載平衡：RTMP 走 TCP LB，WHIP 走 HTTP 反向代理

好消息：**WHIP 直通（bypass transcoding）幾乎不吃 CPU** —— 官方原文是
"a WHIP session with transcoding bypassed consumes minimal resources"。
本站預設就是直通（`enableTranscoding: false`），所以自建 Ingress 的機器壓力比想像中小。
真正吃 CPU 的是 RTMP 和開了轉碼的 WHIP，它們隨解析度和層數線性成長。

## OBS 怎麼填

拿到推流位址後：

1. OBS → 設定 → 直播 → **服務選 `WHIP`**
2. **Server** = 面板裡的 Server
3. **Bearer Token** = 面板裡的 Bearer Token（就是 Stream Key 的 WHIP 叫法）

產生不出位址、或者推著推著被斷開，先看面板頂上的「OBS 直播」開關是不是被房主關了。

WHIP 直通沒有伺服器端 simulcast。要多檔清晰度，得在 **OBS 32.1.0+** 自己開（支援 1–4 層）。

## 節點接入常見問題

| 現象 | 原因 / 處理 |
| --- | --- |
| 位址填成了 `https://` | 不用改，本站自動轉成 `wss://`，也會剝掉多餘的路徑和尾斜線 |
| 儲存時報「連不上或憑證無效」 | `listRooms` 探測失敗。檢查位址是否是該 project 的、key/secret 是否配對、secret 有沒有複製全 |
| Ingress 顯示「—」不可用 | Cloud：專案未啟用 Ingress，或 Ingress 併發已滿（免費層只有 2 個）。自建：沒部署 Ingress，或 `whip_base_url` 沒設 |
| 這套憑證已經接入過了 | 同一使用者 + 同一位址 + 同一 key 只允許接一次，去清單裡找現有那條 |
| 請求突然全部失敗 | 免費層額度打滿了。**超額是直接失敗、不計費**，等下個月或換節點 |
| Secret 丟了 | LiveKit 控制臺重建 key，回本站用「換金鑰」更新（會先檢測新憑證再寫入） |

---

## 架構

```
瀏覽器 ──── Next.js on Vercel ──── Neon Postgres
  │          (登入/房間/成員/簽 token)
  │                 │
  │ WebRTC          │ server SDK（用該房間所屬節點的憑證）
  │ 分享/看畫面      ▼
  └────────► LiveKit 節點 A / B / C …        ← 媒體面，每個房間只落在一個節點上
                    ▲
                    │ WHIP（直通，不轉碼）
                  OBS
```

**兩條推流路線是分開的。** 瀏覽器的「分享我的螢幕」只經過 Next.js 拿一次 token，
之後畫面從瀏覽器**直連 LiveKit**（`getDisplayMedia` → WebRTC），既不過 Vercel 也不過 Ingress；
OBS 那條要先在伺服器端建 ingress，再由 OBS 把 WHIP 推給 LiveKit。所以「OBS 直播」開關
只關得住後者 —— 關掉它，瀏覽器分享照舊能用。

| 路徑 | 作用 |
| --- | --- |
| `src/db/schema.ts` | 12 張資料表。`livekit_nodes` 是整個架構的核心 |
| `src/lib/livekit.ts` | 節點 → SDK client、簽 token、建 WHIP ingress、憑證檢測 |
| `src/lib/nodes.ts` | 節點選取與「誰能用哪個節點」的判定 |
| `src/lib/rooms.ts` | 成員判定（`requireMember` / `requireRoomOwner`） |
| `src/lib/invites.ts` | 邀請連結的簽發與原子兌換 |
| `src/lib/crypto.ts` | 憑證 AES-256-GCM 加解密 |
| `src/lib/site-settings.ts` | 站點級策略（目前只有「開放註冊」），含建帳號守衛 |
| `src/lib/app-config.ts` | `app_config` 這張全域 KV 的讀寫 |
| `src/lib/brand.ts` | 站點名 / 公司名 / 版權行，全站只在這裡寫一遍 |
| `src/i18n/` | 七種語言的文案包 + 語言判定（cookie → Accept-Language → 英語） |
| `src/lib/bootstrap.ts` | 啟動引導：建管理員、供給金鑰。惰性觸發，等冪 |
| `src/app/api/rooms/[code]/token/route.ts` | 鑑權收口 |
| `src/app/api/rooms/[code]/route.ts` | 房間詳情、OBS 閘門（PATCH）、關閉房間 |
| `src/app/api/webhooks/livekit/[nodeId]/route.ts` | 上線檢測，按節點驗簽 |
| `src/app/api/health/route.ts` | 設定診斷，排查入口 |

## 介面

自成一套設計系統，沒有 UI 框架依賴，也沒有 Tailwind ——
只有 CSS 自訂屬性 + 一層薄薄的 React 原語。

| 路徑 | 作用 |
| --- | --- |
| `src/styles/tokens.css` | 全部設計變數（`--mx-*`）。淺色是 `:root`，深色是 `[data-theme="dark"]` |
| `src/styles/base.css` | 重置 + 排版工具類 |
| `src/styles/components.css` | 原語樣式（按鈕、表單、卡片、表格、對話框…） |
| `src/styles/shell.css` | 應用外殼：頂欄、側欄、狀態列、語言下拉 |
| `src/styles/pages.css` | 頁面級組合：登入頁、統計塊、視訊舞臺 |
| `src/styles/landing.css` | 首頁（`/`）。唯一的對外介紹頁，見下 |
| `src/ui/` | React 原語，只消費 token，從不寫死顏色尺寸 |
| `src/components/AppShell.tsx` | 頂欄 + 可折疊側欄 + 主區 + 狀態列；<1024px 側欄變抽屜 |
| `src/components/LanguageSwitcher.tsx` | 語言下拉，就在主題切換按鈕的左邊 |
| `src/components/BrandMark.tsx` | 品牌標記（等距立方體 + 上行訊號），見下 |
| `src/lib/theme.ts` | 主題持久化（跟隨系統 / 淺色 / 深色）+ 首屏防閃指令碼 |

四個刻意的取捨：

- **主題在首屏之前定好**。`themeBootstrapScript` 內聯進 `<head>`，在第一次繪製前就把
  `data-theme` 打到 `<html>` 上，所以不會有一閃的白底。
- **主題預設跟隨系統**。存起來的是**偏好**（`system` / `light` / `dark`），只有 `<html>` 上的
  `data-theme` 才是解析後的顏色 —— 兩者必須分開，否則「跟隨系統」這一檔沒地方表示。
- **視訊舞臺恆定深色**。`--mx-stage-bg` 在兩個主題下都是近黑 —— 畫面周圍的亮色邊框會
  影響對畫面本身的判讀。
- **首頁自帶一套排版步進**。`landing.css` 頂上宣告了一小組 `--land-*`（hero 字級、
  段落節奏），因為 `--mx-font-size-display` 是 30px —— 給頁面標題合適，給 hero 太小了。
  顏色、圓角、陰影仍然全部走 `--mx-*`。

### 語言

介面提供**简体中文、繁體中文、English、Français、Русский、日本語、Tiếng Việt** 七種語言。
三條值得知道的決定：

- **語言在伺服器端定**：`mxds.lang` cookie（使用者明確選過的）→ `Accept-Language`（也就是跟隨系統）
  → 兜底英語。必須在伺服器端算：`<html lang>` 和首幀文案都得是對的，在客戶端讀
  `navigator.language` 會讓每次開啟都先閃一下另一種語言。
- **每份語言包都拿英語那份做型別校驗**。`src/i18n/messages/en.ts` 定義鍵集合，其餘六份宣告成
  `Messages`，於是少一個鍵或拼錯會在 `npm run typecheck` 時報錯，而不是在介面上算繪出一個裸鍵。
  佔位符是 `{name}`；文案裡的行內強調寫成 `**粗**` / `` `等寬` `` 由 `<RichText>` 算繪 ——
  這樣語言包裡沒有任何標籤結構，翻譯的人不必碰 JSX。
- **API 的錯誤訊息是訊息鍵，不是成品文案**。路由處理器拋的是 `api.node.duplicate` 這樣的鍵，
  由 `route()` 那層包裝（`src/lib/api-route.ts`）按**發起這次請求的人的語言**翻一次。
  zod 的驗證訊息同理，所以 `src/lib/validation.ts` 仍然是一個零依賴的純資料模組。

語言下拉就放在主題切換按鈕的左邊 —— 外殼頂欄和首頁頂欄各一份。手機端的首頁頂欄不顯示它：
那裡頂欄的職責是 LOGO、專案名和 GitHub 圖示（見下），而登入頁在角上另有一份，
所以「系統語言沒被認出來」不會變成一條死路。

### 首頁

`/` 是講專案的落地頁，不是分流器：頂欄 + hero + 推流路線 + 免費額度實算 + 功能 +
快速開始 + 桌面端預告 + Q&A + 收尾 CTA。已登入時 CTA 變成「進入控制臺」，未登入是
「登入 / 註冊」。

**它必須在資料庫沒設定好的時候也能開啟** —— 那正是最需要讀它的時候。所以 `currentUser()`
的失敗被吞掉按未登入算繪（`src/app/page.tsx`），而不是讓首頁跟著 500。

Q&A 用原生 `<details>`，不是自己寫的折疊：首頁是伺服器端元件，沒有 JS 也要能展開，
而鍵盤操作和螢幕閱讀器播報瀏覽器已經做對了。

**頂欄按優先順序砍項，而不是卡在一個寫死的斷點上。** 專案名是固定的 23 個字元，但
「登入 / 註冊」在法語裡比中文寬近一倍，所以任何寫死的斷點都會在某幾種語言上砍得過早或過晚。
`src/components/LandingBarFit.tsx` 改成量出來：裝不下時，主題切換和登入/註冊按鈕**一起**讓位，
保證 LOGO、完整的專案名和 GitHub 圖示留在原處。電腦端永遠不會砍任何一項。

桌面端預告那一節講的是 `MX-Desktop-Sharing-APP`（自部署、端對端加密的聊天 + 螢幕分享）。
**它一行程式碼都還沒寫**，所以那一節全部用「考慮」「打算」的語氣，並且掛了一枚「構想階段」
的標籤 —— 落地頁上寫成既成事實就是假承諾。兩個 CTA 都指向本倉庫的 issues 和 discussions，
本專案沒有單獨的信箱或聯絡表單。

### 品牌標記

一個等距立方體（房間繫結的那個 LiveKit 節點）加上方掀起的摺角（推出去的流）。
兩個形狀共用同一條 2:1 等距斜率，所以摺角的兩臂與立方體頂面稜嚴格平行。

`src/components/BrandMark.tsx` 是唯一事實來源；三個面的顏色走
`--mx-mark-{top,right,left,signal}`，按主題分別定義 —— 用透明度做明暗會在深色底下
把光照關係倒過來。`public/` 下另有獨立檔案：`logo-mark.svg`（淺色底）、
`logo-mark-dark.svg`、`logo-tile.svg`（帶底板，給 favicon / 應用圖示）、
`logo-glyph.svg`（單色）、`logo-lockup.svg`（橫向組合）。

## 鑑權模型

簽 token 前必須先過 `requireMember`。簽出來的 grant 是：

```ts
{ roomJoin: true, room: <該房間的 code>, canSubscribe: true, canPublish: <按角色> }
```

`room` 只能寫一個房間名，所以這張 token 物理上無法用於訂閱別的房間。
不給 `roomCreate` / `roomAdmin` / `roomList` —— 房間由伺服器端建好。

踢人必須三件事一起做，否則踢不乾淨（已實現）：刪成員行（之後簽不出新 token）、
`RemoveParticipant`（斷掉當前連線，因為已簽發的 token 在過期前仍然有效）、
刪他的 ingress（否則他的 OBS 還能繼續往房裡推）。

「OBS 直播」開關同理 —— 只改資料庫裡的旗標是關不住的，那個 stream key 在 LiveKit 側仍然有效。
所以關閉時對本房間每條生效的 ingress 做兩件事：`DeleteIngress`（刪掉資源，之後拿舊金鑰也連不上來）
和 `RemoveParticipant`（把 `obs:` 那個參與者踢出房間，房裡的人立刻不再收到它的畫面 ——
文件沒明說 DeleteIngress 會不會順帶終止正在進行的工作階段，不賭）；再把行標成 revoked，
最後寫旗標擋住新的產生請求。代價是重新開啟後每個人要再產生一次位址：
LiveKit 有 `UpdateIngress(enabled=false)` 這種保留金鑰的軟關法，但 JS server SDK 的
`updateIngress` 沒把 `enabled` 透出來（它按固定欄位表重建請求，多傳的會被丟掉），
要用就得自己拼 Twirp 請求。寧可讓人換一次金鑰，也不要一個「看起來關了其實沒關」的開關。

## 免費額度能用多久

這是「為什麼要讓使用者自帶節點」的全部理由。LiveKit Cloud 免費 Build 方案按 **project** 計額度，
超出後請求直接失敗、不計費，且同一帳號下多個免費專案**共用**額度：

- 5,000 WebRTC 參與者分鐘
- 50 GB 下行頻寬
- 100 併發參與者、Ingress / Egress 各 2 併發
- 60 transcode 分鐘（**這就是必須走 WHIP 而不是 RTMP 的原因** —— RTMP 輸入必定轉碼，一個月只夠推 1 小時）

關鍵一點：ingress / egress participant **不計**連線分鐘，所以消耗連線分鐘的只有觀眾。

按觀眾位元率算下來（50 GB 下行是主要瓶頸）：

| 推流位元率 | 每觀眾分鐘耗流量 | 50 GB 能撐的觀眾分鐘 | 折合觀眾小時 |
| --- | --- | --- | --- |
| 4 Mbps（1080p 高位元率） | 30 MB | 1,667 | ≈ 28 h |
| 2.5 Mbps（1080p 常規） | 18.75 MB | 2,667 | ≈ 44 h |
| 1.5 Mbps（720p） | 11.25 MB | 4,444 | ≈ 74 h |
| 0.8 Mbps | 6 MB | 5,000（觸及分鐘上限） | ≈ 83 h |

**約 1.33 Mbps 是分水嶺**：高於它，50 GB 頻寬先撞牆；低於它，5,000 分鐘先撞牆。

換成「實際能開多久會」—— 觀眾小時要除以人數：

- 1 人分享 + 1 人看，1080p：約 **44 小時/月**
- 1 人分享 + 3 人看，1080p：約 **15 小時/月**
- 1 人分享 + 9 人看，1080p：約 **5 小時/月**

結論：單個免費 project 是**試點額度，不是產品額度**。所以本專案把節點做成一等公民 ——
每個使用者接自己的 LiveKit Cloud project，額度就從「站長的一份」變成「每人一份」。
內建節點只用來兜底體驗，務必給它設 `maxRooms`。

## 已知限制

- WHIP 直通**沒有伺服器端 simulcast**，需要在 OBS 32.1.0+ 自己開多層。
- 自建 LiveKit 要用 OBS 推流，必須額外部署 Ingress + Redis（見上文方式二）。
- 沒有金鑰輪換工具：`CREDENTIAL_ENCRYPTION_KEY` 一旦更換，已存的節點憑證全部解不開。
- 沒有額度看板，只能靠上面的實算表自己估。

取捨原因和其餘待辦見 [TASKS.md](TASKS.md)。

## 參考

- [LiveKit 配額與限制](https://docs.livekit.io/cloud/quotas-and-limits/)
- [LiveKit 定價](https://livekit.io/pricing)
- [自建部署](https://docs.livekit.io/transport/self-hosting/deployment/) · [本機執行](https://docs.livekit.io/home/self-hosting/local/) · [Ingress](https://docs.livekit.io/home/self-hosting/ingress/)
