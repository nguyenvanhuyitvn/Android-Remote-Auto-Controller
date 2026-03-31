# Hướng Dẫn Sử Dụng - Hệ Thống Call Automation V2.4.0

## 1. Giới Thiệu
Hệ thống Call Automation là giải pháp tự động hóa cuộc gọi chuyên nghiệp, giúp doanh nghiệp thực hiện hàng ngàn cuộc gọi xác nhận đơn hàng, tư vấn dịch vụ một cách tự động và ổn định trên thiết bị Android vật lý.

## 2. Thiết Lập Ban Đầu

### 2.1. Chuẩn bị thiết bị Android
1.  Vào **Cài đặt** > **Thông tin điện thoại** > Nhấn 7 lần vào **Số hiệu bản dựng** để bật **Tùy chọn cho nhà phát triển**.
2.  Trong **Tùy chọn cho nhà phát triển**, bật **Gỡ lỗi USB (USB Debugging)**.
3.  Kết nối điện thoại với máy tính bằng cáp USB chất lượng cao.
4.  Trên điện thoại, chọn **Luôn cho phép từ máy tính này** khi có thông báo hiện lên.

### 2.2. Kết nối với phần mềm
1.  Mở ứng dụng trên trình duyệt.
2.  Nhấn nút **(+) Thêm thiết bị** trên Dashboard.
3.  Nhập **ID thiết bị** (lấy từ lệnh `adb devices`) và **Tên gợi nhớ** (ví dụ: Samsung S21 - SIM 1).
4.  Nhấn **Thêm**, thiết bị sẽ xuất hiện trên Dashboard với trạng thái **IDLE** (màu xanh lá).

## 3. Quản Lý Hàng Đợi (QUEUE)
1.  Chuyển sang Tab **QUEUE**.
2.  Nhập số điện thoại và tên khách hàng vào ô nhập liệu.
3.  Nhấn **(+) Thêm vào hàng đợi**.
4.  Hệ thống sẽ tự động xếp hàng các số điện thoại này.

## 4. Vận Hành Hệ Thống

### 4.1. Chế độ Thủ công (Manual)
-   Trên Dashboard, nhấn biểu tượng **Gọi (Phone Icon)** trên thẻ thiết bị để thực hiện cuộc gọi ngay lập tức cho số điện thoại đã nhập.

### 4.2. Chế độ Tự động (Auto-Distribution)
1.  Vào Tab **SETTINGS (SET)**.
2.  Bật **Auto-Distribution Mode**.
3.  Hệ thống sẽ tự động quét hàng đợi và phân phối cho các máy đang rảnh (IDLE).
4.  **Lưu ý:** Đảm bảo đã thiết lập `Call Delay` hợp lý để tránh bị nhà mạng khóa SIM.

## 5. Cấu Hình Hệ Thống (SETTINGS)
-   **Audio Routing:**
    -   `VAC`: Sử dụng driver âm thanh ảo (Yêu cầu cài đặt driver trên PC).
    -   `Hardware`: Sử dụng cáp 3.5mm nối từ Soundcard vào cổng Mic điện thoại.
    -   `Direct (Root)`: Nạp audio trực tiếp vào máy (Yêu cầu Root).
-   **Blacklist Prevention:**
    -   `Hourly Limit`: Giới hạn số cuộc gọi mỗi giờ trên mỗi SIM.
    -   `Spam Threshold`: Tự động dừng máy nếu có quá nhiều cuộc gọi ngắn liên tiếp (nghi ngờ bị chặn).
-   **Smart Voice Features:**
    -   `VAD`: Chờ khách hàng nói "Alo" mới phát thoại.
    -   `TTS`: Tự động chèn tên khách hàng vào câu chào.
-   **SIM Rotation Limit:** Tự động đổi SIM 1/2 sau X cuộc gọi để bảo vệ SIM.

## 6. Theo Dõi Hiệu Suất (DATA)
Chuyển sang Tab **DATA** để xem các chỉ số:
-   **Pickup Rate:** Tỷ lệ khách hàng nghe máy.
-   **Avg Duration:** Thời gian đàm thoại trung bình.
-   **Device Efficiency:** Hiệu suất làm việc của từng thiết bị.

## 7. Xử Lý Sự Cố (Troubleshooting)
-   **Thiết bị OFFLINE:** Kiểm tra cáp USB và trạng thái USB Debugging.
-   **Trạng thái ALERT (Màu đỏ):** Hệ thống đã thử lại nhiều lần nhưng thất bại. Hãy kiểm tra sóng điện thoại, số dư tài khoản SIM hoặc khởi động lại thiết bị thủ công.
-   **Lỗi UNAUTHORIZED:** Chấp nhận thông báo gỡ lỗi USB trên màn hình điện thoại.
