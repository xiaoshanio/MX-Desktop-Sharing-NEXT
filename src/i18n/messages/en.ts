/**
 * English — **the source of truth for the key set**.
 *
 * `Messages` (see ./types) is derived from this object, so every other catalog is
 * type-checked against it: a missing or misspelled key fails `npm run typecheck`
 * instead of silently rendering a raw key in the UI.
 *
 * Conventions:
 *   - Keys are flat dotted paths. Flat beats nested here — it makes `t()` fully
 *     type-checked with one `keyof`, and it makes the seven catalogs line-diffable.
 *   - `{name}` placeholders are substituted by `t(key, vars)`.
 *   - `**bold**`, `*italic*` and `` `code` `` are rendered by <RichText>. Only strings
 *     actually passed through <RichText> may use them.
 *   - Counts are written as "Label: {n}" rather than "{n} things" on purpose: it reads
 *     correctly for every number, so no catalog needs plural rules (Russian has three).
 */

const en = {
  /* ============================================================
     Brand
     ============================================================ */
  "brand.tagline": "One node per room, one publish URL per person",
  "brand.subtitle": "LiveKit multi-node",

  /* ============================================================
     Shared verbs and labels
     ============================================================ */
  "common.cancel": "Cancel",
  "common.confirm": "OK",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.delete": "Delete",
  "common.refresh": "Refresh",
  "common.working": "Working…",
  "common.loading": "Loading",
  "common.loadingEllipsis": "Loading…",
  "common.close": "Close",
  "common.gotIt": "Got it",
  "common.errorTitle": "Something went wrong",
  "common.copied": "Copied",
  "common.copy": "Copy {label}",
  "common.reveal": "Show {label}",
  "common.hide": "Hide {label}",
  "common.copyPlain": "Copy",
  "common.revealPlain": "Show",
  "common.hidePlain": "Hide",
  "common.notifications": "Notifications",
  "common.dismissNotification": "Dismiss notification",
  "common.retry": "Retry",
  "common.unlimited": "Unlimited",
  "common.never": "Never",
  "common.system": "System",
  "common.dash": "—",

  /* ============================================================
     Theme + language switchers
     ============================================================ */
  "theme.label": "Theme",
  "theme.system": "Follow system",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.nextSystem": "Theme: dark — switch to following the system",
  "theme.nextLight": "Theme: following the system — switch to light",
  "theme.nextDark": "Theme: light — switch to dark",
  "lang.label": "Language",
  "lang.change": "Change language",

  /* ============================================================
     App shell
     ============================================================ */
  "shell.openNav": "Open navigation",
  "shell.closeNav": "Close navigation",
  "shell.mainNav": "Main navigation",
  "shell.workspace": "Workspace",
  "shell.expandSidebar": "Expand sidebar",
  "shell.collapseSidebar": "Collapse sidebar",
  "shell.back": "Back",
  "shell.online": "Connected",
  "shell.offline": "Offline",
  "shell.nav.rooms": "Rooms",
  "shell.nav.nodes": "LiveKit nodes",
  "shell.nav.me": "Profile",
  "shell.nav.admin": "Admin",
  "shell.role.admin": "Admin",
  "shell.role.user": "User",
  "shell.menu.profile": "Profile",
  "shell.menu.admin": "Admin",
  "shell.menu.logout": "Sign out",
  "shell.menu.loggingOut": "Signing out…",
  /* ============================================================
     Role / health labels (lib/labels.ts)
     ============================================================ */
  "label.role.owner": "Owner",
  "label.role.publisher": "Can publish",
  "label.role.viewer": "View only",
  "label.health.unknown": "Not checked",
  "label.health.ok": "Healthy",
  "label.health.bad": "Failing",

  /* ============================================================
     Sign in / sign up
     ============================================================ */
  "auth.subtitle":
    "One node per room, one publish URL per person. Push your screen to the room from OBS or straight from the browser.",
  "auth.home": "Back to home",
  "auth.tabs": "Sign in or sign up",
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.closed": "Sign-ups are disabled on this site — existing accounts can still sign in.",
  "auth.oauthContinue": "Continue with {provider}",
  "auth.orEmail": "or use email",
  "auth.methods": "Sign-in method",
  "auth.methodPassword": "Password",
  "auth.methodCode": "Email code",
  "auth.email": "Email",
  "auth.displayName": "Display name",
  "auth.displayNameHint": "The name shown in a room's member list.",
  "auth.password": "Password",
  "auth.code": "Email code",
  "auth.codePlaceholder": "6 digits",
  "auth.resendIn": "Resend ({seconds}s)",
  "auth.resend": "Didn't get it? Send again",
  "auth.submitBusy": "Working…",
  "auth.submitRegister": "Create account",
  "auth.submitVerify": "Verify and sign in",
  "auth.submitSendCode": "Send code",
  "auth.submitLogin": "Sign in",
  "auth.codeSent": "Code sent to {email}. It is valid for 10 minutes.",
  "auth.oauthFailedTitle": "Third-party sign-in failed",
  "auth.footRegister": "Signing up gives you your own workspace and your own LiveKit nodes.",
  "auth.footLogin": "Got an invite link? Open it, sign in, and you'll join the room automatically.",
  /* ============================================================
     Invite landing page
     ============================================================ */
  "join.working": "Joining the room",
  "join.workingBody": "Checking the invite link — this only takes a moment.",
  "join.failed": "Can't join",
  "join.failedBody": "This invite link could not be redeemed.",
  "join.checking": "Checking the invite link…",
  "join.failedHint":
    "The link may have expired, been revoked, or hit its usage limit. Ask the room owner for a new one.",
  "join.backToConsole": "Back to the console",

  /* ============================================================
     Turnstile (human verification)
     ============================================================ */
  "turnstile.blocked":
    "Couldn't load the verification script from challenges.cloudflare.com. The network may be blocking it, or an ad blocker is in the way.",
  "turnstile.noInit": "The verification script loaded but failed to initialise. Reload the page.",
  "turnstile.renderFailed": "Human verification failed to render: {message}",
  "turnstile.initFailed": "Human verification failed to initialise. Reload the page.",
  "turnstile.initFailedCode": "Human verification failed to initialise (error {code}).",
  "turnstile.badDomain":
    "This Site Key is not allowed on {hostname} (error {code}). In Cloudflare → Turnstile → this site's settings, add {hostname} to Domains; add localhost separately for local development.",
  "turnstile.badKey":
    "Invalid Site Key (error {code}). Make sure you pasted the Site Key and not the Secret Key — they are easy to swap.",
  "turnstile.badBrowser":
    "This browser isn't supported (error {code}). Try a recent Chrome, Edge or Firefox.",
  "turnstile.timeout": "Verification timed out (error {code}). Give it another try.",
  "turnstile.execFailed":
    "Human verification failed to run (error {code}). A page reload usually fixes it; if it keeps happening the problem is on Cloudflare's side.",
  "turnstile.staleScript": "api.js is out of date (error {code}). Clear the browser cache and retry.",
  /* ============================================================
     Client-side error humanising (lib/error-text.ts)
     ============================================================ */
  "err.signalConnection":
    "Can't reach the room's media server. Check your network, or confirm this LiveKit node is still up.",
  "err.disconnected": "The connection to the room dropped. Reconnecting…",
  "err.roomFull": "The room is full.",
  "err.badToken": "The access token is invalid or expired. Reloading the page issues a new one.",
  "err.permissionDenied": "You don't have permission to do that.",
  "err.serverUnavailable": "The media server is temporarily unavailable. Try again shortly.",
  "err.quota": "This LiveKit node has run out of quota.",
  "err.screenShareDenied":
    "The browser refused the screen-share request. Allow it in the site permissions next to the address bar.",
  "err.noCaptureDevice": "No capture device is available, or another program is holding it.",
  "err.unsupportedBrowser": "This browser doesn't support that. Try Chrome or Edge.",
  "err.network": "The network request failed. Check your connection.",
  "err.aborted": "The request was interrupted.",
  "err.timeout": "The request timed out. Try again shortly.",
  "err.cors":
    "The video source doesn't allow cross-origin reads from this site (CORS). Enable it on the server hosting the video.",
  "err.range": "The video source doesn't support Range requests, so it can't be streamed while downloading.",
  "err.codec":
    "The browser can't decode this format. Video must be H.264/HEVC, audio AAC/FLAC/Opus.",
  "err.unknown": "The operation failed for an unknown reason.",
  "err.httpFailed": "Request failed (HTTP {status})",
  /* ============================================================
     Dashboard (room list)
     ============================================================ */
  "dash.loading": "Loading rooms…",
  "dash.heading": "Rooms",
  "dash.refreshed": "Refreshed",
  "dash.stat.rooms": "Rooms: {count}",
  "dash.stat.active": "Active: {count}",
  "dash.stat.online": "Online: {count}",
  "dash.stat.nodes": "Usable nodes: {count}",
  "dash.title": "Rooms you're in",
  "dash.subtitle":
    "Click a card to enter. Each room is bound to one LiveKit node, and its media traffic only goes through that node.",
  "dash.create": "New room",
  "dash.empty.title": "No rooms yet",
  "dash.empty.action": "Create your first room",
  "dash.empty.body":
    "Create a room and you get your own OBS publish URL — or just share your screen straight from the browser. If someone gave you a room code, use the search box above.",
  "dash.created": "Room created",
  "dash.find.placeholder": "Enter a room code, or search your rooms",
  "dash.find.label": "Enter a room code or search rooms",
  "dash.find.clear": "Clear",
  "dash.find.noMatch":
    "No matching room. Room codes are 10 lowercase letters and digits — check for a typo.",
  "dash.find.node": "Node {name}",
  "dash.find.closed": "Closed",
  "dash.find.direct": "Go straight to",
  "dash.find.directHint": "This isn't a room you've joined — you can only get in if you were invited.",
  "dash.card.active": "Active",
  "dash.card.closed": "Closed",
  "dash.card.copyCode": "Copy room code",
  "dash.card.codeCopied": "Room code copied",
  "dash.card.clipboardBlocked": "The browser blocked clipboard access — select the text and copy it manually.",
  "dash.card.online": "{online}/{total} online",
  "dash.card.node": "Node {name}",
  "dash.card.nodeBuiltin": " (built-in)",
  "dash.card.enter": "Enter",
  "dash.new.title": "Create a room",
  "dash.new.busy": "Creating…",
  "dash.new.name": "Room name",
  "dash.new.namePlaceholder": "Weekly demo",
  "dash.new.node": "Which node to use",
  "dash.new.nodeBuiltin": "{name} (built-in · shared quota)",
  "dash.new.nodeMine": "{name} (mine)",
  "dash.new.nodeNoIngress": " · no OBS publishing",
  "dash.new.nodeNew": "+ Connect a new set of LiveKit credentials…",
  "dash.new.hintNoIngress":
    "This node's Ingress is unavailable, so the room won't offer an OBS publish URL. Browser sharing still works.",
  "dash.new.hintFixed": "A room's node can't be changed after it's created.",
  "dash.new.noNodesTitle": "No usable node",
  "dash.new.noNodesBody":
    "Pick \"Connect a new set of LiveKit credentials\" above, or add one on the LiveKit nodes page first.",
  /* ============================================================
     LiveKit credential fields (shared by "add node" and "create room")
     ============================================================ */
  "node.needCreds": "You need a LiveKit URL / API Key / API Secret",
  "node.guideHide": "Hide the guide",
  "node.guideShow": "I don't have one — how?",
  "node.guide.title": "Open a free LiveKit Cloud node in three minutes",
  "node.guide.step1a": "Open",
  "node.guide.step1b": "and sign up. The free Build plan needs no card.",
  "node.guide.step2": "Create a project, any name. You'll get a `wss://xxx.livekit.cloud` URL.",
  "node.guide.step3":
    "Go to Settings → Keys → create an API Key. You'll get an `API Key` and an `API Secret`. The secret is shown once — copy it now.",
  "node.guide.step4":
    "Put those three values below. Before saving, this site calls the LiveKit API for real to verify them; wrong values are never stored.",
  "node.guide.note":
    "Why bring your own node: the free tier is metered per project (about 5,000 WebRTC participant minutes + 50 GB egress per month; over the limit requests simply fail and nothing is charged). With your own node you burn your own quota and compete with nobody.",
  "node.field.name": "Node name",
  "node.field.namePlaceholder": "My LiveKit",
  "node.field.nameHint": "Just for you — call it anything.",
  "node.field.url": "LiveKit URL",
  "node.field.urlHint": "Pasting an https:// URL is fine too — it's converted to wss:// for you.",
  "node.field.secretHint": "Encrypted at rest; no endpoint ever returns it again.",

  /* ============================================================
     LiveKit nodes page
     ============================================================ */
  "nodes.loading": "Loading nodes…",
  "nodes.heading": "LiveKit nodes",
  "nodes.stat.total": "Nodes: {count}",
  "nodes.stat.mine": "Mine: {count}",
  "nodes.stat.healthy": "Healthy: {count}",
  "nodes.subtitle":
    "Connect your own LiveKit credentials and your rooms burn your own free tier instead of competing for someone else's.",
  "nodes.add": "Connect a node",
  "nodes.empty.title": "No nodes yet",
  "nodes.empty.action": "Connect my first node",
  "nodes.empty.body":
    "LiveKit Cloud's free Build plan needs no card and takes three minutes. On save, this site calls the API for real to verify the credentials — wrong ones are never stored.",
  "nodes.badge.builtin": "Built-in",
  "nodes.badge.mine": "Mine",
  "nodes.badge.theirs": "Someone else's",
  "nodes.badge.disabled": "Disabled",
  "nodes.ingressOk": "Ingress available",
  "nodes.ingressBad": "Ingress unavailable",
  "nodes.check": "Check",
  "nodes.checking": "Checking…",
  "nodes.rotate": "Rotate keys",
  "nodes.delete": "Delete node",
  "nodes.webhookHint":
    "In the LiveKit console go to Settings → Webhooks and paste the URL below. Member presence is updated through it.",
  "nodes.webhookLabel": "Webhook URL",
  "nodes.saved": "Node saved — credentials verified.",
  "nodes.rotated": "Keys for \"{name}\" updated; the new credentials passed verification.",
  "nodes.deleteTitle": "Delete node",
  "nodes.deleteBody":
    "Delete \"{name}\"? Its active rooms have to be closed first, otherwise the delete is rejected.",
  "nodes.add.title": "Connect my LiveKit node",
  "nodes.add.busy": "Verifying and saving…",
  "nodes.add.submit": "Save node",
  "nodes.rotate.title": "Update the keys for \"{name}\"",
  "nodes.rotate.busy": "Verifying and updating…",
  "nodes.rotate.submit": "Update keys",
  "nodes.rotate.note":
    "The new credentials are used against the LiveKit API before anything is written. If verification fails nothing changes and the old keys keep working.",
  "nodes.rotate.newKey": "New API Key",
  "nodes.rotate.newSecret": "New API Secret",
  /* ============================================================
     Profile page
     ============================================================ */
  "me.loading": "Loading your profile…",
  "me.heading": "Profile",
  "me.subtitle": "This edits the member card people see on the left of the video area.",
  "me.preview.title": "Card preview",
  "me.preview.desc":
    "This is how you look to everyone else once you're in a room. With no banner uploaded it falls back to the colour assigned to your account.",
  "me.preview.you": "You",
  "me.avatar.title": "Avatar",
  "me.avatar.desc": "Shown square and cropped to a circle. The browser scales it to 256px before upload.",
  "me.avatar.current": "Current avatar",
  "me.banner.title": "Card banner",
  "me.banner.desc": "The strip across the top of the card. Scaled to 960×540 and centre-cropped.",
  "me.pick": "Choose an image",
  "me.uploading": "Uploading…",
  "me.reset": "Reset to default",
  "me.avatarSaved": "Avatar updated",
  "me.bannerSaved": "Card banner updated",
  "me.avatarReset": "Avatar reset to the default.",
  "me.bannerReset": "Banner reset to the default colour.",
  "me.accent.title": "Card colour",
  "me.accent.desc": "Used when no banner image is set. A shade is assigned to your account by default.",
  "me.accent.saved": "Colour updated.",
  "me.accent.iris": "Iris",
  "me.accent.azure": "Azure",
  "me.accent.teal": "Teal",
  "me.accent.lime": "Lime",
  "me.accent.amber": "Amber",
  "me.accent.rose": "Rose",
  "me.accent.magenta": "Magenta",
  "me.accent.slate": "Slate",
  "me.account.title": "Account",
  "me.account.desc": "Your display name appears in member lists and on your card.",
  "me.account.nameSaved": "Display name updated.",
  "me.account.emailVerified": "Email verified",
  "me.account.emailUnverified": "Email not verified",
  "me.account.hasPassword": "Password set",
  "me.account.noPassword": "Third-party / email code only",
  "me.tour.title": "Onboarding tip",
  "me.tour.desc": "The \"where's my publish URL\" tip shown the first time you enter a room.",
  "me.tour.reset": "Show the tip again",
  "me.tour.done": "Reset — the tip will show once more next time you enter a room",
  /* ============================================================
     Admin — shell, nodes, users
     ============================================================ */
  "admin.loading": "Loading site-wide data…",
  "admin.heading": "Admin",
  "admin.stat.nodes": "Nodes: {count}",
  "admin.stat.users": "Users: {count}",
  "admin.stat.admins": "Admins: {count}",
  "admin.subtitle": "Every node and user on the site. Admins only.",
  "admin.tabs": "Admin sections",
  "admin.tab.nodes": "Nodes",
  "admin.tab.users": "Users",
  "admin.tab.services": "Third-party services",
  "admin.tab.site": "Site settings",
  "admin.promote.title": "Make this the built-in node",
  "admin.promote.confirm": "Make built-in",
  "admin.promote.body":
    "Make \"{name}\" the site-wide built-in node? The current built-in node is demoted to a regular one, and every user without their own credentials will use this one from now on.",
  "admin.nodes.emptyTitle": "No nodes yet",
  "admin.nodes.emptyBody":
    "Add one from the LiveKit nodes page with \"Connect a node\", then come back and make it the site-wide built-in node.",
  "admin.nodes.title": "Nodes",
  "admin.nodes.desc":
    "The built-in node is the one shared site-wide — users can create rooms without bringing credentials, and its quota pays for it. Any node can be promoted; there is only ever one.",
  "admin.nodes.col.node": "Node",
  "admin.nodes.col.kind": "Kind",
  "admin.nodes.col.activeRooms": "Active rooms",
  "admin.nodes.col.enabled": "Enabled",
  "admin.nodes.col.public": "Public",
  "admin.nodes.col.maxRooms": "Room limit",
  "admin.nodes.checkFailed": "Health check failed",
  "admin.nodes.kindBuiltin": "Built-in",
  "admin.nodes.kindUser": "User",
  "admin.nodes.enableAria": "Enable {name}",
  "admin.nodes.publicAria": "Make {name} public",
  "admin.nodes.maxRoomsAria": "Room limit for {name}",
  "admin.nodes.maxRoomsPlaceholder": "Unlimited",
  "admin.nodes.makeBuiltin": "Make built-in",
  "admin.users.title": "Users",
  "admin.users.desc": "A disabled account can't be issued a token, so it can't enter any room.",
  "admin.users.col.user": "User",
  "admin.users.col.role": "Role",
  "admin.users.col.status": "Status",
  "admin.users.me": "Me",
  "admin.users.admin": "Admin",
  "admin.users.user": "User",
  "admin.users.disabled": "Disabled",
  "admin.users.ok": "Active",
  "admin.users.demote": "Demote to user",
  "admin.users.promote": "Make admin",
  "admin.users.enable": "Enable",
  "admin.users.disable": "Disable",
  /* ============================================================
     Admin — site settings
     ============================================================ */
  "site.loading": "Loading site settings…",
  "site.openTitle": "Sign-ups are open",
  "site.closedTitle": "Sign-ups are closed — existing accounts can still sign in",
  "site.openBody":
    "Anyone can create an account: email + password, a first GitHub / Google sign-in, or a first email-code sign-in. All three create an account on the spot.",
  "site.closedBody":
    "All three account-creation paths are blocked and return \"sign-ups are disabled on this site\". Existing accounts are unaffected and can still use passwords, third-party sign-in and email codes. Note that invite links also require an account first — open this switch again to let new people in.",
  "site.card.title": "Sign-ups",
  "site.card.desc":
    "Controls whether strangers can create an account here. Enforced on the server (before a session is issued), not by hiding a button.",
  "site.switch.label": "Allow sign-ups",
  "site.switch.hint":
    "With this off: the register endpoint refuses outright; third-party sign-in only accepts already-linked accounts and rejects the rest on the spot; email-code sign-in behaves the same — existing accounts pass, new addresses no longer create one.",
  "site.opened": "Sign-ups are now open.",
  "site.closed": "Sign-ups are now closed.",

  /* ============================================================
     Admin — third-party services
     ============================================================ */
  "svc.loading": "Loading third-party service settings…",
  "svc.bannerTitle": "Secrets are encrypted in the database, not in environment variables",
  "svc.bannerBody":
    "These secrets are AES-256-GCM encrypted into `service_credentials`, and the master key can live outside the database (`CREDENTIAL_ENCRYPTION_KEY`) — a full database dump still can't be decrypted. No endpoint returns a plaintext secret; what you see below is a mask. Changes take effect immediately, with no redeploy.",
  "svc.notConfigured": "Not configured",
  "svc.enabled": "Enabled",
  "svc.disabled": "Disabled",
  "svc.callbackLabel": "Callback URL (paste it into the provider's console exactly)",
  "svc.callbackShort": "Callback URL",
  "svc.callbackHint":
    "Getting this wrong is the most common reason third-party sign-in fails — the provider rejects the authorisation request outright.",
  "svc.secretCurrent": "{hint} Current: {mask}. Leave blank to keep it.",
  "svc.secretKeepPlaceholder": "Blank = keep current",
  "svc.fromName": "Sender display name (optional)",
  "svc.fromNameHint": "The name recipients see, e.g. \"{app}\".",
  "svc.enableLabel": "Enabled",
  "svc.enableHintTurnstile": "With this off the sign-in page no longer asks for human verification.",
  "svc.enableHintResend": "With this off the sign-in page no longer offers \"email code\".",
  "svc.enableHintOauth": "With this off the sign-in page no longer shows this button.",
  "svc.saveChanges": "Save changes",
  "svc.removeConfig": "Delete configuration",
  "svc.savedToast": "{title} saved.",
  "svc.removedToast": "{title} deleted.",
  "svc.removeTitle": "Delete the {title} configuration",
  "svc.removeBodyTurnstile":
    "After deleting, sign-in, sign-up and code requests no longer ask for human verification. Continue?",
  "svc.removeBodyResend":
    "After deleting, email-code sign-in stops working and codes already sent can't be verified. Continue?",
  "svc.removeBodyOauth":
    "After deleting, this third-party sign-in button disappears. Anyone who linked with it and never set a password will be locked out — make sure they have another way in first.",
  /* ============================================================
     Admin — the four service forms
     ============================================================ */
  "svc.github.title": "GitHub sign-in",
  "svc.github.desc": "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.",
  "svc.github.publicLabel": "Client ID",
  "svc.github.publicHint": "The Client ID on the OAuth App page.",
  "svc.github.secretLabel": "Client Secret",
  "svc.github.secretHint":
    "Shown once at creation — after that not even GitHub can show it to you. Save it before leaving that page.",
  "svc.google.title": "Google sign-in",
  "svc.google.desc":
    "Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).",
  "svc.google.publicLabel": "Client ID",
  "svc.google.publicHint": "Looks like xxxxx.apps.googleusercontent.com.",
  "svc.google.secretLabel": "Client Secret",
  "svc.google.secretHint": "The client secret on the credential detail page.",
  "svc.turnstile.title": "Turnstile human verification",
  "svc.turnstile.desc":
    "Cloudflare dashboard → Turnstile → Add site. Once configured, sign-in, sign-up and code requests all ask for verification.",
  "svc.turnstile.publicLabel": "Site Key",
  "svc.turnstile.publicHint": "It ends up in the sign-in page's HTML — it is public by design.",
  "svc.turnstile.secretLabel": "Secret Key",
  "svc.turnstile.secretHint": "Used for server-side validation; it must never reach the front end.",
  "svc.resend.title": "Resend email service",
  "svc.resend.desc":
    "resend.com → API Keys. The sending domain must be verified in Resend or mail is rejected. Once configured, the sign-in page offers \"email code\".",
  "svc.resend.publicLabel": "Sender address",
  "svc.resend.publicHint":
    "Must belong to a domain verified in Resend, e.g. no-reply@your-domain.com.",
  "svc.resend.secretLabel": "API Key",
  "svc.resend.secretHint": "Looks like re_xxxxxxxx.",
  /* ============================================================
     Room — chrome, status bar, stage
     ============================================================ */
  "room.heading": "Room {code}",
  "room.entering": "Entering the room…",
  "room.fatalTitle": "Can't open this room",
  "room.fatal.emptyTitle": "No access",
  "room.fatal.back": "Back to the room list",
  "room.fatal.body":
    "Non-members are told the room doesn't exist — that's deliberate, so nobody can probe room codes one by one.",
  "room.backLabel": "Back to the room list",
  "room.action.share": "Share this room (invite link)",
  "room.action.members": "Members",
  "room.action.settings": "Room settings and publishing info",
  "room.action.newPlayer": "New sync player",
  "room.stat.code": "Room code {code}",
  "room.stat.node": "Node {name}",
  "room.stat.nodeBuiltin": " (built-in)",
  "room.stat.active": "Active",
  "room.stat.closed": "Closed",
  "room.stat.members": "Members: {count}",
  "room.closedTitle": "Room closed",
  "room.closedBody": "No more tokens can be issued; video and publishing are both unavailable.",

  "channel.rooms.title": "Channel Rooms",
  "channel.rooms.create": "Create Room",
  "channel.rooms.emptyTitle": "No rooms yet",
  "channel.rooms.emptyBody": "Channel admins can create rooms, each with its own sync player",
  "channel.rooms.creator": "Creator: {name}",
  "channel.rooms.backToList": "Back to room list",

  "room.stage.live": "Live",
  "room.stage.noSignal": "No signal",
  "room.stage.inRoom": "In room: {count}",
  "room.stage.onlySelected": "Showing one person only",
  "room.stage.gettingPermission": "Getting publish permission…",
  "room.stage.viewerOnly":
    "You're view-only — ask the owner to change your permission, or to turn on \"anyone can share\"",
  "room.stage.urlPlaceholder": "Enter playback URL",
  "room.stage.urlPlay": "Play",
  "room.stage.fullscreen": "Fullscreen",
  "room.stage.tagObs": "OBS",
  "room.stage.tagScreen": "Screen share",
  "room.stage.tagCamera": "Camera",
  "room.stage.idleSelectedTitle": "This person isn't sharing anything",
  "room.stage.idleTitle": "Nobody is publishing yet",
  "room.stage.idleSelectedBody": "Use \"Show everyone\" on the left to see the rest of the room.",
  "room.stage.idleBody": "As soon as a publisher connects the video appears here — no reload needed.",
  "room.offline.notConnected": "Not connected",
  "room.offline.connecting": "Connecting to the room…",
  "room.offline.closed": "Room closed",
  "room.offline.connectingBody": "Issuing an access token.",
  "room.offline.closedBody": "A closed room issues no tokens and accepts no publishing.",
  "room.share.busy": "Working…",
  "room.share.stop": "Stop sharing",
  "room.share.start": "Share my screen",
  "room.share.settings": "Share Settings",
  "room.share.quality": "Quality Parameters",
  "room.share.resolution": "Resolution",
  "room.share.frameRate": "Frame Rate",
  "room.share.bitrate": "Bitrate",
  "room.share.codec": "Codec",
  "room.share.codecAuto": "Auto",
  "room.share.codecVP8": "VP8 (Best Compatibility)",
  "room.share.codecVP9": "VP9 (High Efficiency)",
  "room.share.codecH264": "H.264 (Hardware Accelerated)",
  "room.share.codecAV1": "AV1 (Experimental)",
  "room.share.presets": "Presets",
  "room.share.presetPresentation": "Presentation (High Res, Low FPS)",
  "room.share.presetBalanced": "Balanced (Recommended)",
  "room.share.presetSmooth": "Smooth (High FPS)",
  "room.share.presetHQ": "High Quality (2K)",
  "room.share.presetCustom": "Custom",
  "room.share.applyPreset": "Apply Preset",
  /* ============================================================
     Room — participant rail + context menu
     ============================================================ */
  "rail.label": "People online",
  "rail.online": "Online: {count}",
  "rail.showAll": "Show everyone",
  "rail.empty": "Nobody is here yet.",
  "rail.obs": "OBS",
  "rail.you": "You",
  "rail.onlineTag": "Online",
  "rail.hasVideo": " · sharing",
  "rail.sharing": "Sharing their screen",
  "rail.sharingScreen": "Sharing screen",
  "rail.menu.ownerLocked": "Room owner — can't be changed or removed",
  "rail.menu.permission": "Permission",
  "rail.menu.current": " (current)",
  "rail.menu.kick": "Remove from room",
  "rail.menu.kickBan": "Remove and ban",
  "room.roleChanged": "Changed \"{name}\" to {role}",
  "room.kicked": "Removed \"{name}\"",
  "room.kickedBanned": "Removed \"{name}\" and added them to the ban list",
  "room.kick.titleBan": "Remove and ban",
  "room.kick.title": "Remove member",
  "room.kick.confirmBan": "Remove and ban",
  "room.kick.confirm": "Remove",
  "room.kick.bodyBan":
    "Remove \"{name}\" from the room and add them to the ban list? They're disconnected immediately, their publish URL is voided, and after that **not even an invite link gets them back in** until you unban them.",
  "room.kick.body":
    "Remove \"{name}\"? This also drops their connection and deletes their publish URL. Note: an invite link they still hold lets them return on their own — use \"Remove and ban\" to shut that door.",

  /* ============================================================
     Room — coach mark + first-visit tip
     ============================================================ */
  "room.coach.title": "Your publish URL lives here",
  "room.coach.body":
    "To see or regenerate the OBS publish URL later, click this gear in the top bar → \"Publishing\".",
  "room.tip.title": "Welcome — here's your publish URL",
  "room.tip.intro":
    "There are two ways to get video into this room: **\"Share my screen\"** above the video area (direct from the browser, one click), and the **OBS publish URL** below.",
  "room.tip.noneTitle": "You don't have a publish URL in this room yet",
  "room.tip.noneViewer": "The owner set you to view-only.",
  "room.tip.noneGate": "The owner turned off this room's OBS channel.",
  "room.tip.noneIngress": "This node's Ingress is unavailable.",
  "room.tip.noneFoot": "You can still push from the browser with \"Share my screen\".",
  "room.tip.serverLabel": "Server (OBS → Settings → Stream → Service: WHIP)",
  "room.tip.notGenerated":
    "You haven't generated a publish URL yet. It's bound to \"you + this room\" — nobody else can get or use it.",
  "room.tip.generateNow": "Generate it now",
  /* ============================================================
     Room — modals, tabs, OBS panel
     ============================================================ */
  "room.people.title": "Room members",
  "room.people.tabs": "Members and invites",
  "room.people.tabMembers": "Members",
  "room.people.tabInvites": "Invites",
  "room.settings.title": "Room settings",
  "room.settings.tabs": "Room settings",
  "room.settings.tabPublish": "Publishing",
  "room.settings.tabRoom": "Room",
  "room.settings.tabLogs": "Audit log",
  "room.settings.tabBans": "Ban list",
  "obs.title": "OBS publishing",
  "obs.noIngressTitle": "This node's Ingress is unavailable",
  "obs.noIngressBody":
    "No OBS publish URL can be issued. You can still use \"Share my screen\" above the video area to push straight from the browser.",
  "obs.viewerTitle": "You're view-only",
  "obs.viewerBody":
    "The owner set you to view-only, so there's no publish URL. Ask them to change your permission if you need to publish.",
  "obs.gateTitle": "The owner turned off OBS publishing",
  "obs.gateBody":
    "This room isn't accepting OBS streams and can't issue a publish URL. \"Share my screen\" above the video area still pushes straight from the browser.",
  "obs.myUrl": "My OBS publish URL",
  "obs.myUrlDesc":
    "Bound to \"you + this room\" — nobody else can get it or use it. It uses WHIP passthrough, so it burns no transcode quota.",
  "obs.generated": "Generated",
  "obs.notGenerated": "Not generated",
  "obs.generate": "Generate publish URL",
  "obs.generating": "Generating…",
  "obs.step1": "OBS → Settings → Stream → Service: **WHIP**",
  "obs.step2": "Put the two values below into Server and Bearer Token",
  "obs.step3":
    "WHIP passthrough has no server-side simulcast. For multiple quality layers, enable it yourself in OBS 32.1.0+ (1–4 layers).",
  "obs.serverLabel": "Server",
  "obs.serverShort": "Server URL",
  "obs.tokenLabel": "Bearer Token (this is the stream key)",
  "obs.tokenShort": "Bearer Token",
  "obs.regenerate": "Regenerate",
  "obs.revoke": "Revoke",
  "obs.regenNote": "Regenerating invalidates the old URL immediately.",
  "obs.revokeTitle": "Revoke the publish URL",
  "obs.revokeBody":
    "After revoking, OBS can no longer connect; you'd have to generate a new URL and update OBS. Continue?",
  "obs.ownerHint": "Want to shut this room's OBS channel entirely? That's on the \"Room\" tab.",
  /* ============================================================
     Room — owner settings
     ============================================================ */
  "rset.share.title": "Who can share their screen",
  "rset.share.desc":
    "New members are view-only by default, so they don't see the \"Share my screen\" button above the video. To let everyone share, flip the switch below; to allow only certain people, right-click their member card on the left of the video and set them to \"Can publish\".",
  "rset.share.everyone": "Everyone",
  "rset.share.restricted": "Owner and publishers only",
  "rset.share.label": "Let every member share their screen",
  "rset.share.hint":
    "Applies to people already in the room immediately — they don't need to reload. It only affects browser sharing; OBS is governed by the gate below.",
  "rset.share.onToast": "Everyone in the room can share their screen now",
  "rset.share.offToast": "Back to publishers only",
  "rset.gate.title": "OBS publishing gate",
  "rset.gate.desc":
    "This governs the OBS/WHIP route only. The browser's \"Share my screen\" is a separate route (direct WebRTC) and is unaffected.",
  "rset.gate.on": "On",
  "rset.gate.off": "Off",
  "rset.gate.label": "Allow OBS to publish into this room",
  "rset.gate.hint":
    "Turning it off cuts any live OBS stream immediately and voids every publish URL already generated for this room.",
  "rset.gate.onToast": "OBS publishing allowed",
  "rset.gate.offToast": "OBS channel closed; {count} publish URL(s) voided",
  "rset.gate.closeTitle": "Turn off OBS publishing",
  "rset.gate.closeConfirm": "Turn off",
  "rset.gate.closeBody":
    "Any live OBS stream is dropped immediately and every publish URL in this room is voided. After turning it back on, everyone has to generate a new one and update the Bearer Token in OBS. Turn it off?",

  /* ============================================================
     Room — members panel
     ============================================================ */
  "members.title": "Members",
  "members.desc":
    "Anyone not in this table can't be issued a token, and therefore can't subscribe to any track — that's a protocol-level limit, not front-end filtering. Change permissions and remove people by right-clicking their card on the left of the video.",
  "members.count": "Members: {count}",
  "members.col.member": "Member",
  "members.col.permission": "Permission",
  "members.col.status": "Status",
  "members.onlineTag": "Online",
  "members.offlineTag": "Offline",
  "members.invite": "Invite a registered user",
  "members.inviteHint":
    "They need an account here first. For people without one, send a link from the Invites tab.",
  "members.permission": "Permission",
  "members.add": "Add",
  /* ============================================================
     Room — invites, bans, logs
     ============================================================ */
  "invite.title": "Invite links",
  "invite.desc":
    "The recipient opens the link, signs in (or signs up), and joins automatically. A link is shown once at creation; only its hash is stored.",
  "invite.activeCount": "Active: {count}",
  "invite.freshTitle": "New link created — copy it now",
  "invite.freshBody": "This is the only time you'll see it.",
  "invite.linkLabel": "Invite link",
  "invite.hours": "Valid for (hours)",
  "invite.hoursPlaceholder": "Blank = forever",
  "invite.uses": "Max uses",
  "invite.usesPlaceholder": "Blank = unlimited",
  "invite.create": "Create link",
  "invite.creating": "Creating…",
  "invite.col.permission": "Permission",
  "invite.col.used": "Used",
  "invite.col.expires": "Expires",
  "invite.unlimitedSuffix": " / ∞",
  "invite.forever": "Never",
  "invite.revoke": "Revoke",
  "invite.revokeTitle": "Revoke the invite link",
  "invite.revokeBody":
    "The link stops working immediately. People who already joined with it are unaffected.",
  "bans.title": "Ban list",
  "bans.desc":
    "People in this table can't enter this room — invite links don't work for them either. Unbanning does not add them back as a member; you have to invite them again.",
  "bans.count": "Banned: {count}",
  "bans.emptyTitle": "The ban list is empty",
  "bans.emptyBody":
    "Right-click a member card on the left of the video and pick \"Remove and ban\" to add someone here.",
  "bans.col.user": "User",
  "bans.col.at": "Banned at",
  "bans.unban": "Unban",
  "logs.title": "Audit log",
  "logs.desc": "Everything that happened in this room, newest first.",
  "logs.emptyTitle": "Nothing logged yet",
  "logs.emptyBody":
    "Creating the room, generating publish URLs, and members joining or leaving all show up here.",
  "logs.system": "System",
  /* ============================================================
     Sync player
     ============================================================ */
  "sync.new.title": "New sync player",
  "sync.new.intro":
    "Once created it appears next to the video. You (the creator) are the projector — your playback position is authoritative and everyone else aligns to you. Video is read by each viewer's browser straight from the source: **it never passes through this site's server, or through LiveKit**.",
  "sync.new.name": "Player name",
  "sync.new.namePlaceholder": "e.g. Friday movie night",
  "sync.new.create": "Create",
  "sync.new.creating": "Creating…",
  "sync.closed": "Sync player closed",
  "sync.hostedByYou": "You're projecting",
  "sync.hostedBy": "{name} is projecting",
  "sync.waitingForOthers": "Sync starts when someone else joins",
  "sync.waitingForHost": "Waiting for the projector",
  "sync.inSync": "In sync",
  "sync.drift": "Drift {value}s",
  "sync.close": "Close this player",
  "sync.sdkFailedTitle": "Player failed to load",
  "sync.sdkFailedBody": "Error fetching MX Player Pro from the CDN: {message}",
  "sync.sdkFailedHint": "Check that cdn.jsdelivr.net is reachable from your network.",
  "sync.playbackError": "Playback error",
  "sync.badSourceTitle": "This source won't play",
  "sync.noSourceHost": "Enter a video URL below",
  "sync.noSourceViewer": "The projector hasn't picked anything yet",
  "sync.noSourceBody":
    "Video is read by your browser straight from the source with Range requests — it never passes through this site's server, or through LiveKit.",
  "sync.urlLabel": "Video URL",
  "sync.urlHint":
    "The source must allow cross-origin reads from this site (CORS) and support Range requests. Changing it switches the source for everyone in the room.",
  "sync.play": "Play and sync",
  "sync.switching": "Switching…",
  "sync.sourceSwitched": "Source switched — everyone in the room follows",
  "sync.sourceCleared": "Source cleared",
  "sync.follow": "Follow the projector",
  "sync.followOn":
    "Automatically aligns to the projector's position: big gaps are seeked, small ones are absorbed with a slight rate change.",
  "sync.followOff": "Detached — you can scrub freely. Turning it back on jumps to the projector.",
  "sync.clock": "Clock offset {offset}ms · one-way latency ≈ {latency}ms",
  "sync.sdkNoExport": "The SDK didn't export MXPlayer",
  /* ============================================================
     Browser-side image preparation (lib/client-image.ts)
     ============================================================ */
  "img.notDecodable": "The browser can't decode this file as an image",
  "img.notImage": "Pick an image file",
  "img.tooBig": "That image is too large (over 25 MB) — compress it before uploading",
  "img.noCanvas": "This browser has no canvas support; try another browser",
  "img.encodeFailed": "Image encoding failed",
  /* ============================================================
     Landing page — chrome, hero, topology
     ============================================================ */
  "landing.meta.description":
    "LiveKit-based desktop sharing. Every room is bound to its own set of LiveKit credentials; push your screen to the room with OBS or just a browser. Authorisation happens at the protocol layer, and two environment variables are enough to run it.",
  "landing.nav.label": "On-page navigation",
  "landing.nav.paths": "Publish routes",
  "landing.nav.quota": "Free tier",
  "landing.nav.features": "Features",
  "landing.nav.start": "Quick start",
  "landing.nav.app": "Desktop app",
  "landing.nav.qa": "Q&A",
  "landing.bar.github": "View the source on GitHub",
  "landing.entry.console": "Open the console",
  "landing.entry.login": "Sign in / Sign up",
  "landing.hero.tag": "Built on **LiveKit** · multi-node · zero-config start",
  "landing.hero.h1a": "One node per room,",
  "landing.hero.h1b": "one publish URL per person.",
  "landing.hero.lead":
    "Push your screen to everyone in the room — with OBS, or with nothing but a browser. Each room is bound to its own LiveKit credentials, so its media traffic and free tier burn on that node and nobody competes for anyone else's.",
  "landing.hero.deploy": "Deploy to Vercel",
  "landing.hero.fact1": "Two environment variables to run",
  "landing.hero.fact2": "WHIP passthrough, no transcode quota",
  "landing.hero.fact3": "Authorisation at the protocol layer",
  "landing.topo.title": "LiveKit nodes",
  "landing.topo.hint": "Separate quotas",
  "landing.topo.nodeA": "Node A",
  "landing.topo.nodeATag": "Yours",
  "landing.topo.nodeB": "Node B",
  "landing.topo.nodeBTag": "A colleague's",
  "landing.topo.builtin": "Built-in node",
  "landing.topo.builtinTag": "Admin-shared · 20 rooms max",
  "landing.topo.online": "{count} online",
  "landing.topo.idle": "Idle",
  "landing.topo.foot":
    "A room lives on exactly one node — its traffic and its free tier are charged there.",
  /* ============================================================
     Landing page — publish routes
     ============================================================ */
  "landing.paths.eyebrow": "01 · Publish routes",
  "landing.paths.h2": "There are two publish routes, and they are separate",
  "landing.paths.lead":
    "The browser route touches this site exactly once — to get a token; after that the video goes straight to LiveKit. The OBS route needs an ingress created on the server first. That's why turning off \"OBS publishing\" leaves browser sharing working.",
  "landing.paths.browser.title": "Share from the browser",
  "landing.paths.browser.body":
    "One click, nothing to install. 1920×1080@15fps — desktop sharing favours resolution over frame rate. The video passes through neither Vercel nor Ingress.",
  "landing.paths.obs.title": "Publish with OBS (WHIP)",
  "landing.paths.obs.body":
    "In the room, click \"Generate publish URL\", then put the Server and Bearer Token into OBS's stream settings (service: WHIP). Passthrough means no transcoding, so it barely touches the machine and never eats the 60-minute quota.",
  "landing.paths.hopBrowser": "Browser",
  "landing.paths.hopNode": "LiveKit node",
  "landing.paths.hopWhip": "WHIP passthrough",

  /* ============================================================
     Landing page — free tier
     ============================================================ */
  "landing.quota.eyebrow": "02 · Why bring your own node",
  "landing.quota.h2": "The free tier is a pilot allowance, not a product allowance",
  "landing.quota.lead":
    "LiveKit Cloud's free Build plan is metered per project; over the limit, requests simply fail and nothing is billed — and multiple free projects on one account share a single allowance.",
  "landing.quota.tile1Label": "WebRTC participant minutes. Publishers don't count — only viewers burn them",
  "landing.quota.tile2Label": "Egress bandwidth. In most scenarios this is the wall you hit first",
  "landing.quota.tile3Value": "60 minutes",
  "landing.quota.tile3Label": "Transcode quota. RTMP input always transcodes — one hour a month",
  "landing.quota.colRate": "Publish bitrate",
  "landing.quota.colMinutes": "Viewer minutes on 50 GB",
  "landing.quota.colHours": "In viewer hours",
  "landing.quota.note4": "1080p high bitrate",
  "landing.quota.note25": "1080p typical",
  "landing.quota.note15": "720p",
  "landing.quota.note08": "Low bitrate",
  "landing.quota.tableNote":
    "About 1.33 Mbps is the dividing line: above it the 50 GB of bandwidth runs out first, below it the 5,000 minutes do. Viewer hours still get divided by the number of viewers — one person sharing to three at 1080p is roughly 15 hours a month.",
  "landing.quota.punch":
    "So this project makes nodes a first-class citizen: **everyone connects their own project**, and the allowance goes from \"one for the whole site\" to \"one each\". The built-in node is only there as a fallback — remember to cap its room count.",
  /* ============================================================
     Landing page — features
     ============================================================ */
  "landing.features.eyebrow": "03 · Features",
  "landing.features.h2": "Everything that matters is enforced on the server",
  "landing.features.lead":
    "A check you can bypass in the client is not a check. All of the following happen where tokens are signed and ingresses are created.",
  "landing.feat.auth.title": "Authorisation at the protocol layer, not front-end filtering",
  "landing.feat.auth.body":
    "Not in the member table → no token → no connection → no track subscription. The grant's `room` field holds exactly one room name, so the token physically cannot open another one. Non-members always get a 404, so a room code reveals nothing.",
  "landing.feat.nodes.title": "Bring your own node, burn your own quota",
  "landing.feat.nodes.body":
    "Connect your own LiveKit Cloud project and pick which set to use per room. Before saving, this site runs a real API health check with those credentials — wrong ones are never stored — and it also probes whether Ingress works and marks that on the node.",
  "landing.feat.whip.title": "OBS over WHIP passthrough",
  "landing.feat.whip.body":
    "`enableTranscoding: false` — it doesn't eat the 60 transcode minutes a month. One publish URL per person, rotatable and revocable; stream keys are encrypted at rest and only decrypted back to their owner.",
  "landing.feat.gate.title": "\"OBS publishing\" is a real switch",
  "landing.feat.gate.body":
    "When the owner turns it off, anything currently publishing drops: the ingress is deleted so old keys can never connect again, and the `obs:` participant is removed from the room. Not a flag that says \"off\" while the stream keeps flowing.",
  "landing.feat.sync.title": "Synchronised playback",
  "landing.feat.sync.body":
    "The owner opens a player and the whole room watches the same source. Position is broadcast over LiveKit's data channel, aligned after estimating the clock offset between machines with ping/pong; video bytes never touch this service.",
  "landing.feat.invite.title": "Invite links",
  "landing.feat.invite.body":
    "Only the hash of a token is stored; links can carry an expiry, a usage cap, and be revoked at any time. Redemption claims a slot atomically with a conditional UPDATE, so concurrency can't punch through `max_uses`; opening one while signed out routes through sign-in and then joins automatically.",
  "landing.feat.env.title": "Two environment variables to run",
  "landing.feat.env.body":
    "`DATABASE_URL` and `ADMIN_PASSWORD`. The admin account is created on first start, the credential encryption key generates itself into the database if unset, and LiveKit is configured in the web UI rather than in env vars. There is no install wizard.",
  "landing.feat.health.title": "Somewhere to look when it breaks",
  "landing.feat.health.body":
    "Rooms have an expandable audit log (it never records a secret). `/api/health` needs no sign-in and reports item by item: database reachability, whether all 12 tables exist, whether bootstrap ran — it lists exactly which tables are missing so you don't have to guess from a stack trace.",
  /* ============================================================
     Landing page — quick start
     ============================================================ */
  "landing.start.eyebrow": "04 · Quick start",
  "landing.start.h2": "Three steps to run your own",
  "landing.start.lead":
    "This site ships no media server, so all you really need is a database and one set of LiveKit credentials.",
  "landing.start.step1Title": "Fill in two environment variables",
  "landing.start.step1Body":
    "Copy `.env.example` to `.env.local` — Next doesn't read the former, so editing the wrong file does nothing at all.",
  "landing.start.passwordPlaceholder": "pick-your-own-password",
  "landing.start.step2Title": "Create the tables, start it",
  "landing.start.step2Comment": "# creates 12 tables",
  "landing.start.step2Body":
    "Then sign in with `admin@localhost` and the password above: the admin account is created on first start, and there is no install wizard. On Vercel the migration is already wired into the build, so you don't run this by hand.",
  "landing.start.step3Title": "Connect a LiveKit node",
  "landing.start.step3Body1":
    "Sidebar \"LiveKit nodes\" → \"Connect a node\", then fill in the `wss://` URL and the API Key / Secret. LiveKit Cloud's free Build plan needs no card and takes about three minutes to get those three values; before saving, this site verifies them for real and refuses to store wrong ones.",
  "landing.start.step3Body2":
    "Self-hosted LiveKit works too (the URL field accepts `ws://`), but publishing from OBS then requires deploying Ingress and Redis yourself.",

  /* ============================================================
     Landing page — desktop app teaser
     ============================================================ */
  "landing.app.eyebrow": "05 · Preview",
  "landing.app.h2a": "We're considering a desktop app:",
  "landing.app.lead":
    "Self-hosted, end-to-end encrypted chat that can also share your screen — this site is only the screen half; the chat half can't be done cleanly in a browser.",
  "landing.app.badge": "Concept stage",
  "landing.app.note":
    "Development **hasn't started** and there's no timeline — this section is a preview. It's here to find out whether anyone actually needs it, because that's what makes it worth building.",
  "landing.app.idea1.title": "End-to-end encryption",
  "landing.app.idea1.body":
    "Messages and shared content are encrypted and decrypted on the endpoints; the server only relays ciphertext — owning the server still doesn't reveal the conversation.",
  "landing.app.idea2.title": "Self-hosted",
  "landing.app.idea2.body":
    "Run the server yourself: accounts, messages and keys never have to be handed to a third party. Like this site, and with none of that mandatory phone-home activation.",
  "landing.app.idea3.title": "Chat and screen in one place",
  "landing.app.idea3.body":
    "Text, files and screen sharing in a single client, instead of running a meeting app next to a chat app.",
  "landing.app.idea4.title": "Native desktop",
  "landing.app.idea4.body":
    "Windows / macOS / Linux clients rather than a browser tab — capturing a whole desktop, staying resident, and starting with the system are things a browser can't give you.",
  "landing.app.footNote":
    "If you're interested, or think something above is wrong, say so. The single most useful piece of feedback is **what you would replace with it** — far more valuable than \"nice idea\".",
  "landing.app.issues": "Open an issue",
  "landing.app.contact": "Contact us",
  /* ============================================================
     Landing page — Q&A
     ============================================================ */
  "landing.qa.eyebrow": "06 · Q&A",
  "landing.qa.h2": "Frequently asked",
  "landing.qa.lead":
    "Every answer below can be traced to the code or the README. For anything not covered here, use the two links in the previous section.",
  "landing.qa.q1": "Do I need to provide a server?",
  "landing.qa.a1":
    "No media server. This site deploys to Vercel + Neon (both have free tiers), video goes through LiveKit Cloud, and all you need is one set of LiveKit credentials — the free Build plan needs no card. Fully self-hosting works too: the URL field accepts `ws://`, but publishing from OBS then means deploying Ingress and Redis yourself.",
  "landing.qa.q2": "How long does the free tier actually last?",
  "landing.qa.a2":
    "In most cases you hit the 50 GB of egress before the 5,000 participant minutes. One person sharing to three viewers at 1080p is roughly 15 hours a month. That's why this project lets everyone connect their own LiveKit project: the allowance goes from \"one for the site owner\" to \"one each\".",
  "landing.qa.q3": "Does the video pass through your servers?",
  "landing.qa.a3":
    "No. For browser sharing this site is contacted exactly once — to get a token; after that the video connects straight to the LiveKit node. The sync player goes further: video bytes are fetched by your own browser directly from the source with Range requests, passing through neither this service nor LiveKit.",
  "landing.qa.q4": "Do I have to install OBS?",
  "landing.qa.a4":
    "No. One click shares from the browser (`getDisplayMedia`, 1920×1080@15fps — desktop sharing favours resolution over frame rate). The OBS route is for people who want multiple scenes, transitions and overlays; it uses WHIP passthrough and eats no transcode quota.",
  "landing.qa.q5": "Can anyone with the room code get in?",
  "landing.qa.a5":
    "No. The member table is the only thing authorisation looks at: not in it means no token, which means no track subscription. A signed token carries exactly one room name, so it physically cannot open another room; non-member requests always return 404, so you can't even learn whether a room exists.",
  "landing.qa.q6": "If I turn off \"OBS publishing\", does a live stream drop?",
  "landing.qa.a6":
    "Yes, immediately. At that moment the server deletes the ingress (old stream keys can never connect again) and removes the `obs:` participant from the room. It is not a flag that flips the label to \"off\" while the stream keeps flowing. Browser sharing is a separate route and is unaffected.",
  "landing.qa.q7": "If the database is stolen, do third-party secrets leak with it?",
  "landing.qa.a7":
    "No. GitHub / Google / Turnstile / Resend secrets are AES-256-GCM encrypted before they are stored, and the master key can live outside the database via `CREDENTIAL_ENCRYPTION_KEY`. No endpoint returns a plaintext secret; the admin UI shows a mask.",
  "landing.qa.q8": "Can I keep it to myself and block strangers from signing up?",
  "landing.qa.a8":
    "Yes. Admin → \"Site settings\" → turn off \"Allow sign-ups\": email/password registration, a first third-party sign-in and a first email-code sign-in are all blocked together and told \"sign-ups are disabled on this site\", while existing accounts sign in as usual. It's enforced on the server, not by hiding a button.",

  /* ============================================================
     Landing page — closing + footer
     ============================================================ */
  "landing.closing.h2": "Create a room, push your screen over",
  "landing.closing.body":
    "Signing up gives you your own workspace, where you can connect your own LiveKit nodes. If you were sent an invite link, just open it and sign in — you'll join the room automatically.",
  "landing.closing.source": "Read the source",
  "landing.closing.badge": "07 · Start here",
  "landing.closing.step1": "Create a room",
  "landing.closing.step2": "Send the invite link",
  "landing.closing.step3": "Push your screen",
  "landing.footer.links": "Related links",
  "landing.footer.docs": "Docs",
  "landing.footer.deploy": "Deployment guide",
  "landing.footer.livekit": "LiveKit docs",
  "landing.footer.stack":
    "Next.js 15 · React 19 · Drizzle + Neon Postgres · LiveKit — the interface is its own design system, with no UI framework and no Tailwind.",
  /* ============================================================
     Server-side API messages.

     Route handlers throw `ApiError`s whose `message` is one of these keys; the
     `route()` wrapper translates it once, using the locale of the request that
     caused it. See lib/http.ts.
     ============================================================ */
  "api.unauthorized": "Please sign in first",
  "api.forbidden": "You don't have permission",
  "api.notFound": "Not found",
  "api.internal": "Server error",
  "api.badJson": "The request body is not valid JSON",
  "api.badParams": "Invalid parameters",
  "api.needAdmin": "Administrator access required",
  "api.notReady":
    "The server isn't ready yet: the database is unreachable, or a required environment variable is missing. Open /api/health to see exactly which item is missing.",
  "api.registrationClosed": "Sign-ups are disabled on this site. Contact an administrator for an account.",

  "api.admin.missingNodeId": "Missing nodeId",
  "api.admin.noFields": "Nothing to update",
  "api.admin.nodeNotFound": "No such node",
  "api.adminUser.selfEdit": "You can't change your own role or status",
  "api.adminUser.noFields": "Nothing to update",
  "api.adminUser.lastAdmin": "The site must keep at least one enabled administrator",
  "api.adminUser.notFound": "No such user",
  "api.cron.noSecret": "CRON_SECRET is not configured; external calls are refused",
  "api.cron.badSecret": "Bad credentials",
  "api.services.badService": "Invalid service parameter",

  "api.node.notFound": "No such node",
  "api.node.rotateBothRequired": "Rotating keys requires both the API Key and the API Secret",
  "api.node.rotateFailed": "The new credentials failed verification: {error}",
  "api.node.noFields": "Nothing to update",
  "api.node.builtinNoDelete":
    "The built-in node can't be deleted — disable it from the admin page instead",
  "api.node.hasActiveRooms":
    "This node still has active rooms; close them before deleting it",
  "api.node.disabled": "Node \"{name}\" has been disabled",
  "api.node.notYours": "You can't use a node someone else connected",
  "api.node.builtinNotPublic":
    "The built-in node isn't open to regular users — connect your own LiveKit Cloud project",
  "api.node.builtinRoomLimit":
    "The built-in node has reached its room limit ({max}); connect your own node",
  "api.node.credsCheckFailed": "Credential verification failed: {error}",
  "api.node.probeFailed": "Can't connect, or the credentials are invalid",
  "api.node.duplicate": "These credentials are already connected",
  "api.auth.emailTaken": "That email is already registered",
  "api.login.badCredentials": "Wrong email or password",
  "api.login.adminNotConfigured":
    "The admin account hasn't been created: the ADMIN_PASSWORD environment variable is empty. Set a non-empty value, restart, then sign in as {email}.",
  "api.account.disabled": "This account has been disabled.",
  "api.account.unverifiedLink":
    "{email} already has an account here, but {provider} didn't confirm that this address belongs to you, so it can't be linked automatically. Sign in with your password or an email code first, then link it from your profile.",

  "api.code.tooFast": "That's too often — try again in {seconds}s.",
  "api.code.tooManyToday": "Too many codes requested for this address today. Try again in an hour.",
  "api.code.noPending": "There's no code waiting to be verified — press \"Send code\" first.",
  "api.code.expired": "That code has expired. Request a new one.",
  "api.code.wrongLeft": "Wrong code — {left} attempt(s) left.",
  "api.code.tooManyWrong": "Too many wrong attempts. Request a new code.",
  "api.captcha.required": "Complete the human verification first",
  "api.captcha.unreachable": "Can't reach the human-verification service; try again shortly",
  "api.captcha.expired": "The human verification expired — please verify again",
  "api.captcha.badSecret":
    "Human verification is misconfigured: the Secret Key is wrong. Contact an administrator",
  "api.captcha.failed": "Human verification didn't pass; please retry",

  "api.oauth.unsupported": "That sign-in method isn't supported",
  "api.oauth.userCancelled": "You cancelled the third-party sign-in.",
  "api.oauth.providerReturned": "The provider returned: {error}",
  "api.oauth.missingCode": "The callback is missing its code parameter",
  "api.oauth.failed": "Third-party sign-in failed. Retry, or use email instead.",
  "api.oauth.missingState": "The callback is missing its state parameter",
  "api.oauth.staleState": "This sign-in request is no longer valid — start the third-party sign-in again.",
  "api.oauth.stateTimeout": "The sign-in request timed out (over 10 minutes) — please start again.",
  "api.oauth.unreachable": "Can't reach the third-party sign-in service; try again shortly.",
  "api.oauth.providerStatus": "The provider's API returned {status}",
  "api.oauth.noAccessToken": "The provider returned no access_token",
  "api.oauth.loginFailed": "Third-party sign-in failed: {reason}",
  "api.oauth.githubNoId": "GitHub returned no account id",
  "api.oauth.googleNoSub": "Google returned no account sub",

  "api.rate.emailTooMany": "Too many sign-in attempts; try again in 15 minutes",
  "api.rate.ipTooMany": "Too many sign-in attempts from this network; try again later",
  "api.mail.unreachable": "The mail service is unreachable; try again shortly.",
  "api.mail.failed": "The email couldn't be sent: {detail}",
  "api.svc.notConfigured":
    "{name} isn't configured yet — ask an administrator to fill it in under Admin → Third-party services.",
  "api.svc.firstSecretRequired": "A secret is required the first time you configure this",
  "api.svc.maskUndecryptable": "(can't be decrypted, please re-enter)",
  "api.room.notFound": "No such room",
  "api.room.ownerOnly": "Only the room owner can do that",
  "api.room.userBanned": "This user is on the room's ban list; unban them first.",
  "api.rooms.noNode": "No node was given, and this site has no built-in node available",
  "api.rooms.codeConflict": "Room code collision — please retry",
  "api.token.roomClosed": "The room is closed",
  "api.token.nodeDisabled": "The node this room lives on has been disabled",
  "api.token.removed": "You have been removed from this room.",

  "api.members.emailNotRegistered": "That email doesn't have an account on this site yet",
  "api.members.accountDisabled": "That account has been disabled",
  "api.members.alreadyMember": "That user is already a member of the room",
  "api.members.cantChangeOwner": "The room owner's permission can't be changed",
  "api.members.notMember": "That user isn't a member of the room",
  "api.members.missingUserId": "Missing userId",
  "api.members.cantRemoveOwner": "The room owner can't be removed",
  "api.bans.missingUserId": "Missing userId",
  "api.bans.notBanned": "That person isn't on the ban list",
  "api.invites.missingId": "Missing id",
  "api.invite.banned": "You've been removed from this room, so invite links don't work for you.",
  "api.invite.invalid": "This invite link is invalid or no longer active",
  "api.invite.notFound": "No such invite",

  "api.ingress.notGenerated": "No publish URL has been generated for you yet",
  "api.ingress.roomClosed": "The room is closed",
  "api.ingress.gateClosed":
    "This room's \"OBS publishing\" switch is off — ask the owner to turn it on before generating a publish URL",
  "api.ingress.noPermission": "You don't have publish permission in this room",
  "api.ingress.nodeNoIngress":
    "This node's Ingress is unavailable (not enabled, or out of quota), so no OBS publish URL can be created",
  "api.ingress.noWhipUrl":
    "LiveKit returned no WHIP URL — check whether Ingress is available on that project",
  "api.ingress.nothingToRevoke": "There's no publish URL to revoke",
  "api.sync.roomClosed": "The room is closed",
  "api.sync.tooMany":
    "A room can have at most {max} sync players open at once — close one first.",
  "api.sync.notFound": "That sync player doesn't exist, or has been closed",
  "api.sync.notAllowed": "Only the creator or the room owner can control this player",
  "api.image.badKind": "kind must be avatar or banner",
  "api.image.notFound": "No such image",
  "api.image.badFormat": "Wrong image format: a base64 data URL is required",
  "api.image.unsupportedType": "That image format isn't supported ({mimeType}); use PNG / JPEG / WebP",
  "api.image.tooBigEstimated": "That image is too large (about {size} KB); the limit is {limit} KB",
  "api.image.empty": "The image is empty",
  "api.image.tooBig": "That image is too large ({size} KB); the limit is {limit} KB",
  "api.image.contentMismatch": "The file contents don't match the declared image format",
  /* ============================================================
     Diagnostics: /api/health and database error hints
     ============================================================ */
  "api.health.set": "Set",
  "api.health.dbUrlMissing": "DATABASE_URL is missing — it is the only mandatory setting",
  "api.health.dbOk": "Connected",
  "api.health.dbFail": "Can't connect: {message}",
  "api.health.tablesOk": "All {count} tables present",
  "api.health.tablesMissing":
    "{count} table(s) missing ({list}) — the migration never ran, or only half ran. Run npm run db:migrate against this database.",
  "api.health.tablesFail": "Couldn't read the table list: {message}",
  "api.health.adminPasswordMissing":
    "ADMIN_PASSWORD is missing (an empty string counts) — the admin account will not be created",
  "api.health.bootReady": "Ready; admin email {email}",
  "api.health.bootReadyNoAdmin": "Ready, but no admin account was created (ADMIN_PASSWORD is empty)",
  "api.health.bootFailed": "Startup bootstrap failed",
  "api.health.keyFromEnv": "From CREDENTIAL_ENCRYPTION_KEY",
  "api.health.keyAuto":
    "Generated automatically and stored in the database (set the variable explicitly for stronger isolation)",
  "api.health.keyPending": "Not loaded yet — fix the failing items above first",
  "api.db.rawPrefix": " Original error: ",
  "api.db.unknown": "The database query failed for an unknown reason.",
  "api.db.42P01": "The table doesn't exist — the migration never ran. Run npm run db:migrate against this database.",
  "api.db.42703": "The column doesn't exist — the migration only half ran. Run npm run db:migrate again.",
  "api.db.3F000": "The schema doesn't exist — check the database name in the connection string.",
  "api.db.3D000": "The database doesn't exist — the name in the connection string is wrong.",
  "api.db.28P01": "Password authentication failed — the password in the connection string is wrong.",
  "api.db.28000": "Authentication refused — the username or its permissions in the connection string are wrong.",
  "api.db.53300": "Too many connections — switch to Neon's pooled connection string.",
  "api.db.08006": "The connection dropped — check the network, and whether the Neon instance is suspended or deleted.",
  "api.db.57P03": "The database is starting up — Neon cold start; wait a few seconds and retry.",
  /* ============================================================
     Validation messages.

     These live in the zod schemas as *keys* (lib/validation.ts stays a pure,
     dependency-free data module) and are translated by parseOr400.
     ============================================================ */
  "valid.wsUrlRequired": "The LiveKit URL can't be empty",
  "valid.wsUrlInvalid": "That isn't a valid LiveKit URL",
  "valid.emailFormat": "That email address doesn't look right",
  "valid.emailTooLong": "That email address is too long",
  "valid.apiKeyShort": "The API Key is too short",
  "valid.apiSecretShort": "The API Secret is too short",
  "valid.nodeName": "Give the node a name",
  "valid.passwordRequired": "Enter your password",
  "valid.passwordShort": "The password must be at least 8 characters",
  "valid.codeSixDigits": "The code is 6 digits",
  "valid.roomName": "The room name can't be empty",
  "valid.atLeastOneSetting": "Change at least one setting",
  "valid.displayName": "The display name can't be empty",
  "valid.playerName": "Give the player a name",
  "valid.sourceUrlScheme": "The URL has to start with http:// or https://",
  "valid.fieldRequired": "This field can't be empty",

  /* ============================================================
     Verification-code email
     ============================================================ */
  "mail.subject": "{code} is your {app} verification code",
  "mail.title": "{app} verification code",
  "mail.preview": "Verification code {code}, valid for {minutes} minutes.",
  "mail.lead": "Use the code below to continue signing in:",
  "mail.validity": "Valid for {minutes} minutes and usable once.",
  "mail.textLead": "Your sign-in code is: {code}",
  "mail.textSafety":
    "If this wasn't you, just ignore this email — without the code, nobody gets in.",
  "mail.safety":
    "Not you signing in? Just ignore this email — without this code, nobody gets in. This site will never ask you for the code through any channel.",
  "mail.autoSent": "This email was sent automatically by {host}.",
};

export default en;
