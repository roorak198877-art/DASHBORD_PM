import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area
} from 'recharts';
import { 
  CheckCircle, 
  Monitor, 
  TrendingUp, 
  FileText,
  Layers,
  Edit2,
  Plus,
  X,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  Settings,
  Wrench,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  Share2,
  Cpu,
  Activity,
  Home,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Printer,
  PrinterIcon,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Download,
  Unlock,
  Calendar,
  ShieldCheck,
  Info,
  Camera,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_PM_DATA, DEPARTMENTS, DEVICE_STATUS_OPTIONS, COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES } from './constants';
import { PMItem } from './types';
import * as XLSX from 'xlsx';

// Modern Color Palette
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f43f5e'];

// Bouncy Animation Config
const bouncySpring = { type: "spring" as const, stiffness: 400, damping: 25 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const bouncyItem = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: bouncySpring }
};

const modalAnimate = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: bouncySpring },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

// Security PIN
const SECURITY_PIN = '1234';

/**
 * Helper: Convert date string to Thai locale 'DD Month YYYY'
 */
const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    let d: Date;
    const str = String(dateStr);
    if (str.includes('T')) {
      const datePart = str.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else if (str.includes('-')) {
      const [year, month, day] = str.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else if (str.includes('/')) {
      const [day, month, year] = str.split('/').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(str);
    }

    if (isNaN(d.getTime())) return str;

    return d.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (e) {
    return String(dateStr);
  }
};

const toISODate = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined') return '';
  try {
    const str = String(dateStr);
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes('-')) return str;
    const parts = str.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const BouncyIcon = ({ icon: Icon = Wrench, size = 20, className = "text-indigo-500" }) => (
  <motion.div
    animate={{ y: [0, -6, 0], scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    className={className}
  >
    <Icon size={size} />
  </motion.div>
);

const AppLogo: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <div className="relative flex items-center justify-center overflow-visible" style={{ width: size, height: size }}>
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute text-indigo-600 z-20"><Settings size={size * 0.9} /></motion.div>
    <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute text-indigo-400 translate-x-4 -translate-y-3 z-10"><Settings size={size * 0.6} /></motion.div>
  </div>
);

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbz33ZEnFiGga00KxZ452_nsgVWGkOsO351GBmEK1fJziXSYzVBFTp03gBbofp3-J7ATMQ/exec';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [pmModule, setPmModule] = useState<'computer' | 'printer'>('computer');
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [userRole, setUserRole] = useState<'admin' | 'general'>('general');
  const [isAdminSession, setIsAdminSession] = useState(false); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [items, setItems] = useState<PMItem[]>(() => {
    try {
      const saved = localStorage.getItem('pm_dashboard_data');
      if (!saved) return INITIAL_PM_DATA;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(i => i !== null) : INITIAL_PM_DATA;
    } catch (e) {
      console.error("Failed to parse items from localStorage", e);
      return INITIAL_PM_DATA;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrItem, setQrItem] = useState<PMItem | null>(null);
  const [editingItem, setEditingItem] = useState<PMItem | null>(null);
  const [otherDeptValue, setOtherDeptValue] = useState('');
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('pm_sheet_url') || DEFAULT_GAS_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [itemsToPrint, setItemsToPrint] = useState<PMItem[]>([]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view');
      if (viewId) setPublicViewId(viewId);
    } catch (e) {
      console.error("URL Search Params error", e);
    }
  }, []);

  useEffect(() => { if (sheetUrl) { fetchFromSheet(true); } }, [sheetUrl]);
  
  useEffect(() => { 
    try {
      localStorage.setItem('pm_dashboard_data', JSON.stringify(items)); 
    } catch (e) {
      console.error("LocalStorage save error", e);
    }
  }, [items]);

  useEffect(() => { 
    if (sheetUrl) {
      try {
        localStorage.setItem('pm_sheet_url', sheetUrl); 
      } catch (e) {
        console.error("LocalStorage save error", e);
      }
    }
  }, [sheetUrl]);

  const filteredItems = useMemo(() => {
    const type = pmModule === 'computer' ? 'Computer' : 'Printer';
    return items.filter(item => item && item.device === type);
  }, [items, pmModule]);

  const getMaintenanceAlert = (dateStr?: any) => {
    if (!dateStr || dateStr === 'undefined' || dateStr === null) return null;
    try {
      const targetStr = toISODate(dateStr);
      if (!targetStr) return null;
      const target = new Date(targetStr);
      if (isNaN(target.getTime())) return null;
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      
      const diffDays = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 15) return 'near';
    } catch (e) {
      return null;
    }
    return null;
  };

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter(i => i && i.status === 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const deptMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item && item.department) deptMap[String(item.department)] = (deptMap[String(item.department)] || 0) + 1; });
    const deptStats = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    
    const trendMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item && item.date) trendMap[String(item.date)] = (trendMap[String(item.date)] || 0) + 1; });
    const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date: formatDateDisplay(date), count })).sort((a, b) => a.date.localeCompare(b.date));
    
    let overdueCount = 0, nearDueCount = 0, brokenCount = 0;
    filteredItems.forEach(item => {
      if (item) {
        if (item.nextPmDate) {
          const alert = getMaintenanceAlert(item.nextPmDate);
          if (alert === 'overdue') overdueCount++; else if (alert === 'near') nearDueCount++;
        }
        if (item.deviceStatus && String(item.deviceStatus).includes('Broken')) brokenCount++;
      }
    });
    return { total, completionRate, deptStats, dailyTrend, overdueCount, nearDueCount, brokenCount };
  }, [filteredItems]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'tci@1234') {
      setUserRole('admin'); setIsAdminSession(false); setIsLoginModalOpen(false); setLoginForm({ username: '', password: '' }); setLoginError('');
      setSyncMessage("ยินดีต้อนรับ Admin / Welcome Admin"); setTimeout(() => setSyncMessage(null), 3000);
    } else { setLoginError('Login ไม่ถูกต้อง / Invalid Login'); }
  };

  const handleLogout = () => {
    setUserRole('general'); setIsAdminSession(false);
    setSyncMessage("ออกจากระบบแล้ว / Logged Out"); setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleRequestUnlock = () => {
    const pin = window.prompt("กรุณาใส่รหัส Admin (1234) / Please Enter Admin PIN:");
    if (pin === SECURITY_PIN) {
      setIsAdminSession(true); setSyncMessage("ปลดล็อกแล้ว / Unlocked"); 
      setTimeout(() => setSyncMessage(null), 3000);
    } else if (pin !== null) { alert("รหัส PIN ไม่ถูกต้อง / Invalid PIN"); }
  };

  const handleEdit = (item: PMItem) => {
    if (!item) return;
    if (userRole !== 'admin') return alert('ต้องใช้สิทธิ์ Admin / Admin access required');
    setEditingItem({ ...item });
    setOtherDeptValue(DEPARTMENTS.includes(item.department) ? '' : item.department);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!id) return;
    if (userRole !== 'admin') return alert('ต้องใช้สิทธิ์ Admin / Admin access required');
    if (window.confirm('ยืนยันการลบข้อมูล? / Are you sure you want to delete?')) {
      setItems(prev => prev.filter(i => i && i.id !== id));
      setSyncMessage("ลบข้อมูลแล้ว / Deleted"); setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const handleShowQr = (item: PMItem) => {
    if (!item) return;
    setQrItem(item);
    setIsQrModalOpen(true);
  };

  const pushToCloud = async (item: PMItem) => {
    if (!sheetUrl || !item) return;
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch (err) { console.error('Cloud Sync Error:', err); }
  };

  const handleAddNew = () => {
    if (userRole !== 'admin') return alert('ต้องใช้สิทธิ์ Admin / Admin access required');
    const deviceType = pmModule === 'computer' ? 'Computer' : 'Printer';
    setEditingItem({
      id: '', 
      date: new Date().toISOString().split('T')[0], 
      department: DEPARTMENTS[0], 
      device: deviceType, 
      personnel: '', 
      status: 'Pending', 
      deviceStatus: DEVICE_STATUS_OPTIONS[0],
      activity: '', 
      computerName: '', 
      computerUser: '', 
      password: '', 
      serverPassword: '', 
      antivirus: '',
      startDate: '',
      warrantyExpiry: '',
      spareField: '',
      imageUrl: ''
    });
    setOtherDeptValue(''); setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || userRole !== 'admin') return;
    if (!editingItem.id) return alert('กรุณากรอกรหัสอุปกรณ์ / Please enter device ID');
    
    let finalItem = { ...editingItem };
    if (finalItem.department === 'Others / อื่นๆ') finalItem.department = otherDeptValue || 'Others';
    if (finalItem.status === 'Completed') {
      const baseDateStr = toISODate(finalItem.date);
      if (baseDateStr) {
        const nextDate = new Date(baseDateStr);
        if (!isNaN(nextDate.getTime())) {
          nextDate.setDate(nextDate.getDate() + (finalItem.device === 'Computer' ? 180 : 60));
          try {
            finalItem.nextPmDate = nextDate.toISOString().split('T')[0];
          } catch (err) {
            console.error("Date formatting error:", err);
            finalItem.nextPmDate = undefined;
          }
        }
      }
    }
    setItems(prev => {
      const exists = prev.find(i => i && i.id === finalItem.id);
      return exists ? prev.map(i => (i && i.id === finalItem.id) ? finalItem : i) : [...prev, finalItem];
    });
    setIsModalOpen(false); setEditingItem(null); setSyncMessage("บันทึกแล้ว / Saved"); setTimeout(() => setSyncMessage(null), 3000);
    await pushToCloud(finalItem);
  };

  const fetchFromSheet = async (silent = false) => {
    if (!sheetUrl) return; setIsSyncing(true);
    try {
      const response = await fetch(`${sheetUrl}?_t=${Date.now()}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      if (Array.isArray(data)) { 
        setItems(data.filter(i => i !== null)); 
        if (!silent) setSyncMessage('อัปเดตข้อมูลแล้ว / Data Updated'); 
      }
    } catch (err) { 
      console.error(err); 
      if (!silent) setSyncMessage('การอัปเดตล้มเหลว / Update Failed');
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 3000); 
    }
  };

  const exportToExcel = () => {
    try {
      setSyncMessage("กำลังส่งออก... / Exporting...");
      const data = filteredItems.map(it => {
        const row: any = {
          ID: it.id, Date: formatDateDisplay(it.date), Next_PM: formatDateDisplay(it.nextPmDate),
          Dept: it.department, Device: it.device, Personnel: it.personnel, Status: it.status,
          Device_Status: it.deviceStatus, Name: it.computerName, Activities: it.activity,
          Start_Date: it.startDate, Warranty_Expiry: it.warrantyExpiry, Additional_Info: it.spareField,
          Image_Attached: it.imageUrl ? 'Yes' : 'No'
        };
        if (it.device === 'Computer') {
          row.User_ColJ = it.computerUser || '-';
          row.Pass_K = it.password; row.Pass_L = it.serverPassword;
          row.AV_M = it.antivirus || '-';
        }
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "PM_Report");
      XLSX.writeFile(wb, `IT_PM_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
      setTimeout(() => setSyncMessage(null), 2000);
    } catch (e) {
      console.error("Excel Export Error", e);
      setSyncMessage("ส่งออกล้มเหลว / Export Failed");
    }
  };

  const handlePrintSingle = (item: PMItem) => { if(!item) return; setItemsToPrint([item]); setTimeout(() => { window.print(); setItemsToPrint([]); }, 500); };
  const handlePrintAll = () => { if (filteredItems.length === 0) return; setItemsToPrint(filteredItems); setTimeout(() => { window.print(); setItemsToPrint([]); }, 500); };
  const resetFiltersAndGoHome = () => { setActiveTab('dashboard'); setPmModule('computer'); };

  const getDeviceStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-500 border-slate-200';
    const s = String(status);
    if (s.includes('In Use')) return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    if (s.includes('Standby')) return 'bg-blue-100 text-blue-600 border-blue-200';
    if (s.includes('Broken')) return 'bg-red-100 text-red-600 border-red-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getPMStatusColor = (status?: string) => {
    if (status === 'Completed') return 'bg-emerald-500 text-white border-emerald-600';
    if (status === 'In Progress') return 'bg-amber-400 text-white border-amber-500';
    return 'bg-slate-200 text-slate-600 border-slate-300';
  };

  const handleBackFromPublicView = () => {
    setPublicViewId(null);
    setActiveTab('table');
    try {
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("File size too large (> 2MB)");

    const reader = new FileReader();
    reader.onloadend = () => {
      if (editingItem) {
        setEditingItem({ ...editingItem, imageUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // --- PUBLIC REPORT READ-ONLY MODE LOGIC ---
  if (publicViewId) {
    const item = items.find(i => i && i.id === publicViewId);
    
    if (isSyncing && !item) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Loading Data / กำลังโหลดข้อมูล...</h2>
            <p className="text-xs font-bold text-slate-400">Please wait while we sync with cloud</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 pointer-events-none select-none overflow-x-hidden">
        {!item ? (
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ไม่พบข้อมูล / Data Not Found</h2>
            <p className="mt-2 text-slate-400 font-medium">Device ID: <span className="font-black">{publicViewId}</span></p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden print-visible relative">
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-slate-100/50 backdrop-blur-md rounded-full border border-slate-200/50 flex items-center gap-1.5 no-print">
               <Eye size={12} className="text-slate-500" />
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Read Only Mode</span>
            </div>

            <div className={`p-10 text-white ${item.status === 'Completed' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
              <h2 className="text-4xl font-black leading-tight">PM Report<br/>ใบรายงานบำรุงรักษา</h2>
            </div>
            <div className="p-10 space-y-8">
              {/* Photo Preview in Report */}
              {item.imageUrl && (
                <div className="w-full h-56 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-inner group relative">
                  <img src={item.imageUrl} alt="Device" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}

              <div className="flex justify-between border-b pb-6">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device / อุปกรณ์</p><p className="text-xl font-black text-slate-800">{item.computerName || 'N/A'}</p></div>
                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / รหัส</p><p className="font-mono font-bold text-slate-500">{item.id}</p></div>
              </div>
              
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status / สถานะระบบ</p>
                 <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-2xl border text-center font-black text-[10px] uppercase ${getPMStatusColor(item.status)}`}>
                       PM: {item.status || 'Pending'}
                    </div>
                    <div className={`p-4 rounded-2xl border text-center font-black text-[10px] uppercase ${getDeviceStatusColor(item.deviceStatus)}`}>
                       Health: {String(item.deviceStatus || '').split(' / ')[0] || 'Ready'}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PM Date / วันที่ทำ</p><p className="text-sm font-black text-slate-700">{formatDateDisplay(item.date)}</p></div>
                <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department / แผนก</p><p className="text-sm font-black text-slate-700 truncate">{item.department || '-'}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User / ผู้ใช้ (F)</p><p className="text-sm font-black text-slate-700">{item.personnel || '-'}</p></div>
                {item.device === 'Computer' ? (
                   <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User computer / ผู้ใช้คอมพิวเตอร์ (J)</p><p className="text-sm font-black text-slate-700">{item.computerUser || '-'}</p></div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Type / ประเภท</p><p className="text-sm font-black text-slate-700">{item.device}</p></div>
                )}
              </div>

              {/* Lifecycle and Warranty Section */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2"><Calendar size={14} className="text-indigo-500" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle & Warranty / ประกันและอายุการใช้งาน</p></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date / เริ่มใช้งาน</p><p className="text-[11px] font-black text-slate-700">{formatDateDisplay(item.startDate)}</p></div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warranty / หมดประกัน</p><p className="text-[11px] font-black text-slate-700">{formatDateDisplay(item.warrantyExpiry)}</p></div>
                 </div>
              </div>

              {item.device === 'Computer' && (
                <div className="grid grid-cols-1 gap-6">
                   <div className="bg-slate-50 p-5 rounded-[2rem]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antivirus / แอนตี้ (M)</p><p className="text-sm font-black text-slate-700">{item.antivirus || '-'}</p></div>
                </div>
              )}

              {item.nextPmDate && (
                <div className={`p-5 rounded-[2rem] border-2 ${getMaintenanceAlert(item.nextPmDate) === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Schedule / ครั้งถัดไป (C)</p><p className={`text-sm font-black ${getMaintenanceAlert(item.nextPmDate) === 'overdue' ? 'text-red-600' : 'text-indigo-600'}`}>{formatDateDisplay(item.nextPmDate)}</p>
                </div>
              )}

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities / กิจกรรม</p>
                 <div className="space-y-2">
                    {item.activity && String(item.activity).split(' | ').filter(a => a).map((a, i) => (<div key={i} className="flex gap-3 items-center text-[11px] text-slate-600 font-bold bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50"><CheckCircle size={14} className="text-emerald-500" /><span>{a}</span></div>))}
                 </div>
              </div>

              {/* Spare Field / Additional Info */}
              {item.spareField && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                   <div className="flex items-center gap-2 mb-2"><Info size={14} className="text-slate-400" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Info / ข้อมูลเพิ่มเติม</p></div>
                   <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic">"{item.spareField}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 no-print pointer-events-auto">
                <button onClick={() => window.print()} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                   <Printer size={16} /> Print Report / พิมพ์
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfdfe] relative font-sans">
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[200] px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-2xl font-black text-xs uppercase pointer-events-none text-center">
          {syncMessage}
        </motion.div>
      )}</AnimatePresence>
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-100 p-8 flex-col gap-8 sticky top-0 h-screen z-10 no-print">
        <div className="flex items-center gap-4 mb-4 cursor-pointer" onClick={resetFiltersAndGoHome}>
           <AppLogo size={45} /><div><h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">IT PM</h1><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Main / หน้าหลัก</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-6 mb-2">Category / หมวดหมู่</p>
          <button onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all ${pmModule === 'computer' && activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Monitor size={18} /> <span className="text-sm">Computer / คอมฯ</span></button>
          <button onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all ${pmModule === 'printer' && activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Printer size={18} /> <span className="text-sm">Printer / พิมพ์</span></button>
          <div className="h-px bg-slate-100 my-4 mx-4"></div>
          <button onClick={() => setActiveTab('table')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all ${activeTab === 'table' ? 'bg-slate-100 text-slate-800 font-black' : 'text-slate-400 hover:bg-slate-50'}`}><FileText size={18} /> <span className="text-sm">PM History / ประวัติ</span></button>
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-4 px-6 py-4 text-indigo-600 bg-indigo-50 rounded-[1.5rem] font-black text-[11px] uppercase shadow-sm mt-4">
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} <span>Sync / ซิงค์</span>
          </button>
        </nav>
        <div className="space-y-4">
          {userRole === 'general' ? (<button onClick={() => setIsLoginModalOpen(true)} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase hover:bg-indigo-600 transition-all shadow-xl"><Unlock size={14} /> Admin Login</button>) : (<button onClick={handleLogout} className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase"><LogOut size={14} /> Logout</button>)}
        </div>
      </aside>
      
      <header className="md:hidden sticky top-0 bg-white border-b px-6 py-4 z-40 flex items-center justify-between no-print shadow-sm">
        <div onClick={resetFiltersAndGoHome} className="flex items-center gap-3"><AppLogo size={35} /><h1 className="text-lg font-black text-slate-800">IT PM</h1></div>
        <div className="flex gap-2">{userRole === 'general' ? (<button onClick={() => setIsLoginModalOpen(true)} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase"><Unlock size={14}/></button>) : (<button onClick={handleLogout} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase"><LogOut size={14}/></button>)}</div>
      </header>
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-[50] flex items-center justify-around py-3 px-6 no-print shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe">
        <button onClick={() => { setActiveTab('dashboard'); resetFiltersAndGoHome(); }} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><Home size={22}/><span className="text-[9px] font-black uppercase">Home</span></button>
        <button onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} className={`flex flex-col items-center gap-1 ${pmModule === 'computer' && activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><Monitor size={22}/><span className="text-[9px] font-black uppercase">Comp</span></button>
        <button onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} className={`flex flex-col items-center gap-1 ${pmModule === 'printer' && activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><Printer size={22}/><span className="text-[9px] font-black uppercase">Print</span></button>
        <button onClick={() => setActiveTab('table')} className={`flex flex-col items-center gap-1 ${activeTab === 'table' ? 'text-indigo-600' : 'text-slate-400'}`}><FileText size={22}/><span className="text-[9px] font-black uppercase">Logs</span></button>
      </nav>
      
      {userRole === 'admin' && (<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleAddNew} className="md:hidden fixed bottom-24 right-6 z-40 p-4 bg-indigo-600 text-white rounded-full shadow-2xl no-print"><Plus size={28} /></motion.button>)}
      
      <main ref={dashboardRef} className="flex-1 p-4 md:p-12 overflow-y-auto w-full mb-20 md:mb-0">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 no-print">
          <div>
            <div className="flex items-center gap-3 mb-1"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm"><BouncyIcon icon={pmModule === 'computer' ? Cpu : Printer} size={20} /></div><h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight capitalize">{pmModule === 'computer' ? 'Computer / คอมพิวเตอร์' : 'Printer / เครื่องพิมพ์'}</h2></div>
            <p className="text-slate-400 font-medium ml-1 text-xs md:text-sm">IT Preventive Maintenance Dashboard / ระบบจัดการงานบำรุงรักษา</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {userRole === 'admin' && (<button onClick={handleAddNew} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-xl text-xs uppercase"><Plus size={18} /> Add New / เพิ่ม</button>)}
            <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="flex-1 lg:flex-none p-3 text-indigo-600 bg-white rounded-xl border border-indigo-100 shadow-sm font-black text-xs uppercase flex items-center justify-center gap-2">{isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Sync</button>
            <button onClick={exportToExcel} className="flex-1 lg:flex-none p-3 text-emerald-600 bg-white rounded-xl border shadow-sm font-black text-xs uppercase flex items-center justify-center gap-2"><Download size={16} /> Export / ส่งออก</button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <MetricCard icon={Layers} title="Total Assets / ทั้งหมด" value={stats.total.toString()} subtitle="Total Managed" color="indigo" />
                <MetricCard icon={CheckCircle} title="Efficiency / ประสิทธิภาพ" value={`${stats.completionRate}%`} subtitle="Completion Rate" color="emerald" />
                <MetricCard icon={ShieldAlert} title="Overdue / เลยกำหนด" value={stats.overdueCount.toString()} subtitle="Urgent Maintenance" color="amber" />
                <MetricCard icon={AlertTriangle} title="Failures / อุปกรณ์เสีย" value={stats.brokenCount.toString()} subtitle="Broken Units" color="purple" />
              </div>
              
              <motion.div variants={bouncyItem} className="bg-white p-4 md:p-8 rounded-[2rem] border shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="flex items-center gap-4 w-full"><div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24} /></div><div><h3 className="text-lg md:text-xl font-black text-slate-800">Maintenance Alerts / การแจ้งเตือนบำรุงรักษา</h3><p className="text-xs font-bold text-slate-400">Based on Next PM Schedule (Column C)</p></div></div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                   <div className="flex-1 sm:flex-none px-6 py-4 bg-red-50 border-red-100 rounded-2xl text-center"><p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Overdue / เลยกำหนด</p><p className="text-2xl font-black text-red-600">{stats.overdueCount}</p></div>
                   <div className="flex-1 sm:flex-none px-6 py-4 bg-amber-50 border-amber-100 rounded-2xl text-center"><p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Near Due / ใกล้กำหนด</p><p className="text-2xl font-black text-amber-600">{stats.nearDueCount}</p></div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <motion.div variants={bouncyItem} className="bg-white p-6 md:p-10 rounded-[2rem] border shadow-lg">
                  <div className="flex items-center gap-4 mb-6"><BouncyIcon icon={Activity} size={20} /><h3 className="text-lg font-black text-slate-800">Workload by Department / ปริมาณงานรายแผนก</h3></div>
                  <div className="w-full"><ResponsiveContainer width="100%" height={250}><BarChart data={stats.deptStats} layout="vertical" margin={{ left: -10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} width={80} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} /><Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={12}>{stats.deptStats.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div variants={bouncyItem} className="bg-white p-6 md:p-10 rounded-[2rem] border shadow-lg">
                  <div className="flex items-center gap-4 mb-6"><BouncyIcon icon={TrendingUp} size={20} className="text-emerald-500" /><h3 className="text-lg font-black text-slate-800">PM Trends / แนวโน้มการดำเนินงาน</h3></div>
                  <div className="w-full"><ResponsiveContainer width="100%" height={250}><AreaChart data={stats.dailyTrend}><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} /><Tooltip contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} /><Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" /></AreaChart></ResponsiveContainer></div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" initial="hidden" animate="show" variants={containerVariants} className="space-y-4">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm no-print">
                 <div className="flex items-center gap-3"><BouncyIcon icon={pmModule === 'computer' ? Monitor : Printer} size={22} /><h3 className="text-lg font-black text-slate-800 capitalize">{pmModule === 'computer' ? 'Computer / คอมพิวเตอร์' : 'Printer / เครื่องพิมพ์'} History</h3></div>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {pmModule === 'computer' && (<button onClick={handleRequestUnlock} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Lock size={14} /> Password / ดูรหัส</button>)}
                    <button onClick={handlePrintAll} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-xl hover:bg-indigo-100 flex items-center justify-center gap-2"><PrinterIcon size={14} /> Batch Print / พิมพ์ทั้งหมด</button>
                    <button onClick={exportToExcel} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2"><FileSpreadsheet size={14} /> Export / ส่งออก</button>
                 </div>
               </div>
               
               <div className="md:hidden space-y-4">
                 {filteredItems.map((it) => {
                   if (!it) return null;
                   const alert = getMaintenanceAlert(it.nextPmDate);
                   return (
                     <motion.div key={it.id} variants={bouncyItem} className={`bg-white p-5 rounded-2xl border ${alert === 'overdue' ? 'border-red-200 bg-red-50/20' : 'border-slate-100'} shadow-sm space-y-4`}>
                       <div className="flex justify-between items-start">
                         <div><p className="font-black text-slate-800">{it.computerName || 'N/A'}</p><p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{it.id} • {it.department}</p></div>
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border ${getPMStatusColor(it.status)}`}>{it.status || 'Pending'}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 py-2">
                          <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">User (F) / ผู้ใช้</p><p className="text-xs font-bold text-slate-700">{it.personnel || '-'}</p></div>
                          <div className="space-y-1 col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next PM (C) / ครั้งถัดไป</p><p className={`text-xs font-black ${alert === 'overdue' ? 'text-red-600' : 'text-indigo-600'}`}>{formatDateDisplay(it.nextPmDate)}</p></div>
                       </div>
                       <div className="flex items-center justify-between pt-2 border-t">
                         <div className="flex gap-2"><button onClick={() => handlePrintSingle(it)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg"><PrinterIcon size={16} /></button><button onClick={() => handleShowQr(it)} className="p-2 text-purple-600 bg-purple-50 rounded-lg"><QrCode size={16} /></button></div>
                         <div className="flex gap-2">{userRole === 'admin' ? (<><button onClick={() => handleEdit(it)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit2 size={16} /></button><button onClick={() => handleDelete(it.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={16} /></button></>) : (<div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase"><Lock size={10}/> Locked</div>)}</div>
                       </div>
                     </motion.div>
                   );
                 })}
               </div>

               <div className="hidden md:block bg-white rounded-[2rem] border shadow-xl overflow-hidden print-visible">
                 <div className="overflow-x-auto w-full">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <tr><th className="px-10 py-6">Device Info / ข้อมูล</th><th className="px-10 py-6">PM Status (G)</th><th className="px-10 py-6">User (F) / ผู้ใช้</th><th className="px-10 py-6">Next Schedule (C)</th>{pmModule === 'computer' && <th className="px-10 py-6">Passwords</th>}<th className="px-10 py-6 text-right no-print">Actions / จัดการ</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {filteredItems.map((it) => {
                         if (!it) return null;
                         const alert = getMaintenanceAlert(it.nextPmDate);
                         return (
                           <motion.tr key={it.id} variants={bouncyItem} className={`transition-colors group ${alert === 'overdue' ? 'bg-red-50/40' : 'hover:bg-indigo-50/20'}`}>
                             <td className="px-10 py-6"><p className="font-black text-slate-800 text-sm">{it.computerName || 'N/A'}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{it.id} • {it.department}</p>{it.device === 'Computer' && <p className="text-[10px] text-indigo-500 font-bold mt-1">User computer: {it.computerUser || '-'}</p>}</td>
                             <td className="px-10 py-6">
                               <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-colors ${getPMStatusColor(it.status)}`}>
                                 {it.status || 'Pending'}
                               </span>
                             </td>
                             <td className="px-10 py-6"><p className="text-xs font-bold text-slate-600">{it.personnel || '-'}</p></td>
                             <td className="px-10 py-6"><span className={`text-[11px] font-black ${alert === 'overdue' ? 'text-red-600' : 'text-indigo-500'}`}>{formatDateDisplay(it.nextPmDate)}</span></td>
                             {pmModule === 'computer' && (<td className="px-10 py-6"><div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PC: <span className="text-slate-600 lowercase">{isAdminSession ? it.password : '••••••••'}</span></p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Srv: <span className="text-slate-600 lowercase">{isAdminSession ? it.serverPassword : '••••••••'}</span></p></div></td>)}
                             <td className="px-10 py-6 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print"><button onClick={() => handlePrintSingle(it)} className="p-3 text-emerald-600 bg-emerald-50 rounded-xl"><PrinterIcon size={18} /></button><button onClick={() => handleShowQr(it)} className="p-3 text-purple-600 bg-purple-50 rounded-xl"><QrCode size={18} /></button>{userRole === 'admin' ? (<><button onClick={() => handleEdit(it)} className="p-3 text-indigo-600 bg-indigo-50 rounded-xl"><Edit2 size={18} /></button><button onClick={() => handleDelete(it.id)} className="p-3 text-red-600 bg-red-50 rounded-xl"><Trash2 size={18} /></button></>) : (<div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase"><Lock size={10}/> Locked</div>)}</td>
                           </motion.tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bulk Print Section */}
      <div id="qr-print-section" className="hidden"><div className="qr-print-grid">{itemsToPrint.map((item) => (
            <div key={item.id} className="qr-tag-card">
              <div style={{ marginBottom: '15px' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=${item.id}`)}`} alt="QR" style={{ width: '150px', height: '150px' }} /></div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{item.computerName || 'N/A'}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '4px' }}>{item.id} • {item.department}</div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>User / ผู้ใช้: {item.personnel || '-'}</div>
              {item.nextPmDate && <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: '900', marginTop: '2px' }}>Next Schedule: {formatDateDisplay(item.nextPmDate)}</div>}
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', width: '100%' }}>Scan for Report / สแกนรายงาน</div>
            </div>
      ))}</div></div>

      {/* Modals */}
      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[2rem] shadow-3xl w-full max-w-sm overflow-hidden p-8 space-y-6">
            <div className="text-center space-y-3"><div className="inline-block p-4 bg-indigo-600 text-white rounded-[1rem] shadow-xl"><BouncyIcon icon={Lock} size={24} className="text-white" /></div><h3 className="text-xl font-black">Admin Access / เข้าสู่ระบบ</h3></div>
            <form onSubmit={handleLogin} className="space-y-5">
              <FormInput label="Username / ชื่อผู้ใช้" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} placeholder="Username" />
              <FormInput label="Password / รหัสผ่าน" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} placeholder="Password" type="password" />
              {loginError && <p className="text-[10px] font-black text-red-500 uppercase text-center bg-red-50 py-3 rounded-xl">{loginError}</p>}
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-xl">Login / เข้าสู่ระบบ</button>
              <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-400 font-black text-[10px] uppercase">Cancel / ยกเลิก</button>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm no-print overflow-y-auto">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3"><div className="p-2 bg-indigo-600 text-white rounded-xl"><BouncyIcon icon={editingItem.device === 'Computer' ? Monitor : Printer} size={18} className="text-white" /></div><h3 className="text-lg md:text-xl font-black text-slate-800">{items.find(i => i && i.id === editingItem.id) ? 'Edit Record / แก้ไข' : 'New Record / เพิ่มข้อมูล'}</h3></div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-8 overflow-y-auto space-y-6 md:space-y-8 flex-1 pb-20">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2"><ImageIcon size={18} className="text-indigo-500" /><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Photo / รูปภาพอุปกรณ์</label></div>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                   <div className="w-full sm:w-48 h-48 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative">
                      {editingItem.imageUrl ? (
                        <>
                          <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setEditingItem({...editingItem, imageUrl: ''})} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Camera size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[9px] font-black text-slate-400 uppercase">No Photo</p>
                        </div>
                      )}
                   </div>
                   <div className="flex-1 w-full space-y-3">
                      <p className="text-xs font-bold text-slate-500">Attach an equipment photo. It will be embedded in the report.</p>
                      <label className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 font-black text-[10px] uppercase cursor-pointer hover:bg-indigo-100 transition-all shadow-sm">
                        <Upload size={16} /> <span>{editingItem.imageUrl ? 'Replace / เปลี่ยนรูป' : 'Capture/Upload / ถ่ายรูป'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <p className="text-[9px] text-slate-400">Max size 2MB</p>
                   </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full my-2"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput label="Device ID / รหัสอุปกรณ์ (ID)" value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} placeholder="Example: IT-001" />
                <FormInput label="Date / วันที่บันทึก" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} />
                <FormSelect label="Department / แผนก" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                <FormInput label="User / ผู้ใช้งาน (Col F)" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} placeholder="Enter technician/user name" />
                
                {editingItem.device === 'Computer' && (
                  <>
                    <FormInput label="User computer / ผู้ใช้คอมพิวเตอร์ (Col J)" value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} placeholder="Computer user name" />
                    <FormInput label="Antivirus / แอนตี้ไวรัส (Col M)" value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} placeholder="e.g. Kaspersky" />
                  </>
                )}
                
                <FormSelect label="PM Status / สถานะ (Col G)" value={editingItem.status} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                <FormSelect label="Device Health / สภาพเครื่อง" value={editingItem.deviceStatus || ''} options={DEVICE_STATUS_OPTIONS} onChange={val => setEditingItem({...editingItem, deviceStatus: val})} />
                <FormInput label={editingItem.device === 'Computer' ? 'Hostname / ชื่อเครื่อง' : 'Device Name / ชื่ออุปกรณ์'} value={editingItem.computerName} onChange={val => setEditingItem({...editingItem, computerName: val})} />
                
                {/* Lifecycle & Warranty Fields */}
                <FormInput label="Start Date / วันเริ่มใช้งาน" type="date" value={toISODate(editingItem.startDate)} onChange={val => setEditingItem({...editingItem, startDate: val})} />
                <FormInput label="Warranty Expire / วันหมดประกัน" type="date" value={toISODate(editingItem.warrantyExpiry)} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                
                {editingItem.device === 'Computer' && (
                  <>
                    <FormInput label="PC Pass / รหัสผ่าน (Col K)" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                    <FormInput label="Server Pass / รหัสเซิร์ฟฯ (Col L)" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                  </>
                )}

                <div className="md:col-span-2">
                   <FormInput label="Additional Info / ข้อมูลเพิ่มเติม (Spare Field)" value={editingItem.spareField || ''} onChange={val => setEditingItem({...editingItem, spareField: val})} placeholder="Future use / Spare field..." />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2"><BouncyIcon icon={CheckSquare} size={18} /><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance Checklist / รายการตรวจสอบ</label></div>
                <div className="grid grid-cols-1 gap-2 p-4 bg-slate-50 rounded-2xl">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = editingItem.activity && String(editingItem.activity).includes(act);
                    return (<label key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer hover:border-indigo-300 transition-colors">
                      <input type="checkbox" className="hidden" checked={!!isChecked} onChange={() => {
                        const acts = String(editingItem.activity || '').split(' | ').filter(x => x);
                        const next = isChecked ? acts.filter(x => x !== act) : [...acts, act];
                        setEditingItem({...editingItem, activity: next.join(' | ')});
                      }} /><div className={`p-1 rounded ${isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={14} /> : <Square size={14} />}</div><span className={`text-[11px] font-bold ${isChecked ? 'text-indigo-600' : 'text-slate-500'}`}>{act}</span>
                    </label>);
                  })}
                </div>
              </div>
              <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t z-10 flex gap-4"><button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Save Record / บันทึกข้อมูล</button></div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[2rem] shadow-3xl w-full max-sm overflow-hidden p-8 text-center space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-xl font-black">QR Tag / ป้ายอุปกรณ์</h3><button onClick={() => setIsQrModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><X size={20} /></button></div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border inline-block"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`)}`} alt="QR" className="w-40 h-40 rounded-xl" /></div>
            <div className="p-4 bg-indigo-50 rounded-2xl text-center"><p className="text-sm font-black text-indigo-700">{qrItem.computerName || 'N/A'}</p><p className="text-[9px] font-bold text-indigo-400 tracking-widest">{qrItem.id}</p></div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setPublicViewId(qrItem.id)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase shadow-xl">Preview Report / ดูตัวอย่าง</button>
              <button onClick={() => { try { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`); alert('Link copied!'); } catch(e) {} }} className="w-full p-4 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] uppercase"><Share2 size={16} /> Share Link / แชร์ลิงก์</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// Sub-components
const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'indigo' | 'emerald' | 'purple' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-red-50 text-red-600 border-red-100'
  };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-md relative overflow-hidden group">
      <div className={`p-2 md:p-3 rounded-lg inline-block mb-3 ${themes[color] || themes.indigo} border shadow-sm`}><Icon size={18} /></div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-lg md:text-xl font-black text-slate-900 truncate">{value}</h4>
      <p className="text-[8px] text-slate-400 font-bold mt-1">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; readOnly?: boolean; showToggle?: boolean; isLocked?: boolean; onUnlock?: () => void; }> = ({ label, value, onChange, type = "text", placeholder, readOnly = false, showToggle = false, isLocked = false, onUnlock }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const inputType = showToggle ? (internalVisible && !isLocked ? "text" : "password") : type;
  const handleToggle = () => { if (isLocked && !internalVisible) onUnlock?.(); else setInternalVisible(!internalVisible); };
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input type={inputType} value={value || ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} className={`w-full px-4 py-3 rounded-xl text-[12px] font-bold border outline-none focus:ring-[3px] transition-all ${readOnly ? 'bg-slate-50 border-slate-100 text-slate-400 shadow-inner' : 'bg-slate-50 border-slate-100 focus:bg-white shadow-sm'}`} />
        {showToggle && (<button type="button" onClick={handleToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600">{internalVisible && !isLocked ? <EyeOff size={14} /> : <Eye size={14} />}</button>)}
      </div>
    </div>
  );
};

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-[12px] font-bold outline-none focus:ring-[3px] appearance-none cursor-pointer shadow-sm">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

export default App;