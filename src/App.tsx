import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, 
  PhoneCall, 
  Activity, 
  Terminal, 
  Settings, 
  Play, 
  Square, 
  RefreshCw, 
  Battery, 
  Signal, 
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Database,
  Search,
  Brain,
  Eye,
  FileText,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Download,
  X,
  WifiOff,
  AlertTriangle,
  Phone,
  RotateCcw,
  Volume2,
  ShieldAlert,
  Zap,
  Save,
  Shield,
  Info,
  BarChart3,
  PieChart,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Markdown from "react-markdown";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Device {
  id: string;
  model: string;
  status: "idle" | "dialing" | "connected" | "rebooting" | "offline" | "unauthorized" | "alert";
  battery: number;
  signal: "excellent" | "good" | "fair" | "poor";
  currentNumber?: string | null;
  callCountHour?: number;
  consecutiveShortCalls?: number;
  isAlerted?: boolean;
  soundCardId?: string;
  currentSim?: number;
  simCallCount?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  deviceId: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "queue" | "logs" | "settings" | "analytics">("dashboard");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("intro_v1.mp3");
  const [settings, setSettings] = useState({
    callDelay: 30,
    maxRetries: 3,
    hourlyLimit: 20,
    spamThreshold: 10,
    audioRouting: "vac",
    autoMode: false,
    useTTS: true,
    vadEnabled: true,
    simRotationLimit: 10
  });
  const [analytics, setAnalytics] = useState({
    totalCalls: 0,
    pickups: 0,
    totalDuration: 0,
    avgDuration: 0,
    pickupRate: 0
  });
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({ id: "", model: "" });
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; model: string } | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [visionTask, setVisionTask] = useState("Tìm nút 'Đăng nhập' và click");
  const [visionResult, setVisionResult] = useState<any>(null);
  const [isAnalyzingScreen, setIsAnalyzingScreen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data);
    } catch (e) {
      console.error("Failed to fetch devices", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setQueue(data);
    } catch (e) {
      console.error("Failed to fetch queue", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateSettings = async (newSettings: any) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      setSettings(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to update settings", e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchLogs();
    fetchQueue();
    fetchSettings();
    fetchAnalytics();
    const interval = setInterval(() => {
      fetchDevices();
      fetchLogs();
      fetchQueue();
      fetchAnalytics();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-distribution logic
  useEffect(() => {
    if (!settings.autoMode) return;

    const idleDevice = devices.find(d => d.status === "idle");
    const nextInQueue = queue.find(q => q.status === "pending");

    if (idleDevice && nextInQueue) {
      // Mark as calling immediately to avoid double calls before server update
      handleCall(idleDevice.id, nextInQueue.phoneNumber);
      // We should ideally mark the queue item as "calling" on the server too
    }
  }, [settings.autoMode, devices, queue]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const alertedDevices = devices.filter(d => d.status === "alert");
    if (alertedDevices.length > 0) {
      // Play alert sound (Beep)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } catch (e) {
        console.error("Audio alert failed", e);
      }
    }
  }, [devices.map(d => d.status).join(',')]);

  const handleCall = async (deviceId: string, overrideNumber?: string) => {
    const targetNumber = overrideNumber || phoneNumber;
    if (!targetNumber) {
      setReportError("Vui lòng nhập số điện thoại hoặc chọn từ danh sách!");
      return;
    }

    // Check if number is already being called in the queue
    const queueItem = queue.find(q => q.phoneNumber === targetNumber);
    if (queueItem && (queueItem.status === "calling" || queueItem.status === "completed")) {
      return;
    }

    try {
      await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, phoneNumber: targetNumber, audioFile: selectedAudio }),
      });
      if (!overrideNumber) setPhoneNumber(""); // Clear input if manual
    } catch (e) {
      console.error("Call failed", e);
    }
  };

  const handleReboot = async (deviceId: string) => {
    try {
      await fetch("/api/reboot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
    } catch (e) {
      console.error("Reboot failed", e);
    }
  };

  const addDevice = async () => {
    if (!newDeviceData.id || !newDeviceData.model) return;
    setIsAddingDevice(true);
    try {
      const res = await fetch("/api/devices/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeviceData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add device");
      }
      setNewDeviceData({ id: "", model: "" });
      setShowAddDevice(false);
      fetchDevices();
    } catch (e: any) {
      setReportError(e.message);
    } finally {
      setIsAddingDevice(false);
    }
  };

  const removeDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove device");
      setConfirmDelete(null);
      fetchDevices();
    } catch (e: any) {
      setReportError(e.message);
    }
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Timestamp,Device,Message,Type\n"
      + logs.map(log => `${log.id},${log.timestamp},${log.deviceId},"${log.message}",${log.type}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAIReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errorMessage = data.error || "Failed to generate report";
        try {
          // Try to parse if it's a JSON string from the API
          const parsedError = JSON.parse(errorMessage);
          if (parsedError.error && parsedError.error.message) {
            errorMessage = parsedError.error.message;
          }
        } catch (e) {
          // Not a JSON string, use original
        }
        throw new Error(errorMessage);
      }

      if (!data.report) {
        throw new Error("AI returned an empty report");
      }
      setAiReport(data.report);
      setActiveTab("logs");
    } catch (e: any) {
      console.error("Report generation failed", e);
      setReportError("Lỗi tạo báo cáo: " + e.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const analyzeScreen = async (deviceId: string) => {
    setIsAnalyzingScreen(true);
    try {
      const res = await fetch("/api/ai/analyze-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, task: visionTask }),
      });
      const data = await res.json();
      setVisionResult(data);
    } catch (e) {
      console.error("Screen analysis failed", e);
    } finally {
      setIsAnalyzingScreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Top Header */}
      <header className="border-b border-[#141414] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#141414] flex items-center justify-center rounded-sm">
            <Smartphone className="text-[#E4E3E0] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs uppercase tracking-widest font-bold">Android Remote Control</h1>
            <p className="text-[10px] opacity-50 font-mono">SYSTEM_V2.4.0 // ACTIVE_SESSIONS: {devices.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">ADB_SERVER_ONLINE</span>
          </div>
          <div className="text-[10px] font-mono opacity-50">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <nav className="w-16 border-r border-[#141414] flex flex-col items-center py-6 gap-8">
          <NavButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<Activity size={20} />} label="DASH" />
          <NavButton active={activeTab === "queue"} onClick={() => setActiveTab("queue")} icon={<Database size={20} />} label="QUEUE" />
          <NavButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 size={20} />} label="DATA" />
          <NavButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<Terminal size={20} />} label="LOGS" />
          <div className="mt-auto">
            <NavButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={20} />} label="SET" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {reportError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 border border-red-400 bg-red-50 text-red-700 text-xs flex items-center gap-3 rounded-sm"
            >
              <AlertCircle size={18} />
              <div>
                <p className="font-bold uppercase tracking-widest text-[10px]">Thông báo hệ thống</p>
                <p>{reportError}</p>
              </div>
              <button 
                onClick={() => setReportError(null)}
                className="ml-auto text-red-900 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* AI Vision Panel & Device Management */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 border border-[#141414] p-6 bg-[#141414] text-[#E4E3E0] rounded-sm flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Brain className="text-purple-400" size={32} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-lg font-serif italic flex items-center gap-2">
                      <Sparkles size={18} className="text-purple-400" />
                      Gemini AI Vision Assistant
                    </h2>
                    <p className="text-xs opacity-60">Sử dụng AI để đọc hiểu màn hình, vượt CAPTCHA và tương tác thông minh với các ứng dụng phức tạp.</p>
                    <div className="flex gap-2 pt-2">
                      <input 
                        type="text" 
                        value={visionTask}
                        onChange={(e) => setVisionTask(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder="Ví dụ: Tìm nút 'Xác nhận' và click..."
                      />
                      <button 
                        onClick={() => analyzeScreen(devices[0]?.id)}
                        disabled={isAnalyzingScreen || devices.length === 0}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        {isAnalyzingScreen ? <RefreshCw className="animate-spin" size={14} /> : <Eye size={14} />}
                        Thực thi AI
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-[#141414] p-6 bg-white flex flex-col justify-center items-center gap-4 rounded-sm shadow-sm">
                  <div className="text-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Quản lý thiết bị</h3>
                    <p className="text-[10px] opacity-50">Thêm hoặc bớt máy trong hệ thống</p>
                  </div>
                  <button 
                    onClick={() => setShowAddDevice(true)}
                    className="w-full py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                  >
                    <Plus size={16} /> Thêm máy mới
                  </button>
                </div>
              </div>

              {showAddDevice && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                >
                  <div className="bg-white p-8 border border-[#141414] w-full max-w-md space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b pb-4">
                      <h3 className="text-lg font-serif italic">Thêm thiết bị ADB mới</h3>
                      <button onClick={() => setShowAddDevice(false)} className="text-gray-400 hover:text-black">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold opacity-50">Device ID (ADB Serial)</label>
                        <input 
                          type="text" 
                          value={newDeviceData.id}
                          onChange={(e) => setNewDeviceData({...newDeviceData, id: e.target.value})}
                          className="w-full border border-[#141414] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="Ví dụ: R58M1234567"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold opacity-50">Tên Model</label>
                        <input 
                          type="text" 
                          value={newDeviceData.model}
                          onChange={(e) => setNewDeviceData({...newDeviceData, model: e.target.value})}
                          className="w-full border border-[#141414] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="Ví dụ: Samsung Galaxy S22"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setShowAddDevice(false)}
                        className="flex-1 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        onClick={addDevice}
                        disabled={isAddingDevice || !newDeviceData.id || !newDeviceData.model}
                        className="flex-1 py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isAddingDevice ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        {isAddingDevice ? "Đang thêm..." : "Xác nhận thêm"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#141414] p-4 bg-white/50 space-y-3">
                  <label className="text-[10px] uppercase font-bold opacity-50 block">Số điện thoại khách hàng (Target)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Nhập số khách hàng..."
                      className="flex-1 bg-transparent border-b border-[#141414] px-2 py-1 text-sm focus:outline-none placeholder:opacity-30"
                    />
                    <button 
                      onClick={() => updateSettings({ ...settings, autoMode: !settings.autoMode })}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold border border-[#141414] transition-all relative overflow-hidden flex items-center gap-2",
                        settings.autoMode ? "bg-green-600 text-white border-green-600" : "hover:bg-[#141414] hover:text-[#E4E3E0]"
                      )}
                    >
                      {settings.autoMode && (
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="absolute inset-0 bg-white/20"
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        {settings.autoMode ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 border border-current opacity-30" />}
                        {settings.autoMode ? "AUTO_DISTRIBUTING" : "AUTO_OFF"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="border border-[#141414] p-4 bg-white/50 space-y-3">
                  <label className="text-[10px] uppercase font-bold opacity-50 block">Kịch bản âm thanh (Script)</label>
                  <select 
                    value={selectedAudio}
                    onChange={(e) => setSelectedAudio(e.target.value)}
                    className="w-full bg-transparent border-b border-[#141414] px-2 py-1 text-sm focus:outline-none"
                  >
                    <option value="intro_v1.mp3">intro_v1.mp3 (0:45)</option>
                    <option value="promo_sale.mp3">promo_sale.mp3 (1:12)</option>
                    <option value="follow_up.mp3">follow_up.mp3 (0:30)</option>
                  </select>
                </div>

                <div className="border border-[#141414] p-4 bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] uppercase font-bold opacity-50">Global Status</h3>
                    <p className="text-xl font-bold tracking-tighter">READY_TO_SYNC</p>
                  </div>
                  <button 
                    onClick={generateAIReport}
                    disabled={isGeneratingReport}
                    className="p-2 hover:bg-white/10 rounded-sm transition-colors disabled:opacity-50"
                    title="Generate AI Report"
                  >
                    {isGeneratingReport ? <RefreshCw className="animate-spin" size={24} /> : <Brain size={24} />}
                  </button>
                </div>
              </div>

              {/* Device Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <DeviceCard 
                    key={device.id} 
                    device={device} 
                    onCall={() => handleCall(device.id)}
                    onReboot={() => handleReboot(device.id)}
                    onRemove={() => setConfirmDelete({ id: device.id, model: device.model })}
                  />
                ))}
              </div>

              {/* Confirmation Modal */}
              <AnimatePresence>
                {confirmDelete && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-white p-8 border border-[#141414] w-full max-w-sm space-y-6 shadow-2xl"
                    >
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-serif italic">Xác nhận xóa thiết bị?</h3>
                        <p className="text-xs opacity-60">Bạn có chắc chắn muốn xóa thiết bị <strong>{confirmDelete.model} ({confirmDelete.id})</strong> khỏi hệ thống?</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                          Hủy bỏ
                        </button>
                        <button 
                          onClick={() => removeDevice(confirmDelete.id)}
                          className="flex-1 py-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                        >
                          Xác nhận xóa
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif italic">System Logs & AI Insights</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={exportLogs}
                    className="px-6 py-2 border border-[#141414] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <Download size={14} /> Xuất Log File
                  </button>
                  <button 
                    onClick={generateAIReport}
                    disabled={isGeneratingReport}
                    className="px-6 py-2 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                  >
                    {isGeneratingReport ? <RefreshCw className="animate-spin" size={14} /> : <Brain size={14} />}
                    Generate AI Report
                  </button>
                </div>
              </div>

              {aiReport && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-6 border border-purple-400 bg-purple-50 text-sm overflow-y-auto max-h-[300px]"
                >
                  <div className="flex items-center gap-2 mb-4 text-purple-900">
                    <Sparkles size={18} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Gemini Intelligence Report</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{aiReport}</Markdown>
                  </div>
                </motion.div>
              )}

              <div className="flex-1 flex flex-col border border-[#141414] bg-[#1a1a1a] text-[#00FF00] font-mono text-xs overflow-hidden">
              <div className="p-2 border-b border-[#141414] bg-[#141414] flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-[#E4E3E0]">System Terminal</span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    <span className="opacity-30">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-white">[{log.deviceId}]</span>
                    <span className={cn(
                      log.type === "success" && "text-green-400",
                      log.type === "error" && "text-red-400",
                      log.type === "warning" && "text-yellow-400",
                      log.type === "info" && "text-blue-400"
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        )}

          {activeTab === "queue" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-[#141414] pb-4">
                <div>
                  <h2 className="text-2xl font-serif italic">Danh sách khách hàng chờ gọi</h2>
                  <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">Hệ thống sẽ tự động phân phối các số này cho 5 điện thoại đang rảnh</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest">Thêm số mới</button>
                  <button className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest">Nhập File CSV</button>
                </div>
              </div>
              <div className="space-y-1">
                {queue.map((item, i) => (
                  <div key={item.id} className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] items-center p-4 border-b border-[#141414] hover:bg-white/40 transition-colors group">
                    <span className="text-[10px] font-mono opacity-30">{i + 1 < 10 ? `0${i + 1}` : i + 1}</span>
                    <span className="font-bold">{item.phoneNumber}</span>
                    <span className="text-xs opacity-50 italic">{item.name}</span>
                    <span className={cn(
                      "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border",
                      item.status === "pending" && "border-gray-400 text-gray-500",
                      item.status === "calling" && "border-blue-500 text-blue-600 bg-blue-50 animate-pulse",
                      item.status === "completed" && "border-green-500 text-green-600 bg-green-50",
                      item.status === "retry_15m" && "border-yellow-500 text-yellow-600 bg-yellow-50",
                      item.status === "error_network" && "border-red-500 text-red-600 bg-red-50",
                      item.status === "voicemail" && "border-purple-500 text-purple-600 bg-purple-50"
                    )}>
                      {item.status === "pending" ? "Đang chờ" : 
                       item.status === "calling" ? "Đang gọi" : 
                       item.status === "completed" ? "Hoàn thành" :
                       item.status === "retry_15m" ? "Gọi lại sau 15p" :
                       item.status === "error_network" ? "Lỗi mạng/Hết tiền" :
                       item.status === "voicemail" ? "Hộp thư thoại" : "Khác"}
                    </span>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCall(devices[0]?.id, item.phoneNumber)}
                        className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] rounded-sm transition-colors"
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-8">
              <div className="border-b border-[#141414] pb-4">
                <h2 className="text-2xl font-serif italic">Real-time Analytics</h2>
                <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Thống kê hiệu suất cuộc gọi hệ thống</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 border border-[#141414] bg-white space-y-2">
                  <p className="text-[10px] uppercase font-bold opacity-50">Tổng cuộc gọi</p>
                  <p className="text-3xl font-serif italic">{analytics.totalCalls}</p>
                </div>
                <div className="p-6 border border-[#141414] bg-white space-y-2">
                  <p className="text-[10px] uppercase font-bold opacity-50">Số người nghe máy</p>
                  <p className="text-3xl font-serif italic text-green-600">{analytics.pickups}</p>
                </div>
                <div className="p-6 border border-[#141414] bg-white space-y-2">
                  <p className="text-[10px] uppercase font-bold opacity-50">Tỷ lệ bắt máy</p>
                  <p className="text-3xl font-serif italic text-blue-600">{analytics.pickupRate}%</p>
                </div>
                <div className="p-6 border border-[#141414] bg-white space-y-2">
                  <p className="text-[10px] uppercase font-bold opacity-50">Thời gian đàm thoại TB</p>
                  <p className="text-3xl font-serif italic">{analytics.avgDuration}s</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-[#141414] bg-[#141414] text-[#E4E3E0] space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                    <PieChart size={16} /> Hiệu suất thiết bị
                  </h3>
                  <div className="space-y-4">
                    {devices.map(d => (
                      <div key={d.id} className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold">
                          <span>{d.model}</span>
                          <span>{d.callCountHour} calls/hr</span>
                        </div>
                        <div className="w-full h-1 bg-white/10">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${Math.min(100, (d.callCountHour || 0) * 5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border border-[#141414] bg-white space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                    <BarChart3 size={16} /> Trạng thái hàng đợi
                  </h3>
                  <div className="flex items-end gap-2 h-40 pt-4">
                    <div className="flex-1 bg-gray-100 relative group">
                      <div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${(queue.filter(q => q.status === "pending").length / queue.length) * 100}%` }} />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100">PENDING</span>
                    </div>
                    <div className="flex-1 bg-gray-100 relative group">
                      <div className="absolute bottom-0 w-full bg-yellow-500" style={{ height: `${(queue.filter(q => q.status === "calling").length / queue.length) * 100}%` }} />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100">CALLING</span>
                    </div>
                    <div className="flex-1 bg-gray-100 relative group">
                      <div className="absolute bottom-0 w-full bg-green-500" style={{ height: `${(queue.filter(q => q.status === "completed").length / queue.length) * 100}%` }} />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100">DONE</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[8px] font-bold uppercase opacity-50">
                    <span>Chờ xử lý</span>
                    <span>Đang gọi</span>
                    <span>Hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "settings" && (
            <div className="max-w-3xl space-y-8">
              <div className="flex justify-between items-end border-b border-[#141414] pb-4">
                <div>
                  <h2 className="text-2xl font-serif italic">System Configuration</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Cấu hình tham số vận hành hệ thống</p>
                </div>
                <button 
                  onClick={() => updateSettings(settings)}
                  disabled={isSavingSettings}
                  className={cn(
                    "px-6 py-2 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    saveSuccess ? "bg-green-600" : "bg-[#141414] hover:bg-gray-800"
                  )}
                >
                  {isSavingSettings ? <RefreshCw className="animate-spin" size={14} /> : (saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />)}
                  {isSavingSettings ? "Đang lưu..." : (saveSuccess ? "Đã lưu thành công" : "Lưu cấu hình")}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="opacity-50" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Audio Routing</h3>
                    </div>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setSettings({ ...settings, audioRouting: "vac" })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 border border-[#141414] transition-all text-left",
                          settings.audioRouting === "vac" ? "bg-[#141414] text-white" : "bg-white/50 hover:bg-white"
                        )}
                      >
                        <div>
                          <span className="text-sm font-bold block">Virtual Audio Cable (VAC)</span>
                          <span className="text-[9px] opacity-60">Sử dụng driver âm thanh ảo để truyền phát file ghi âm.</span>
                        </div>
                        {settings.audioRouting === "vac" && <CheckCircle2 size={16} />}
                      </button>
                      <button 
                        onClick={() => setSettings({ ...settings, audioRouting: "hardware" })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 border border-[#141414] transition-all text-left",
                          settings.audioRouting === "hardware" ? "bg-[#141414] text-white" : "bg-white/50 hover:bg-white"
                        )}
                      >
                        <div>
                          <span className="text-sm font-bold block">Hardware Loopback (3.5mm)</span>
                          <span className="text-[9px] opacity-60">Sử dụng cáp vật lý nối từ Soundcard vào cổng Mic điện thoại.</span>
                        </div>
                        {settings.audioRouting === "hardware" && <CheckCircle2 size={16} />}
                      </button>
                      <button 
                        onClick={() => setSettings({ ...settings, audioRouting: "root_direct" })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 border border-[#141414] transition-all text-left",
                          settings.audioRouting === "root_direct" ? "bg-[#141414] text-white" : "bg-white/50 hover:bg-white"
                        )}
                      >
                        <div>
                          <span className="text-sm font-bold block">Direct Audio Injection (Root)</span>
                          <span className="text-[9px] opacity-60">Nạp audio trực tiếp vào AudioTrack (Yêu cầu Root). Không cần dây AUX.</span>
                        </div>
                        {settings.audioRouting === "root_direct" && <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain size={16} className="opacity-50" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Smart Voice Features</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-[#141414] bg-white/50">
                        <div>
                          <span className="text-sm font-bold block">Voice Activity Detection (VAD)</span>
                          <span className="text-[9px] opacity-60">Chờ khách hàng nói "Alo" mới bắt đầu phát thoại.</span>
                        </div>
                        <button 
                          onClick={() => setSettings({ ...settings, vadEnabled: !settings.vadEnabled })}
                          className={cn("w-10 h-5 rounded-full p-1 transition-colors", settings.vadEnabled ? "bg-green-500" : "bg-gray-300")}
                        >
                          <div className={cn("w-3 h-3 bg-white rounded-full transition-all", settings.vadEnabled ? "ml-5" : "ml-0")} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-[#141414] bg-white/50">
                        <div>
                          <span className="text-sm font-bold block">Personalized TTS (Gemini)</span>
                          <span className="text-[9px] opacity-60">Tự động chèn tên khách hàng vào câu thoại xác nhận.</span>
                        </div>
                        <button 
                          onClick={() => setSettings({ ...settings, useTTS: !settings.useTTS })}
                          className={cn("w-10 h-5 rounded-full p-1 transition-colors", settings.useTTS ? "bg-green-500" : "bg-gray-300")}
                        >
                          <div className={cn("w-3 h-3 bg-white rounded-full transition-all", settings.useTTS ? "ml-5" : "ml-0")} />
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="opacity-50" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Blacklist Prevention</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold block">Hourly Call Limit</label>
                          <span className="text-[10px] font-mono opacity-50">{settings.hourlyLimit} calls/hour</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="100" 
                          value={settings.hourlyLimit} 
                          onChange={(e) => setSettings({ ...settings, hourlyLimit: parseInt(e.target.value) })}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#141414]" 
                        />
                        <p className="text-[9px] opacity-60 italic">Giới hạn số cuộc gọi tối đa mỗi giờ trên mỗi SIM để tránh bị nhà mạng khóa SIM.</p>
                      </div>

                      <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold block">Spam Threshold (Short Calls)</label>
                          <span className="text-[10px] font-mono opacity-50">{settings.spamThreshold} consecutive</span>
                        </div>
                        <input 
                          type="range" 
                          min="3" 
                          max="20" 
                          value={settings.spamThreshold} 
                          onChange={(e) => setSettings({ ...settings, spamThreshold: parseInt(e.target.value) })}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#141414]" 
                        />
                        <p className="text-[9px] opacity-60 italic">Số cuộc gọi ngắn (dưới 5s) liên tiếp tối đa. Vượt ngưỡng này máy sẽ tạm dừng để bảo vệ SIM.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="opacity-50" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Automation Rules</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                        <label className="text-[10px] uppercase font-bold block">Call Delay (sec)</label>
                        <input 
                          type="number" 
                          value={settings.callDelay} 
                          onChange={(e) => setSettings({ ...settings, callDelay: parseInt(e.target.value) })}
                          className="w-full bg-transparent border-b border-[#141414] focus:outline-none text-sm py-1" 
                        />
                        <p className="text-[9px] opacity-60 italic">Thời gian nghỉ giữa 2 cuộc gọi liên tiếp trên cùng một thiết bị (giãn cách tự nhiên).</p>
                      </div>
                      <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                        <label className="text-[10px] uppercase font-bold block">Max Retries</label>
                        <input 
                          type="number" 
                          value={settings.maxRetries} 
                          onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) })}
                          className="w-full bg-transparent border-b border-[#141414] focus:outline-none text-sm py-1" 
                        />
                        <p className="text-[9px] opacity-60 italic">Số lần thử lại tối đa khi cuộc gọi thất bại trước khi chuyển sang bước Reset/Alert.</p>
                      </div>
                      <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold block">SIM Rotation Limit</label>
                          <span className="text-[10px] font-mono opacity-50">{settings.simRotationLimit} calls</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="50" 
                          value={settings.simRotationLimit} 
                          onChange={(e) => setSettings({ ...settings, simRotationLimit: parseInt(e.target.value) })}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#141414]" 
                        />
                        <p className="text-[9px] opacity-60 italic">Tự động đổi SIM 1/2 sau mỗi X cuộc gọi để tránh bị nhà mạng soi tần suất.</p>
                      </div>
                    </div>
                  </section>

                  <section className="p-6 border border-[#141414] bg-[#141414] text-[#E4E3E0] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest">Auto-Distribution Mode</h3>
                        <p className="text-[10px] opacity-60">Tự động phân phối cuộc gọi từ hàng đợi cho các máy đang rảnh.</p>
                      </div>
                      <button 
                        onClick={() => setSettings({ ...settings, autoMode: !settings.autoMode })}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors relative",
                          settings.autoMode ? "bg-green-500" : "bg-gray-600"
                        )}
                      >
                        <motion.div 
                          animate={{ x: settings.autoMode ? 24 : 0 }}
                          className="w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[9px] opacity-40 leading-relaxed">
                        * Chế độ này sẽ liên tục quét hàng đợi (QUEUE) và tìm thiết bị có trạng thái IDLE. 
                        Hệ thống sẽ tự động thực hiện cuộc gọi mà không cần can thiệp thủ công.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all group",
        active ? "text-[#141414]" : "text-gray-400 hover:text-[#141414]"
      )}
    >
      <div className={cn(
        "p-2 rounded-sm transition-colors",
        active ? "bg-[#141414] text-[#E4E3E0]" : "group-hover:bg-gray-200"
      )}>
        {icon}
      </div>
      <span className="text-[8px] font-bold tracking-tighter uppercase">{label}</span>
    </button>
  );
}

