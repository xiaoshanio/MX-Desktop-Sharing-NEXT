/**
 * Tiếng Việt.
 *
 * Tập khoá do ./en định nghĩa (kiểu `Messages`): thiếu khoá hoặc viết sai sẽ hỏng ở
 * `npm run typecheck` thay vì hiện khoá thô trên giao diện.
 * `{name}` được t(key, vars) thay thế; `**đậm**`, `*nghiêng*` và `` `mã` `` do
 * <RichText> kết xuất.
 */

import type { Messages } from "./types";

const vi: Messages = {
  /* ============================================================
     Brand
     ============================================================ */
  "brand.tagline": "Mỗi phòng một node, mỗi người một URL phát",
  "brand.subtitle": "LiveKit đa node",

  /* ============================================================
     Shared verbs and labels
     ============================================================ */
  "common.cancel": "Huỷ",
  "common.confirm": "OK",
  "common.save": "Lưu",
  "common.saving": "Đang lưu…",
  "common.delete": "Xoá",
  "common.refresh": "Làm mới",
  "common.working": "Đang xử lý…",
  "common.loading": "Đang tải",
  "common.loadingEllipsis": "Đang tải…",
  "common.close": "Đóng",
  "common.gotIt": "Đã hiểu",
  "common.errorTitle": "Đã xảy ra lỗi",
  "common.copied": "Đã sao chép",
  "common.copy": "Sao chép {label}",
  "common.reveal": "Hiện {label}",
  "common.hide": "Ẩn {label}",
  "common.copyPlain": "Sao chép",
  "common.revealPlain": "Hiện",
  "common.hidePlain": "Ẩn",
  "common.notifications": "Thông báo",
  "common.dismissNotification": "Đóng thông báo",
  "common.retry": "Thử lại",
  "common.unlimited": "Không giới hạn",
  "common.never": "Không bao giờ",
  "common.system": "Hệ thống",
  "common.dash": "—",

  /* ============================================================
     Theme + language switchers
     ============================================================ */
  "theme.label": "Giao diện",
  "theme.system": "Theo hệ thống",
  "theme.light": "Sáng",
  "theme.dark": "Tối",
  "theme.nextSystem": "Đang dùng giao diện tối — chuyển sang theo hệ thống",
  "theme.nextLight": "Đang theo hệ thống — chuyển sang giao diện sáng",
  "theme.nextDark": "Đang dùng giao diện sáng — chuyển sang giao diện tối",
  "lang.label": "Ngôn ngữ",
  "lang.change": "Đổi ngôn ngữ",

  /* ============================================================
     App shell
     ============================================================ */
  "shell.openNav": "Mở điều hướng",
  "shell.closeNav": "Đóng điều hướng",
  "shell.mainNav": "Điều hướng chính",
  "shell.workspace": "Không gian làm việc",
  "shell.expandSidebar": "Mở rộng thanh bên",
  "shell.collapseSidebar": "Thu gọn thanh bên",
  "shell.back": "Quay lại",
  "shell.online": "Đã kết nối",
  "shell.offline": "Ngoại tuyến",
  "shell.nav.rooms": "Phòng",
  "shell.nav.nodes": "Node LiveKit",
  "shell.nav.me": "Trang cá nhân",
  "shell.nav.admin": "Quản trị",
  "shell.role.admin": "Quản trị viên",
  "shell.role.user": "Người dùng",
  "shell.menu.profile": "Trang cá nhân",
  "shell.menu.admin": "Quản trị",
  "shell.menu.logout": "Đăng xuất",
  "shell.menu.loggingOut": "Đang đăng xuất…",
  /* ============================================================
     Role / health labels (lib/labels.ts)
     ============================================================ */
  "label.role.owner": "Chủ phòng",
  "label.role.publisher": "Được phát",
  "label.role.viewer": "Chỉ xem",
  "label.health.unknown": "Chưa kiểm tra",
  "label.health.ok": "Bình thường",
  "label.health.bad": "Lỗi",

  /* ============================================================
     Sign in / sign up
     ============================================================ */
  "auth.subtitle":
    "Mỗi phòng một node, mỗi người một URL phát. Đưa màn hình của bạn tới mọi người trong phòng bằng OBS hoặc chỉ với trình duyệt.",
  "auth.home": "Về trang chủ",
  "auth.tabs": "Đăng nhập hoặc đăng ký",
  "auth.signIn": "Đăng nhập",
  "auth.signUp": "Đăng ký",
  "auth.closed": "Trang này đã tắt đăng ký — tài khoản hiện có vẫn đăng nhập được.",
  "auth.oauthContinue": "Tiếp tục với {provider}",
  "auth.orEmail": "hoặc dùng email",
  "auth.methods": "Cách đăng nhập",
  "auth.methodPassword": "Mật khẩu",
  "auth.methodCode": "Mã qua email",
  "auth.email": "Email",
  "auth.displayName": "Tên hiển thị",
  "auth.displayNameHint": "Tên xuất hiện trong danh sách thành viên của phòng.",
  "auth.password": "Mật khẩu",
  "auth.code": "Mã qua email",
  "auth.codePlaceholder": "6 chữ số",
  "auth.resendIn": "Gửi lại ({seconds} s)",
  "auth.resend": "Chưa nhận được? Gửi lại",
  "auth.submitBusy": "Đang xử lý…",
  "auth.submitRegister": "Tạo tài khoản",
  "auth.submitVerify": "Xác minh và đăng nhập",
  "auth.submitSendCode": "Gửi mã",
  "auth.submitLogin": "Đăng nhập",
  "auth.codeSent": "Đã gửi mã tới {email}. Mã có hiệu lực 10 phút.",
  "auth.oauthFailedTitle": "Đăng nhập bằng dịch vụ ngoài không thành công",
  "auth.footRegister": "Đăng ký để có không gian làm việc riêng và node LiveKit của riêng bạn.",
  "auth.footLogin": "Có liên kết mời? Cứ mở rồi đăng nhập, bạn sẽ vào phòng tự động.",
  /* ============================================================
     Invite landing page
     ============================================================ */
  "join.working": "Đang vào phòng",
  "join.workingBody": "Đang kiểm tra liên kết mời — sẽ xong ngay.",
  "join.failed": "Không thể tham gia",
  "join.failedBody": "Không dùng được liên kết mời này.",
  "join.checking": "Đang kiểm tra liên kết mời…",
  "join.failedHint":
    "Liên kết có thể đã hết hạn, bị thu hồi hoặc dùng hết số lần. Hãy nhờ chủ phòng gửi liên kết mới.",
  "join.backToConsole": "Về bảng điều khiển",

  /* ============================================================
     Turnstile (human verification)
     ============================================================ */
  "turnstile.blocked":
    "Không tải được tập lệnh xác minh từ challenges.cloudflare.com. Có thể mạng đang chặn, hoặc trình chặn quảng cáo đang can thiệp.",
  "turnstile.noInit": "Tập lệnh xác minh đã tải nhưng không khởi tạo được. Hãy tải lại trang.",
  "turnstile.renderFailed": "Không kết xuất được phần xác minh người thật: {message}",
  "turnstile.initFailed": "Không khởi tạo được phần xác minh người thật. Hãy tải lại trang.",
  "turnstile.initFailedCode": "Không khởi tạo được phần xác minh người thật (lỗi {code}).",
  "turnstile.badDomain":
    "Site Key này không được phép dùng trên {hostname} (lỗi {code}). Vào Cloudflare → Turnstile → cài đặt của site này và thêm {hostname} vào Domains; khi phát triển cục bộ hãy thêm localhost riêng.",
  "turnstile.badKey":
    "Site Key không hợp lệ (lỗi {code}). Hãy chắc bạn dán Site Key chứ không phải Secret Key — hai giá trị này rất dễ lẫn.",
  "turnstile.badBrowser":
    "Trình duyệt này không được hỗ trợ (lỗi {code}). Hãy thử Chrome, Edge hoặc Firefox bản mới.",
  "turnstile.timeout": "Xác minh đã hết thời gian (lỗi {code}). Hãy thử lại.",
  "turnstile.execFailed":
    "Không chạy được phần xác minh người thật (lỗi {code}). Thường chỉ cần tải lại trang; nếu vẫn lặp lại thì lỗi nằm ở phía Cloudflare.",
  "turnstile.staleScript": "api.js đã cũ (lỗi {code}). Hãy xoá bộ đệm trình duyệt rồi thử lại.",
  /* ============================================================
     Client-side error humanising (lib/error-text.ts)
     ============================================================ */
  "err.signalConnection":
    "Không liên lạc được với máy chủ media của phòng. Hãy kiểm tra mạng, hoặc xem node LiveKit này còn hoạt động không.",
  "err.disconnected": "Kết nối tới phòng đã mất. Đang kết nối lại…",
  "err.roomFull": "Phòng đã đủ người.",
  "err.badToken": "Token truy cập không hợp lệ hoặc đã hết hạn. Tải lại trang sẽ cấp token mới.",
  "err.permissionDenied": "Bạn không có quyền làm việc này.",
  "err.serverUnavailable": "Máy chủ media tạm thời không dùng được. Hãy thử lại sau ít phút.",
  "err.quota": "Node LiveKit này đã dùng hết hạn mức.",
  "err.screenShareDenied":
    "Trình duyệt đã từ chối yêu cầu chia sẻ màn hình. Hãy cho phép trong phần quyền của trang, cạnh thanh địa chỉ.",
  "err.noCaptureDevice":
    "Không có thiết bị thu nào khả dụng, hoặc một chương trình khác đang chiếm dụng.",
  "err.unsupportedBrowser":
    "Trình duyệt này không hỗ trợ chức năng đó. Hãy thử Chrome hoặc Edge.",
  "err.network": "Yêu cầu mạng thất bại. Hãy kiểm tra kết nối.",
  "err.aborted": "Yêu cầu đã bị ngắt.",
  "err.timeout": "Yêu cầu đã hết thời gian. Hãy thử lại sau ít phút.",
  "err.cors":
    "Nguồn video không cho phép đọc chéo miền từ trang này (CORS). Hãy bật nó trên máy chủ chứa video.",
  "err.range": "Nguồn video không hỗ trợ yêu cầu Range, nên không thể vừa tải vừa phát.",
  "err.codec":
    "Trình duyệt không giải mã được định dạng này. Video cần là H.264/HEVC, âm thanh AAC/FLAC/Opus.",
  "err.unknown": "Thao tác thất bại vì lý do không rõ.",
  "err.httpFailed": "Yêu cầu thất bại (HTTP {status})",
  /* ============================================================
     Dashboard (room list)
     ============================================================ */
  "dash.loading": "Đang tải danh sách phòng…",
  "dash.heading": "Phòng",
  "dash.refreshed": "Đã làm mới",
  "dash.stat.rooms": "Phòng: {count}",
  "dash.stat.active": "Đang hoạt động: {count}",
  "dash.stat.online": "Trực tuyến: {count}",
  "dash.stat.nodes": "Node dùng được: {count}",
  "dash.title": "Phòng của bạn",
  "dash.subtitle":
    "Bấm vào thẻ để vào. Mỗi phòng gắn với đúng một node LiveKit, và lưu lượng media chỉ đi qua node đó.",
  "dash.create": "Phòng mới",
  "dash.empty.title": "Chưa có phòng nào",
  "dash.empty.action": "Tạo phòng đầu tiên",
  "dash.empty.body":
    "Tạo một phòng là bạn có URL phát OBS riêng — hoặc chỉ cần chia sẻ màn hình ngay từ trình duyệt. Nếu ai đó cho bạn mã phòng, hãy dùng hộp tìm kiếm ở trên.",
  "dash.created": "Đã tạo phòng",
  "dash.find.placeholder": "Nhập mã phòng, hoặc tìm trong các phòng của bạn",
  "dash.find.label": "Nhập mã phòng hoặc tìm phòng",
  "dash.find.clear": "Xoá",
  "dash.find.noMatch":
    "Không có phòng nào khớp. Mã phòng gồm 10 chữ thường và số — hãy kiểm tra lại.",
  "dash.find.node": "Node {name}",
  "dash.find.closed": "Đã đóng",
  "dash.find.direct": "Vào thẳng",
  "dash.find.directHint":
    "Đây không phải phòng bạn đã tham gia — chỉ vào được nếu bạn từng được mời.",
  "dash.card.active": "Đang hoạt động",
  "dash.card.closed": "Đã đóng",
  "dash.card.copyCode": "Sao chép mã phòng",
  "dash.card.codeCopied": "Đã sao chép mã phòng",
  "dash.card.clipboardBlocked":
    "Trình duyệt đã chặn truy cập bộ nhớ tạm — hãy chọn văn bản rồi sao chép thủ công.",
  "dash.card.online": "{online}/{total} trực tuyến",
  "dash.card.node": "Node {name}",
  "dash.card.nodeBuiltin": " (tích hợp)",
  "dash.card.enter": "Vào",
  "dash.new.title": "Tạo phòng",
  "dash.new.busy": "Đang tạo…",
  "dash.new.name": "Tên phòng",
  "dash.new.namePlaceholder": "Demo hằng tuần",
  "dash.new.node": "Dùng node nào",
  "dash.new.nodeBuiltin": "{name} (tích hợp · hạn mức dùng chung)",
  "dash.new.nodeMine": "{name} (của tôi)",
  "dash.new.nodeNoIngress": " · không phát được từ OBS",
  "dash.new.nodeNew": "+ Kết nối bộ khoá LiveKit mới…",
  "dash.new.hintNoIngress":
    "Ingress của node này không dùng được, nên phòng sẽ không có URL phát OBS. Chia sẻ từ trình duyệt vẫn hoạt động.",
  "dash.new.hintFixed": "Sau khi tạo phòng thì không đổi node được nữa.",
  "dash.new.noNodesTitle": "Không có node nào dùng được",
  "dash.new.noNodesBody":
    "Hãy chọn « Kết nối bộ khoá LiveKit mới » ở trên, hoặc thêm một node ở trang Node LiveKit trước.",
  /* ============================================================
     LiveKit credential fields (shared by "add node" and "create room")
     ============================================================ */
  "node.needCreds": "Cần URL LiveKit / API Key / API Secret",
  "node.guideHide": "Ẩn hướng dẫn",
  "node.guideShow": "Tôi chưa có — làm thế nào?",
  "node.guide.title": "Mở một node LiveKit Cloud miễn phí trong ba phút",
  "node.guide.step1a": "Mở",
  "node.guide.step1b": "và đăng ký. Gói Build miễn phí không cần thẻ.",
  "node.guide.step2":
    "Tạo một project, tên gì cũng được. Bạn sẽ nhận được URL `wss://xxx.livekit.cloud`.",
  "node.guide.step3":
    "Vào Settings → Keys → tạo một API Key. Bạn sẽ nhận được `API Key` và `API Secret`. Secret chỉ hiện một lần — hãy sao chép ngay.",
  "node.guide.step4":
    "Điền ba giá trị đó bên dưới. Trước khi lưu, trang này gọi thật API LiveKit để kiểm tra; giá trị sai sẽ không được lưu.",
  "node.guide.note":
    "Vì sao nên tự mang node: hạn mức miễn phí tính theo từng project (khoảng 5.000 phút-người WebRTC + 50 GB băng thông ra mỗi tháng; vượt hạn mức thì yêu cầu chỉ đơn giản là thất bại và không bị tính phí). Với node của riêng bạn, bạn tiêu hạn mức của mình và không tranh với ai.",
  "node.field.name": "Tên node",
  "node.field.namePlaceholder": "LiveKit của tôi",
  "node.field.nameHint": "Chỉ để bạn nhận biết — đặt tên tuỳ ý.",
  "node.field.url": "URL LiveKit",
  "node.field.urlHint": "Dán URL dạng https:// cũng được — hệ thống sẽ tự chuyển thành wss://.",
  "node.field.secretHint": "Được mã hoá khi lưu; không API nào trả lại nó nữa.",

  /* ============================================================
     LiveKit nodes page
     ============================================================ */
  "nodes.loading": "Đang tải danh sách node…",
  "nodes.heading": "Node LiveKit",
  "nodes.stat.total": "Node: {count}",
  "nodes.stat.mine": "Của tôi: {count}",
  "nodes.stat.healthy": "Bình thường: {count}",
  "nodes.subtitle":
    "Kết nối bộ khoá LiveKit của riêng bạn, và các phòng sẽ tiêu hạn mức miễn phí của bạn thay vì tranh của người khác.",
  "nodes.add": "Kết nối node",
  "nodes.empty.title": "Chưa có node nào",
  "nodes.empty.action": "Kết nối node đầu tiên của tôi",
  "nodes.empty.body":
    "Gói Build miễn phí của LiveKit Cloud không cần thẻ và chỉ mất ba phút. Khi lưu, trang này gọi thật API để kiểm tra bộ khoá — bộ khoá sai sẽ không được lưu.",
  "nodes.badge.builtin": "Tích hợp",
  "nodes.badge.mine": "Của tôi",
  "nodes.badge.theirs": "Của người khác",
  "nodes.badge.disabled": "Đã tắt",
  "nodes.ingressOk": "Ingress dùng được",
  "nodes.ingressBad": "Ingress không dùng được",
  "nodes.check": "Kiểm tra",
  "nodes.checking": "Đang kiểm tra…",
  "nodes.rotate": "Đổi khoá",
  "nodes.delete": "Xoá node",
  "nodes.webhookHint":
    "Trong bảng điều khiển LiveKit, vào Settings → Webhooks và dán URL bên dưới. Trạng thái trực tuyến của thành viên được cập nhật qua đó.",
  "nodes.webhookLabel": "URL webhook",
  "nodes.saved": "Đã lưu node — bộ khoá đã được kiểm tra.",
  "nodes.rotated": "Đã cập nhật khoá của « {name} »; bộ khoá mới đã qua kiểm tra.",
  "nodes.deleteTitle": "Xoá node",
  "nodes.deleteBody":
    "Xoá « {name} »? Các phòng đang hoạt động của nó phải được đóng trước, nếu không việc xoá sẽ bị từ chối.",
  "nodes.add.title": "Kết nối node LiveKit của tôi",
  "nodes.add.busy": "Đang kiểm tra và lưu…",
  "nodes.add.submit": "Lưu node",
  "nodes.rotate.title": "Cập nhật khoá của « {name} »",
  "nodes.rotate.busy": "Đang kiểm tra và cập nhật…",
  "nodes.rotate.submit": "Cập nhật khoá",
  "nodes.rotate.note":
    "Bộ khoá mới được thử với API LiveKit trước khi ghi. Nếu kiểm tra thất bại thì không có gì thay đổi và khoá cũ vẫn hoạt động.",
  "nodes.rotate.newKey": "API Key mới",
  "nodes.rotate.newSecret": "API Secret mới",
  /* ============================================================
     Profile page
     ============================================================ */
  "me.loading": "Đang tải trang cá nhân…",
  "me.heading": "Trang cá nhân",
  "me.subtitle": "Đây là nơi chỉnh thẻ thành viên mà người khác thấy ở bên trái khung video.",
  "me.preview.title": "Xem trước thẻ",
  "me.preview.desc":
    "Đây là hình ảnh của bạn với người khác khi vào phòng. Nếu chưa tải ảnh bìa, hệ thống dùng màu được gán cho tài khoản của bạn.",
  "me.preview.you": "Bạn",
  "me.avatar.title": "Ảnh đại diện",
  "me.avatar.desc":
    "Hiển thị hình vuông và được cắt thành hình tròn. Trình duyệt thu nhỏ về 256px trước khi tải lên.",
  "me.avatar.current": "Ảnh đại diện hiện tại",
  "me.banner.title": "Ảnh bìa thẻ",
  "me.banner.desc": "Dải ảnh ở đầu thẻ. Được thu về 960×540 và cắt theo tâm.",
  "me.pick": "Chọn ảnh",
  "me.uploading": "Đang tải lên…",
  "me.reset": "Về mặc định",
  "me.avatarSaved": "Đã cập nhật ảnh đại diện",
  "me.bannerSaved": "Đã cập nhật ảnh bìa thẻ",
  "me.avatarReset": "Đã đưa ảnh đại diện về mặc định.",
  "me.bannerReset": "Đã đưa ảnh bìa về màu mặc định.",
  "me.accent.title": "Màu thẻ",
  "me.accent.desc": "Dùng khi không có ảnh bìa. Mặc định mỗi tài khoản được gán một sắc.",
  "me.accent.saved": "Đã cập nhật màu.",
  "me.accent.iris": "Diên vĩ",
  "me.accent.azure": "Thanh thiên",
  "me.accent.teal": "Xanh mòng",
  "me.accent.lime": "Xanh chanh",
  "me.accent.amber": "Hổ phách",
  "me.accent.rose": "Hồng đào",
  "me.accent.magenta": "Đỏ tím",
  "me.accent.slate": "Xám đá",
  "me.account.title": "Tài khoản",
  "me.account.desc": "Tên hiển thị xuất hiện trong danh sách thành viên và trên thẻ của bạn.",
  "me.account.nameSaved": "Đã cập nhật tên hiển thị.",
  "me.account.emailVerified": "Email đã xác minh",
  "me.account.emailUnverified": "Email chưa xác minh",
  "me.account.hasPassword": "Đã đặt mật khẩu",
  "me.account.noPassword": "Chỉ đăng nhập ngoài / mã email",
  "me.tour.title": "Gợi ý cho người mới",
  "me.tour.desc": "Gợi ý « URL phát ở đâu » hiện ra lần đầu bạn vào một phòng.",
  "me.tour.reset": "Xem lại gợi ý",
  "me.tour.done": "Đã đặt lại — gợi ý sẽ hiện thêm một lần khi bạn vào phòng lần tới",
  /* ============================================================
     Admin — shell, nodes, users
     ============================================================ */
  "admin.loading": "Đang tải dữ liệu toàn trang…",
  "admin.heading": "Quản trị",
  "admin.stat.nodes": "Node: {count}",
  "admin.stat.users": "Người dùng: {count}",
  "admin.stat.admins": "Quản trị viên: {count}",
  "admin.subtitle": "Toàn bộ node và người dùng của trang. Chỉ quản trị viên xem được.",
  "admin.tabs": "Các mục quản trị",
  "admin.tab.nodes": "Node",
  "admin.tab.users": "Người dùng",
  "admin.tab.services": "Dịch vụ ngoài",
  "admin.tab.site": "Cài đặt trang",
  "admin.promote.title": "Đặt làm node tích hợp",
  "admin.promote.confirm": "Đặt làm tích hợp",
  "admin.promote.body":
    "Đặt « {name} » làm node tích hợp của toàn trang? Node tích hợp hiện tại sẽ trở thành node thường, và từ giờ mọi người dùng không có bộ khoá riêng sẽ dùng node này.",
  "admin.nodes.emptyTitle": "Chưa có node nào",
  "admin.nodes.emptyBody":
    "Hãy thêm một node ở trang Node LiveKit bằng « Kết nối node », rồi quay lại đây đặt nó làm node tích hợp của trang.",
  "admin.nodes.title": "Node",
  "admin.nodes.desc":
    "Node tích hợp là node dùng chung cho toàn trang — người dùng có thể tạo phòng mà không cần bộ khoá riêng, và hạn mức của node này sẽ trả giá cho việc đó. Node nào cũng có thể được nâng lên; và luôn chỉ có một.",
  "admin.nodes.col.node": "Node",
  "admin.nodes.col.kind": "Loại",
  "admin.nodes.col.activeRooms": "Phòng đang hoạt động",
  "admin.nodes.col.enabled": "Bật",
  "admin.nodes.col.public": "Mở",
  "admin.nodes.col.maxRooms": "Giới hạn phòng",
  "admin.nodes.checkFailed": "Kiểm tra thất bại",
  "admin.nodes.kindBuiltin": "Tích hợp",
  "admin.nodes.kindUser": "Người dùng",
  "admin.nodes.enableAria": "Bật {name}",
  "admin.nodes.publicAria": "Mở {name} cho mọi người",
  "admin.nodes.maxRoomsAria": "Giới hạn phòng cho {name}",
  "admin.nodes.maxRoomsPlaceholder": "Không giới hạn",
  "admin.nodes.makeBuiltin": "Đặt làm tích hợp",
  "admin.users.title": "Người dùng",
  "admin.users.desc":
    "Tài khoản bị tắt sẽ không được cấp token nữa, nên không vào được phòng nào.",
  "admin.users.col.user": "Người dùng",
  "admin.users.col.role": "Vai trò",
  "admin.users.col.status": "Trạng thái",
  "admin.users.me": "Tôi",
  "admin.users.admin": "Quản trị viên",
  "admin.users.user": "Người dùng",
  "admin.users.disabled": "Đã tắt",
  "admin.users.ok": "Hoạt động",
  "admin.users.demote": "Hạ xuống người dùng",
  "admin.users.promote": "Đặt làm quản trị viên",
  "admin.users.enable": "Bật",
  "admin.users.disable": "Tắt",
  /* ============================================================
     Admin — site settings
     ============================================================ */
  "site.loading": "Đang tải cài đặt trang…",
  "site.openTitle": "Đang mở đăng ký",
  "site.closedTitle": "Đang tắt đăng ký — tài khoản hiện có vẫn đăng nhập được",
  "site.openBody":
    "Ai cũng có thể tạo tài khoản: email + mật khẩu, lần đầu đăng nhập GitHub / Google, hoặc lần đầu đăng nhập bằng mã email. Cả ba đường đều tạo tài khoản ngay tại chỗ.",
  "site.closedBody":
    "Cả ba đường tạo tài khoản đều bị chặn và trả về « trang này đã tắt đăng ký ». Tài khoản hiện có không bị ảnh hưởng và vẫn dùng được mật khẩu, đăng nhập ngoài và mã email. Lưu ý liên kết mời cũng cần có tài khoản trước — muốn cho người mới vào thì hãy mở lại công tắc này.",
  "site.card.title": "Đăng ký",
  "site.card.desc":
    "Quyết định người lạ có tạo được tài khoản ở đây hay không. Chặn ở phía máy chủ (trước khi cấp phiên), không phải ẩn một cái nút.",
  "site.switch.label": "Cho phép đăng ký",
  "site.switch.hint":
    "Khi tắt: endpoint đăng ký từ chối thẳng; đăng nhập ngoài chỉ nhận tài khoản đã liên kết và từ chối phần còn lại tại chỗ; đăng nhập bằng mã email cũng vậy — tài khoản hiện có vẫn qua, địa chỉ mới không tạo tài khoản nữa.",
  "site.opened": "Đã mở đăng ký.",
  "site.closed": "Đã tắt đăng ký.",

  /* ============================================================
     Admin — third-party services
     ============================================================ */
  "svc.loading": "Đang tải cài đặt dịch vụ ngoài…",
  "svc.bannerTitle": "Khoá bí mật được mã hoá trong cơ sở dữ liệu, không nằm ở biến môi trường",
  "svc.bannerBody":
    "Các khoá này được mã hoá AES-256-GCM vào `service_credentials`, và khoá chủ có thể nằm ngoài cơ sở dữ liệu (`CREDENTIAL_ENCRYPTION_KEY`) — có cả bản dump đầy đủ cũng không giải mã được. Không API nào trả về khoá dạng rõ; những gì bạn thấy bên dưới là bản che. Thay đổi có hiệu lực ngay, không cần triển khai lại.",
  "svc.notConfigured": "Chưa cấu hình",
  "svc.enabled": "Đã bật",
  "svc.disabled": "Đã tắt",
  "svc.callbackLabel": "URL gọi lại (dán vào bảng điều khiển của nhà cung cấp thật chính xác)",
  "svc.callbackShort": "URL gọi lại",
  "svc.callbackHint":
    "Sai chỗ này là nguyên nhân phổ biến nhất khiến đăng nhập ngoài thất bại — nhà cung cấp sẽ từ chối yêu cầu cấp quyền ngay lập tức.",
  "svc.secretCurrent": "{hint} Hiện tại: {mask}. Để trống nếu không muốn thay.",
  "svc.secretKeepPlaceholder": "Trống = giữ nguyên",
  "svc.fromName": "Tên người gửi hiển thị (không bắt buộc)",
  "svc.fromNameHint": "Tên mà người nhận thấy, ví dụ « {app} ».",
  "svc.enableLabel": "Bật",
  "svc.enableHintTurnstile": "Khi tắt, trang đăng nhập sẽ không còn yêu cầu xác minh người thật.",
  "svc.enableHintResend": "Khi tắt, trang đăng nhập sẽ không còn mời « mã qua email ».",
  "svc.enableHintOauth": "Khi tắt, trang đăng nhập sẽ không còn hiện nút này.",
  "svc.saveChanges": "Lưu thay đổi",
  "svc.removeConfig": "Xoá cấu hình",
  "svc.savedToast": "Đã lưu {title}.",
  "svc.removedToast": "Đã xoá {title}.",
  "svc.removeTitle": "Xoá cấu hình {title}",
  "svc.removeBodyTurnstile":
    "Sau khi xoá, việc đăng nhập, đăng ký và gửi mã đều không còn yêu cầu xác minh người thật. Tiếp tục?",
  "svc.removeBodyResend":
    "Sau khi xoá, đăng nhập bằng mã email sẽ không hoạt động và những mã đã gửi cũng không xác minh được. Tiếp tục?",
  "svc.removeBodyOauth":
    "Sau khi xoá, nút đăng nhập ngoài này sẽ biến mất. Ai đã liên kết qua đó mà chưa đặt mật khẩu sẽ bị khoá ngoài — hãy chắc rằng họ còn cách khác để vào.",
  /* ============================================================
     Admin — the four service forms
     ============================================================ */
  "svc.github.title": "Đăng nhập GitHub",
  "svc.github.desc": "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.",
  "svc.github.publicLabel": "Client ID",
  "svc.github.publicHint": "Client ID trên trang OAuth App.",
  "svc.github.secretLabel": "Client Secret",
  "svc.github.secretHint":
    "Chỉ hiện một lần lúc tạo — sau đó chính GitHub cũng không cho xem lại. Hãy lưu trước khi rời trang đó.",
  "svc.google.title": "Đăng nhập Google",
  "svc.google.desc":
    "Google Cloud Console → API và dịch vụ → Thông tin xác thực → Tạo ID ứng dụng khách OAuth (ứng dụng web).",
  "svc.google.publicLabel": "Client ID",
  "svc.google.publicHint": "Có dạng xxxxx.apps.googleusercontent.com.",
  "svc.google.secretLabel": "Client Secret",
  "svc.google.secretHint": "Client secret trên trang chi tiết thông tin xác thực.",
  "svc.turnstile.title": "Xác minh người thật Turnstile",
  "svc.turnstile.desc":
    "Bảng điều khiển Cloudflare → Turnstile → Add site. Khi đã cấu hình, cả đăng nhập, đăng ký và gửi mã đều yêu cầu xác minh.",
  "svc.turnstile.publicLabel": "Site Key",
  "svc.turnstile.publicHint": "Nó nằm trong HTML của trang đăng nhập — vốn là giá trị công khai.",
  "svc.turnstile.secretLabel": "Secret Key",
  "svc.turnstile.secretHint":
    "Dùng để kiểm tra phía máy chủ; tuyệt đối không được lộ ra front-end.",
  "svc.resend.title": "Dịch vụ email Resend",
  "svc.resend.desc":
    "resend.com → API Keys. Tên miền gửi phải được xác minh trong Resend, nếu không email sẽ bị từ chối. Khi đã cấu hình, trang đăng nhập sẽ mời « mã qua email ».",
  "svc.resend.publicLabel": "Địa chỉ gửi",
  "svc.resend.publicHint":
    "Phải thuộc một tên miền đã xác minh trong Resend, ví dụ no-reply@ten-mien-cua-ban.com.",
  "svc.resend.secretLabel": "API Key",
  "svc.resend.secretHint": "Có dạng re_xxxxxxxx.",
  /* ============================================================
     Room — chrome, status bar, stage
     ============================================================ */
  "room.heading": "Phòng {code}",
  "room.entering": "Đang vào phòng…",
  "room.fatalTitle": "Không mở được phòng này",
  "room.fatal.emptyTitle": "Không có quyền truy cập",
  "room.fatal.back": "Về danh sách phòng",
  "room.fatal.body":
    "Người không phải thành viên sẽ được trả lời là phòng không tồn tại — đó là chủ ý, để không ai dò mã phòng từng cái một được.",
  "room.backLabel": "Về danh sách phòng",
  "room.action.share": "Chia sẻ phòng này (liên kết mời)",
  "room.action.members": "Thành viên",
  "room.action.settings": "Cài đặt phòng và thông tin phát",
  "room.action.newPlayer": "Trình phát đồng bộ mới",
  "room.stat.code": "Mã phòng {code}",
  "room.stat.node": "Node {name}",
  "room.stat.nodeBuiltin": " (tích hợp)",
  "room.stat.active": "Đang hoạt động",
  "room.stat.closed": "Đã đóng",
  "room.stat.members": "Thành viên: {count}",
  "room.closedTitle": "Phòng đã đóng",
  "room.closedBody": "Không cấp thêm token nữa; cả hình ảnh và việc phát đều không dùng được.",

  "channel.rooms.title": "Phòng kênh",
  "channel.rooms.create": "Tạo phòng",
  "channel.rooms.emptyTitle": "Chưa có phòng nào",
  "channel.rooms.emptyBody": "Quản trị viên kênh có thể tạo phòng, mỗi phòng có trình phát đồng bộ riêng",
  "channel.rooms.creator": "Người tạo: {name}",
  "channel.rooms.backToList": "Quay lại danh sách phòng",

  "room.stage.live": "Đang phát",
  "room.stage.urlPlaceholder": "Nhập URL phát",
  "room.stage.urlPlay": "Phát",
  "room.stage.fullscreen": "Toàn màn hình",
  "room.stage.noSignal": "Không có tín hiệu",
  "room.stage.inRoom": "Trong phòng: {count}",
  "room.stage.onlySelected": "Chỉ hiện một người",
  "room.stage.modeScreen": "Chia sẻ màn hình",
  "room.stage.modePlayer": "Trình phát đồng bộ",
  "room.stage.gettingPermission": "Đang lấy quyền phát…",
  "room.stage.viewerOnly":
    "Bạn đang ở chế độ chỉ xem — hãy nhờ chủ phòng đổi quyền, hoặc bật « ai cũng chia sẻ được »",
  "room.stage.tagObs": "OBS",
  "room.stage.tagScreen": "Chia sẻ màn hình",
  "room.stage.tagCamera": "Máy ảnh",
  "room.stage.idleSelectedTitle": "Người này không chia sẻ gì",
  "room.stage.idleTitle": "Chưa ai phát",
  "room.stage.idleSelectedBody":
    "Bấm « Hiện tất cả » ở bên trái để xem những người còn lại trong phòng.",
  "room.stage.idleBody":
    "Ngay khi một nguồn phát kết nối, hình ảnh sẽ xuất hiện ở đây — không cần tải lại trang.",
  "room.offline.notConnected": "Chưa kết nối",
  "room.offline.connecting": "Đang kết nối tới phòng…",
  "room.offline.closed": "Phòng đã đóng",
  "room.offline.connectingBody": "Đang cấp token truy cập.",
  "room.offline.closedBody": "Phòng đã đóng thì không cấp token và không nhận phát nữa.",
  "room.share.busy": "Đang xử lý…",
  "room.share.stop": "Dừng chia sẻ",
  "room.share.start": "Chia sẻ màn hình của tôi",
  "room.share.settings": "Cài đặt chia sẻ",
  "room.share.quality": "Tham số chất lượng",
  "room.share.resolution": "Độ phân giải",
  "room.share.frameRate": "Tốc độ khung hình",
  "room.share.bitrate": "Bitrate",
  "room.share.codec": "Codec",
  "room.share.codecAuto": "Tự động",
  "room.share.codecVP8": "VP8 (Tương thích tốt nhất)",
  "room.share.codecVP9": "VP9 (Hiệu suất cao)",
  "room.share.codecH264": "H.264 (Tăng tốc phần cứng)",
  "room.share.codecAV1": "AV1 (Thử nghiệm)",
  "room.share.presets": "Cài đặt sẵn",
  "room.share.presetPresentation": "Thuyết trình (Độ phân giải cao, FPS thấp)",
  "room.share.presetBalanced": "Cân bằng (Khuyến nghị)",
  "room.share.presetSmooth": "Mượt mà (FPS cao)",
  "room.share.presetHQ": "Chất lượng cao (2K)",
  "room.share.presetCustom": "Tùy chỉnh",
  "room.share.applyPreset": "Áp dụng cài đặt sẵn",
  /* ============================================================
     Room — participant rail + context menu
     ============================================================ */
  "rail.label": "Thành viên trực tuyến",
  "rail.online": "Trực tuyến: {count}",
  "rail.showAll": "Hiện tất cả",
  "rail.empty": "Chưa có ai ở đây.",
  "rail.obs": "OBS",
  "rail.you": "Bạn",
  "rail.onlineTag": "Trực tuyến",
  "rail.hasVideo": " · đang chia sẻ",
  "rail.sharing": "Đang chia sẻ màn hình",
  "rail.sharingScreen": "Đang chia sẻ màn hình",
  "rail.menu.ownerLocked": "Chủ phòng — không thể đổi hay đưa ra khỏi phòng",
  "rail.menu.permission": "Quyền",
  "rail.menu.current": " (hiện tại)",
  "rail.menu.kick": "Đưa ra khỏi phòng",
  "rail.menu.kickBan": "Đưa ra khỏi phòng và chặn",
  "room.roleChanged": "Đã chuyển « {name} » thành {role}",
  "room.kicked": "Đã đưa « {name} » ra khỏi phòng",
  "room.kickedBanned": "Đã đưa « {name} » ra khỏi phòng và thêm vào danh sách chặn",
  "room.kick.titleBan": "Đưa ra khỏi phòng và chặn",
  "room.kick.title": "Đưa thành viên ra khỏi phòng",
  "room.kick.confirmBan": "Đưa ra và chặn",
  "room.kick.confirm": "Đưa ra",
  "room.kick.bodyBan":
    "Đưa « {name} » ra khỏi phòng và thêm vào danh sách chặn? Kết nối của họ bị ngắt ngay, URL phát bị vô hiệu, và sau đó **kể cả có liên kết mời họ cũng không vào được** cho tới khi bạn bỏ chặn.",
  "room.kick.body":
    "Đưa « {name} » ra khỏi phòng? Việc này cũng ngắt kết nối và xoá URL phát của họ. Lưu ý: nếu họ còn giữ một liên kết mời còn hiệu lực thì vẫn tự quay lại được — hãy dùng « Đưa ra khỏi phòng và chặn » để khoá hẳn.",

  /* ============================================================
     Room — coach mark + first-visit tip
     ============================================================ */
  "room.coach.title": "Thông tin phát ở đây",
  "room.coach.body":
    "Sau này muốn xem lại hoặc tạo lại URL phát OBS, hãy bấm bánh răng này trên thanh trên → « Thông tin phát ».",
  "room.tip.title": "Chào bạn — đây là URL phát của bạn",
  "room.tip.intro":
    "Có hai cách đưa hình ảnh vào phòng này: **« Chia sẻ màn hình của tôi »** phía trên khung video (trực tiếp từ trình duyệt, một cú bấm), và **URL phát OBS** bên dưới.",
  "room.tip.noneTitle": "Bạn chưa có URL phát trong phòng này",
  "room.tip.noneViewer": "Chủ phòng đã đặt bạn ở chế độ chỉ xem.",
  "room.tip.noneGate": "Chủ phòng đã đóng kênh OBS của phòng này.",
  "room.tip.noneIngress": "Ingress của node này không dùng được.",
  "room.tip.noneFoot": "Bạn vẫn có thể phát từ trình duyệt bằng « Chia sẻ màn hình của tôi ».",
  "room.tip.serverLabel": "Server (OBS → Cài đặt → Phát trực tiếp → Dịch vụ: WHIP)",
  "room.tip.notGenerated":
    "Bạn chưa tạo URL phát. Nó gắn với « bạn + phòng này » — không ai khác lấy hay dùng được.",
  "room.tip.generateNow": "Tạo ngay",
  /* ============================================================
     Room — modals, tabs, OBS panel
     ============================================================ */
  "room.people.title": "Thành viên phòng",
  "room.people.tabs": "Thành viên và lời mời",
  "room.people.tabMembers": "Thành viên",
  "room.people.tabInvites": "Lời mời",
  "room.settings.title": "Cài đặt phòng",
  "room.settings.tabs": "Cài đặt phòng",
  "room.settings.tabPublish": "Thông tin phát",
  "room.settings.tabRoom": "Phòng",
  "room.settings.tabLogs": "Nhật ký thao tác",
  "room.settings.tabBans": "Danh sách chặn",
  "room.nodes.title": "Tuyến",
  "room.nodes.desc": "Thêm các node LiveKit của bạn vào phòng này",
  "room.nodes.selectLabel": "Chọn node",
  "room.nodes.add": "Thêm",
  "room.nodes.added": "Đã thêm node",
  "room.nodes.col.name": "Node",
  "room.nodes.col.status": "Trạng thái",
  "room.nodes.primary": "Chính",
  "room.nodes.secondary": "Phụ",
  "room.nodes.setPrimary": "Đặt làm chính",
  "room.nodes.primarySet": "Đã cập nhật node chính",
  "room.nodes.grantTitle": "Cấp quyền truy cập node",
  "room.nodes.grantDesc": "Cho phép {name} truy cập vào một trong các node của bạn",
  "room.nodes.grant": "Cấp quyền",
  "room.nodes.granted": "{name} giờ có thể sử dụng node đó",
  "obs.title": "Phát bằng OBS",
  "obs.noIngressTitle": "Ingress của node này không dùng được",
  "obs.noIngressBody":
    "Không thể cấp URL phát OBS. Bạn vẫn có thể dùng « Chia sẻ màn hình của tôi » phía trên khung video để phát trực tiếp từ trình duyệt.",
  "obs.viewerTitle": "Bạn đang ở chế độ chỉ xem",
  "obs.viewerBody":
    "Chủ phòng đã đặt bạn ở chế độ chỉ xem, nên không có URL phát. Nếu cần phát, hãy nhờ chủ phòng đổi quyền.",
  "obs.gateTitle": "Chủ phòng đã tắt việc phát bằng OBS",
  "obs.gateBody":
    "Phòng này không nhận luồng OBS và không cấp được URL phát. « Chia sẻ màn hình của tôi » phía trên khung video vẫn phát được từ trình duyệt.",
  "obs.myUrl": "URL phát OBS của tôi",
  "obs.myUrlDesc":
    "Gắn với « bạn + phòng này » — không ai khác lấy hay dùng được. Đi qua WHIP trực tiếp nên không tiêu hạn mức chuyển mã.",
  "obs.generated": "Đã tạo",
  "obs.notGenerated": "Chưa tạo",
  "obs.generate": "Tạo URL phát",
  "obs.generating": "Đang tạo…",
  "obs.step1": "OBS → Cài đặt → Phát trực tiếp → Dịch vụ: **WHIP**",
  "obs.step2": "Điền hai giá trị bên dưới vào Server và Bearer Token",
  "obs.step3":
    "WHIP trực tiếp không có simulcast phía máy chủ. Muốn nhiều mức chất lượng thì tự bật trong OBS 32.1.0+ (1–4 lớp).",
  "obs.serverLabel": "Server",
  "obs.serverShort": "URL Server",
  "obs.tokenLabel": "Bearer Token (chính là stream key)",
  "obs.tokenShort": "Bearer Token",
  "obs.regenerate": "Tạo lại",
  "obs.revoke": "Thu hồi",
  "obs.regenNote": "Tạo lại sẽ khiến URL cũ mất hiệu lực ngay.",
  "obs.revokeTitle": "Thu hồi URL phát",
  "obs.revokeBody":
    "Sau khi thu hồi, OBS không kết nối được nữa; bạn sẽ phải tạo URL mới và cập nhật lại OBS. Tiếp tục?",
  "obs.ownerHint": "Muốn đóng hẳn kênh OBS của phòng này? Nó ở thẻ « Phòng ».",
  /* ============================================================
     Room — owner settings
     ============================================================ */
  "rset.share.title": "Ai được chia sẻ màn hình",
  "rset.share.desc":
    "Thành viên mới mặc định chỉ xem, nên họ không thấy nút « Chia sẻ màn hình của tôi » phía trên khung video. Muốn cho tất cả chia sẻ thì bật công tắc bên dưới; muốn mở cho vài người thì bấm chuột phải vào thẻ thành viên bên trái khung video và đổi thành « Được phát ».",
  "rset.share.everyone": "Tất cả",
  "rset.share.restricted": "Chỉ chủ phòng và người được phát",
  "rset.share.label": "Cho mọi thành viên chia sẻ màn hình",
  "rset.share.hint":
    "Có hiệu lực ngay với những người đang trong phòng — họ không cần tải lại trang. Chỉ ảnh hưởng chia sẻ từ trình duyệt; OBS do cổng bên dưới quản lý.",
  "rset.share.onToast": "Bây giờ mọi người trong phòng đều chia sẻ màn hình được",
  "rset.share.offToast": "Đã trở lại chỉ người được phát",
  "rset.gate.title": "Cổng phát bằng OBS",
  "rset.gate.desc":
    "Chỉ quản lý đường OBS/WHIP. Nút « Chia sẻ màn hình của tôi » trên trình duyệt là đường khác (WebRTC trực tiếp) và không bị ảnh hưởng.",
  "rset.gate.on": "Đang bật",
  "rset.gate.off": "Đang tắt",
  "rset.gate.label": "Cho OBS phát vào phòng này",
  "rset.gate.hint":
    "Tắt đi sẽ ngắt ngay mọi luồng OBS đang chạy và vô hiệu toàn bộ URL phát đã tạo cho phòng này.",
  "rset.gate.onToast": "Đã cho phép phát bằng OBS",
  "rset.gate.offToast": "Đã đóng kênh OBS; vô hiệu {count} URL phát",
  "rset.gate.closeTitle": "Tắt việc phát bằng OBS",
  "rset.gate.closeConfirm": "Tắt",
  "rset.gate.closeBody":
    "Mọi luồng OBS đang chạy sẽ bị ngắt ngay và toàn bộ URL phát của phòng này bị vô hiệu. Sau khi bật lại, mỗi người phải tạo URL mới và cập nhật Bearer Token trong OBS. Tắt chứ?",

  /* ============================================================
     Room — members panel
     ============================================================ */
  "members.title": "Thành viên",
  "members.desc":
    "Ai không có trong bảng này thì không được cấp token, nên không đăng ký được track nào — đây là giới hạn ở tầng giao thức, không phải lọc ở phía giao diện. Muốn đổi quyền hay đưa ai ra khỏi phòng thì bấm chuột phải vào thẻ của họ bên trái khung video.",
  "members.count": "Thành viên: {count}",
  "members.col.member": "Thành viên",
  "members.col.permission": "Quyền",
  "members.col.status": "Trạng thái",
  "members.onlineTag": "Trực tuyến",
  "members.offlineTag": "Ngoại tuyến",
  "members.invite": "Mời người dùng đã đăng ký",
  "members.inviteHint":
    "Họ cần có tài khoản ở đây trước. Với người chưa có, hãy gửi liên kết từ thẻ Lời mời.",
  "members.permission": "Quyền",
  "members.add": "Thêm",
  /* ============================================================
     Room — invites, bans, logs
     ============================================================ */
  "invite.title": "Liên kết mời",
  "invite.desc":
    "Người nhận mở liên kết, đăng nhập (hoặc đăng ký) rồi vào phòng tự động. Liên kết chỉ hiện một lần lúc tạo; cơ sở dữ liệu chỉ lưu bản băm.",
  "invite.activeCount": "Còn hiệu lực: {count}",
  "invite.freshTitle": "Đã tạo liên kết mới — hãy sao chép ngay",
  "invite.freshBody": "Đây là lần duy nhất bạn thấy nó.",
  "invite.linkLabel": "Liên kết mời",
  "invite.hours": "Hiệu lực (giờ)",
  "invite.hoursPlaceholder": "Trống = vĩnh viễn",
  "invite.uses": "Số lần dùng tối đa",
  "invite.usesPlaceholder": "Trống = không giới hạn",
  "invite.create": "Tạo liên kết",
  "invite.creating": "Đang tạo…",
  "invite.col.permission": "Quyền",
  "invite.col.used": "Đã dùng",
  "invite.col.expires": "Hết hạn",
  "invite.unlimitedSuffix": " / ∞",
  "invite.forever": "Không bao giờ",
  "invite.revoke": "Thu hồi",
  "invite.revokeTitle": "Thu hồi liên kết mời",
  "invite.revokeBody":
    "Liên kết mất hiệu lực ngay. Những người đã vào phòng bằng nó không bị ảnh hưởng.",
  "bans.title": "Danh sách chặn",
  "bans.desc":
    "Người trong bảng này không vào được phòng — liên kết mời cũng không có tác dụng với họ. Bỏ chặn không tự thêm họ lại làm thành viên; bạn phải mời lại.",
  "bans.count": "Bị chặn: {count}",
  "bans.emptyTitle": "Danh sách chặn đang trống",
  "bans.emptyBody":
    "Bấm chuột phải vào thẻ thành viên bên trái khung video và chọn « Đưa ra khỏi phòng và chặn » để thêm người vào đây.",
  "bans.col.user": "Người dùng",
  "bans.col.at": "Bị chặn lúc",
  "bans.unban": "Bỏ chặn",
  "logs.title": "Nhật ký thao tác",
  "logs.desc": "Mọi việc đã diễn ra trong phòng này, mới nhất ở trên.",
  "logs.emptyTitle": "Chưa có ghi nhận nào",
  "logs.emptyBody": "Việc tạo phòng, tạo URL phát, thành viên vào ra đều được ghi lại ở đây.",
  "logs.system": "Hệ thống",
  /* ============================================================
     Sync player
     ============================================================ */
  "sync.new.title": "Trình phát đồng bộ mới",
  "sync.new.intro":
    "Sau khi tạo, nó hiện cạnh khung video. Bạn (người tạo) là bên trình chiếu — vị trí phát của bạn là chuẩn, mọi người khác tự khớp theo bạn. Video do trình duyệt của từng người đọc trực tiếp từ nguồn: **nó không bao giờ đi qua máy chủ của trang này, cũng không qua LiveKit**.",
  "sync.new.name": "Tên trình phát",
  "sync.new.namePlaceholder": "ví dụ: Phim tối thứ Sáu",
  "sync.new.create": "Tạo",
  "sync.new.creating": "Đang tạo…",
  "sync.new.accessLabel": "Ai có thể điều khiển",
  "sync.accessLabel": "Quyền điều khiển",
  "sync.accessMembers": "Tất cả thành viên",
  "sync.accessPublishers": "Chỉ người phát",
  "sync.accessOwner": "Chỉ chủ phòng",
  "sync.accessUpdated": "Đã cập nhật quyền truy cập",
  "sync.closed": "Đã đóng trình phát đồng bộ",
  "sync.hostedByYou": "Bạn đang trình chiếu",
  "sync.hostedBy": "{name} đang trình chiếu",
  "sync.waitingForOthers": "Đồng bộ bắt đầu khi có người khác vào",
  "sync.waitingForHost": "Đang chờ bên trình chiếu",
  "sync.inSync": "Đã đồng bộ",
  "sync.drift": "Lệch {value} s",
  "sync.close": "Đóng trình phát này",
  "sync.sdkFailedTitle": "Không tải được trình phát",
  "sync.sdkFailedBody": "Lỗi khi lấy MX Player Pro từ CDN: {message}",
  "sync.sdkFailedHint": "Hãy kiểm tra xem mạng của bạn có vào được cdn.jsdelivr.net không.",
  "sync.playbackError": "Lỗi phát",
  "sync.badSourceTitle": "Nguồn này không phát được",
  "sync.noSourceHost": "Hãy nhập URL video bên dưới",
  "sync.noSourceViewer": "Bên trình chiếu chưa chọn gì",
  "sync.noSourceBody":
    "Video do trình duyệt của bạn đọc trực tiếp từ nguồn bằng yêu cầu Range — không đi qua máy chủ của trang này, cũng không qua LiveKit.",
  "sync.urlLabel": "URL video",
  "sync.urlHint":
    "Nguồn phải cho phép đọc chéo miền từ trang này (CORS) và hỗ trợ yêu cầu Range. Đổi URL sẽ đổi nguồn cho cả phòng.",
  "sync.play": "Phát và đồng bộ",
  "sync.switching": "Đang chuyển…",
  "sync.sourceSwitched": "Đã đổi nguồn — cả phòng chuyển theo",
  "sync.sourceCleared": "Đã xoá nguồn",
  "sync.follow": "Theo bên trình chiếu",
  "sync.followOn":
    "Tự khớp theo vị trí của bên trình chiếu: lệch nhiều thì nhảy, lệch ít thì điều chỉnh nhẹ tốc độ để bắt kịp.",
  "sync.followOff":
    "Đã rời đồng bộ — bạn tự tua thoải mái. Bật lại sẽ nhảy về vị trí của bên trình chiếu.",
  "sync.clock": "Lệch đồng hồ {offset}ms · độ trễ một chiều ≈ {latency}ms",
  "sync.sdkNoExport": "SDK không xuất MXPlayer",
  /* ============================================================
     Browser-side image preparation (lib/client-image.ts)
     ============================================================ */
  "img.notDecodable": "Trình duyệt không giải mã được tệp này thành hình ảnh",
  "img.notImage": "Hãy chọn một tệp hình ảnh",
  "img.tooBig": "Ảnh quá lớn (hơn 25 MB) — hãy nén lại trước khi tải lên",
  "img.noCanvas": "Trình duyệt này không hỗ trợ canvas; hãy thử trình duyệt khác",
  "img.encodeFailed": "Mã hoá hình ảnh thất bại",
  /* ============================================================
     Landing page — chrome, hero, topology
     ============================================================ */
  "landing.meta.description":
    "Chia sẻ màn hình dựa trên LiveKit. Mỗi phòng gắn với bộ khoá LiveKit riêng; đưa màn hình vào phòng bằng OBS hoặc chỉ với một trình duyệt. Cấp quyền diễn ra ở tầng giao thức, và chỉ cần hai biến môi trường là chạy được.",
  "landing.nav.label": "Điều hướng trong trang",
  "landing.nav.paths": "Đường phát",
  "landing.nav.quota": "Hạn mức miễn phí",
  "landing.nav.features": "Tính năng",
  "landing.nav.start": "Bắt đầu nhanh",
  "landing.nav.app": "Ứng dụng máy tính",
  "landing.nav.qa": "Hỏi & đáp",
  "landing.bar.github": "Xem mã nguồn trên GitHub",
  "landing.entry.console": "Mở bảng điều khiển",
  "landing.entry.login": "Đăng nhập / Đăng ký",
  "landing.hero.tag": "Dựa trên **LiveKit** · đa node · chạy không cần cấu hình",
  "landing.hero.h1a": "Mỗi phòng một node,",
  "landing.hero.h1b": "mỗi người một URL phát.",
  "landing.hero.lead":
    "Đưa màn hình tới mọi người trong phòng — bằng OBS, hoặc chỉ với một trình duyệt. Mỗi phòng gắn với bộ khoá LiveKit riêng, nên lưu lượng media và hạn mức miễn phí tiêu trên node đó, không ai tranh của ai.",
  "landing.hero.deploy": "Triển khai lên Vercel",
  "landing.hero.fact1": "Hai biến môi trường là chạy",
  "landing.hero.fact2": "WHIP trực tiếp, không tiêu hạn mức chuyển mã",
  "landing.hero.fact3": "Cấp quyền ở tầng giao thức",
  "landing.topo.title": "Node LiveKit",
  "landing.topo.hint": "Hạn mức riêng",
  "landing.topo.nodeA": "Node A",
  "landing.topo.nodeATag": "Của bạn",
  "landing.topo.nodeB": "Node B",
  "landing.topo.nodeBTag": "Của đồng nghiệp",
  "landing.topo.builtin": "Node tích hợp",
  "landing.topo.builtinTag": "Quản trị viên chia sẻ · tối đa 20 phòng",
  "landing.topo.online": "{count} trực tuyến",
  "landing.topo.idle": "Rỗi",
  "landing.topo.foot":
    "Một phòng chỉ nằm trên đúng một node — lưu lượng và hạn mức miễn phí đều tính cho node đó.",
  /* ============================================================
     Landing page — publish routes
     ============================================================ */
  "landing.paths.eyebrow": "01 · Đường phát",
  "landing.paths.h2": "Có hai đường phát, và chúng độc lập với nhau",
  "landing.paths.lead":
    "Đường trình duyệt chỉ chạm tới trang này đúng một lần — để lấy token; sau đó hình ảnh đi thẳng tới LiveKit. Đường OBS cần máy chủ tạo một ingress trước. Vì thế tắt « phát bằng OBS » vẫn không ảnh hưởng chia sẻ từ trình duyệt.",
  "landing.paths.browser.title": "Chia sẻ từ trình duyệt",
  "landing.paths.browser.body":
    "Một cú bấm, không cần cài gì. 1920×1080@15 fps — chia sẻ màn hình ưu tiên độ phân giải hơn tốc độ khung hình. Hình ảnh không đi qua Vercel cũng không qua Ingress.",
  "landing.paths.obs.title": "Phát bằng OBS (WHIP)",
  "landing.paths.obs.body":
    "Trong phòng, bấm « Tạo URL phát », rồi điền Server và Bearer Token vào cài đặt phát của OBS (dịch vụ: WHIP). Chế độ trực tiếp không chuyển mã, nên gần như không tốn tài nguyên máy và không bao giờ ăn vào hạn mức 60 phút.",
  "landing.paths.hopBrowser": "Trình duyệt",
  "landing.paths.hopNode": "Node LiveKit",
  "landing.paths.hopWhip": "WHIP trực tiếp",

  /* ============================================================
     Landing page — free tier
     ============================================================ */
  "landing.quota.eyebrow": "02 · Vì sao nên tự mang node",
  "landing.quota.h2": "Hạn mức miễn phí là để thử, không phải để chạy sản phẩm",
  "landing.quota.lead":
    "Gói Build miễn phí của LiveKit Cloud tính theo từng project; vượt hạn mức thì yêu cầu chỉ đơn giản là thất bại và không bị tính phí — và nhiều project miễn phí trên cùng một tài khoản chia nhau một hạn mức duy nhất.",
  "landing.quota.tile1Label": "Phút-người WebRTC. Bên phát không tính — chỉ người xem mới tiêu",
  "landing.quota.tile2Label":
    "Băng thông ra. Trong phần lớn tình huống, đây là bức tường bạn chạm đầu tiên",
  "landing.quota.tile3Value": "60 phút",
  "landing.quota.tile3Label":
    "Hạn mức chuyển mã. Đầu vào RTMP luôn phải chuyển mã — chỉ đủ một giờ mỗi tháng",
  "landing.quota.colRate": "Bitrate phát",
  "landing.quota.colMinutes": "Phút-người xem với 50 GB",
  "landing.quota.colHours": "Quy ra giờ-người xem",
  "landing.quota.note4": "1080p bitrate cao",
  "landing.quota.note25": "1080p thông thường",
  "landing.quota.note15": "720p",
  "landing.quota.note08": "Bitrate thấp",
  "landing.quota.tableNote":
    "Khoảng 1,33 Mbps là đường phân định: cao hơn thì 50 GB băng thông hết trước, thấp hơn thì 5.000 phút hết trước. Giờ-người xem còn phải chia cho số người xem — một người chia sẻ cho ba người ở 1080p thì khoảng 15 giờ mỗi tháng.",
  "landing.quota.punch":
    "Vì thế dự án này coi node là công dân hạng nhất: **mỗi người kết nối project của riêng mình**, và hạn mức chuyển từ « một suất cho cả trang » thành « mỗi người một suất ». Node tích hợp chỉ để đỡ trải nghiệm — hãy nhớ giới hạn số phòng cho nó.",
  /* ============================================================
     Landing page — features
     ============================================================ */
  "landing.features.eyebrow": "03 · Tính năng",
  "landing.features.h2": "Mọi thứ đáng giữ đều được chặn ở phía máy chủ",
  "landing.features.lead":
    "Một phép kiểm tra có thể bị vượt qua ở client thì không phải là kiểm tra. Tất cả những điều dưới đây diễn ra ngay tại nơi token được ký và ingress được tạo.",
  "landing.feat.auth.title": "Cấp quyền ở tầng giao thức, không phải lọc ở giao diện",
  "landing.feat.auth.body":
    "Không có trong bảng thành viên → không có token → không kết nối được → không đăng ký được track nào. Trường `room` trong grant chỉ chứa đúng một tên phòng, nên token đó không thể mở phòng khác về mặt vật lý. Người không phải thành viên luôn nhận 404, nên mã phòng chẳng hé lộ điều gì.",
  "landing.feat.nodes.title": "Tự mang node, tự tiêu hạn mức",
  "landing.feat.nodes.body":
    "Kết nối project LiveKit Cloud của riêng bạn và chọn dùng bộ nào cho từng phòng. Trước khi lưu, trang này gọi thật API bằng bộ khoá đó để kiểm tra — bộ khoá sai không bao giờ được lưu — và đồng thời dò xem Ingress có hoạt động để ghi nhận lên node.",
  "landing.feat.whip.title": "OBS qua WHIP trực tiếp",
  "landing.feat.whip.body":
    "`enableTranscoding: false` — không ăn vào 60 phút chuyển mã mỗi tháng. Mỗi người một URL phát, có thể đổi và thu hồi; stream key được mã hoá khi lưu và chỉ giải mã cho chính chủ.",
  "landing.feat.gate.title": "« Phát bằng OBS » là công tắc thật",
  "landing.feat.gate.body":
    "Khi chủ phòng tắt nó, mọi thứ đang phát dừng ngay: ingress bị xoá nên khoá cũ không bao giờ kết nối lại được, và người tham gia `obs:` bị đưa ra khỏi phòng. Không phải một cờ ghi « đã tắt » trong khi luồng vẫn chạy.",
  "landing.feat.sync.title": "Phát đồng bộ",
  "landing.feat.sync.body":
    "Chủ phòng mở một trình phát và cả phòng xem cùng một nguồn. Vị trí phát được phát tán qua data channel của LiveKit, khớp lại sau khi ước lượng độ lệch đồng hồ giữa hai máy bằng ping/pong; các byte video không hề chạm tới dịch vụ này.",
  "landing.feat.invite.title": "Liên kết mời",
  "landing.feat.invite.body":
    "Chỉ bản băm của token được lưu; liên kết có thể có thời hạn, giới hạn số lần dùng, và thu hồi bất cứ lúc nào. Việc dùng liên kết chiếm suất một cách nguyên tử bằng một câu UPDATE có điều kiện, nên truy cập đồng thời không thể xuyên qua `max_uses`; mở liên kết khi chưa đăng nhập sẽ qua trang đăng nhập rồi vào phòng tự động.",
  "landing.feat.env.title": "Hai biến môi trường là chạy",
  "landing.feat.env.body":
    "`DATABASE_URL` và `ADMIN_PASSWORD`. Tài khoản quản trị được tạo ở lần khởi động đầu, khoá mã hoá bộ khoá tự sinh và lưu vào cơ sở dữ liệu nếu chưa đặt, còn LiveKit thì cấu hình trên giao diện web chứ không qua biến môi trường. Không có trình hướng dẫn cài đặt.",
  "landing.feat.health.title": "Có chỗ để xem khi hỏng",
  "landing.feat.health.body":
    "Mỗi phòng có nhật ký thao tác mở rộng được (không bao giờ ghi khoá bí mật). `/api/health` không cần đăng nhập và báo cáo từng mục: cơ sở dữ liệu có kết nối được không, đủ 12 bảng chưa, khởi tạo đã chạy chưa — nó liệt kê chính xác những bảng còn thiếu để bạn không phải đoán từ vết lỗi.",
  /* ============================================================
     Landing page — quick start
     ============================================================ */
  "landing.start.eyebrow": "04 · Bắt đầu nhanh",
  "landing.start.h2": "Ba bước để tự chạy một bản của riêng bạn",
  "landing.start.lead":
    "Trang này không kèm máy chủ media, nên thứ thực sự cần chỉ là một cơ sở dữ liệu và một bộ khoá LiveKit.",
  "landing.start.step1Title": "Điền hai biến môi trường",
  "landing.start.step1Body":
    "Sao chép `.env.example` thành `.env.local` — Next không đọc tệp trước, nên sửa sai tệp thì chẳng có gì xảy ra.",
  "landing.start.passwordPlaceholder": "đặt-mật-khẩu-của-bạn",
  "landing.start.step2Title": "Tạo bảng, khởi chạy",
  "landing.start.step2Comment": "# tạo 12 bảng",
  "landing.start.step2Body":
    "Rồi đăng nhập bằng `admin@localhost` với mật khẩu ở trên: tài khoản quản trị được tạo ở lần khởi động đầu, và không có trình hướng dẫn cài đặt. Trên Vercel, bước migrate đã nằm trong quy trình build nên bạn không cần chạy tay.",
  "landing.start.step3Title": "Kết nối một node LiveKit",
  "landing.start.step3Body1":
    "Thanh bên « Node LiveKit » → « Kết nối node », rồi điền URL `wss://` cùng API Key / Secret. Gói Build miễn phí của LiveKit Cloud không cần thẻ, và mất khoảng ba phút để có ba giá trị đó; trước khi lưu, trang này kiểm tra thật và từ chối lưu giá trị sai.",
  "landing.start.step3Body2":
    "LiveKit tự dựng cũng được (ô URL nhận `ws://`), nhưng khi đó muốn phát từ OBS thì bạn phải tự triển khai Ingress và Redis.",

  /* ============================================================
     Landing page — desktop app teaser
     ============================================================ */
  "landing.app.eyebrow": "05 · Sắp tới",
  "landing.app.h2a": "Chúng tôi đang cân nhắc một ứng dụng máy tính:",
  "landing.app.lead":
    "Một ứng dụng nhắn tin tự dựng, mã hoá đầu-cuối, và cũng chia sẻ được màn hình — trang này chỉ là nửa « màn hình »; nửa « nhắn tin » thì không thể làm gọn gàng trong trình duyệt.",
  "landing.app.badge": "Giai đoạn ý tưởng",
  "landing.app.note":
    "Việc phát triển **chưa bắt đầu** và cũng chưa có lịch — phần này chỉ là lời báo trước. Nó ở đây để xem có ai thực sự cần hay không, bởi chính điều đó mới làm nó đáng làm.",
  "landing.app.idea1.title": "Mã hoá đầu-cuối",
  "landing.app.idea1.body":
    "Tin nhắn và nội dung chia sẻ được mã hoá và giải mã ở hai đầu; máy chủ chỉ chuyển tiếp bản mã — có nắm được máy chủ cũng không đọc được nội dung trò chuyện.",
  "landing.app.idea2.title": "Tự dựng",
  "landing.app.idea2.body":
    "Bạn tự chạy máy chủ: tài khoản, tin nhắn và khoá không cần giao cho bên thứ ba. Giống như trang này, và cũng không có kiểu bắt buộc kích hoạt qua mạng.",
  "landing.app.idea3.title": "Trò chuyện và màn hình ở cùng một nơi",
  "landing.app.idea3.body":
    "Văn bản, tệp và chia sẻ màn hình trong cùng một ứng dụng, khỏi phải mở ứng dụng họp cạnh ứng dụng chat.",
  "landing.app.idea4.title": "Ứng dụng máy tính thật sự",
  "landing.app.idea4.body":
    "Ứng dụng cho Windows / macOS / Linux chứ không phải một thẻ trình duyệt — thu cả màn hình, chạy thường trú, khởi động cùng hệ thống là những thứ trình duyệt không cho được.",
  "landing.app.footNote":
    "Nếu bạn thấy hứng thú, hoặc thấy chỗ nào chúng tôi nghĩ sai, hãy nói. Phản hồi hữu ích nhất là **bạn sẽ thay thế cái gì bằng nó** — giá trị hơn nhiều so với « ý tưởng hay ».",
  "landing.app.issues": "Mở một issue",
  "landing.app.contact": "Liên hệ",
  /* ============================================================
     Landing page — Q&A
     ============================================================ */
  "landing.qa.eyebrow": "06 · Hỏi & đáp",
  "landing.qa.h2": "Câu hỏi thường gặp",
  "landing.qa.lead":
    "Mọi câu trả lời dưới đây đều truy được về mã nguồn hoặc README. Điều gì chưa có ở đây, hãy dùng hai liên kết ở phần trước.",
  "landing.qa.q1": "Tôi có phải tự lo máy chủ không?",
  "landing.qa.a1":
    "Không cần máy chủ media. Trang này triển khai lên Vercel + Neon (cả hai đều có gói miễn phí), hình ảnh đi qua LiveKit Cloud, và bạn chỉ cần một bộ khoá LiveKit — gói Build miễn phí không cần thẻ. Tự dựng hoàn toàn cũng được: ô URL nhận `ws://`, nhưng khi đó muốn phát từ OBS thì bạn phải tự triển khai Ingress và Redis.",
  "landing.qa.q2": "Hạn mức miễn phí thực sự dùng được bao lâu?",
  "landing.qa.a2":
    "Phần lớn trường hợp bạn chạm 50 GB băng thông ra trước khi hết 5.000 phút-người. Một người chia sẻ cho ba người xem ở 1080p thì khoảng 15 giờ mỗi tháng. Vì thế dự án này cho mỗi người kết nối project LiveKit của riêng mình: hạn mức chuyển từ « một suất của chủ trang » thành « mỗi người một suất ».",
  "landing.qa.q3": "Hình ảnh màn hình có đi qua máy chủ của các bạn không?",
  "landing.qa.a3":
    "Không. Với chia sẻ từ trình duyệt, trang này được gọi đúng một lần — để lấy token; sau đó hình ảnh nối thẳng tới node LiveKit. Trình phát đồng bộ còn triệt để hơn: các byte video do chính trình duyệt của bạn lấy trực tiếp từ nguồn bằng yêu cầu Range, không qua dịch vụ này cũng không qua LiveKit.",
  "landing.qa.q4": "Có bắt buộc cài OBS không?",
  "landing.qa.a4":
    "Không. Một cú bấm là chia sẻ được từ trình duyệt (`getDisplayMedia`, 1920×1080@15 fps — chia sẻ màn hình ưu tiên độ phân giải hơn tốc độ khung hình). Đường OBS dành cho ai cần nhiều cảnh, hiệu ứng chuyển và lớp phủ; nó dùng WHIP trực tiếp và không tiêu hạn mức chuyển mã.",
  "landing.qa.q5": "Có mã phòng là ai cũng vào được sao?",
  "landing.qa.a5":
    "Không. Bảng thành viên là căn cứ duy nhất để cấp quyền: không có trong bảng thì không có token, và do đó không đăng ký được track nào. Token đã ký chỉ chứa đúng một tên phòng nên không thể mở phòng khác; yêu cầu từ người không phải thành viên luôn trả 404, nên bạn còn chẳng biết được phòng đó có tồn tại hay không.",
  "landing.qa.q6": "Nếu tắt « phát bằng OBS », luồng đang phát có bị ngắt không?",
  "landing.qa.a6":
    "Có, ngắt ngay. Ngay lúc đó máy chủ xoá ingress (stream key cũ không bao giờ kết nối lại được) và đưa người tham gia `obs:` ra khỏi phòng. Đây không phải một cờ chỉ đổi nhãn thành « đã tắt » trong khi luồng vẫn chạy. Chia sẻ từ trình duyệt là đường khác và không bị ảnh hưởng.",
  "landing.qa.q7": "Nếu cơ sở dữ liệu bị lấy mất thì khoá của dịch vụ ngoài có lộ theo không?",
  "landing.qa.a7":
    "Không. Khoá của GitHub / Google / Turnstile / Resend đều được mã hoá AES-256-GCM trước khi lưu, và khoá chủ có thể nằm ngoài cơ sở dữ liệu qua `CREDENTIAL_ENCRYPTION_KEY`. Không API nào trả về khoá dạng rõ; trang quản trị chỉ hiện bản che.",
  "landing.qa.q8": "Tôi có thể giữ trang cho riêng mình và không cho người lạ đăng ký không?",
  "landing.qa.a8":
    "Được. Quản trị → « Cài đặt trang » → tắt « Cho phép đăng ký »: đăng ký bằng email/mật khẩu, lần đầu đăng nhập ngoài và lần đầu đăng nhập bằng mã email đều bị chặn cùng lúc và nhận về « trang này đã tắt đăng ký », còn tài khoản hiện có vẫn đăng nhập như thường. Việc chặn diễn ra ở phía máy chủ, không phải ẩn một cái nút.",

  /* ============================================================
     Landing page — closing + footer
     ============================================================ */
  "landing.closing.h2": "Tạo một phòng và đưa màn hình sang đó",
  "landing.closing.body":
    "Đăng ký để có không gian làm việc riêng, nơi bạn kết nối node LiveKit của mình. Nếu ai gửi bạn liên kết mời, chỉ cần mở rồi đăng nhập — bạn sẽ vào phòng tự động.",
  "landing.closing.source": "Đọc mã nguồn",
  "landing.closing.badge": "07 · Bắt đầu",
  "landing.closing.step1": "Tạo phòng",
  "landing.closing.step2": "Gửi liên kết mời",
  "landing.closing.step3": "Đưa màn hình sang",
  "landing.footer.links": "Liên kết liên quan",
  "landing.footer.docs": "Tài liệu",
  "landing.footer.deploy": "Hướng dẫn triển khai",
  "landing.footer.livekit": "Tài liệu LiveKit",
  "landing.footer.stack":
    "Next.js 15 · React 19 · Drizzle + Neon Postgres · LiveKit — giao diện là một design system riêng, không dùng framework UI và không dùng Tailwind.",
  /* ============================================================
     Server-side API messages.

     Route handlers throw `ApiError`s whose `message` is one of these keys; the
     `route()` wrapper translates it once, using the locale of the request that
     caused it. See lib/http.ts.
     ============================================================ */
  "api.unauthorized": "Vui lòng đăng nhập trước",
  "api.forbidden": "Bạn không có quyền",
  "api.notFound": "Không tìm thấy",
  "api.internal": "Lỗi máy chủ",
  "api.badJson": "Nội dung yêu cầu không phải JSON hợp lệ",
  "api.badParams": "Tham số không hợp lệ",
  "api.needAdmin": "Cần quyền quản trị viên",
  "api.notReady":
    "Máy chủ chưa sẵn sàng: không kết nối được cơ sở dữ liệu, hoặc thiếu một biến môi trường bắt buộc. Hãy mở /api/health để xem chính xác thiếu gì.",
  "api.registrationClosed":
    "Trang này đã tắt đăng ký. Nếu cần tài khoản, hãy liên hệ quản trị viên.",

  "api.admin.missingNodeId": "Thiếu nodeId",
  "api.admin.noFields": "Không có gì để cập nhật",
  "api.admin.nodeNotFound": "Không có node đó",
  "api.adminUser.selfEdit": "Bạn không thể tự đổi vai trò hoặc trạng thái của mình",
  "api.adminUser.noFields": "Không có gì để cập nhật",
  "api.adminUser.lastAdmin": "Trang phải còn ít nhất một quản trị viên đang hoạt động",
  "api.adminUser.notFound": "Không có người dùng đó",
  "api.cron.noSecret": "Chưa cấu hình CRON_SECRET; từ chối các lệnh gọi từ bên ngoài",
  "api.cron.badSecret": "Thông tin xác thực không đúng",
  "api.services.badService": "Tham số service không hợp lệ",

  "api.node.notFound": "Không có node đó",
  "api.node.rotateBothRequired": "Đổi khoá cần cả API Key và API Secret",
  "api.node.rotateFailed": "Bộ khoá mới không qua kiểm tra: {error}",
  "api.node.noFields": "Không có gì để cập nhật",
  "api.node.builtinNoDelete": "Không xoá được node tích hợp — hãy tắt nó ở trang quản trị",
  "api.node.hasActiveRooms":
    "Node này vẫn còn phòng đang hoạt động; hãy đóng chúng trước khi xoá",
  "api.node.disabled": "Node « {name} » đã bị tắt",
  "api.node.notYours": "Bạn không dùng được node do người khác kết nối",
  "api.node.builtinNotPublic":
    "Node tích hợp không mở cho người dùng thường — hãy kết nối project LiveKit Cloud của riêng bạn",
  "api.node.builtinRoomLimit":
    "Node tích hợp đã đạt giới hạn phòng ({max}); hãy kết nối node của riêng bạn",
  "api.node.credsCheckFailed": "Kiểm tra bộ khoá thất bại: {error}",
  "api.node.probeFailed": "Không kết nối được, hoặc bộ khoá không hợp lệ",
  "api.node.duplicate": "Bộ khoá này đã được kết nối",
  "api.auth.emailTaken": "Email này đã được đăng ký",
  "api.login.badCredentials": "Email hoặc mật khẩu không đúng",
  "api.login.adminNotConfigured":
    "Tài khoản quản trị chưa được tạo: biến môi trường ADMIN_PASSWORD đang trống. Hãy đặt một giá trị khác trống, khởi động lại, rồi đăng nhập bằng {email}.",
  "api.account.disabled": "Tài khoản này đã bị tắt.",
  "api.account.unverifiedLink":
    "{email} đã có tài khoản ở đây, nhưng {provider} chưa xác nhận địa chỉ này thuộc về bạn nên không thể liên kết tự động. Hãy đăng nhập bằng mật khẩu hoặc mã email trước, rồi liên kết trong trang cá nhân.",

  "api.code.tooFast": "Gửi quá dày — hãy thử lại sau {seconds} giây.",
  "api.code.tooManyToday":
    "Hôm nay địa chỉ này đã yêu cầu quá nhiều mã. Hãy thử lại sau một giờ.",
  "api.code.noPending": "Không có mã nào đang chờ xác minh — hãy bấm « Gửi mã » trước.",
  "api.code.expired": "Mã này đã hết hạn. Hãy lấy mã mới.",
  "api.code.wrongLeft": "Mã không đúng — còn {left} lần thử.",
  "api.code.tooManyWrong": "Sai mã quá nhiều lần. Hãy lấy mã mới.",
  "api.captcha.required": "Hãy hoàn tất xác minh người thật trước",
  "api.captcha.unreachable":
    "Không liên lạc được dịch vụ xác minh người thật; hãy thử lại sau ít phút",
  "api.captcha.expired": "Xác minh người thật đã hết hiệu lực — hãy xác minh lại",
  "api.captcha.badSecret":
    "Xác minh người thật bị cấu hình sai: Secret Key không đúng. Hãy liên hệ quản trị viên",
  "api.captcha.failed": "Xác minh người thật không qua; hãy thử lại",

  "api.oauth.unsupported": "Không hỗ trợ cách đăng nhập này",
  "api.oauth.userCancelled": "Bạn đã huỷ việc đăng nhập bằng dịch vụ ngoài.",
  "api.oauth.providerReturned": "Nhà cung cấp trả về: {error}",
  "api.oauth.missingCode": "Lệnh gọi lại thiếu tham số code",
  "api.oauth.failed": "Đăng nhập bằng dịch vụ ngoài thất bại. Hãy thử lại, hoặc dùng email.",
  "api.oauth.missingState": "Lệnh gọi lại thiếu tham số state",
  "api.oauth.staleState":
    "Yêu cầu đăng nhập này không còn hiệu lực — hãy bắt đầu lại việc đăng nhập ngoài.",
  "api.oauth.stateTimeout": "Yêu cầu đăng nhập đã quá thời gian (hơn 10 phút) — hãy làm lại.",
  "api.oauth.unreachable":
    "Không liên lạc được dịch vụ đăng nhập ngoài; hãy thử lại sau ít phút.",
  "api.oauth.providerStatus": "API của nhà cung cấp trả về {status}",
  "api.oauth.noAccessToken": "Nhà cung cấp không trả về access_token",
  "api.oauth.loginFailed": "Đăng nhập bằng dịch vụ ngoài thất bại: {reason}",
  "api.oauth.githubNoId": "GitHub không trả về id tài khoản",
  "api.oauth.googleNoSub": "Google không trả về sub tài khoản",

  "api.rate.emailTooMany": "Thử đăng nhập quá nhiều lần; hãy thử lại sau 15 phút",
  "api.rate.ipTooMany": "Mạng này thử đăng nhập quá nhiều lần; hãy thử lại sau",
  "api.mail.unreachable": "Không liên lạc được dịch vụ email; hãy thử lại sau ít phút.",
  "api.mail.failed": "Không gửi được email: {detail}",
  "api.svc.notConfigured":
    "{name} chưa được cấu hình — hãy nhờ quản trị viên điền ở « Quản trị → Dịch vụ ngoài ».",
  "api.svc.firstSecretRequired": "Lần cấu hình đầu bắt buộc phải có khoá bí mật",
  "api.svc.maskUndecryptable": "(không giải mã được, hãy nhập lại)",
  "api.room.notFound": "Không có phòng đó",
  "api.room.ownerOnly": "Chỉ chủ phòng làm được việc này",
  "api.room.userBanned": "Người dùng này đang trong danh sách chặn của phòng; hãy bỏ chặn trước.",
  "api.rooms.noNode":
    "Không chỉ định node, và trang này cũng không có node tích hợp nào dùng được",
  "api.rooms.codeConflict": "Mã phòng bị trùng — hãy thử lại",
  "api.token.roomClosed": "Phòng đã đóng",
  "api.token.nodeDisabled": "Node chứa phòng này đã bị tắt",
  "api.token.removed": "Bạn đã bị đưa ra khỏi phòng này.",

  "api.members.emailNotRegistered": "Email này chưa có tài khoản trên trang",
  "api.members.accountDisabled": "Tài khoản đó đã bị tắt",
  "api.members.alreadyMember": "Người dùng đó đã là thành viên của phòng",
  "api.members.cantChangeOwner": "Không đổi được quyền của chủ phòng",
  "api.members.notMember": "Người dùng đó không phải thành viên của phòng",
  "api.members.missingUserId": "Thiếu userId",
  "api.members.cantRemoveOwner": "Không đưa chủ phòng ra khỏi phòng được",
  "api.bans.missingUserId": "Thiếu userId",
  "api.bans.notBanned": "Người này không có trong danh sách chặn",
  "api.invites.missingId": "Thiếu id",
  "api.invite.banned":
    "Bạn đã bị đưa ra khỏi phòng này, nên liên kết mời không có tác dụng với bạn.",
  "api.invite.invalid": "Liên kết mời này không hợp lệ hoặc đã hết hiệu lực",
  "api.invite.notFound": "Không có lời mời đó",

  "api.ingress.notGenerated": "Chưa tạo URL phát cho bạn",
  "api.ingress.roomClosed": "Phòng đã đóng",
  "api.ingress.gateClosed":
    "Cổng « phát bằng OBS » của phòng này đang đóng — hãy nhờ chủ phòng mở trước khi tạo URL phát",
  "api.ingress.noPermission": "Bạn không có quyền phát trong phòng này",
  "api.ingress.nodeNoIngress":
    "Ingress của node này không dùng được (chưa bật hoặc hết hạn mức), nên không tạo được URL phát OBS",
  "api.ingress.noWhipUrl":
    "LiveKit không trả về URL WHIP — hãy kiểm tra xem project đó có Ingress dùng được không",
  "api.ingress.nothingToRevoke": "Không có URL phát nào để thu hồi",
  "api.sync.roomClosed": "Phòng đã đóng",
  "api.sync.tooMany":
    "Một phòng mở đồng thời tối đa {max} trình phát đồng bộ — hãy đóng một cái trước.",
  "api.sync.notFound": "Trình phát đồng bộ này không tồn tại, hoặc đã bị đóng",
  "api.sync.notAllowed": "Chỉ người tạo hoặc chủ phòng điều khiển được trình phát này",
  "api.image.badKind": "kind chỉ có thể là avatar hoặc banner",
  "api.image.notFound": "Không có ảnh đó",
  "api.image.badFormat": "Định dạng ảnh không đúng: cần một data URL base64",
  "api.image.unsupportedType":
    "Không hỗ trợ định dạng ảnh này ({mimeType}); hãy dùng PNG / JPEG / WebP",
  "api.image.tooBigEstimated": "Ảnh quá lớn (khoảng {size} KB); giới hạn là {limit} KB",
  "api.image.empty": "Ảnh trống",
  "api.image.tooBig": "Ảnh quá lớn ({size} KB); giới hạn là {limit} KB",
  "api.image.contentMismatch": "Nội dung tệp không khớp với định dạng ảnh đã khai báo",
  /* ============================================================
     Diagnostics: /api/health and database error hints
     ============================================================ */
  "api.health.set": "Đã đặt",
  "api.health.dbUrlMissing": "Thiếu DATABASE_URL — đây là thiết lập bắt buộc duy nhất",
  "api.health.dbOk": "Đã kết nối",
  "api.health.dbFail": "Không kết nối được: {message}",
  "api.health.tablesOk": "Đủ {count} bảng",
  "api.health.tablesMissing":
    "Thiếu {count} bảng ({list}) — bước migrate chưa chạy, hoặc chỉ chạy nửa. Hãy chạy npm run db:migrate trên cơ sở dữ liệu này.",
  "api.health.tablesFail": "Không đọc được danh sách bảng: {message}",
  "api.health.adminPasswordMissing":
    "Thiếu ADMIN_PASSWORD (chuỗi rỗng cũng tính) — tài khoản quản trị sẽ không được tạo",
  "api.health.bootReady": "Sẵn sàng; email quản trị {email}",
  "api.health.bootReadyNoAdmin":
    "Sẵn sàng, nhưng chưa tạo tài khoản quản trị (ADMIN_PASSWORD đang trống)",
  "api.health.bootFailed": "Khởi tạo lúc chạy thất bại",
  "api.health.keyFromEnv": "Lấy từ CREDENTIAL_ENCRYPTION_KEY",
  "api.health.keyAuto":
    "Tự sinh và lưu trong cơ sở dữ liệu (muốn cách ly mạnh hơn thì hãy đặt biến này tường minh)",
  "api.health.keyPending": "Chưa nạp — hãy xử lý các mục lỗi ở trên trước",
  "api.db.rawPrefix": " Lỗi gốc: ",
  "api.db.unknown": "Truy vấn cơ sở dữ liệu thất bại vì lý do không rõ.",
  "api.db.42P01":
    "Bảng không tồn tại — bước migrate chưa chạy. Hãy chạy npm run db:migrate trên cơ sở dữ liệu này.",
  "api.db.42703":
    "Cột không tồn tại — bước migrate chỉ chạy nửa. Hãy chạy lại npm run db:migrate.",
  "api.db.3F000": "Schema không tồn tại — hãy kiểm tra tên cơ sở dữ liệu trong chuỗi kết nối.",
  "api.db.3D000": "Cơ sở dữ liệu không tồn tại — tên trong chuỗi kết nối bị sai.",
  "api.db.28P01": "Xác thực mật khẩu thất bại — mật khẩu trong chuỗi kết nối bị sai.",
  "api.db.28000":
    "Bị từ chối xác thực — tên người dùng hoặc quyền của nó trong chuỗi kết nối bị sai.",
  "api.db.53300": "Quá nhiều kết nối — hãy chuyển sang chuỗi kết nối pooled của Neon.",
  "api.db.08006":
    "Kết nối bị ngắt — hãy kiểm tra mạng, và xem instance Neon có đang tạm dừng hoặc đã bị xoá không.",
  "api.db.57P03":
    "Cơ sở dữ liệu đang khởi động — Neon khởi động lạnh; hãy đợi vài giây rồi thử lại.",
  /* ============================================================
     Validation messages.

     These live in the zod schemas as *keys* (lib/validation.ts stays a pure,
     dependency-free data module) and are translated by parseOr400.
     ============================================================ */
  "valid.wsUrlRequired": "URL LiveKit không được để trống",
  "valid.wsUrlInvalid": "Đây không phải URL LiveKit hợp lệ",
  "valid.emailFormat": "Địa chỉ email không đúng định dạng",
  "valid.emailTooLong": "Địa chỉ email quá dài",
  "valid.apiKeyShort": "API Key quá ngắn",
  "valid.apiSecretShort": "API Secret quá ngắn",
  "valid.nodeName": "Hãy đặt tên cho node",
  "valid.passwordRequired": "Hãy nhập mật khẩu",
  "valid.passwordShort": "Mật khẩu phải có ít nhất 8 ký tự",
  "valid.codeSixDigits": "Mã gồm 6 chữ số",
  "valid.roomName": "Tên phòng không được để trống",
  "valid.atLeastOneSetting": "Hãy thay đổi ít nhất một thiết lập",
  "valid.displayName": "Tên hiển thị không được để trống",
  "valid.playerName": "Hãy đặt tên cho trình phát",
  "valid.sourceUrlScheme": "URL phải bắt đầu bằng http:// hoặc https://",
  "valid.fieldRequired": "Ô này không được để trống",

  /* ============================================================
     Verification-code email
     ============================================================ */
  "mail.subject": "{code} là mã xác minh {app} của bạn",
  "mail.title": "Mã xác minh {app}",
  "mail.preview": "Mã xác minh {code}, có hiệu lực {minutes} phút.",
  "mail.lead": "Hãy dùng mã dưới đây để tiếp tục đăng nhập:",
  "mail.validity": "Có hiệu lực {minutes} phút và chỉ dùng được một lần.",
  "mail.textLead": "Mã đăng nhập của bạn là: {code}",
  "mail.textSafety":
    "Nếu không phải bạn, cứ bỏ qua email này — không có mã thì không ai vào được.",
  "mail.safety":
    "Không phải bạn đăng nhập? Cứ bỏ qua email này — không có mã này thì không ai vào được. Trang này sẽ không bao giờ hỏi bạn mã đó qua bất kỳ kênh nào.",
  "mail.autoSent": "Email này do {host} gửi tự động.",
};

export default vi;
