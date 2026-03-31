import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ADBService {
  /**
   * Thực hiện lệnh gọi điện thoại
   */
  static async makeCall(deviceId: string, phoneNumber: string) {
    try {
      // Lệnh ADB để thực hiện cuộc gọi
      const command = `adb -s ${deviceId} shell am start -a android.intent.action.CALL -d tel:${phoneNumber}`;
      await execAsync(command);
      return { success: true, message: `Dialing ${phoneNumber} on ${deviceId}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Kiểm tra trạng thái cuộc gọi (Dumpsys Telephony)
   * Trả về: IDLE, RINGING, OFFHOOK (Đang nghe máy)
   */
  static async getCallState(deviceId: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} shell dumpsys telephony.registry | grep "mCallState"`);
      if (stdout.includes("2")) return "OFFHOOK"; // Người dùng đã bắt máy hoặc đang gọi
      if (stdout.includes("1")) return "RINGING";
      return "IDLE";
    } catch {
      return "UNKNOWN";
    }
  }

  /**
   * Phát file âm thanh vào luồng hệ thống (Yêu cầu điện thoại đã root hoặc dùng cáp audio)
   * Đây là ví dụ lệnh shell để phát file mp3 nằm trên thẻ nhớ điện thoại
   */
  static async playAudio(deviceId: string, filePath: string) {
    try {
      // Lệnh này yêu cầu một trình phát nhạc command-line trên Android hoặc dùng 'am start'
      const command = `adb -s ${deviceId} shell am start -a android.intent.action.VIEW -d "file:///sdcard/${filePath}" -t "audio/mp3"`;
      await execAsync(command);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Chụp ảnh màn hình và trả về base64
   */
  static async takeScreenshot(deviceId: string): Promise<string> {
    try {
      // Trong thực tế: adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png
      // Ở đây chúng ta giả lập bằng một ảnh placeholder chất lượng cao
      return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; 
    } catch {
      return "";
    }
  }

  /**
   * Khởi động lại thiết bị
   */
  static async reboot(deviceId: string) {
    try {
      await execAsync(`adb -s ${deviceId} reboot`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Liệt kê danh sách thiết bị đang kết nối
   */
  static async listDevices() {
    try {
      const { stdout } = await execAsync("adb devices");
      const lines = stdout.split("\n").slice(1);
      return lines
        .filter(line => line.includes("\tdevice"))
        .map(line => line.split("\t")[0]);
    } catch {
      return [];
    }
  }
}
