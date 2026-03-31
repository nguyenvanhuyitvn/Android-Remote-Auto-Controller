# Tài Liệu Kỹ Thuật - Hệ Thống Call Automation V2.4.0

## 1. Tổng Quan Kiến Trúc
Hệ thống được xây dựng theo mô hình Full-stack (Express + React) kết hợp với công cụ ADB (Android Debug Bridge) để điều khiển thiết bị Android vật lý.

- **Frontend:** React 18, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Node.js (Express), File-based Database (JSON).
- **Device Control:** ADB Service (Child Process execution).

## 2. Các Thành Phần Chính

### 2.1. ADB Service (`src/lib/adb.ts`)
Lớp dịch vụ chịu trách nhiệm giao tiếp trực tiếp với thiết bị thông qua các lệnh shell:
- `makeCall`: `am start -a android.intent.action.CALL -d tel:{number}`.
- `getCallState`: `dumpsys telephony.registry | grep "mCallState"`.
- `keepAwake`: `svc power stayon true` kết hợp giả lập `input swipe`.
- `checkRadioStream`: Kiểm tra `logcat -b radio` để xác nhận luồng GSM.
- `switchSim`: Thay đổi `multi_sim_voice_call_slot` trong settings global.

### 2.2. Backend Logic (`server.ts`)
- **Quản lý trạng thái:** Sử dụng `db.json` để lưu trữ `devices`, `logs`, `queue`, `settings`, và `analytics`.
- **Atomic Locking:** Khi một cuộc gọi bắt đầu, số điện thoại trong hàng đợi được đánh dấu `calling` ngay lập tức để tránh Race Condition.
- **3-Step Recovery:** 
    1. **Retry:** Thử lại cuộc gọi dựa trên `maxRetries`.
    2. **Reset:** Nếu thất bại, thực hiện `adb reboot`.
    3. **Alert:** Nếu vẫn lỗi, chuyển trạng thái `alert` và phát âm thanh cảnh báo trên UI.
- **Blacklist Prevention:** Theo dõi `callCountHour` và `consecutiveShortCalls` để tạm dừng thiết bị nếu nghi ngờ bị nhà mạng soi.

### 2.3. Các Tính Năng Nâng Cao
- **VAD (Voice Activity Detection):** Giả lập trễ thông minh trước khi phát audio để chờ tín hiệu "Alo" từ khách hàng.
- **Personalized TTS:** Tích hợp Gemini API để tạo câu thoại động dựa trên tên khách hàng.
- **SIM Rotation:** Tự động chuyển đổi SIM 1/2 sau mỗi X cuộc gọi để phân phối tải.

## 3. Cấu Trúc Dữ Liệu (`db.json`)
```json
{
  "devices": [],
  "logs": [],
  "queue": [],
  "settings": {
    "callDelay": 30,
    "maxRetries": 3,
    "hourlyLimit": 20,
    "spamThreshold": 10,
    "audioRouting": "vac",
    "autoMode": false,
    "useTTS": true,
    "vadEnabled": true,
    "simRotationLimit": 10
  },
  "analytics": {
    "totalCalls": 0,
    "pickups": 0,
    "totalDuration": 0,
    "avgDuration": 0,
    "pickupRate": 0
  }
}
```

## 4. API Endpoints
- `GET /api/devices`: Lấy danh sách thiết bị.
- `POST /api/call`: Thực hiện cuộc gọi (deviceId, phoneNumber, audioFile).
- `GET /api/settings`: Lấy cấu hình hệ thống.
- `POST /api/settings`: Cập nhật cấu hình.
- `GET /api/analytics`: Lấy dữ liệu thống kê hiệu suất.
- `POST /api/ai/analyze-screen`: Sử dụng Gemini Vision để phân tích màn hình thiết bị.

## 5. Yêu Cầu Hệ Thống
- Node.js 18+.
- ADB Tool được cài đặt và thêm vào PATH.
- Thiết bị Android đã bật "USB Debugging" và "Allow ADB to make calls".
- (Tùy chọn) Quyền Root để sử dụng tính năng `Direct Audio Injection`.
