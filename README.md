# Hệ Thống Call Automation V2.4.0

Hệ thống tự động hóa cuộc gọi chuyên nghiệp cho thiết bị Android vật lý.

## 🚀 Tính Năng Chính
- **Tự động hóa hoàn toàn:** Quản lý hàng đợi và phân phối cuộc gọi thông minh.
- **Bảo vệ SIM:** Xoay vòng SIM, giới hạn cuộc gọi mỗi giờ, chống spam.
- **Âm thanh thông minh:** VAD (chờ Alo), TTS cá nhân hóa, Root Audio Injection.
- **Phục hồi 3 bước:** Tự động thử lại, khởi động lại máy, cảnh báo thủ công.
- **Phân tích thời gian thực:** Dashboard thống kê tỷ lệ bắt máy và hiệu suất.

## 📖 Tài Liệu
- [Hướng Dẫn Sử Dụng (User Guide)](./USER_GUIDE.md)
- [Tài Liệu Kỹ Thuật (Technical Doc)](./TECHNICAL_DOC.md)

## 🛠️ Cài Đặt Nhanh
1. Cài đặt Node.js 18+.
2. Cài đặt ADB Tool và thêm vào PATH.
3. Chạy `npm install` để cài đặt dependencies.
4. Chạy `npm run dev` để khởi động server.
5. Truy cập `http://localhost:3000` trên trình duyệt.

## ⚠️ Lưu Ý Quan Trọng
- Luôn bật **USB Debugging** trên thiết bị Android.
- Đảm bảo cáp USB kết nối ổn định.
- Cấu hình `Call Delay` tối thiểu 30s để bảo vệ SIM khỏi bị nhà mạng khóa.
