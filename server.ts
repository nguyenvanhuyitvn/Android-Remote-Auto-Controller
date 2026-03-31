import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ADBService } from "./src/lib/adb.ts";
import { GeminiService } from "./src/services/geminiService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BIẾN CẤU HÌNH: Chuyển thành false nếu chạy trên máy tính có kết nối điện thoại thật
const IS_MOCK_MODE = true;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dữ liệu thiết bị (Trong thực tế sẽ lấy từ ADBService.listDevices())
  let devices = [
    { id: "ADB001", model: "Samsung S21", status: "idle", battery: 85, signal: "excellent" },
    { id: "ADB002", model: "Pixel 6", status: "idle", battery: 92, signal: "good" },
    { id: "ADB003", model: "Samsung S20", status: "idle", battery: 45, signal: "fair" },
    { id: "ADB004", model: "Xiaomi Mi 11", status: "idle", battery: 78, signal: "excellent" },
    { id: "ADB005", model: "Pixel 5", status: "idle", battery: 60, signal: "good" },
  ];

  let logs: any[] = [
    { id: "log1", timestamp: new Date().toISOString(), deviceId: "ADB001", message: "System initialized", type: "info" },
    { id: "log2", timestamp: new Date().toISOString(), deviceId: "ADB002", message: "Connection stable", type: "success" },
    { id: "log3", timestamp: new Date().toISOString(), deviceId: "ADB003", message: "Battery low warning", type: "warning" },
    { id: "log4", timestamp: new Date().toISOString(), deviceId: "ADB001", message: "Call sequence started", type: "info" },
    { id: "log5", timestamp: new Date().toISOString(), deviceId: "ADB001", message: "Call connected successfully", type: "success" },
    { id: "log6", timestamp: new Date().toISOString(), deviceId: "ADB004", message: "ADB server re-syncing", type: "info" },
    { id: "log7", timestamp: new Date().toISOString(), deviceId: "ADB002", message: "Signal strength dropped", type: "warning" },
  ];

  const addLog = (deviceId: string, message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const log = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      deviceId,
      message,
      type,
    };
    logs.unshift(log);
    if (logs.length > 100) logs.pop();
    return log;
  };

  // API Routes
  app.get("/api/devices", async (req, res) => {
    if (!IS_MOCK_MODE) {
      const realDeviceIds = await ADBService.listDevices();
      // Cập nhật danh sách thiết bị thực tế nếu cần
      console.log("Real devices connected:", realDeviceIds);
    }
    res.json(devices);
  });

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.post("/api/call", async (req, res) => {
    const { deviceId, phoneNumber, audioFile } = req.body;
    const device = devices.find((d) => d.id === deviceId);

    if (!device) return res.status(404).json({ error: "Device not found" });
    if (device.status !== "idle") return res.status(400).json({ error: "Device is busy" });

    device.status = "dialing";
    addLog(deviceId, `[ADB] Executing: am start -a CALL -d tel:${phoneNumber}`, "info");

    if (!IS_MOCK_MODE) {
      await ADBService.makeCall(deviceId, phoneNumber);
      
      // Logic kiểm tra người dùng bắt máy (Polling)
      const checkState = setInterval(async () => {
        const state = await ADBService.getCallState(deviceId);
        if (state === "OFFHOOK") {
          clearInterval(checkState);
          device.status = "connected";
          addLog(deviceId, `Detected OFFHOOK. Playing ${audioFile}...`, "success");
          await ADBService.playAudio(deviceId, audioFile);
          
          // Kết thúc sau 10s
          setTimeout(() => {
            device.status = "idle";
            addLog(deviceId, `Call sequence completed.`, "info");
          }, 10000);
        }
      }, 1000);
    } else {
      // MOCK LOGIC cho môi trường Browser
      setTimeout(() => {
        device.status = "connected";
        addLog(deviceId, `Call connected (MOCK). Playing ${audioFile}...`, "success");
        setTimeout(() => {
          device.status = "idle";
          addLog(deviceId, `Call finished (MOCK).`, "info");
        }, 5000);
      }, 3000);
    }

    res.json({ status: "initiated", deviceId, phoneNumber });
  });

  app.post("/api/reboot", async (req, res) => {
    const { deviceId } = req.body;
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      device.status = "rebooting";
      addLog(deviceId, "Executing: adb reboot", "warning");
      
      if (!IS_MOCK_MODE) {
        await ADBService.reboot(deviceId);
      }

      setTimeout(() => {
        device.status = "idle";
        addLog(deviceId, "Device back online.", "success");
      }, 10000);
    }
    res.json({ status: "rebooting" });
  });

  app.post("/api/ai/analyze-intent", async (req, res) => {
    const { transcript } = req.body;
    try {
      const result = await GeminiService.analyzeIntent(transcript);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ai/analyze-screen", async (req, res) => {
    const { deviceId, task } = req.body;
    try {
      const screenshot = await ADBService.takeScreenshot(deviceId);
      const result = await GeminiService.analyzeScreen(screenshot, task);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ai/report", async (req, res) => {
    const { logs } = req.body;
    try {
      const report = await GeminiService.generateReport(logs);
      res.json({ report });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
