**English** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · [Tiếng Việt](README.vi.md)

# MX-Desktop-Sharing-NEXT

LiveKit-based desktop sharing. The core idea: **one node per room, one publish URL per person**.

- **Rooms are bound to a LiveKit node.** You pick which set of LiveKit credentials a room uses when you create it, and that room's media traffic and free-tier usage burn on that node.
- **Regular users bring their own node.** Users connect their own LiveKit Cloud project, each burning their own quota, competing with nobody.
- **A built-in node as a fallback.** An admin can promote any node to "built-in" so the whole site shares it, with switches for whether regular users may use it and a cap on its room count.
- **Authorisation happens at the protocol layer.** Not in the member table → no token → no room connection → no track subscription. This is not front-end filtering.
- **OBS goes over WHIP passthrough.** `enableTranscoding: false`, so it never eats the 60 transcode minutes a month.
- **"OBS publishing" is a real switch.** The owner can shut this room's WHIP entrance in one click: anything currently publishing drops immediately and every publish URL already handed out is voided. Browser sharing is a separate route and is unaffected.
- **Two environment variables are enough to run it.** The admin account is created automatically, the encryption key is provisioned automatically, and LiveKit is configured in the web UI.

To deploy this site to Vercel, see [DEPLOY.md](DEPLOY.md).

## Quick start

You only need two environment variables. Copy `.env.example` to `.env.local` (Next **does not read**
`.env.example` itself — editing that file has no effect) and fill in these two:

```bash
DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
ADMIN_PASSWORD=pick-your-own-password
```

**Quotes are optional** — with or without them the parsed result is identical. The one exception is a
value containing `#`: without quotes it is silently truncated as a comment, so quote it in that case.
`ADMIN_PASSWORD` must be non-empty; leaving it as `""` counts as unset and the admin account will not
be created.

Then create the tables and start:

```bash
npm install
npm run db:migrate
npm run dev
```

`db:migrate` reads the migration files under `drizzle/` and creates 12 tables. It reads the same env
files as the app (`.env.local` takes precedence over `.env`). **You do not run this by hand when
deploying to Vercel** — the migration step is already wired into the build, so configure
`DATABASE_URL` and push; see [DEPLOY.md](DEPLOY.md) for details.

Open `http://localhost:3000` and sign in with `admin@localhost` plus the password above —
**the admin account is created on first start, and there is no install wizard**.

Once signed in, go to "LiveKit nodes" in the sidebar → "Connect a node" and configure a LiveKit node
(how to get the credentials is in the next section). LiveKit occupies no environment variables.

Other commands: `npm test` (137 assertions), `npm run typecheck`, `npm run build`.
`build` runs the database migration first (skipped when `DATABASE_URL` is unset); to compile without
touching the database use `npm run build:only`.

### Sign-in is failing?

**Open `/api/health` first** — it reports the state of every step, needs no sign-in, and is far faster
than guessing from a stack trace.

```bash
curl -s http://localhost:3000/api/health | python -m json.tool
```

The five items, in order: is `DATABASE_URL` set → can the database be reached → **were the 12 tables
created** → is `ADMIN_PASSWORD` set → did the startup bootstrap pass. Later items are skipped while an
earlier one fails, so you only ever need to fix the topmost red one.

The sign-in endpoint separates status codes by cause:

| Response | Meaning |
| --- | --- |
| `503 not_configured` | The database is unreachable, the tables don't exist, or `DATABASE_URL` isn't set |
| `503 admin_not_configured` | The database is fine, but `ADMIN_PASSWORD` is empty so the admin account was never created |
| `401 invalid_credentials` | The account exists, the password is wrong |
| `429 rate_limited` | 8 failures for the same email within 15 minutes (30 from the same IP) |

The easiest one to misdiagnose: **the tables haven't been created**. The symptom is that `database`
shows "Connected" while every endpoint that touches a table fails — because connecting and creating
tables are two different things. The `tables` item in `/api/health` lists exactly which ones are
missing. On deploy the build creates them automatically; locally, catch up with `npm run db:migrate`.

