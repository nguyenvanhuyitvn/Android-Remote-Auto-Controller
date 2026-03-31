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
  Sparkles
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
  status: "idle" | "dialing" | "connected" | "rebooting";
  battery: number;
  signal: "excellent" | "good" | "fair" | "poor";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "queue" | "logs" | "settings">("dashboard");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("intro_v1.mp3");
  const [isAutoMode, setIsAutoMode] = useState(false);
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

  useEffect(() => {
    fetchDevices();
    fetchLogs();
    const interval = setInterval(() => {
      fetchDevices();
      fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCall = async (deviceId: string) => {
    if (!phoneNumber) return;
    try {
      await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, phoneNumber, audioFile: selectedAudio }),
      });
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

  const generateAIReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const data = await res.json();
      if (!data.report) {
        throw new Error("AI returned an empty report");
      }
      setAiReport(data.report);
      setActiveTab("logs");
    } catch (e: any) {
      console.error("Report generation failed", e);
      setReportError(e.message);
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
          <NavButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<Terminal size={20} />} label="LOGS" />
          <div className="mt-auto">
            <NavButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={20} />} label="SET" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* AI Vision Panel */}
              <div className="border border-[#141414] p-6 bg-[#141414] text-[#E4E3E0] rounded-sm flex flex-col md:flex-row gap-6 items-center">
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
                      Analyze Screen
                    </button>
                  </div>
                  {visionResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-white/5 border border-purple-400/30 text-[10px] font-mono"
                    >
                      <p className="text-purple-400 mb-1 uppercase font-bold">AI Result:</p>
                      <p>{visionResult.description}</p>
                      {visionResult.elementFound && (
                        <p className="mt-1 text-green-400">Target Coordinates: [{visionResult.coordinates.x}, {visionResult.coordinates.y}]</p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#141414] p-4 bg-white/50 space-y-3">
                  <label className="text-[10px] uppercase font-bold opacity-50 block">Target Number</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+84 900 000 000"
                      className="flex-1 bg-transparent border-b border-[#141414] px-2 py-1 text-sm focus:outline-none placeholder:opacity-30"
                    />
                    <button 
                      onClick={() => setIsAutoMode(!isAutoMode)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold border border-[#141414] transition-colors",
                        isAutoMode ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414] hover:text-[#E4E3E0]"
                      )}
                    >
                      {isAutoMode ? "AUTO_ON" : "AUTO_OFF"}
                    </button>
                  </div>
                </div>

                <div className="border border-[#141414] p-4 bg-white/50 space-y-3">
                  <label className="text-[10px] uppercase font-bold opacity-50 block">Audio Script</label>
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
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif italic">System Logs & AI Insights</h2>
                <button 
                  onClick={generateAIReport}
                  disabled={isGeneratingReport}
                  className="px-6 py-2 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                >
                  {isGeneratingReport ? <RefreshCw className="animate-spin" size={14} /> : <Brain size={14} />}
                  Generate AI Report
                </button>
              </div>

              {reportError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-red-400 bg-red-50 text-red-700 text-xs flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  <div>
                    <p className="font-bold uppercase tracking-widest text-[10px]">Report Generation Error</p>
                    <p>{reportError}</p>
                  </div>
                  <button 
                    onClick={() => setReportError(null)}
                    className="ml-auto text-red-900 hover:text-red-600"
                  >
                    <Square size={14} />
                  </button>
                </motion.div>
              )}

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
                <h2 className="text-2xl font-serif italic">Call Queue</h2>
                <button className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest">Import CSV</button>
              </div>
              <div className="space-y-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] items-center p-4 border-b border-[#141414] hover:bg-white/40 transition-colors group">
                    <span className="text-[10px] font-mono opacity-30">0{i + 1}</span>
                    <span className="font-bold">+84 901 234 {567 + i}</span>
                    <span className="text-xs opacity-50 italic">Customer_{i + 1024}</span>
                    <span className="text-[10px] font-mono uppercase">intro_v1.mp3</span>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] rounded-sm transition-colors">
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-8">
              <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-4">System Configuration</h2>
              
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Audio Routing</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-[#141414] bg-white/50">
                      <span className="text-sm">Virtual Audio Cable (VAC)</span>
                      <div className="w-10 h-5 bg-[#141414] rounded-full p-1 flex justify-end">
                        <div className="w-3 h-3 bg-[#E4E3E0] rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-[#141414] bg-white/50">
                      <span className="text-sm">Hardware Loopback (3.5mm)</span>
                      <div className="w-10 h-5 bg-gray-300 rounded-full p-1 flex justify-start">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-50">Automation Rules</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                      <label className="text-[10px] uppercase font-bold block">Call Delay (sec)</label>
                      <input type="number" defaultValue={5} className="w-full bg-transparent border-b border-[#141414] focus:outline-none text-sm" />
                    </div>
                    <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
                      <label className="text-[10px] uppercase font-bold block">Max Retries</label>
                      <input type="number" defaultValue={3} className="w-full bg-transparent border-b border-[#141414] focus:outline-none text-sm" />
                    </div>
                  </div>
                </section>
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

function DeviceCard({ device, onCall, onReboot }: { key?: string | number; device: Device; onCall: () => void | Promise<void>; onReboot: () => void | Promise<void> }) {
  const isBusy = device.status !== "idle";

  return (
    <div className="border border-[#141414] bg-white/60 p-5 space-y-6 relative overflow-hidden group">
      {/* Status Indicator */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full transition-colors",
        device.status === "idle" && "bg-green-500",
        device.status === "dialing" && "bg-blue-500 animate-pulse",
        device.status === "connected" && "bg-red-500 animate-pulse",
        device.status === "rebooting" && "bg-yellow-500"
      )} />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-xs uppercase font-bold tracking-widest">{device.model}</h3>
          <p className="text-[10px] font-mono opacity-50">{device.id}</p>
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
          device.status === "connected" ? "bg-red-500 text-white animate-pulse" : "bg-transparent"
        )}>
          <PhoneCall size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold opacity-50">Current State</p>
          <p className="text-sm font-bold tracking-tight uppercase">{device.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button 
          disabled={isBusy}
          onClick={onCall}
          className={cn(
            "flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-all",
            isBusy ? "opacity-30 cursor-not-allowed" : "hover:bg-[#141414] hover:text-[#E4E3E0]"
          )}
        >
          <Play size={12} /> Start Call
        </button>
        <button 
          disabled={isBusy}
          onClick={onReboot}
          className={cn(
            "flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-all",
            isBusy ? "opacity-30 cursor-not-allowed" : "hover:bg-yellow-500 hover:border-yellow-500"
          )}
        >
          <RefreshCw size={12} /> Reboot
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
