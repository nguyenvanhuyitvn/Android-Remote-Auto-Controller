import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ADBService } from "./src/lib/adb.ts";
import { GeminiService } from "./src/services/geminiService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(process.cwd(), "db.json");

// BIẾN CẤU HÌNH: Chuyển thành false nếu chạy trên máy tính có kết nối điện thoại thật
const IS_MOCK_MODE = true;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dữ liệu mặc định
  let devices = [
    { id: "ADB001", model: "Samsung S21", status: "idle", battery: 85, signal: "excellent", currentNumber: null, callCountHour: 0, lastCallTime: 0, consecutiveShortCalls: 0, retryCount: 0, isAlerted: false, soundCardId: "SC_01", currentSim: 1, simCallCount: 0 },
    { id: "ADB002", model: "Pixel 6", status: "idle", battery: 92, signal: "good", currentNumber: null, callCountHour: 0, lastCallTime: 0, consecutiveShortCalls: 0, retryCount: 0, isAlerted: false, soundCardId: "SC_02", currentSim: 1, simCallCount: 0 },
    { id: "ADB003", model: "Samsung S20", status: "idle", battery: 45, signal: "fair", currentNumber: null, callCountHour: 0, lastCallTime: 0, consecutiveShortCalls: 0, retryCount: 0, isAlerted: false, soundCardId: "SC_03", currentSim: 1, simCallCount: 0 },
    { id: "ADB004", model: "Xiaomi Mi 11", status: "idle", battery: 78, signal: "excellent", currentNumber: null, callCountHour: 0, lastCallTime: 0, consecutiveShortCalls: 0, retryCount: 0, isAlerted: false, soundCardId: "SC_04", currentSim: 1, simCallCount: 0 },
    { id: "ADB005", model: "Pixel 5", status: "idle", battery: 60, signal: "good", currentNumber: null, callCountHour: 0, lastCallTime: 0, consecutiveShortCalls: 0, retryCount: 0, isAlerted: false, soundCardId: "SC_05", currentSim: 1, simCallCount: 0 },
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

  let queue: any[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `q${i}`,
    phoneNumber: `+84 901 234 ${567 + i}`,
    name: `Khách hàng ${i + 1}`,
    status: "pending"
  }));

  let settings = {
    callDelay: 30, // seconds
    maxRetries: 3,
    hourlyLimit: 20,
    spamThreshold: 10,
    audioRouting: "vac", // "vac" | "hardware" | "root_direct"
    autoMode: false,
    useTTS: true,
    vadEnabled: true,
    simRotationLimit: 10
  };

  let analytics = {
    totalCalls: 0,
    pickups: 0,
    totalDuration: 0,
    avgDuration: 0,
    pickupRate: 0
  };

  // Hàm lưu dữ liệu vào file
  const saveData = () => {
    try {
      const data = { devices, logs, queue, settings, analytics };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  };

  // Hàm nạp dữ liệu từ file
  const loadData = () => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        if (data.devices) devices = data.devices;
        if (data.logs) logs = data.logs;
        if (data.queue) queue = data.queue;
        if (data.settings) settings = { ...settings, ...data.settings };
        if (data.analytics) analytics = data.analytics;
        console.log("Data loaded successfully from db.json");
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  };

  // Nạp dữ liệu khi khởi động
  loadData();

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
    saveData(); // Lưu log mới
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

  app.post("/api/devices/add", (req, res) => {
    const { model, id } = req.body;
    if (!id || !model) return res.status(400).json({ error: "Missing ID or Model" });
    
    if (devices.find(d => d.id === id)) {
      return res.status(400).json({ error: "Device ID already exists" });
    }

    const newDevice = {
      id,
      model,
      status: "idle",
      battery: 100,
      signal: "excellent",
      currentNumber: null,
      callCountHour: 0,
      lastCallTime: 0,
      consecutiveShortCalls: 0,
      retryCount: 0,
      isAlerted: false,
      soundCardId: `SC_${Math.floor(Math.random() * 100)}`,
      currentSim: 1,
      simCallCount: 0
    };
    devices.push(newDevice);
    addLog(id, `New device added: ${model}`, "success");
    saveData();
    res.json(newDevice);
  });

  app.delete("/api/devices/:id", (req, res) => {
    const { id } = req.params;
    const index = devices.findIndex(d => d.id === id);
    if (index === -1) return res.status(404).json({ error: "Device not found" });
    
    const removedDevice = devices.splice(index, 1)[0];
    addLog(id, `Device removed: ${removedDevice.model}`, "warning");
    saveData();
    res.json({ success: true, id });
  });

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.get("/api/queue", (req, res) => {
    res.json(queue);
  });

  app.post("/api/queue/add", (req, res) => {
    const { phoneNumber, name } = req.body;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      phoneNumber,
      name: name || "Khách hàng mới",
      status: "pending"
    };
    queue.push(newItem);
    saveData();
    res.json(newItem);
  });

  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    settings = { ...settings, ...req.body };
    saveData();
    res.json(settings);
  });

  app.get("/api/analytics", (req, res) => {
    res.json(analytics);
  });

  app.post("/api/call", async (req, res) => {
    const { deviceId, phoneNumber, audioFile } = req.body;
    const device = devices.find((d) => d.id === deviceId);

    if (!device) return res.status(404).json({ error: "Device not found" });
    if (device.status !== "idle") return res.status(400).json({ error: "Device is busy" });

    // 1. Race Condition Prevention: Check Central Queue Status
    const queueItem = queue.find(q => q.phoneNumber === phoneNumber);
    if (queueItem && (queueItem.status === "calling" || queueItem.status === "completed")) {
      return res.status(400).json({ error: "Number is already being processed" });
    }

    // Mark as calling immediately (Atomic Lock)
    if (queueItem) {
      queueItem.status = "calling";
      saveData();
    }

    // Blacklist Prevention: Tần suất gọi (Dynamic Limit)
    if (device.callCountHour >= settings.hourlyLimit) {
      addLog(deviceId, `CẢNH BÁO: Đã đạt giới hạn ${settings.hourlyLimit} cuộc/giờ. Tạm dừng để tránh khóa Sim.`, "warning");
      if (queueItem) queueItem.status = "pending"; // Rollback
      return res.status(429).json({ error: "Hourly limit reached" });
    }

    // Blacklist Prevention: Thời gian chờ (Dynamic Cooldown)
    const now = Date.now();
    const cooldownMs = settings.callDelay * 1000;
    const cooldownRemaining = Math.max(0, cooldownMs - (now - device.lastCallTime));
    if (cooldownRemaining > 0) {
      addLog(deviceId, `Cooldown: Chờ thêm ${Math.ceil(cooldownRemaining/1000)}s để giả lập hành vi người dùng.`, "info");
      return res.status(429).json({ error: "Cooldown active", remaining: cooldownRemaining });
    }

    // Blacklist Prevention: Tỷ lệ cuộc gọi ngắn (Dynamic Threshold)
    if (device.consecutiveShortCalls >= settings.spamThreshold) {
      device.status = "alert";
      device.isAlerted = true;
      addLog(deviceId, `CẢNH BÁO: ${settings.spamThreshold} cuộc gọi liên tiếp bị cúp máy ngay. Có thể Sim đã bị đưa vào danh sách Spam. Tạm dừng máy.`, "error");
      return res.status(403).json({ error: "Spam bot suspicion" });
    }

    const executeCall = async (retryAttempt = 0) => {
      try {
        device.status = "dialing";
        device.currentNumber = phoneNumber;
        device.lastCallTime = Date.now();
        device.callCountHour++;
        device.simCallCount++;

        // SIM Rotation Logic
        if (device.simCallCount >= settings.simRotationLimit) {
          const nextSim = device.currentSim === 1 ? 2 : 1;
          addLog(deviceId, `SIM Rotation: Switching from SIM ${device.currentSim} to SIM ${nextSim}`, "info");
          await ADBService.switchSim(deviceId, nextSim as 1 | 2);
          device.currentSim = nextSim;
          device.simCallCount = 0;
        }

        // 1. Keep Awake: Chống Deep Sleep
        await ADBService.keepAwake(deviceId);

        // 3. Ghost Interaction: Đảm bảo môi trường sạch
        if (!IS_MOCK_MODE) {
          addLog(deviceId, "Ghost Interaction Prevention: Sending HOME and opening Dialer...", "info");
          await ADBService.sendHomeKey(deviceId);
          await new Promise(r => setTimeout(r, 1000));
          await ADBService.openDialer(deviceId);
          await new Promise(r => setTimeout(r, 1000));
        }

        addLog(deviceId, `[ADB] Executing: am start -a CALL -d tel:${phoneNumber}`, "info");

        if (!IS_MOCK_MODE) {
          const callResult = await ADBService.makeCall(deviceId, phoneNumber);
          if (!callResult.success) throw new Error(callResult.error);
          
          // 1. Telephony Check: Xác nhận Radio stream
          const radioCheck = await ADBService.checkRadioStream(deviceId);
          if (!radioCheck.success) throw new Error("Telephony process frozen (Radio stream failed)");

          let ringTimeout = 0;
          let callStartTime = 0;
          const checkState = setInterval(async () => {
            const state = await ADBService.getCallState(deviceId);
            ringTimeout++;

            if (state === "OFFHOOK") {
              if (callStartTime === 0) {
                callStartTime = Date.now();
                device.status = "connected";
                addLog(deviceId, "Cuộc gọi đã kết nối. Đang chờ VAD (Alo)...", "success");
                
                // Update Analytics
                analytics.totalCalls++;
                analytics.pickups++;

                // 2A. VAD Simulation: Chờ khách hàng Alo
                if (settings.vadEnabled) {
                  await new Promise(r => setTimeout(r, 1500)); // Giả lập chờ 1.5s
                  addLog(deviceId, "VAD: Đã nhận diện tiếng 'Alo'. Bắt đầu phát thoại.", "info");
                }

                // 2B. Personalized TTS
                if (settings.useTTS && queueItem?.name) {
                  const ttsPrompt = `Chào ${queueItem.name}, đây là cuộc gọi tự động xác nhận đơn hàng của bạn.`;
                  addLog(deviceId, `TTS: Generating personalized audio for ${queueItem.name}...`, "info");
                  // Trong thực tế sẽ gọi Gemini TTS API ở đây
                }

                // 2C. Smart Audio Routing
                if (settings.audioRouting === "root_direct") {
                  await ADBService.injectAudioDirect(deviceId, audioFile);
                }
              }

              clearInterval(checkState);
              device.status = "connected";
              addLog(deviceId, `Detected OFFHOOK. SoundCard: ${device.soundCardId}. Playing ${audioFile}...`, "success");
              
              // 3. Audio Conflict: Kiểm tra SoundCard (Giả lập)
              if (device.soundCardId === "ERROR") {
                addLog(deviceId, "SoundCard Error! Stopping audio to prevent silence/conflict.", "error");
                return;
              }

              await ADBService.playAudio(deviceId, audioFile);
              
              setTimeout(() => {
                const duration = (Date.now() - callStartTime) / 1000;
                // 5. Track short calls
                if (duration < 5) {
                  device.consecutiveShortCalls++;
                } else {
                  device.consecutiveShortCalls = 0;
                }

                device.status = "idle";
                device.currentNumber = null;
                device.retryCount = 0;
                if (queueItem) {
                  queueItem.status = "completed";
                  saveData();
                }
                addLog(deviceId, `Call sequence completed. Duration: ${duration.toFixed(1)}s`, "info");
              }, 10000);
            } else if (state === "IDLE" && ringTimeout > 5) {
              clearInterval(checkState);
              throw new Error("Call failed to connect (IDLE/Timeout)");
            }
          }, 1000);
        } else {
          // MOCK LOGIC
          setTimeout(() => {
            device.status = "connected";
            addLog(deviceId, `Call connected (MOCK). SoundCard: ${device.soundCardId}`, "success");
            setTimeout(() => {
              device.status = "idle";
              device.currentNumber = null;
              device.retryCount = 0;
              if (queueItem) {
                queueItem.status = "completed";
                saveData();
              }
              addLog(deviceId, `Call finished (MOCK).`, "info");
            }, 5000);
          }, 3000);
        }
      } catch (error: any) {
        addLog(deviceId, `Lỗi cuộc gọi: ${error.message}`, "error");
        
        // 4. 3-Step Recovery: Retry
        if (retryAttempt < settings.maxRetries) {
          addLog(deviceId, `Retry Attempt ${retryAttempt + 1}/${settings.maxRetries}...`, "warning");
          setTimeout(() => executeCall(retryAttempt + 1), 3000);
        } else if (retryAttempt === settings.maxRetries) {
          // 4. 3-Step Recovery: Reset (Reboot)
          addLog(deviceId, "Retry failed. Attempting Reset (Reboot)...", "error");
          device.status = "rebooting";
          if (!IS_MOCK_MODE) await ADBService.reboot(deviceId);
          setTimeout(() => {
            device.status = "idle";
            addLog(deviceId, "Device rebooted. Ready for manual intervention.", "warning");
          }, 15000);
        } else {
          // 4. 3-Step Recovery: Alert
          device.status = "alert";
          device.isAlerted = true;
          addLog(deviceId, "CRITICAL: 3-Step Recovery failed. Manual intervention required!", "error");
        }
      }
    };

    executeCall();
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

  // Heartbeat & Reset Counters
  setInterval(async () => {
    const now = new Date();
    
    // Reset hourly counters at the start of each hour
    if (now.getMinutes() === 0 && now.getSeconds() < 5) {
      devices.forEach(d => d.callCountHour = 0);
    }

    // Heartbeat check
    for (const device of devices) {
      if (IS_MOCK_MODE) continue;
      
      const state = await ADBService.getDeviceState(device.id);
      if (state === "offline" && device.status !== "offline") {
        device.status = "offline";
        addLog(device.id, "DEVICE OFFLINE: Heartbeat failed. Check USB cable/Hub.", "error");
      } else if (state === "unauthorized" && device.status !== "unauthorized") {
        device.status = "unauthorized";
        addLog(device.id, "UNAUTHORIZED: Please allow USB Debugging on phone.", "warning");
      } else if (state === "device" && (device.status === "offline" || device.status === "unauthorized")) {
        device.status = "idle";
        addLog(device.id, "Device back online.", "success");
      }
    }
  }, 5000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
