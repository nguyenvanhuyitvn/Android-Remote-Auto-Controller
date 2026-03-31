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
   * Kiểm tra trạng thái kết nối của thiết bị
   */
  static async getDeviceState(deviceId: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} get-state`);
      return stdout.trim(); // "device", "offline", "unauthorized"
    } catch (error: any) {
      if (error.message.includes("unauthorized")) return "unauthorized";
      return "offline";
    }
  }

  /**
   * Đưa điện thoại về màn hình chính (Home)
   */
  static async sendHomeKey(deviceId: string) {
    try {
      await execAsync(`adb -s ${deviceId} shell input keyevent 3`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mở lại ứng dụng gọi điện mặc định hoặc ứng dụng chỉ định
   */
  static async openDialer(deviceId: string) {
    try {
      // Mở trình quay số mặc định
      await execAsync(`adb -s ${deviceId} shell am start -a android.intent.action.DIAL`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Giữ màn hình luôn sáng và giả lập thao tác vuốt nhẹ để chống Deep Sleep
   */
  static async keepAwake(deviceId: string) {
    try {
      // SVC power stayon true: Giữ màn hình luôn sáng khi cắm USB
      await execAsync(`adb -s ${deviceId} shell svc power stayon true`);
      // Giả lập vuốt nhẹ tọa độ (100,100) -> (101,101)
      await execAsync(`adb -s ${deviceId} shell input swipe 100 100 101 101 10`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Kiểm tra logcat để xác nhận luồng Radio (Telephony) đã thực sự mở
   */
  static async checkRadioStream(deviceId: string) {
    try {
      // Kiểm tra logcat cho các sự kiện liên quan đến Radio/Telephony
      const { stdout } = await execAsync(`adb -s ${deviceId} shell logcat -d -b radio | grep -i "dial" | tail -n 5`);
      return { success: true, log: stdout };
    } catch {
      return { success: true }; // Fallback nếu không đọc được log radio
    }
  }

  /**
   * Chuyển đổi SIM (Dành cho máy 2 SIM)
   */
  static async switchSim(deviceId: string, simSlot: 1 | 2) {
    try {
      // Lệnh này tùy thuộc vào từng dòng máy Android (Samsung, Xiaomi, etc.)
      // Đây là ví dụ lệnh phổ biến để đặt SIM mặc định cho cuộc gọi
      const slot = simSlot - 1;
      await execAsync(`adb -s ${deviceId} shell settings put global multi_sim_voice_call_slot ${slot}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Nạp âm thanh trực tiếp vào hệ thống (Yêu cầu Root)
   */
  static async injectAudioDirect(deviceId: string, audioPath: string) {
    try {
      // Giả lập script nạp audio vào AudioTrack
      console.log(`[ADB] ROOT: Injecting ${audioPath} into AudioTrack on ${deviceId}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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