function DeviceCard({ device, onCall, onReboot, onRemove }: { key?: string | number; device: Device; onCall: () => void | Promise<void>; onReboot: () => void | Promise<void>; onRemove: () => void | Promise<void> }) {
  const isBusy = device.status !== "idle";

  return (
    <div className="border border-[#141414] bg-white/60 p-5 space-y-6 relative overflow-hidden group">
      {/* Remove Button */}
      <button 
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Xóa thiết bị"
      >
        <Trash2 size={14} />
      </button>
      {/* Status Indicator */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full transition-colors",
        device.status === "idle" && "bg-green-500",
        device.status === "dialing" && "bg-blue-500 animate-pulse",
        device.status === "connected" && "bg-red-500 animate-pulse",
        device.status === "rebooting" && "bg-yellow-500",
        device.status === "offline" && "bg-gray-400",
        device.status === "unauthorized" && "bg-orange-500 animate-bounce",
        device.status === "alert" && "bg-red-700 shadow-[0_0_15px_rgba(185,28,28,0.5)]"
      )} />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-xs uppercase font-bold tracking-widest",
              device.status === "alert" && "text-red-700"
            )}>{device.model}</h3>
            {device.status === "alert" && <AlertTriangle size={12} className="text-red-700 animate-pulse" />}
            {device.status === "offline" && <WifiOff size={12} className="text-gray-400" />}
          </div>
          <p className="text-[10px] font-mono opacity-50">{device.id}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] font-mono opacity-30">SoundCard: {device.soundCardId || "N/A"}</p>
            <div className="w-px h-2 bg-gray-300" />
            <p className="text-[9px] font-mono font-bold text-blue-600">SIM: {device.currentSim || 1}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1">
            <Battery size={12} className={cn(device.battery < 20 ? "text-red-500" : "opacity-50")} />
            <span className="text-[10px] font-mono">{device.battery}%</span>
          </div>
          <Signal size={12} className="opacity-50" />
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 border-y border-[#141414]/10">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border border-[#141414]",
          device.status === "connected" ? "bg-red-500 text-white animate-pulse" : 
          device.status === "alert" ? "bg-red-700 text-white shadow-lg shadow-red-500/50" : "bg-transparent"
        )}>
          {device.status === "alert" ? <AlertCircle size={20} /> : <PhoneCall size={20} />}
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold opacity-50">Trạng thái máy</p>
          <p className={cn(
            "text-sm font-bold tracking-tight uppercase",
            device.status === "alert" && "text-red-700",
            device.status === "offline" && "text-gray-400"
          )}>
            {device.status === "idle" ? "Đang rảnh" : 
             device.status === "dialing" ? "Đang quay số" : 
             device.status === "connected" ? "Đang hội thoại" : 
             device.status === "offline" ? "Mất kết nối" :
             device.status === "unauthorized" ? "Chưa cấp quyền" :
             device.status === "alert" ? "CẢNH BÁO LỖI" :
             "Đang khởi động lại"}
          </p>
          {device.currentNumber && (
            <p className="text-[10px] font-mono text-blue-600 font-bold mt-1">
              CALLING: {device.currentNumber}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-white/40 border border-[#141414]/5 rounded-sm">
          <p className="text-[8px] uppercase font-bold opacity-40">Calls/Hour</p>
          <p className={cn("text-xs font-bold", (device.callCountHour || 0) >= 15 ? "text-orange-600" : "text-black")}>
            {device.callCountHour || 0}/20
          </p>
        </div>
        <div className="p-2 bg-white/40 border border-[#141414]/5 rounded-sm">
          <p className="text-[8px] uppercase font-bold opacity-40">Spam Score</p>
          <p className={cn("text-xs font-bold", (device.consecutiveShortCalls || 0) >= 5 ? "text-red-600" : "text-black")}>
            {device.consecutiveShortCalls || 0}/10
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button 
          disabled={isBusy || device.status === "offline" || device.status === "unauthorized" || device.status === "alert"}
          onClick={onCall}
          className={cn(
            "flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-all",
            (isBusy || device.status === "offline" || device.status === "unauthorized" || device.status === "alert") ? "opacity-30 cursor-not-allowed" : "hover:bg-[#141414] hover:text-[#E4E3E0]"
          )}
        >
          <Phone size={12} /> Gọi ngay
        </button>
        <button 
          disabled={device.status === "rebooting" || device.status === "offline"}
          onClick={onReboot}
          className={cn(
            "flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-all",
            (device.status === "rebooting" || device.status === "offline") ? "opacity-30 cursor-not-allowed" : "hover:bg-yellow-500 hover:border-yellow-500"
          )}
        >
          <RotateCcw size={12} /> Reset máy
        </button>
      </div>

      {/* Visual Activity Feed */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={device.status === "connected" ? { x: "100%" } : { x: "-100%" }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="h-full w-1/3 bg-[#141414]"
        />
      </div>
    </div>
  );
}
