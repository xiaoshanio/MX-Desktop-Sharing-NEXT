[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [日本語](README.ja.md) · **Tiếng Việt**

# MX-Desktop-Sharing-NEXT

Chia sẻ màn hình dựa trên LiveKit. Ý tưởng cốt lõi: **mỗi phòng một node, mỗi người một URL phát**.

- **Phòng gắn với một node LiveKit.** Khi tạo phòng bạn chọn nó dùng bộ khoá LiveKit nào, và lưu lượng media cùng hạn mức miễn phí của phòng đó sẽ tiêu trên node ấy.
- **Người dùng thường tự mang node.** Mỗi người kết nối project LiveKit Cloud của riêng mình, tiêu hạn mức của mình và không tranh với ai.
- **Node tích hợp làm chỗ đỡ.** Quản trị viên có thể nâng bất kỳ node nào thành « tích hợp » để cả trang dùng chung, kèm công tắc cho phép người dùng thường sử dụng hay không và giới hạn số phòng.
- **Cấp quyền diễn ra ở tầng giao thức.** Không có trong bảng thành viên → không có token → không kết nối được phòng → không đăng ký được track nào. Đây không phải lọc ở phía giao diện.
- **OBS đi qua WHIP trực tiếp.** `enableTranscoding: false`, nên 60 phút chuyển mã mỗi tháng không bao giờ bị dùng tới.
- **« Phát bằng OBS » là công tắc thật.** Chủ phòng có thể đóng cửa WHIP của phòng bằng một cú bấm: thứ đang phát bị ngắt ngay, và mọi URL phát đã phát ra đều mất hiệu lực. Chia sẻ từ trình duyệt là đường khác và không bị ảnh hưởng.
- **Hai biến môi trường là đủ để chạy.** Tài khoản quản trị được tạo tự động, khoá mã hoá được cấp tự động, còn LiveKit thì cấu hình trên giao diện web.

Để triển khai trang này lên Vercel, xem [DEPLOY.md](DEPLOY.md).

## Bắt đầu nhanh

Bạn chỉ cần hai biến môi trường. Sao chép `.env.example` thành `.env.local` (Next **không đọc** chính
`.env.example` — sửa tệp đó không có tác dụng gì) rồi điền hai giá trị này:

```bash
DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
ADMIN_PASSWORD=đặt-mật-khẩu-của-bạn
```

**Dấu ngoặc kép là không bắt buộc** — có hay không thì kết quả phân tích vẫn như nhau. Ngoại lệ duy nhất
là giá trị chứa `#`: không có ngoặc kép thì nó bị âm thầm cắt như một chú thích, nên trường hợp đó hãy
thêm ngoặc. `ADMIN_PASSWORD` phải khác trống; để `""` tính như chưa đặt và tài khoản quản trị sẽ không
được tạo.

Sau đó tạo bảng và khởi chạy:

```bash
npm install
npm run db:migrate
npm run dev
```

`db:migrate` đọc các tệp migration trong `drizzle/` và tạo 12 bảng. Nó đọc cùng bộ tệp env với ứng dụng
(`.env.local` ưu tiên hơn `.env`). **Khi triển khai lên Vercel bạn không chạy lệnh này bằng tay** —
bước migration đã nằm trong quy trình build, nên chỉ cần cấu hình `DATABASE_URL` rồi push code; chi tiết
xem [DEPLOY.md](DEPLOY.md).

Mở `http://localhost:3000` và đăng nhập bằng `admin@localhost` với mật khẩu ở trên —
**tài khoản quản trị được tạo ở lần khởi động đầu, và không có trình hướng dẫn cài đặt**.

Sau khi đăng nhập, vào « Node LiveKit » ở thanh bên → « Kết nối node » và cấu hình một node LiveKit
(cách lấy bộ khoá ở mục sau). LiveKit không chiếm biến môi trường nào.

Các lệnh khác: `npm test` (137 kiểm tra), `npm run typecheck`, `npm run build`.
`build` chạy migration cơ sở dữ liệu trước (bỏ qua nếu `DATABASE_URL` chưa đặt); muốn biên dịch mà không
chạm vào cơ sở dữ liệu thì dùng `npm run build:only`.

### Đăng nhập báo lỗi?

**Hãy mở `/api/health` trước** — nó báo trạng thái từng bước, không cần đăng nhập, và nhanh hơn nhiều so
với việc đoán từ vết lỗi.

```bash
curl -s http://localhost:3000/api/health | python -m json.tool
```

Năm mục theo thứ tự: `DATABASE_URL` đã đặt chưa → cơ sở dữ liệu có kết nối được không →
**12 bảng đã được tạo chưa** → `ADMIN_PASSWORD` đã đặt chưa → bước khởi tạo lúc chạy có qua không. Mục sau
bị bỏ qua khi mục trước còn lỗi, nên bạn chỉ cần sửa mục đỏ trên cùng.

Endpoint đăng nhập tách mã trạng thái theo nguyên nhân:

| Phản hồi | Ý nghĩa |
| --- | --- |
| `503 not_configured` | Không kết nối được cơ sở dữ liệu, chưa có bảng, hoặc `DATABASE_URL` chưa đặt |
| `503 admin_not_configured` | Cơ sở dữ liệu vẫn tốt, nhưng `ADMIN_PASSWORD` trống nên tài khoản quản trị chưa từng được tạo |
| `401 invalid_credentials` | Tài khoản có tồn tại, mật khẩu sai |
| `429 rate_limited` | 8 lần thất bại cho cùng một email trong 15 phút (30 lần từ cùng một IP) |

Trường hợp dễ chẩn đoán sai nhất: **bảng chưa được tạo**. Triệu chứng là `database` hiện « Đã kết nối »
trong khi mọi endpoint chạm tới bảng đều lỗi — vì kết nối và tạo bảng là hai việc khác nhau. Mục `tables`
trong `/api/health` liệt kê chính xác những bảng còn thiếu. Khi triển khai, quy trình build tạo chúng tự
động; ở máy cục bộ hãy bù bằng `npm run db:migrate`.

Đã chạy `db:migrate` mà vẫn không có bảng? Kiểm tra xem `drizzle/meta/_journal.json` có tồn tại không.
Khi drizzle-kit không tìm thấy nó, nó **không báo lỗi** — nó âm thầm tạo một tệp rỗng rồi không làm gì cả.
`tests/migrations.test.mts` canh đúng chỗ này. Nếu gặp thật, `npm run db:push` có thể bỏ qua các tệp
migration và tạo bảng trực tiếp từ `schema.ts`.

### Danh sách biến môi trường

| Biến | Bắt buộc | Mặc định / ghi chú |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Chuỗi kết nối Neon |
| `ADMIN_PASSWORD` | ✅ | Phải khác trống. Đổi giá trị này rồi khởi động lại là đổi được mật khẩu |
| `ADMIN_EMAIL` | | `admin@localhost` |
| `CREDENTIAL_ENCRYPTION_KEY` | | Nếu không đặt thì tự sinh ở lần khởi động đầu và lưu vào cơ sở dữ liệu (xem phần bàn về đánh đổi trong [DEPLOY.md](DEPLOY.md#关于自动生成的加密密钥)) |
| `NEXT_PUBLIC_APP_URL` | | Nếu không đặt thì suy ra từ header của yêu cầu |
| `CRON_SECRET` | | Bảo vệ endpoint dọn dẹp định kỳ |

### Chỉ dùng cho người trong nhà (đóng đăng ký)

**Quản trị → « Cài đặt trang » → tắt « Cho phép đăng ký ».** Công tắc nằm trong bảng `app_config` (khoá
`registration_enabled`), không chiếm biến môi trường nào và có hiệu lực ngay, không cần triển khai lại.
Khi khoá không tồn tại thì mặc định là **mở** — nâng cấp một bản triển khai cũ không bao giờ bất ngờ khoá
ai ở ngoài.

Điểm then chốt là **có ba đường tạo tài khoản, và đóng một đường nghĩa là phải đóng cả ba**, nếu không thì
coi như bạn chưa đóng gì:

| Cửa vào | Hành vi sau khi đóng |
| --- | --- |
| Email + mật khẩu | `POST /api/auth/register` trả về thẳng `403 registration_closed` |
| GitHub / Google | Tài khoản đã liên kết vẫn đăng nhập như thường; ai chưa liên kết mà địa chỉ cũng không có ở đây thì bị từ chối ngay bước tạo tài khoản |
| Mã qua email | Tương tự — tài khoản hiện có vẫn đăng nhập như thường, địa chỉ mới không còn tạo tài khoản |

Vì vậy phép kiểm tra không được viết ở cửa vào của ba route; nó được gom vào `assertRegistrationOpen()`
trong `src/lib/site-settings.ts` và được gọi bởi **hai chỗ thực sự insert vào users** (hai hàm resolve
trong `src/lib/accounts.ts`, cùng với route register). Đăng nhập ngoài và đăng nhập bằng mã email thực chất
đều là « có tài khoản thì đăng nhập, không thì tạo một cái »; chỉ nửa sau nên bị chặn, còn nửa đầu phải tiếp
tục hoạt động.

Hai lựa chọn có chủ ý về vị trí chặn:

- **Đường mã email bị chặn *sau* khi xác minh, không phải *trước* khi gửi.** Endpoint gửi trả về cùng một
  phản hồi bất kể địa chỉ có trong cơ sở dữ liệu hay không (nếu không nó trở thành một endpoint để dò danh
  sách người dùng); chặn ở bước đó sẽ phá mất tính chất này.
- **Trong route register, việc chặn đứng trước phần xác minh người thật.** Token Turnstile chỉ dùng một
  lần; đốt nó vào một yêu cầu chắc chắn bị từ chối đồng nghĩa buộc người dùng xác minh lại chỉ để đọc dòng
  « trang này đã tắt đăng ký ».

Thẻ « Đăng ký » trên trang đăng nhập cũng biến mất theo, thay bằng một dòng « trang này đã tắt đăng ký —
tài khoản hiện có vẫn đăng nhập được » — nhưng đó chỉ là gợi ý. Đổi `registrationEnabled` mà front-end nhận
được thành `true` vẫn không vượt qua được phép kiểm tra ở máy chủ.


---

# Triển khai một node LiveKit

Trang này không kèm máy chủ media. Mọi phòng đều phải gắn với một node LiveKit, và node có thể đến từ một
trong hai nguồn.

**Kết luận trước**: gần như ai cũng nên chọn cách một. Cách hai chỉ đáng khi bạn đã có sẵn máy chủ và sẵn
lòng triển khai thêm dịch vụ Ingress.

| | Cách 1 · LiveKit Cloud | Cách 2 · Tự dựng |
| --- | --- | --- |
| Thời gian | Khoảng 3 phút | Từ nửa ngày |
| Chi phí | Gói Build miễn phí, không cần thẻ | Máy chủ + băng thông |
| Phát từ OBS (Ingress) | **Dùng được ngay** | **Phải triển khai Ingress + Redis riêng** |
| Hạn mức | Có mức chặn cứng (xem phần tính ở cuối) | Chỉ bị giới hạn bởi băng thông của bạn |
| Cần tên miền / chứng chỉ | Không | Có, chứng chỉ do CA phát hành; tự ký không dùng được |

## Cách 1 · LiveKit Cloud (khuyến nghị)

### 1. Đăng ký và tạo project

Mở [cloud.livekit.io](https://cloud.livekit.io) và đăng ký. Gói **Build** miễn phí không cần thẻ.

Tạo một project với tên tuỳ ý. Sau khi tạo bạn sẽ có một URL dạng `wss://xxx.livekit.cloud` — đây là giá
trị đầu tiên bạn cần điền.

### 2. Tạo API Key

Trong project, vào **Settings → Keys → tạo API Key mới**, bạn sẽ nhận được:

- `API Key` (dạng `APIxxxxxxxx`)
- `API Secret`

> **API Secret chỉ hiện một lần.** Đóng hộp thoại là mất luôn. Hãy sao chép ngay.
> Mất cũng không sao: xoá key đó trong bảng điều khiển LiveKit, tạo cái mới, rồi quay lại đây dùng
> « Đổi khoá » để cập nhật.

### 3. Kết nối vào trang này

Đăng nhập → thanh bên **« Node LiveKit » → « Kết nối node »**, rồi điền ba giá trị:

| Trường | Điền gì |
| --- | --- |
| Tên node | Tuỳ ý, chỉ để bạn nhận biết |
| URL LiveKit | `wss://xxx.livekit.cloud` |
| API Key | Key ở bước trước |
| API Secret | Secret ở bước trước |

Bấm lưu. **Trang này sẽ dùng bộ khoá đó gọi thật API LiveKit để kiểm tra, và giá trị sai không bao giờ được
lưu vào cơ sở dữ liệu.** Việc kiểm tra làm hai chuyện:

- `listRooms` — dò xem URL và bộ khoá có đúng không. **Thất bại thì từ chối lưu.**
- `listIngress` — dò xem có tạo được URL phát OBS không. **Thất bại chỉ hạ cấp chứ không chặn** (phòng vẫn
  dùng được cho chia sẻ từ trình duyệt, chỉ là không lấy được URL WHIP).

Kết quả được ghi vào `capabilities` của node, và mỗi dòng trên trang « Node LiveKit » đều cho biết Ingress
có dùng được hay không. Bạn có thể bấm « Kiểm tra » để thử lại bất cứ lúc nào.

### 4. Cấu hình webhook (khuyến nghị)

Không cấu hình vẫn chạy; chỉ là máy chủ không ghi lại việc vào/ra (front-end vẫn thấy hình ảnh và số người
theo thời gian thực, vì phần đó đi qua sự kiện của SDK LiveKit và không phụ thuộc webhook).

Trang « Node LiveKit » hiển thị một URL webhook **riêng cho từng node của bạn**, dạng:

```
https://trang-cua-ban/api/webhooks/livekit/<nodeId>
```

Sao chép nó vào bảng điều khiển LiveKit → project đó → **Settings → Webhooks**.

> Vì sao URL của mỗi node lại khác nhau: chữ ký của webhook được tạo bằng API key/secret của bên gửi. Trong
> kịch bản nhiều node, ta phải biết *từ URL* rằng node nào đã gửi trước khi chọn được khoá đúng để xác minh
> chữ ký. `nodeId` trong đường dẫn làm đúng việc đó.

### 5. Tạo phòng để kiểm chứng

Quay lại trang « Phòng » và tạo một phòng, chọn node bạn vừa kết nối. Khi đã vào trong:

- Nút « Chia sẻ từ trình duyệt » → phát được mà không cần cài OBS
- Bảng « URL phát OBS » → bấm « Tạo URL phát » để lấy Server + Bearer Token
- Công tắc « Phát bằng OBS » ở đầu cùng bảng đó → khi chủ phòng tắt, phòng này thôi nhận luồng WHIP

## Cách 2 · LiveKit tự dựng

### ⚠️ Đọc phần này trước, không thì làm không đâu

**`livekit-server` tự dựng không bao gồm Ingress.** Ingress là một dịch vụ riêng, giao tiếp với
livekit-server qua Redis. Nghĩa là:

- Chỉ **chia sẻ màn hình từ trình duyệt** → không cần Ingress, một livekit-server là đủ
- Muốn **phát bằng OBS/WHIP** → phải triển khai thêm dịch vụ Ingress + Redis, và cấu hình `whip_base_url`
  ở phía livekit-server trỏ tới nó

Trang này sẽ phát hiện Ingress không dùng được lúc kiểm tra và nói rõ trên giao diện phòng rằng « không cấp
được URL phát OBS ».

### Dựng nhanh một cái để phát triển cục bộ

```bash
livekit-server --dev --bind 0.0.0.0
```

Cài đặt: macOS `brew install livekit`; Linux `curl -sSL https://get.livekit.io | bash`;
Windows tải từ GitHub Releases.

Chế độ `--dev` dùng bộ khoá cố định **`devkey` / `secret`** và chỉ phù hợp cho máy cục bộ. Khi kết nối vào
trang này, hãy điền URL `ws://localhost:7880` (phần kiểm tra URL của trang này nhận `ws://` chính là để dành
cho tự dựng và mạng nội bộ).

### Triển khai production

Có sẵn công cụ sinh cấu hình chính thức, tiện hơn nhiều so với viết tay:

```bash
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate
```

Nó tạo ra một thư mục theo tên miền bạn nhập, bên trong có `docker-compose.yaml`, `livekit.yaml`,
`caddy.yaml`, `redis.conf` và một script khởi động.

Các mục quan trọng trong `livekit.yaml`:

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true      # trong môi trường cloud, phát hiện IP công cộng thật qua STUN
redis:
  address: redis:6379        # rất nên dùng trong production
keys:
  APIyourkey: your_secret_here   # chỉ là một ánh xạ key: secret
turn:
  enabled: true
  domain: turn.example.com   # phải khớp với chứng chỉ
  tls_port: 443              # dùng 443 khi phía trước không có bộ cân bằng tải
```

`keys:` thực sự chỉ là một bảng ánh xạ; không có lệnh sinh riêng — hãy tự tạo một secret đủ ngẫu nhiên:

```bash
openssl rand -base64 32
```

Các cổng cần mở:

| Cổng | Giao thức | Mục đích |
| --- | --- | --- |
| 7880 | TCP | Tín hiệu (đặt điểm kết thúc HTTPS/TLS ở phía trước) |
| 7881 | TCP | Dự phòng TCP cho media WebRTC |
| 50000–60000 | UDP | Media WebRTC |
| 3478 hoặc 5349 | TCP | TURN tích hợp over TLS (đặt 443 khi không có LB) |
| 443 | UDP | TURN/UDP tuỳ chọn, để xuyên qua tường lửa khắt khe |
| 6789 | TCP | Số liệu Prometheus tuỳ chọn |

Hai chỗ dễ sập bẫy:

- **Bắt buộc chứng chỉ do CA phát hành**; tự ký không chạy. Điểm cuối có dạng `wss://livekit.example.com`.
- **Trong Docker hãy dùng host networking**, đừng ánh xạ bridge theo từng cổng, nếu không dải cổng media sẽ
  hỏng.

### Triển khai Ingress (chỉ cần khi muốn phát từ OBS)

- Là một dịch vụ riêng; **địa chỉ Redis của nó phải trùng với địa chỉ livekit-server đang dùng**
- Khuyến nghị **≥ 4 CPU / 4 GB RAM** cho mỗi phiên bản
- Cổng: RTMP `1935/TCP`, WHIP `8080/TCP`, WHIP over UDP `7885/UDP`
- Khoá cấu hình: `api_key`, `api_secret`, `ws_url`, `redis`
  (hoặc các biến môi trường `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL`)
- **Phía livekit-server cũng phải đặt `whip_base_url`** (thêm `rtmp_base_url` nếu muốn cả RTMP), nếu không
  máy chủ sẽ không tạo được URL ingress
- Nhiều phiên bản thì cần cân bằng tải: LB TCP cho RTMP, reverse proxy HTTP cho WHIP

Tin tốt: **WHIP trực tiếp (bypass transcoding) gần như không tốn CPU** — nguyên văn tài liệu chính thức là
"a WHIP session with transcoding bypassed consumes minimal resources". Trang này mặc định dùng chế độ trực
tiếp (`enableTranscoding: false`), nên máy chạy Ingress tự dựng chịu tải nhẹ hơn nhiều so với tưởng tượng.
Thứ thực sự ngốn CPU là RTMP và WHIP có bật chuyển mã, và mức đó tăng tuyến tính theo độ phân giải cùng số
lớp.

## Điền vào OBS thế nào

Sau khi có URL phát:

1. OBS → Cài đặt → Phát trực tiếp → **Dịch vụ chọn `WHIP`**
2. **Server** = Server trong bảng
3. **Bearer Token** = Bearer Token trong bảng (cách WHIP gọi stream key)

Nếu không tạo được URL, hoặc đang phát thì bị ngắt, trước tiên hãy xem chủ phòng có tắt công tắc « Phát bằng
OBS » ở đầu bảng hay không.

WHIP trực tiếp không có simulcast phía máy chủ. Muốn nhiều mức chất lượng thì phải tự bật trong
**OBS 32.1.0+** (hỗ trợ 1–4 lớp).

## Hỏi đáp thường gặp khi kết nối node

| Hiện tượng | Nguyên nhân / xử lý |
| --- | --- |
| Điền URL thành `https://` | Không cần sửa; trang này tự chuyển thành `wss://`, đồng thời cắt bỏ đường dẫn thừa và dấu gạch chéo cuối |
| Khi lưu báo « không kết nối được hoặc bộ khoá không hợp lệ » | Phép dò `listRooms` thất bại. Kiểm tra URL có thuộc project đó không, key/secret có thành cặp không, secret đã sao chép đủ chưa |
| Ingress hiện « — » / không dùng được | Cloud: project chưa bật Ingress, hoặc số Ingress đồng thời đã đầy (bậc miễn phí chỉ có 2). Tự dựng: chưa triển khai Ingress, hoặc chưa đặt `whip_base_url` |
| Bộ khoá này đã được kết nối | Cùng một người dùng + cùng URL + cùng key chỉ được kết nối một lần; hãy tìm bản ghi hiện có trong danh sách |
| Đột nhiên mọi yêu cầu đều lỗi | Hạn mức bậc miễn phí đã cạn. **Vượt hạn mức là thất bại thẳng và không bị tính phí** — hãy đợi tháng sau hoặc đổi node |
| Mất secret | Tạo lại key trong bảng điều khiển LiveKit, quay lại đây dùng « Đổi khoá » để cập nhật (bộ khoá mới được kiểm tra trước khi ghi) |

---

## Kiến trúc

```
Trình duyệt ──── Next.js on Vercel ──── Neon Postgres
  │          (đăng nhập/phòng/thành viên/ký token)
  │                 │
  │ WebRTC          │ server SDK (bằng bộ khoá của node mà phòng thuộc về)
  │ chia sẻ/xem     ▼
  └────────► Node LiveKit A / B / C …        ← mặt media; mỗi phòng chỉ nằm trên một node
                    ▲
                    │ WHIP (trực tiếp, không chuyển mã)
                  OBS
```

**Hai đường phát là độc lập.** Nút « Chia sẻ màn hình của tôi » trên trình duyệt chỉ đi qua Next.js một lần
để lấy token, sau đó hình ảnh **nối thẳng từ trình duyệt tới LiveKit** (`getDisplayMedia` → WebRTC), không
qua Vercel cũng không qua Ingress; đường OBS phải tạo ingress ở phía máy chủ trước, rồi OBS mới đẩy WHIP tới
LiveKit. Vì thế công tắc « Phát bằng OBS » chỉ đóng được đường sau — tắt nó đi, chia sẻ từ trình duyệt vẫn
dùng bình thường.

| Đường dẫn | Vai trò |
| --- | --- |
| `src/db/schema.ts` | 12 bảng. `livekit_nodes` là trái tim của cả kiến trúc |
| `src/lib/livekit.ts` | Node → SDK client, ký token, tạo WHIP ingress, kiểm tra bộ khoá |
| `src/lib/nodes.ts` | Chọn node và quyết định « ai được dùng node nào » |
| `src/lib/rooms.ts` | Kiểm tra thành viên (`requireMember` / `requireRoomOwner`) |
| `src/lib/invites.ts` | Phát hành liên kết mời và đổi liên kết một cách nguyên tử |
| `src/lib/crypto.ts` | Mã hoá / giải mã bộ khoá bằng AES-256-GCM |
| `src/lib/site-settings.ts` | Chính sách cấp trang (hiện chỉ có « cho phép đăng ký »), gồm cả chốt chặn tạo tài khoản |
| `src/lib/app-config.ts` | Đọc/ghi bảng KV toàn cục `app_config` |
| `src/lib/brand.ts` | Tên trang / công ty / dòng bản quyền, viết một lần cho cả trang |
| `src/i18n/` | Bảy bộ văn bản ngôn ngữ cùng phần xác định ngôn ngữ (cookie → Accept-Language → tiếng Anh) |
| `src/lib/bootstrap.ts` | Khởi tạo lúc chạy: tạo quản trị viên, cấp khoá. Chạy lười và luỹ đẳng |
| `src/app/api/rooms/[code]/token/route.ts` | Nơi việc cấp quyền hội tụ |
| `src/app/api/rooms/[code]/route.ts` | Chi tiết phòng, cổng OBS (PATCH), đóng phòng |
| `src/app/api/webhooks/livekit/[nodeId]/route.ts` | Phát hiện hiện diện, xác minh chữ ký theo từng node |
| `src/app/api/health/route.ts` | Chẩn đoán cấu hình, cửa vào để lần lỗi |

## Giao diện

Một design system riêng, không phụ thuộc framework UI và cũng không dùng Tailwind —
chỉ có thuộc tính tuỳ chỉnh CSS cộng một lớp mỏng các primitive React.

| Đường dẫn | Vai trò |
| --- | --- |
| `src/styles/tokens.css` | Toàn bộ biến thiết kế (`--mx-*`). Sáng nằm ở `:root`, tối ở `[data-theme="dark"]` |
| `src/styles/base.css` | Reset + lớp tiện ích cho chữ |
| `src/styles/components.css` | Kiểu của các primitive (nút, biểu mẫu, thẻ, bảng, hộp thoại…) |
| `src/styles/shell.css` | Vỏ ứng dụng: thanh trên, thanh bên, thanh trạng thái, chọn ngôn ngữ |
| `src/styles/pages.css` | Ghép ở cấp trang: trang đăng nhập, ô số liệu, sân khấu video |
| `src/styles/landing.css` | Trang chủ (`/`). Trang duy nhất hướng ra ngoài; xem bên dưới |
| `src/ui/` | Primitive React; chỉ tiêu thụ token, không bao giờ viết cứng màu hay kích thước |
| `src/components/AppShell.tsx` | Thanh trên + thanh bên gập được + vùng chính + thanh trạng thái; dưới 1024px thanh bên thành ngăn kéo |
| `src/components/LanguageSwitcher.tsx` | Menu ngôn ngữ, ngay bên trái nút đổi giao diện |
| `src/components/BrandMark.tsx` | Dấu hiệu thương hiệu (khối lập phương đẳng cự + tín hiệu đi lên); xem bên dưới |
| `src/lib/theme.ts` | Lưu giao diện (hệ thống / sáng / tối) + script chống nhấp nháy ở khung đầu |

Bốn đánh đổi có chủ ý:

- **Giao diện được quyết trước khung vẽ đầu tiên.** `themeBootstrapScript` được nhúng thẳng vào `<head>` và
  đặt `data-theme` lên `<html>` trước khi có gì được vẽ, nên không bao giờ có một nhấp nháy trắng.
- **Giao diện mặc định theo hệ thống.** Thứ được lưu là một *tuỳ chọn* (`system` / `light` / `dark`), và chỉ
  `data-theme` trên `<html>` mới chứa màu đã giải quyết — hai thứ này phải tách nhau, nếu không « theo hệ
  thống » không có chỗ nào để biểu diễn.
- **Sân khấu video luôn tối.** `--mx-stage-bg` gần như đen ở cả hai giao diện — một khung sáng quanh video
  làm thay đổi cách ta đọc chính video đó.
- **Trang chủ mang thang chữ riêng.** `landing.css` khai báo ở đầu một nhóm nhỏ `--land-*` (cỡ chữ hero,
  nhịp của các mục), vì `--mx-font-size-display` là 30px — vừa cho tiêu đề trang, quá nhỏ cho hero. Màu, bán
  kính bo và bóng thì vẫn đi qua `--mx-*` hết.

### Ngôn ngữ

Giao diện có sẵn **简体中文, 繁體中文, English, Français, Русский, 日本語, Tiếng Việt** — bảy ngôn ngữ.
Ba quyết định đáng biết:

- **Ngôn ngữ được xác định ở phía máy chủ**: cookie `mxds.lang` (lựa chọn tường minh) → `Accept-Language`
  (tức là theo hệ thống) → tiếng Anh làm phương án cuối. Phải là máy chủ, vì `<html lang>` và khung vẽ đầu
  tiên đã phải đúng ngay — đọc `navigator.language` ở phía client sẽ khiến mỗi lần tải trang nhấp nháy sai
  ngôn ngữ.
- **Mọi bộ văn bản đều được kiểm tra kiểu dựa trên bộ tiếng Anh.** `src/i18n/messages/en.ts` định nghĩa tập
  khoá; sáu bộ còn lại được khai báo là `Messages`, nên khoá thiếu hoặc viết sai sẽ làm `npm run typecheck`
  hỏng thay vì hiện một khoá thô trên giao diện. Chỗ thay thế viết là `{name}`; phần nhấn mạnh trong câu viết
  là `**đậm**` / `` `mã` `` và do `<RichText>` kết xuất — nhờ vậy không có đánh dấu nào lọt vào bộ văn bản và
  người dịch không bao giờ phải chạm vào JSX.
- **Thông báo lỗi của API là khoá thông báo, không phải câu chữ.** Các handler route ném ra khoá kiểu
  `api.node.duplicate`, và lớp bọc `route()` (`src/lib/api-route.ts`) dịch một lần, theo ngôn ngữ của yêu cầu
  đã gây ra lỗi. Thông báo kiểm tra của zod cũng vậy, nhờ đó `src/lib/validation.ts` vẫn là một module dữ
  liệu thuần, không phụ thuộc gì.

Menu ngôn ngữ nằm ngay bên trái nút đổi giao diện, ở cả thanh trên của vỏ ứng dụng và thanh trên của trang
chủ. Trên điện thoại, thanh trang chủ ẩn nó đi: ở đó việc của thanh là dấu hiệu thương hiệu, tên dự án và
liên kết GitHub (xem bên dưới), còn trang đăng nhập giữ menu riêng ở góc để một ngôn ngữ hệ thống không được
nhận ra cũng không bao giờ thành đường cùng.

### Trang chủ

`/` là một trang nói về dự án, không phải bộ định tuyến: thanh trên + hero + đường phát + phần tính thật về
hạn mức miễn phí + tính năng + bắt đầu nhanh + giới thiệu ứng dụng máy tính + hỏi đáp + CTA kết. Khi đã đăng
nhập, CTA đổi thành « Mở bảng điều khiển »; nếu chưa thì « Đăng nhập / Đăng ký ».

**Nó phải mở được ngay cả khi cơ sở dữ liệu chưa được cấu hình** — đó chính là lúc người ta cần đọc nó nhất.
Vì vậy lỗi từ `currentUser()` bị nuốt đi và trang kết xuất như chưa đăng nhập (`src/app/page.tsx`), thay vì
để trang chủ cũng trả 500 cùng mọi thứ khác.

Phần hỏi đáp dùng `<details>` gốc chứ không phải accordion tự viết: trang là một server component, nó phải mở
ra được khi không có JS, và bàn phím cùng trình đọc màn hình thì trình duyệt đã làm đúng sẵn.

**Thanh trên bỏ bớt phần tử theo thứ tự ưu tiên, không theo một điểm ngắt cố định.** Tên dự án đúng 23 ký tự,
nhưng « Đăng nhập / Đăng ký » trong tiếng Pháp rộng gần gấp đôi tiếng Trung, nên bất kỳ điểm ngắt viết cứng
nào cũng sẽ cắt quá sớm hoặc quá muộn ở một vài ngôn ngữ. `src/components/LandingBarFit.tsx` thay vào đó đo
thật: khi thanh không chứa đủ, nút đổi giao diện và CTA đăng nhập **cùng nhau** nhường chỗ, bảo đảm dấu hiệu
thương hiệu, tên dự án đầy đủ và liên kết GitHub vẫn còn. Trên máy tính thì không bao giờ có gì bị bỏ.

Mục về ứng dụng máy tính nói về `MX-Desktop-Sharing-APP` (nhắn tin tự dựng, mã hoá đầu-cuối + chia sẻ màn
hình). **Chưa viết một dòng nào**, nên cả mục đó được diễn đạt bằng « đang cân nhắc » và « dự định », kèm nhãn
« giai đoạn ý tưởng » — viết như một việc đã xong trên trang chủ thì chỉ là hứa hẹn giả. Cả hai CTA đều trỏ
tới issues và discussions của kho này; dự án không có địa chỉ email hay biểu mẫu liên hệ riêng.

### Dấu hiệu thương hiệu

Một khối lập phương đẳng cự (node LiveKit mà phòng gắn vào) với một góc được nâng lên phía trên (luồng được
đẩy ra ngoài). Hai hình dùng chung độ nghiêng đẳng cự 2:1, nên hai cánh của góc nâng song song chính xác với
các cạnh mặt trên của khối lập phương.

`src/components/BrandMark.tsx` là nguồn sự thật duy nhất; ba mặt lấy màu từ
`--mx-mark-{top,right,left,signal}`, định nghĩa riêng theo từng giao diện — dùng độ mờ để tạo sáng tối sẽ làm
đảo ngược quan hệ chiếu sáng trên nền tối. Trong `public/` còn có các tệp độc lập: `logo-mark.svg` (nền
sáng), `logo-mark-dark.svg`, `logo-tile.svg` (có đế, dành cho favicon / biểu tượng ứng dụng),
`logo-glyph.svg` (một màu) và `logo-lockup.svg` (ghép ngang).


## Mô hình cấp quyền

Trước khi ký token, bắt buộc phải qua `requireMember`. Grant tạo ra là:

```ts
{ roomJoin: true, room: <code của phòng đó>, canSubscribe: true, canPublish: <theo vai trò> }
```

`room` chỉ chứa được một tên phòng, nên token này về mặt vật lý không thể dùng để đăng ký một phòng khác. Nó
không cấp `roomCreate` / `roomAdmin` / `roomList` — phòng do máy chủ tạo.

Đưa một người ra khỏi phòng cần làm ba việc cùng lúc, nếu không thì vẫn còn kẽ hở (tất cả đã hiện thực): xoá
dòng thành viên (từ đó không ký được token mới), `RemoveParticipant` (ngắt kết nối hiện tại, vì token đã phát
hành vẫn còn hiệu lực đến khi hết hạn), và xoá ingress của họ (nếu không OBS của họ vẫn đẩy vào phòng được).

Công tắc « Phát bằng OBS » cũng vậy — chỉ đảo một cờ trong cơ sở dữ liệu thì chẳng đóng được gì, vì stream key
đó vẫn còn hiệu lực ở phía LiveKit. Nên khi đóng, mỗi ingress còn sống của phòng phải trải qua hai việc:
`DeleteIngress` (xoá tài nguyên, để khoá cũ không bao giờ kết nối lại được) và `RemoveParticipant` (đưa người
tham gia `obs:` ra khỏi phòng để mọi người lập tức thôi nhận hình của nó — tài liệu không nói rõ DeleteIngress
có kết thúc luôn phiên đang chạy hay không, và điều đó không đáng để đánh cược); sau đó dòng được đánh dấu
revoked, và cuối cùng cờ được ghi để chặn các yêu cầu tạo mới. Cái giá là sau khi bật lại, mỗi người phải tạo
URL mới: LiveKit có cách đóng mềm giữ nguyên khoá, `UpdateIngress(enabled=false)`, nhưng `updateIngress` của
server SDK JS không phơi ra `enabled` (nó dựng lại yêu cầu theo một danh sách trường cố định và bỏ hết phần
thừa), nên muốn dùng thì phải tự ghép một yêu cầu Twirp. Thà bắt người ta đổi khoá một lần còn hơn xuất xưởng
một công tắc « trông như đã tắt mà thực ra chưa ».

## Hạn mức miễn phí dùng được bao lâu

Đây chính là toàn bộ lý do để người dùng tự mang node. Gói Build miễn phí của LiveKit Cloud tính theo
**project**; vượt hạn mức thì yêu cầu thất bại thẳng và không bao giờ bị tính phí, còn nhiều project miễn phí
dưới cùng một tài khoản thì **dùng chung** hạn mức:

- 5.000 phút-người WebRTC
- 50 GB băng thông ra
- 100 người tham gia đồng thời, mỗi loại Ingress / Egress 2 đồng thời
- 60 phút chuyển mã (**đây chính là lý do phải dùng WHIP chứ không phải RTMP** — đầu vào RTMP luôn phải
  chuyển mã, mà thế thì chỉ đủ một giờ mỗi tháng)

Điểm then chốt: participant của ingress / egress **không tính** vào phút kết nối, nên thứ tiêu phút kết nối chỉ
có người xem.

Tính theo bitrate của người xem (50 GB băng thông ra là cổ chai chính):

| Bitrate phát | Lưu lượng mỗi phút-người xem | Phút-người xem với 50 GB | Quy ra giờ-người xem |
| --- | --- | --- | --- |
| 4 Mbps (1080p bitrate cao) | 30 MB | 1.667 | ≈ 28 h |
| 2,5 Mbps (1080p thông thường) | 18,75 MB | 2.667 | ≈ 44 h |
| 1,5 Mbps (720p) | 11,25 MB | 4.444 | ≈ 74 h |
| 0,8 Mbps | 6 MB | 5.000 (chạm mức chặn về phút) | ≈ 83 h |

**Khoảng 1,33 Mbps là đường phân định**: cao hơn thì 50 GB băng thông hết trước; thấp hơn thì 5.000 phút hết
trước.

Đổi sang « thực tế họp được bao lâu » — giờ-người xem còn phải chia cho số người xem:

- 1 người chia sẻ + 1 người xem, 1080p: khoảng **44 giờ/tháng**
- 1 người chia sẻ + 3 người xem, 1080p: khoảng **15 giờ/tháng**
- 1 người chia sẻ + 9 người xem, 1080p: khoảng **5 giờ/tháng**

Kết luận: một project miễn phí là **hạn mức để thử, không phải hạn mức để chạy sản phẩm**. Vì thế dự án này
coi node là công dân hạng nhất — mỗi người dùng kết nối project LiveKit Cloud của riêng mình, và hạn mức
chuyển từ « một suất của chủ trang » thành « mỗi người một suất ». Node tích hợp chỉ để đỡ trải nghiệm, nên
nhớ đặt `maxRooms` cho nó.

## Giới hạn đã biết

- WHIP trực tiếp **không có simulcast phía máy chủ**; bạn cần tự bật nhiều lớp trong OBS 32.1.0+.
- Phát từ OBS với LiveKit tự dựng đòi hỏi triển khai Ingress + Redis riêng (xem cách hai ở trên).
- Không có công cụ luân chuyển khoá: một khi `CREDENTIAL_ENCRYPTION_KEY` bị thay, toàn bộ bộ khoá node đã lưu
  sẽ không giải mã được nữa.
- Không có bảng theo dõi hạn mức; bạn phải tự ước lượng từ bảng ở trên.

Lý do của các đánh đổi và phần việc còn lại nằm trong [TASKS.md](TASKS.md).

## Tham khảo

- [Hạn mức và giới hạn của LiveKit](https://docs.livekit.io/cloud/quotas-and-limits/)
- [Giá của LiveKit](https://livekit.io/pricing)
- [Tự dựng](https://docs.livekit.io/transport/self-hosting/deployment/) · [Chạy cục bộ](https://docs.livekit.io/home/self-hosting/local/) · [Ingress](https://docs.livekit.io/home/self-hosting/ingress/)