Ran `db:migrate` but the tables still aren't there? Check whether `drizzle/meta/_journal.json` exists.
When drizzle-kit can't find it, it **doesn't error** — it quietly creates an empty one and does
nothing. `tests/migrations.test.mts` guards exactly this. If you do hit it, `npm run db:push` can
bypass the migration files and create the tables straight from `schema.ts`.

### Environment variables

| Variable | Required | Default / notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon connection string |
| `ADMIN_PASSWORD` | ✅ | Must be non-empty. Change this value and restart to change the password |
| `ADMIN_EMAIL` | | `admin@localhost` |
| `CREDENTIAL_ENCRYPTION_KEY` | | Generated on first start and stored in the database if unset (see the trade-off discussion in [DEPLOY.md](DEPLOY.md#关于自动生成的加密密钥)) |
| `NEXT_PUBLIC_APP_URL` | | Derived from request headers if unset |
| `CRON_SECRET` | | Protects the scheduled cleanup endpoint |

### Keeping it to your own people (closing sign-ups)

**Admin → "Site settings" → turn off "Allow sign-ups".** The switch lives in the `app_config` table
(key `registration_enabled`), takes no environment variable, and applies immediately with no redeploy.
When the key is absent the default is **open** — upgrading an existing deployment never locks people
out unexpectedly.

The crucial part is that **there are three ways to create an account, and closing one means closing
all three**, otherwise you've closed nothing:

| Entrance | Behaviour once closed |
| --- | --- |
| Email + password | `POST /api/auth/register` returns `403 registration_closed` outright |
| GitHub / Google | Already-linked accounts sign in as usual; anyone unlinked whose email isn't here either is rejected at the account-creation step |
| Email code | Same — existing accounts sign in as usual, new addresses no longer create an account |

So the check isn't written at the entrance of three routes; it's collected in
`assertRegistrationOpen()` in `src/lib/site-settings.ts` and called by **the two places that actually
insert into users** (the two resolve functions in `src/lib/accounts.ts`, plus the register route).
Third-party and email-code sign-in are both really "sign in if the account exists, otherwise create
one"; only the second half should be blocked, and the first half must keep working.

Two deliberate placement choices:

- **The email-code path is blocked *after* verification, not *before* sending.** The send endpoint
  returns the same response whether or not the address is in the database (otherwise it becomes an
  endpoint for enumerating users); blocking at that step would destroy that property.
- **In the register route it's blocked before the human verification.** A Turnstile token is
  single-use; burning it on a request that is doomed to be refused would force the user to verify
  again just to see "sign-ups are disabled on this site".

The "Sign up" tab on the sign-in page disappears accordingly, replaced by a line reading "sign-ups are
disabled on this site — existing accounts can still sign in" — but that's only a hint. Flipping the
`registrationEnabled` the front end received to `true` still doesn't get past the server check.


---

# Deploying a LiveKit node

This site ships no media server. Every room has to be bound to a LiveKit node, and a node can come
from one of two places.

**The conclusion first**: almost everyone should use option one. Option two is only worth it when you
already have a server and are willing to deploy the Ingress service on top.

| | Option 1 · LiveKit Cloud | Option 2 · Self-hosted |
| --- | --- | --- |
| Time | About 3 minutes | Half a day and up |
| Cost | Free Build plan, no card | Server + bandwidth |
| OBS publishing (Ingress) | **Works out of the box** | **Requires deploying Ingress + Redis separately** |
| Quota | Hard caps (see the numbers at the end) | Only limited by your bandwidth |
| Domain / certificate needed | No | Yes, a CA-issued certificate; self-signed does not work |

## Option 1 · LiveKit Cloud (recommended)

### 1. Sign up and create a project

Open [cloud.livekit.io](https://cloud.livekit.io) and sign up. The free **Build** plan needs no card.

Create a project with any name. Once created you get a URL of the form `wss://xxx.livekit.cloud` —
that's the first of the values you'll need.

### 2. Create an API Key

Inside the project go to **Settings → Keys → new API Key**, which gives you:

- `API Key` (looks like `APIxxxxxxxx`)
- `API Secret`

> **The API Secret is shown once.** Close the dialog and it's gone for good. Copy it now.
> Losing it isn't fatal: delete that key in the LiveKit console, create a new one, then come back here
> and use "Rotate keys" to update it.

### 3. Connect it here

Sign in → sidebar **"LiveKit nodes" → "Connect a node"**, and fill in three values:

| Field | What goes in |
| --- | --- |
| Node name | Anything; it's only for you |
| LiveKit URL | `wss://xxx.livekit.cloud` |
| API Key | The key from the previous step |
| API Secret | The secret from the previous step |

Press save. **This site runs a real health check against the LiveKit API with those credentials, and
wrong ones are never stored.** The check does two things:

- `listRooms` — probes whether the URL and credentials are right. **Failure refuses the save.**
- `listIngress` — probes whether OBS publish URLs can be created. **Failure only degrades, never
  blocks** (the room still works for browser sharing, it just can't hand out a WHIP URL).

The result is recorded in the node's `capabilities`, and every row on the "LiveKit nodes" page shows
whether Ingress is available. You can press "Check" to re-test at any time.

### 4. Configure the webhook (recommended)

It works without one; you just won't get server-side presence records (the front end still sees video
and head-count in real time, because that comes from LiveKit SDK events and doesn't depend on the
webhook).

The "LiveKit nodes" page shows a webhook URL **specific to each of your own nodes**, of the form:

```
https://your-site/api/webhooks/livekit/<nodeId>
```

Copy it into the LiveKit console → that project → **Settings → Webhooks**.

> Why the URL differs per node: a webhook's signature is signed with the sender's own API key/secret.
> In a multi-node setup you have to know which node sent it *from the URL* before you can pick the
> right key to verify with. That's what the `nodeId` in the path is for.

### 5. Verify by creating a room

Go back to the "Rooms" page and create a room, picking the node you just connected. Once inside:

- The "Share from the browser" button → publishes without installing OBS
- The "OBS publish URL" panel → press "Generate publish URL" to get a Server + Bearer Token
- The "OBS publishing" switch at the top of the same panel → when the owner turns it off, this room
  stops accepting WHIP streams

## Option 2 · Self-hosted LiveKit

### ⚠️ Read this first or you'll waste the effort

**A self-hosted `livekit-server` does not include Ingress.** Ingress is a separate service that talks
to livekit-server through Redis. Which means:

- Only **sharing the screen from a browser** → no Ingress needed, a livekit-server is enough
- Wanting **OBS/WHIP publishing** → you must additionally deploy the Ingress service + Redis, and
  configure `whip_base_url` on the livekit-server side to point at it

This site detects the unavailable Ingress during the health check and says plainly in the room UI that
"no OBS publish URL can be issued".

### Spinning one up for local development

```bash
livekit-server --dev --bind 0.0.0.0
```

Install: macOS `brew install livekit`; Linux `curl -sSL https://get.livekit.io | bash`;
Windows, download from GitHub Releases.

`--dev` mode uses the fixed credentials **`devkey` / `secret`** and is only suitable locally. When
connecting it here, use `ws://localhost:7880` as the URL (this site's URL validation accepts `ws://`
specifically for self-hosted and internal networks).

### Production deployment

There's an official config generator, which saves a lot over hand-writing the config:

```bash
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate
```

It produces a directory for the domain you enter, containing `docker-compose.yaml`, `livekit.yaml`,
`caddy.yaml`, `redis.conf` and a startup script.

The key entries in `livekit.yaml`:

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true      # discovers the real public IP via STUN in cloud environments
redis:
  address: redis:6379        # strongly recommended in production
keys:
  APIyourkey: your_secret_here   # simply a key: secret mapping
turn:
  enabled: true
  domain: turn.example.com   # must match the certificate
  tls_port: 443              # use 443 when there's no load balancer in front
```

`keys:` really is just a mapping table; there's no dedicated generation command — make up a
sufficiently random secret yourself:

```bash
openssl rand -base64 32
```

Ports you need to open:

| Port | Protocol | Purpose |
| --- | --- | --- |
| 7880 | TCP | Signalling (put HTTPS/TLS termination in front) |
| 7881 | TCP | TCP fallback for WebRTC media |
| 50000–60000 | UDP | WebRTC media |
| 3478 or 5349 | TCP | Built-in TURN over TLS (set 443 when there's no LB) |
| 443 | UDP | Optional TURN/UDP, for punching through strict firewalls |
| 6789 | TCP | Optional Prometheus metrics |

Two easy traps:

- **A CA-issued certificate is required**; self-signed does not work. The endpoint looks like
  `wss://livekit.example.com`.
- **Use host networking under Docker**, not per-port bridge mappings, or the media port range breaks.

### Deploying Ingress (only needed for OBS publishing)

- A separate service; **its Redis address must be the same one livekit-server uses**
- **≥ 4 CPU / 4 GB RAM** recommended per instance
- Ports: RTMP `1935/TCP`, WHIP `8080/TCP`, WHIP over UDP `7885/UDP`
- Config keys: `api_key`, `api_secret`, `ws_url`, `redis`
  (or the `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL` environment variables)
- **You also have to set `whip_base_url` on the livekit-server side** (add `rtmp_base_url` too if you
  want RTMP), otherwise the server can't produce an ingress URL
- Multiple instances need a load balancer: TCP LB for RTMP, HTTP reverse proxy for WHIP

The good news: **WHIP passthrough (bypass transcoding) barely uses CPU** — the official wording is
"a WHIP session with transcoding bypassed consumes minimal resources". This site uses passthrough by
default (`enableTranscoding: false`), so a self-hosted Ingress machine is under far less strain than
you'd expect. What actually eats CPU is RTMP and WHIP with transcoding on, and that grows linearly
with resolution and layer count.

## Configuring OBS

Once you have the publish URL:

1. OBS → Settings → Stream → **Service: `WHIP`**
2. **Server** = the Server from the panel
3. **Bearer Token** = the Bearer Token from the panel (WHIP's name for the stream key)

If no URL can be generated, or the stream keeps getting cut, first check whether the owner turned off
the "OBS publishing" switch at the top of the panel.

WHIP passthrough has no server-side simulcast. For multiple quality levels you have to enable it
yourself in **OBS 32.1.0+** (1–4 layers are supported).

## Node connection FAQ

| Symptom | Cause / fix |
| --- | --- |
| Entered the URL as `https://` | No need to change it; this site converts to `wss://` automatically and also strips extra paths and trailing slashes |
| Save reports "can't connect or credentials invalid" | The `listRooms` probe failed. Check that the URL belongs to that project, that the key/secret are a matching pair, and that the secret was copied in full |
| Ingress shows "—" / unavailable | Cloud: Ingress isn't enabled on the project, or Ingress concurrency is full (the free tier only allows 2). Self-hosted: Ingress isn't deployed, or `whip_base_url` isn't set |
| These credentials are already connected | The same user + same URL + same key may only be connected once; find the existing entry in the list |
| All requests suddenly fail | The free tier is exhausted. **Going over fails outright and is never billed** — wait for next month or switch nodes |
| Lost the secret | Recreate the key in the LiveKit console, come back here and use "Rotate keys" (the new credentials are health-checked before anything is written) |

---

## Architecture

```
Browser ──── Next.js on Vercel ──── Neon Postgres
  │          (auth / rooms / members / token signing)
  │                 │
  │ WebRTC          │ server SDK (with the credentials of the room's own node)
  │ share/watch     ▼
  └────────► LiveKit node A / B / C …        ← media plane; a room lives on exactly one node
                    ▲
                    │ WHIP (passthrough, no transcoding)
                  OBS
```

**The two publish routes are separate.** The browser's "Share my screen" passes through Next.js once to
get a token, after which the video **connects straight to LiveKit** (`getDisplayMedia` → WebRTC),
touching neither Vercel nor Ingress; the OBS route requires an ingress to be created on the server
first, and then OBS pushes WHIP to LiveKit. So the "OBS publishing" switch only closes the latter —
turn it off and browser sharing keeps working.

| Path | Purpose |
| --- | --- |
| `src/db/schema.ts` | 12 tables. `livekit_nodes` is the heart of the whole architecture |
| `src/lib/livekit.ts` | Node → SDK client, token signing, WHIP ingress creation, credential health checks |
| `src/lib/nodes.ts` | Node selection and the "who may use which node" decision |
| `src/lib/rooms.ts` | Membership checks (`requireMember` / `requireRoomOwner`) |
| `src/lib/invites.ts` | Issuing invite links and redeeming them atomically |
| `src/lib/crypto.ts` | AES-256-GCM encryption of credentials |
| `src/lib/site-settings.ts` | Site-level policy (currently just "allow sign-ups"), including the account-creation guard |
| `src/lib/app-config.ts` | Reads and writes the global `app_config` KV table |
| `src/lib/brand.ts` | Site name / company / copyright line, written once for the whole site |
| `src/i18n/` | Seven language catalogs plus locale resolution (cookie → Accept-Language → English) |
| `src/lib/bootstrap.ts` | Startup bootstrap: create the admin, provision the key. Lazy and idempotent |
| `src/app/api/rooms/[code]/token/route.ts` | Where authorisation converges |
| `src/app/api/rooms/[code]/route.ts` | Room detail, the OBS gate (PATCH), closing a room |
| `src/app/api/webhooks/livekit/[nodeId]/route.ts` | Presence detection, signature verified per node |
| `src/app/api/health/route.ts` | Configuration diagnostics, the entry point for troubleshooting |

## Interface

Its own design system, with no UI framework dependency and no Tailwind —
just CSS custom properties plus a thin layer of React primitives.

| Path | Purpose |
| --- | --- |
| `src/styles/tokens.css` | Every design variable (`--mx-*`). Light lives on `:root`, dark on `[data-theme="dark"]` |
| `src/styles/base.css` | Reset + typography utilities |
| `src/styles/components.css` | Primitive styles (buttons, forms, cards, tables, modals…) |
| `src/styles/shell.css` | App shell: top bar, sidebar, status bar, language picker |
| `src/styles/pages.css` | Page-level compositions: sign-in page, stat tiles, video stage |
| `src/styles/landing.css` | The landing page (`/`). The only outward-facing page; see below |
| `src/ui/` | React primitives; they consume tokens only and never hard-code a colour or size |
| `src/components/AppShell.tsx` | Top bar + collapsible sidebar + main area + status bar; below 1024px the sidebar becomes a drawer |
| `src/components/LanguageSwitcher.tsx` | The language dropdown, immediately left of the theme toggle |
| `src/components/BrandMark.tsx` | The brand mark (isometric cube + upward signal); see below |
| `src/lib/theme.ts` | Theme persistence (system / light / dark) + the anti-flash bootstrap script |

Four deliberate trade-offs:

- **The theme is settled before the first paint.** `themeBootstrapScript` is inlined into `<head>` and
  stamps `data-theme` onto `<html>` before anything is painted, so there's never a flash of white.
- **The theme follows the system by default.** The stored value is a *preference*
  (`system` / `light` / `dark`), and only `data-theme` on `<html>` holds a resolved colour — those two
  have to stay separate, or "follow the system" has nowhere to live.
- **The video stage is permanently dark.** `--mx-stage-bg` is near-black in both themes — a bright
  frame around the video changes how you read the video itself.
- **The landing page carries its own type scale.** `landing.css` declares a small set of `--land-*` at
  the top (hero sizes, section rhythm), because `--mx-font-size-display` is 30px — right for a page
  title, far too small for a hero. Colour, radius and shadow still all go through `--mx-*`.

### Languages

The interface ships in **Simplified Chinese, Traditional Chinese, English, French, Russian, Japanese
and Vietnamese**. Three decisions worth knowing:

- **The language is resolved on the server**: the `mxds.lang` cookie (an explicit choice) →
  `Accept-Language` (i.e. follow the system) → English as the fallback. It has to be the server,
  because `<html lang>` and the first painted frame must already be correct — reading
  `navigator.language` on the client would flash the wrong language on every load.
- **Every catalog is type-checked against the English one.** `src/i18n/messages/en.ts` defines the key
  set; the other six are declared as `Messages`, so a missing or misspelled key fails
  `npm run typecheck` instead of rendering a bare key in the UI. Placeholders are `{name}`; inline
  emphasis in copy is written as `**bold**` / `` `code` `` and rendered by `<RichText>` — that keeps
  markup out of the catalogs so translators never touch JSX.
- **API error messages are message keys, not prose.** Route handlers throw keys like
  `api.node.duplicate`, and the `route()` wrapper (`src/lib/api-route.ts`) translates once, using the
  language of the request that caused the error. Same for zod validation messages, so
  `src/lib/validation.ts` stays a pure, dependency-free data module.

The language picker sits immediately left of the theme toggle, in both the app shell's top bar and the
landing bar. On phones the landing bar hides it: there the bar's job is the mark, the wordmark and the
GitHub link (see below), and the sign-in page keeps its own picker in the corner so an unrecognised
system language is never a dead end.

### The landing page

`/` is a page about the project, not a router: top bar + hero + publish routes + free-tier reality
check + features + quick start + desktop-app teaser + Q&A + closing CTA. When signed in the CTA becomes
"Open the console"; otherwise "Sign in / Sign up".

**It has to open even when the database isn't configured** — that's precisely when someone most needs
to read it. So a failure from `currentUser()` is swallowed and it renders as signed-out
(`src/app/page.tsx`) rather than letting the landing page 500 along with everything else.

The Q&A uses native `<details>` rather than a hand-rolled accordion: the page is a server component, it
has to expand with JS off, and the browser already gets keyboard and screen-reader behaviour right.

**The top bar drops items by priority rather than at a fixed breakpoint.** The wordmark is a fixed 23
characters, but "Sign in / Sign up" is nearly twice as wide in French as in Chinese, so any hard-coded
breakpoint would cut too early or too late in some languages. `src/components/LandingBarFit.tsx`
measures instead: when the bar can't fit everything, the theme toggle and the sign-in CTA go **together**,
guaranteeing the mark, the full wordmark and the GitHub link stay. On a desktop nothing is ever dropped.

The desktop-app section is about `MX-Desktop-Sharing-APP` (self-hosted, end-to-end encrypted chat +
screen sharing). **Not a line of it has been written**, so that whole section is phrased with
"considering" and "planning to" and carries a "concept stage" badge — writing it as an accomplished
fact on a landing page is just a false promise. Both CTAs point at this repository's issues and
discussions; the project has no separate email address or contact form.

### The brand mark

An isometric cube (the LiveKit node a room is bound to) with a corner lifted above it (the stream being
pushed out). Both shapes share the same 2:1 isometric slope, so the lifted corner's two arms are exactly
parallel to the cube's top edges.

`src/components/BrandMark.tsx` is the single source of truth; the three faces take their colours from
`--mx-mark-{top,right,left,signal}`, defined per theme — using opacity for light and shade would invert
the lighting on a dark background. `public/` holds standalone files too: `logo-mark.svg` (light ground),
`logo-mark-dark.svg`, `logo-tile.svg` (with a plate, for favicons / app icons), `logo-glyph.svg`
(monochrome) and `logo-lockup.svg` (horizontal combination).


## Authorisation model

`requireMember` has to pass before a token is signed. The grant that comes out is:

```ts
{ roomJoin: true, room: <that room's code>, canSubscribe: true, canPublish: <by role> }
```

`room` can only hold one room name, so this token physically cannot be used to subscribe to another
room. It grants no `roomCreate` / `roomAdmin` / `roomList` — rooms are created by the server.

Removing someone requires three things at once, or the removal leaks (all implemented): delete the
member row (so no new token can be signed), `RemoveParticipant` (drop the current connection, because an
already-issued token stays valid until it expires), and delete their ingress (otherwise their OBS can
keep pushing into the room).

The "OBS publishing" switch is the same story — flipping a flag in the database doesn't close anything,
because that stream key is still valid on the LiveKit side. So when it closes, two things happen to every
live ingress in the room: `DeleteIngress` (delete the resource so an old key can't connect any more) and
`RemoveParticipant` (kick the `obs:` participant out so everyone stops receiving its video immediately —
the docs don't say whether DeleteIngress also terminates an in-flight session, and that's not worth
betting on); then the row is marked revoked, and finally the flag is written to block new generation
requests. The cost is that everyone has to generate a new URL after it's reopened: LiveKit does have a
soft close that keeps the key, `UpdateIngress(enabled=false)`, but the JS server SDK's `updateIngress`
doesn't expose `enabled` (it rebuilds the request from a fixed field list and drops anything extra), so
using it would mean hand-assembling a Twirp request. Better to make people swap a key once than to ship
a switch that "looks off but isn't".

## How long does the free tier last

This is the entire reason for letting users bring their own node. LiveKit Cloud's free Build plan is
metered per **project**; going over fails outright and is never billed, and multiple free projects under
one account **share** the allowance:

- 5,000 WebRTC participant minutes
- 50 GB egress bandwidth
- 100 concurrent participants, 2 concurrent Ingress / Egress each
- 60 transcode minutes (**this is exactly why WHIP and not RTMP** — RTMP input always transcodes, which
  is only an hour a month)

The key point: ingress / egress participants **don't count** toward connection minutes, so the only
thing consuming them is viewers.

Worked out by viewer bitrate (50 GB of egress is the main bottleneck):

| Publish bitrate | Traffic per viewer minute | Viewer minutes on 50 GB | In viewer hours |
| --- | --- | --- | --- |
| 4 Mbps (1080p high bitrate) | 30 MB | 1,667 | ≈ 28 h |
| 2.5 Mbps (1080p typical) | 18.75 MB | 2,667 | ≈ 44 h |
| 1.5 Mbps (720p) | 11.25 MB | 4,444 | ≈ 74 h |
| 0.8 Mbps | 6 MB | 5,000 (hits the minute cap) | ≈ 83 h |

**About 1.33 Mbps is the dividing line**: above it the 50 GB of bandwidth runs out first; below it the
5,000 minutes do.

Translated into "how long can I actually run a meeting" — divide the viewer hours by the number of
viewers:

- 1 sharing + 1 watching, 1080p: about **44 hours/month**
- 1 sharing + 3 watching, 1080p: about **15 hours/month**
- 1 sharing + 9 watching, 1080p: about **5 hours/month**

Conclusion: a single free project is a **pilot allowance, not a product allowance**. That's why this
project makes nodes a first-class citizen — every user connects their own LiveKit Cloud project, and the
allowance goes from "one for the site owner" to "one each". The built-in node is only there as a
fallback, so do set `maxRooms` on it.

## Known limitations

- WHIP passthrough has **no server-side simulcast**; you need to enable multiple layers yourself in
  OBS 32.1.0+.
- Publishing from OBS with a self-hosted LiveKit requires deploying Ingress + Redis separately (see
  option two above).
- There is no key-rotation tool: once `CREDENTIAL_ENCRYPTION_KEY` is replaced, every stored node
  credential becomes undecryptable.
- There is no quota dashboard; you have to estimate from the table above.

The reasoning behind the trade-offs and the rest of the to-do list are in [TASKS.md](TASKS.md).

## References

- [LiveKit quotas and limits](https://docs.livekit.io/cloud/quotas-and-limits/)
- [LiveKit pricing](https://livekit.io/pricing)
- [Self-hosting](https://docs.livekit.io/transport/self-hosting/deployment/) · [Running locally](https://docs.livekit.io/home/self-hosting/local/) · [Ingress](https://docs.livekit.io/home/self-hosting/ingress/)
