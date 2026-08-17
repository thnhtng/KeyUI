# 🎮 UI Control Baker — After Effects CEP Extension

Dán code HTML control (joystick, button attack, bất kỳ UI nhấn/kéo nào) → tương tác trong panel →
extension **tạo layer thật + tự sinh keyframe** đặt **dưới layer đang chọn** của comp hiện tại
(nền trong suốt). Đúng kiểu "game control overlay" có sẵn keyframe, khỏi key tay.

---

## 1. Yêu cầu
- After Effects 2018 trở lên (CC 15.0+).
- Bật **debug mode** cho CEP (vì extension chưa ký chứng chỉ).

## 2. Cài đặt (macOS)

**B1 — Bật PlayerDebugMode** (chạy trong Terminal, làm 1 lần):
```bash
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9  PlayerDebugMode 1
killall cfprefsd
```
(Số 9–12 ứng với các bản AE khác nhau — cứ chạy hết cho chắc.)

**B2 — Copy cả thư mục `AE_UIControlBaker` vào:**
```
~/Library/Application Support/Adobe/CEP/extensions/
```
Tức đường dẫn cuối là: `~/Library/Application Support/Adobe/CEP/extensions/AE_UIControlBaker/`

> Mẹo: mở Finder → `Cmd+Shift+G` → dán `~/Library/Application Support/Adobe/CEP/extensions/` → kéo thư mục vào.
> Nếu chưa có thư mục `extensions` thì tạo mới.

**B3 — Mở AE** → menu **Window ▸ Extensions ▸ UI Control Baker**.

*(Windows: đặt PlayerDebugMode = 1 trong Registry `HKEY_CURRENT_USER/Software/Adobe/CSXS.xx`, và copy vào `C:\Users\<user>\AppData\Roaming\Adobe\CEP\extensions\`.)*

---

## 3. Cách dùng
1. Trong AE: mở & **chọn 1 comp**, chọn **layer** mà bạn muốn control nằm **bên dưới**.
2. Panel: bấm **↻ Đọc comp** → tự điền W/H/FPS đúng comp.
3. **↧ Nạp HTML vào sân khấu** (mặc định có sẵn joystick + nút ATK để thử ngay). Hoặc mở khung
   *"Dán code HTML control"* và dán code của bạn.
4. Bấm **● Ghi** → **tương tác** (kéo joystick, bấm ATK…) → **■ Dừng**.
5. **▶ Xem lại** để kiểm tra, rồi **⬤ Bake vào comp**.
   → AE tạo layer + keyframe khớp thao tác, đặt dưới layer đang chọn.

---

## 4. Chuẩn bị HTML control của bạn
Chỉ cần thêm **thuộc tính đánh dấu** vào phần tử muốn thành layer:

| Thuộc tính | Ý nghĩa |
|---|---|
| `data-ae="tên_layer"` | Phần tử này → 1 layer trong AE (bắt buộc để được ghi) |
| `data-ae-img="/abs/path.png"` | Ảnh sprite thật để AE import (đường dẫn **tuyệt đối**). Không có → AE tạo solid đỏ để bạn thay ảnh sau |
| `data-ae-stage` | Bọc "sân khấu" đúng kích thước comp (vd 1080×1920) để map toạ độ chuẩn |

Ví dụ tối thiểu:
```html
<div data-ae-stage style="width:1080px;height:1920px;position:relative">
  <img data-ae="joy_knob" data-ae-img="/Users/ban/knob.png"
       style="position:absolute;left:470px;top:1430px;width:140px">
</div>
<script> /* logic kéo/nhấn của bạn — extension chỉ quan sát DOM */ </script>
```

Extension ghi lại theo từng frame: **vị trí (tâm) → Position**, **CSS scale → Scale%**,
**CSS rotate → Rotation**, **opacity → Opacity**. Trục Y của web & AE cùng chiều nên toạ độ khớp trực tiếp.

---

## 5. Lưu ý / giới hạn
- Bake tạo **1 keyframe / frame** (auto keyframe dày, mượt). Muốn thưa hơn thì sau khi bake dùng
  *Animation ▸ Keyframe Assistant ▸ Smoother* hoặc xoá bớt.
- **Scale** ghi theo CSS transform (100% = không scale). Kích thước tuyệt đối do **ảnh sprite** quyết định,
  nên hãy xuất sprite đúng cỡ hiển thị của control.
- Phần tử phải nằm trong `data-ae-stage` (hoặc body) và **hiển thị** khi ghi.
- Đây là bản CEP dùng `CSInterface.js` rút gọn (đủ `evalScript`). Cần đầy đủ thì tải
  `CSInterface.js` chính thức của Adobe đè lên `js/CSInterface.js`.
- Extension đã test luồng panel + bắt toạ độ (map comp chính xác). Phần tạo layer/keyframe (`jsx/host.jsx`)
  cần chạy thử trong AE của bạn — nếu lỗi, gửi mình dòng log `AE ▸ ...` để sửa.

---

## 6. Cấu trúc
```
AE_UIControlBaker/
├─ CSXS/manifest.xml     # khai báo extension (host AEFT)
├─ .debug                # cho phép debug khi chưa ký
├─ index.html            # panel UI
├─ css/style.css
├─ js/CSInterface.js     # cầu nối CEP↔ExtendScript (rút gọn)
├─ js/main.js            # ghi transform, dựng JSON, gọi bake
└─ jsx/host.jsx          # tạo layer + keyframe trong AE
```
