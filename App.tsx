
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  CheckCircle, Monitor, TrendingUp, FileText, Layers, Edit2, Plus, X, Trash2,
  CheckSquare, Square, RefreshCw, Settings, Wrench, QrCode, Share2, 
  Activity, Lock, PrinterIcon, ShieldAlert, Loader2, ChevronRight, 
  Download, Camera, Image as ImageIcon, Upload, Database, Globe, Eye, EyeOff,
  AlertCircle, Calendar, Info, ArrowLeft, ShieldCheck, MapPin, Tag, Cpu, Hash, Key,
  Menu, Server, Search, WifiOff, Copy, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_PM_DATA, DEPARTMENTS, COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES } from './constants';
import { PMItem } from './types';

// --- CONFIGURATION ---
const COMPANY_NAME = 'TCITRENDGROUP'; 
const LOGO_TEXT = 'T.T.g';
const DEFAULT_GAS_URL = ''; 
const SECURITY_PIN = '1234';
const EXIT_URL = 'https://tcitrendgroup.com'; 

const CHART_COLORS = ['#065f46', '#0f172a', '#059669', '#1e293b', '#10b981', '#334155', '#34d399', '#064e3b'];
const bouncySpring = { type: "spring" as const, stiffness: 400, damping: 25 };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const bouncyItem = { hidden: { opacity: 0, scale: 0.8, y: 30 }, show: { opacity: 1, scale: 1, y: 0, transition: bouncySpring } };
const modalAnimate = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: bouncySpring },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

// --- HELPER FUNCTIONS ---
const normalizeId = (id: any): string => {
  if (!id) return '';
  return String(id).replace(/[\s\u00A0\u180E\u200B\u200C\u200D\u2060\uFEFF]/g, '').toLowerCase().trim();
};

const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    return String(dateStr).split('T')[0];
  } catch (e) { return String(dateStr); }
};

const toISODate = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined') return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(d);
  } catch (e) { return ''; }
};

const calculateNextPM = (currentDate: string, device: 'Computer' | 'Printer'): string => {
  if (!currentDate) return '';
  const d = new Date(currentDate);
  if (isNaN(d.getTime())) return '';
  const months = device === 'Computer' ? 6 : 2;
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

const SpinningGears = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
    <motion.div 
      animate={{ rotate: 360, y: [0, -10, 0] }} 
      transition={{ rotate: { repeat: Infinity, duration: 20, ease: "linear" }, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
      className="absolute -top-10 -right-10 text-emerald-900"
    >
      <Settings size={200} strokeWidth={1} />
    </motion.div>
    <motion.div 
      animate={{ rotate: -360, scale: [1, 1.1, 1] }} 
      transition={{ rotate: { repeat: Infinity, duration: 25, ease: "linear" }, scale: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
      className="absolute -bottom-20 -left-20 text-emerald-800"
    >
      <Settings size={280} strokeWidth={0.5} />
    </motion.div>
    <motion.div 
      animate={{ rotate: 360, x: [0, 15, 0] }} 
      transition={{ rotate: { repeat: Infinity, duration: 18, ease: "linear" }, x: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
      className="absolute bottom-40 right-1/4 text-emerald-700 opacity-50"
    >
      <Settings size={120} strokeWidth={1} />
    </motion.div>
    {/* Added 2 more gears as requested */}
    <motion.div 
      animate={{ rotate: -360, y: [0, 20, 0] }} 
      transition={{ rotate: { repeat: Infinity, duration: 30, ease: "linear" }, y: { repeat: Infinity, duration: 7, ease: "easeInOut" } }}
      className="absolute top-1/2 -left-10 text-emerald-600 opacity-20"
    >
      <Settings size={160} strokeWidth={0.8} />
    </motion.div>
    <motion.div 
      animate={{ rotate: 360, scale: [0.8, 1, 0.8] }} 
      transition={{ rotate: { repeat: Infinity, duration: 22, ease: "linear" }, scale: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
      className="absolute top-1/4 right-1/3 text-emerald-500 opacity-10"
    >
      <Settings size={90} strokeWidth={1.2} />
    </motion.div>
  </div>
);

const BrandIdentity: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
  const isLg = size === 'lg';
  return (
    <div className="flex items-center gap-3 relative z-10">
      <div className="flex items-center justify-center rounded-lg bg-emerald-600 shadow-sm border border-emerald-500" style={{ width: isLg ? 35 : 30, height: isLg ? 35 : 30 }}>
        <span className="font-black text-[12px] text-white tracking-tighter">{LOGO_TEXT}</span>
      </div>
      <div className="flex flex-col text-left">
        <h1 className={`${isLg ? 'text-lg' : 'text-sm'} font-black text-white tracking-tighter leading-none uppercase`}>{COMPANY_NAME}</h1>
        {isLg && <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">PM Cloud System / ระบบคลาวด์</p>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [pmModule, setPmModule] = useState<'computer' | 'printer'>('computer');
  const [publicViewId, setPublicViewId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || null;
  });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userRole, setUserRole] = useState<'admin' | 'general'>('general');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [items, setItems] = useState<PMItem[]>(() => {
    try {
      const saved = localStorage.getItem('pm_dashboard_data');
      return saved ? JSON.parse(saved) : INITIAL_PM_DATA;
    } catch (e) { return INITIAL_PM_DATA; }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDbSettingsOpen, setIsDbSettingsOpen] = useState(false);
  const [qrItem, setQrItem] = useState<PMItem | null>(null);
  const [editingItem, setEditingItem] = useState<PMItem | null>(null);
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('pm_sheet_url') || DEFAULT_GAS_URL);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const publicItem = useMemo(() => {
    if (!publicViewId) return null;
    const target = normalizeId(publicViewId);
    return items.find(i => i && normalizeId(i.id) === target);
  }, [items, publicViewId]);

  useEffect(() => {
    const fetchOnMount = async () => {
      setIsLoading(true);
      if (sheetUrl && sheetUrl.startsWith('http')) {
        await fetchFromSheet(true);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }
      setIsLoading(false);
    };
    fetchOnMount();
  }, [sheetUrl]);

  useEffect(() => { 
    if (publicViewId) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [publicViewId]);

  useEffect(() => { 
    localStorage.setItem('pm_dashboard_data', JSON.stringify(items)); 
  }, [items]);

  const filteredItems = useMemo(() => {
    const type = pmModule === 'computer' ? 'Computer' : 'Printer';
    return items.filter(item => item && item.device === type);
  }, [items, pmModule]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter(i => i.status === 'Completed').length;
    const inProgress = filteredItems.filter(i => i.status === 'In Progress').length;
    const pending = filteredItems.filter(i => i.status === 'Pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const deptMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item.department) deptMap[item.department] = (deptMap[item.department] || 0) + 1; });
    const deptStats = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    
    const trendMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item.date) { const d = toISODate(item.date); if(d) trendMap[d] = (trendMap[d] || 0) + 1; } });
    const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date: formatDateDisplay(date), count })).sort((a, b) => a.date.localeCompare(b.date));
    
    const statusStats = [
      { name: 'Done / เสร็จแล้ว', value: completed },
      { name: 'Doing / กำลังทำ', value: inProgress },
      { name: 'Pending / รอทำ', value: pending }
    ];

    return { total, completionRate, deptStats, dailyTrend, statusStats };
  }, [filteredItems, items]);

  const pushToCloud = async (item: PMItem) => {
    if (!sheetUrl) return;
    try {
      setSyncMessage("Cloud Syncing / กำลังซิงค์...");
      // Exact sequence A-V (Indices 0-21) to match GAS setupSheet HEADERS
      const values = [
        item.id,               // A: id
        item.date,             // B: date
        item.nextPmDate || '', // C: nextPmDate
        item.department,       // D: department
        item.device,           // E: device
        item.personnel || '',  // F: personnel
        item.status || 'Pending', // G: status
        item.activity || '',   // H: activity
        item.computerName || '', // I: computerName
        item.computerUser || '', // J: computerUser
        item.password || '',     // K: password
        item.serverPassword || '', // L: serverPassword
        item.antivirus || '',    // M: antivirus
        item.imageUrl || '',     // N: imageUrl
        item.technician || '',   // O: technician
        item.startDate || '',    // P: startDate
        item.warrantyExpiry || '', // Q: warrantyExpiry
        item.notes || '',        // R: notes
        item.assetName || '',    // S: assetName
        item.modelSpec || '',    // T: modelSpec
        item.serialNumber || '', // U: serialNumber
        item.location || ''      // V: location
      ];

      await fetch(sheetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ values }) 
      });
      setSyncMessage("Sync Success / บันทึกสำเร็จ");
      setIsCloudConnected(true);
    } catch (err) { 
      setSyncMessage("Sync Failed / เชื่อมต่อล้มเหลว"); 
      setIsCloudConnected(false);
    } finally { setTimeout(() => setSyncMessage(null), 3000); }
  };

  const fetchFromSheet = async (silent = false) => {
    if (!sheetUrl) { setIsSyncing(false); return; } 
    setIsSyncing(true);
    try {
      const res = await fetch(`${sheetUrl}?_t=${Date.now()}`);
      if (res.ok) { 
        const data = await res.json(); 
        if (Array.isArray(data)) {
          // IMPORTANT: Mapping based on Object Keys from GAS doGet()
          const mapped: PMItem[] = data.map(obj => {
            if (!obj || !obj.id) return null;
            return {
              id: String(obj.id).trim(),
              date: obj.date || '',
              nextPmDate: obj.nextPmDate || '',
              department: obj.department || '',
              device: obj.device || 'Computer',
              personnel: obj.personnel || '',
              status: obj.status || 'Pending',
              activity: obj.activity || '',
              computerName: obj.computerName || '',
              computerUser: obj.computerUser || '',
              password: obj.password || '',
              serverPassword: obj.serverPassword || '',
              antivirus: obj.antivirus || '',
              imageUrl: obj.imageUrl || '',
              technician: obj.technician || '',
              startDate: obj.startDate || '',
              warrantyExpiry: obj.warrantyExpiry || '',
              notes: obj.notes || '',
              assetName: obj.assetName || '',
              modelSpec: obj.modelSpec || '',
              serialNumber: obj.serialNumber || '',
              location: obj.location || '',
              deviceStatus: obj.activity?.includes('Broken') ? 'Broken' : 'Ready'
            };
          }).filter(i => i !== null) as PMItem[];
          
          setItems(mapped); 
          setIsCloudConnected(true);
          if (!silent) setSyncMessage('Data Synced / ซิงค์ข้อมูลสำเร็จ');
        }
      }
    } catch (err) { 
      console.error("Fetch Error:", err);
      setIsCloudConnected(false); 
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 2000); 
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.id) return alert('Asset ID required / กรุณาระบุรหัสทรัพย์สิน');
    let finalItem = { ...editingItem, id: String(editingItem.id).trim() };
    if (finalItem.status === 'Completed') {
      finalItem.nextPmDate = calculateNextPM(finalItem.date, finalItem.device);
    } else { finalItem.nextPmDate = ''; }
    
    setItems(prev => {
      const targetId = normalizeId(finalItem.id);
      const exists = prev.find(i => normalizeId(i.id) === targetId);
      return exists ? prev.map(i => normalizeId(i.id) === targetId ? finalItem : i) : [...prev, finalItem];
    });
    
    setIsModalOpen(false); 
    setEditingItem(null); 
    await pushToCloud(finalItem);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'tci@1234') {
      setUserRole('admin'); 
      setIsLoginModalOpen(false); 
    } else { setLoginError('Login Failed / ข้อมูลไม่ถูกต้อง'); }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SECURITY_PIN) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const appBaseUrl = window.location.href.split('?')[0];

  const handleCopyTestLink = (assetId: string) => {
    const fullUrl = `${appBaseUrl}?view=${assetId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setSyncMessage("Link Copied / คัดลอกลิงก์แล้ว!");
      setTimeout(() => setSyncMessage(null), 3000);
    });
  };

  // --- PUBLIC ASSET VIEW (Scan Result) ---
  if (publicViewId) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
          <Loader2 size={40} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Verifying Data / กำลังตรวจสอบข้อมูล...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 relative overflow-hidden">
        <SpinningGears />
        {publicItem ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-4xl border border-slate-200 overflow-hidden relative z-10 text-left">
            <div className={`p-10 text-white ${publicItem.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck size={28} className="text-white" />
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight">Verified Asset / ข้อมูลทรัพย์สิน</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{COMPANY_NAME}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[72vh] no-scrollbar pb-10">
              {publicItem.imageUrl && (
                <div className="relative">
                  <img src={publicItem.imageUrl} className="w-full h-56 object-cover rounded-3xl border-4 border-slate-50 shadow-xl" alt="Proof" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <DataField label="Asset ID / รหัสทรัพย์สิน (A)" value={publicItem.id} mono />
                <DataField label="PM Status / สถานะ (G)" value={publicItem.status === 'Completed' ? 'Done / เสร็จสิ้น' : publicItem.status === 'In Progress' ? 'Doing / กำลังทำ' : 'Pending / รอทำ'} />
                <DataField label="Last PM / ทำล่าสุด (B)" value={formatDateDisplay(publicItem.date)} />
                <DataField label="Next PM / ครั้งถัดไป (C)" value={formatDateDisplay(publicItem.nextPmDate)} />
                <DataField label="Dept / แผนก (D)" value={publicItem.department} />
                <DataField label="User / ผู้ใช้งาน (F)" value={publicItem.personnel || '-'} />
                <DataField label="Hostname / ชื่อเครื่อง (I)" value={publicItem.computerName || '-'} />
                <DataField label="Tech / ช่างผู้ดูแล (O)" value={publicItem.technician || '-'} />
                
                <DataField label="Login User / ชื่อผู้ใช้ (J)" value={isUnlocked ? (publicItem.computerUser || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
                <DataField label="Password / รหัสผ่าน (K)" value={isUnlocked ? (publicItem.password || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
                <DataField label="Server Pass / รหัสเซิร์ฟเวอร์ (L)" value={isUnlocked ? (publicItem.serverPassword || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
                <DataField label="Antivirus / แอนตี้ไวรัส (M)" value={isUnlocked ? (publicItem.antivirus || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
              </div>

              {!isUnlocked && (
                <form onSubmit={handlePinSubmit} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-5 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Unlock Sensitive Data / ใส่ PIN เพื่อดูรหัสผ่าน</span>
                  </div>
                  <div className="flex gap-3">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="****" className={`flex-1 px-5 py-4 rounded-2xl border-2 text-center font-black tracking-[1.2em] outline-none transition-all ${pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-emerald-600'}`} />
                    <button type="submit" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all">Unlock / ปลดล็อก</button>
                  </div>
                </form>
              )}

              <div className="p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-left">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">PM Records / บันทึกการทำ (H)</p>
                <div className="space-y-3">
                  {String(publicItem.activity || '').split(' | ').filter(x => x).map((act, i) => (
                    <p key={i} className="text-[11px] font-bold text-slate-700 flex items-start gap-3 leading-relaxed text-left">
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5" /> {act}
                    </p>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => { window.location.href = EXIT_URL; }} 
                className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black text-[12px] uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 mt-6 mb-2"
              >
                <ExternalLink size={18} /> Company Web / กลับสู่หน้าหลักบริษัท
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="text-center p-12 bg-white rounded-[4rem] shadow-5xl max-w-sm relative z-10 border border-slate-100">
            <AlertCircle size={72} className="text-rose-500 mx-auto mb-10" />
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Asset Not Found / ไม่พบข้อมูล</h2>
            <p className="text-slate-400 text-[13px] font-bold leading-relaxed mb-10 uppercase tracking-tight">รหัสที่สแกนไม่ตรงกับฐานข้อมูล</p>
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-10 text-left space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanned ID:</p>
               <p className="text-[16px] font-mono font-black text-emerald-600 truncate">{publicViewId}</p>
            </div>
            <div className="flex flex-col gap-4">
                <button onClick={() => { setIsLoading(true); fetchFromSheet().then(() => setIsLoading(false)); }} className="w-full px-8 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-4xl">
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""}/> Sync & Retry / ซิงค์ข้อมูลใหม่
                </button>
                <button 
                  onClick={() => { window.location.href = EXIT_URL; }} 
                  className="w-full py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Exit / กลับหน้าหลักบริษัท
                </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // --- ADMIN/STAFF DASHBOARD ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] relative font-sans overflow-x-hidden text-left">
      <SpinningGears />
      
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[300] px-10 py-5 bg-emerald-600 text-white rounded-3xl shadow-4xl font-black text-[11px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      {/* Mobile Top Nav */}
      <div className="md:hidden sticky top-0 z-[100] bg-slate-900 px-7 py-6 flex items-center justify-between shadow-4xl no-print border-b border-slate-800">
        <BrandIdentity size="sm" />
        <div className="flex gap-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3.5 bg-slate-800 text-white rounded-[1.2rem]"><Menu size={24} /></button>
           <button onClick={() => setIsLoginModalOpen(true)} className="p-3.5 bg-emerald-600 text-white rounded-[1.2rem]"><Lock size={20} /></button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[200] bg-slate-900 p-10 flex flex-col gap-12 no-print md:hidden shadow-4xl">
            <div className="flex justify-between items-center">
              <BrandIdentity size="lg" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-slate-400 bg-slate-800 rounded-3xl"><X size={32} /></button>
            </div>
            <nav className="space-y-5 flex-1 overflow-y-auto pt-8">
              <NavBtn icon={Monitor} label="Computer / คอมพิวเตอร์" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <NavBtn icon={PrinterIcon} label="Printer / เครื่องพิมพ์" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
              <NavBtn icon={FileText} label="Full Asset Ledger / รายการทั้งหมด" active={activeTab === 'table'} onClick={() => { setActiveTab('table'); setIsMobileMenuOpen(false); }} />
            </nav>
            <div className="space-y-5">
              <button onClick={() => { setIsDbSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-7 text-slate-400 font-black text-[11px] uppercase border border-slate-800 rounded-[3rem] flex items-center justify-center gap-3">
                <Settings size={18} /> Settings / ตั้งค่า
              </button>
              {userRole === 'admin' ? (
                <button onClick={() => { setUserRole('general'); setIsMobileMenuOpen(false); }} className="w-full py-7 bg-rose-950/40 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/40">Logout Admin / ออกระบบ</button>
              ) : (
                <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-4xl">Admin Login / เข้าสู่ระบบ</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 bg-slate-900 p-12 flex-col gap-12 sticky top-0 h-screen z-20 no-print shadow-4xl border-r border-slate-800 text-left">
        <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}><BrandIdentity size="lg" /></div>
        <nav className="space-y-5 flex-1 pt-10">
          <NavBtn icon={Monitor} label="Computer / คอมฯ" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printer / พรินเตอร์" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
          <NavBtn icon={FileText} label="Asset List / รายการ" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-5 px-10 py-7 text-emerald-400 bg-emerald-950/30 rounded-[3rem] font-black text-[12px] uppercase border border-emerald-900/50 mt-12 hover:bg-emerald-900/40 transition-all shadow-3xl">
            {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} Cloud Sync / ซิงค์ข้อมูล
          </button>
        </nav>
        
        <div className="space-y-5">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-6 text-slate-400 font-black text-[10px] uppercase border border-slate-800 rounded-[2.5rem] flex items-center justify-center gap-3 hover:bg-slate-800"><Settings size={16} /> Setup / ตั้งค่า</button>
          {userRole === 'admin' ? (
            <button onClick={() => setUserRole('general')} className="w-full py-7 bg-rose-950/30 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/30">Logout Admin / ออก</button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-3xl hover:bg-emerald-500">Admin Login / เข้าสู่ระบบ</button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-20 overflow-y-auto w-full relative z-10 text-left">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-14 gap-10 no-print text-left">
          <div className="text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">PM Hub / {pmModule === 'computer' ? 'Computer' : 'Printer'}</h2>
            <div className="flex items-center gap-3 mt-4 text-left">
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] text-left">{COMPANY_NAME} • Maintenance System / ระบบซ่อมบำรุง</p>
            </div>
          </div>
          <div className="flex gap-5 w-full lg:w-auto">
            <button onClick={() => { 
              if(userRole !== 'admin') return setIsLoginModalOpen(true);
              setEditingItem({ id: '', date: new Date().toISOString(), department: DEPARTMENTS[0], device: pmModule === 'computer' ? 'Computer' : 'Printer', personnel: '', technician: '', status: 'Pending', activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '', startDate: '', warrantyExpiry: '', notes: '', imageUrl: '', assetName: '', modelSpec: '', serialNumber: '', location: '' }); 
              setIsModalOpen(true); 
            }} className="flex-1 lg:flex-none flex items-center justify-center gap-5 px-12 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black shadow-4xl text-[14px] uppercase hover:scale-95 transition-all">
              <Plus size={22} /> New Asset / ลงทะเบียนใหม่
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-14">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-left">
                <MetricCard icon={Layers} title="Total Assets / รวม" value={stats.total.toString()} subtitle="Current module units" color="emerald" />
                <MetricCard icon={CheckCircle} title="PM Efficiency / ผลงาน" value={`${stats.completionRate}%`} subtitle="Completion ratio" color="teal" />
                <MetricCard icon={Server} title="Connection / การเชื่อมต่อ" value={isCloudConnected ? "Online / ออนไลน์" : "Local / เครื่อง"} subtitle="Database status" color={isCloudConnected ? "emerald" : "amber"} />
                <MetricCard icon={Activity} title="System Status / สถานะ" value="Active / ทำงาน" subtitle="Real-time update" color="emerald" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100 lg:col-span-2 text-left">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800 text-left"><Monitor size={28} className="text-emerald-600" /> Units by Dept / อุปกรณ์ตามแผนก</h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={stats.deptStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} width={160} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 15, 15, 0]} barSize={18}>
                        {stats.deptStats.map((_, i) => (<Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100 flex flex-col items-center text-left">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800 self-start text-left"><TrendingUp size={28} className="text-emerald-600" /> PM Workload / สถานะงาน</h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie data={stats.statusStats} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                        <Cell fill="#059669" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#64748b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-6 mt-8">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600"></div><span className="text-[10px] font-black uppercase text-slate-400">Done / เสร็จ</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase text-slate-400">Doing / กำลังทำ</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-[10px] font-black uppercase text-slate-400">Pending / รอ</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" variants={containerVariants} initial="hidden" animate="show" className="bg-white rounded-[4rem] shadow-4xl overflow-hidden border border-slate-100 overflow-x-auto transition-all text-left">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[12px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  <tr>
                    <th className="px-14 py-12">Asset & ID / ข้อมูลอุปกรณ์</th>
                    <th className="px-14 py-12">PM Status / สถานะ</th>
                    <th className="px-14 py-12">User / ผู้รับผิดชอบ</th>
                    <th className="px-14 py-12">Last Cycle / วันที่ทำ</th>
                    <th className="px-14 py-12 text-center">Manage / จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.length > 0 ? filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-all group">
                      <td className="px-14 py-12">
                        <div className="text-left">
                          <p className="font-black text-slate-800 text-[18px] tracking-tight">{it.assetName || it.computerName || it.id}</p>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{it.id} | {it.modelSpec || '-'}</p>
                        </div>
                      </td>
                      <td className="px-14 py-12">
                        <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm ${it.status === 'Completed' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : it.status === 'In Progress' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-400 text-white shadow-slate-400/20'}`}>
                          {it.status === 'Completed' ? 'Done / เสร็จแล้ว' : it.status === 'In Progress' ? 'Doing / กำลังทำ' : 'Pending / รอทำ'}
                        </span>
                      </td>
                      <td className="px-14 py-12 text-[15px] font-black text-slate-700">{it.personnel || '-'}</td>
                      <td className="px-14 py-12 text-[13px] font-black text-slate-500">{formatDateDisplay(it.date)}</td>
                      <td className="px-14 py-12">
                        <div className="flex gap-5 justify-center">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-5 text-emerald-600 bg-emerald-50 rounded-3xl border border-emerald-100 hover:scale-110 shadow-md active:scale-95"><QrCode size={22} /></button>
                          {userRole === 'admin' && (
                            <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-5 text-slate-600 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all shadow-md flex items-center gap-4 active:scale-95">
                              <Edit2 size={22} />
                              <span className="text-[12px] font-black uppercase tracking-tight">Edit / แก้ไข</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-14 py-32 text-center">
                         <p className="text-slate-400 font-black uppercase tracking-widest">No assets found / ยังไม่มีรายการ</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Asset Edit Modal */}
      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-slate-900/85 backdrop-blur-xl overflow-y-auto pt-14 text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[4.5rem] md:rounded-[4.5rem] w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] shadow-5xl text-left border border-slate-200">
            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50 text-left">
              <div className="flex items-center gap-8 text-left">
                <div className="p-5 bg-emerald-600 text-white rounded-[2.5rem] shadow-4xl"><Wrench size={34} /></div>
                <div className="text-left">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">{editingItem.id ? 'Modify Asset / แก้ไขข้อมูล' : 'New Asset / ลงทะเบียนใหม่'}</h3>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Ref ID: {editingItem.id || 'NEW'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-6 bg-slate-50 text-slate-400 rounded-3xl active:scale-90 shadow-sm"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-14 space-y-16 overflow-y-auto pb-40 text-left no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-14 text-left">
                 <div className="md:col-span-1 space-y-5 text-left">
                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 flex items-center gap-4 text-left"><ImageIcon size={18} className="text-emerald-600"/> Asset Image (N)</label>
                    <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[5rem] flex flex-col items-center justify-center overflow-hidden group relative shadow-inner">
                       {editingItem.imageUrl ? (
                         <>
                           <img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="Proof" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-8">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-6 bg-emerald-600 text-white rounded-full"><Camera size={36} /></button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-6 bg-white text-emerald-600 rounded-full"><Upload size={36} /></button>
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center gap-10 text-center px-8">
                            <div className="flex gap-8">
                               <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl"><Camera size={48} /></button>
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl"><Upload size={48} /></button>
                            </div>
                            <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em]">Capture/Upload</span>
                         </div>
                       )}
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </div>
                 </div>

                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                    <FormInput label="Asset ID / รหัสทรัพย์สิน (A)" icon={Hash} value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} required placeholder="Ex: TC-2568-001" />
                    <FormInput label="Last PM / ทำล่าสุด (B)" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} required />
                    <FormInput label="Next PM / ครั้งหน้า (C)" value={formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))} readOnly icon={Calendar} />
                    <FormInput label="Asset Name / ชื่อเรียก (S)" icon={Tag} value={editingItem.assetName || ''} onChange={val => setEditingItem({...editingItem, assetName: val})} placeholder="Ex: Finance PC" />
                    <FormInput label="Spec / รุ่น (T)" icon={Cpu} value={editingItem.modelSpec || ''} onChange={val => setEditingItem({...editingItem, modelSpec: val})} />
                    <FormInput label="Serial No. (U)" value={editingItem.serialNumber || ''} onChange={val => setEditingItem({...editingItem, serialNumber: val})} />
                    <FormInput label="Location / สถานที่ (V)" icon={MapPin} value={editingItem.location || ''} onChange={val => setEditingItem({...editingItem, location: val})} />
                    <FormSelect label="Department / แผนก (D)" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                    <FormSelect label="Device Type / ประเภท (E)" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                 </div>
              </div>

              {/* Security */}
              <div className="space-y-10 text-left">
                <div className="flex items-center gap-5"><div className="w-2.5 h-10 bg-emerald-600 rounded-full"></div><h4 className="text-xl font-black text-slate-900 uppercase">Access & Security / ความปลอดภัย (J-M)</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                   <FormInput label="Login User (J)" icon={Lock} value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} />
                   <FormInput label="PC Pass (K)" icon={Key} type="password" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} />
                   <FormInput label="Server Pass (L)" icon={Key} type="password" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} />
                   <FormInput label="Antivirus (M)" icon={ShieldCheck} value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                 <FormInput label="User / ผู้ใช้ (F)" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} />
                 <FormInput label="Technician / ช่าง (O)" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} />
                 <FormInput label="Hostname (I)" value={editingItem.computerName || ''} onChange={val => setEditingItem({...editingItem, computerName: val})} />
              </div>

              <div className="space-y-10 text-left">
                <div className="flex items-center gap-5"><div className="w-2.5 h-10 bg-slate-400 rounded-full"></div><h4 className="text-xl font-black text-slate-900 uppercase">Lifecycle & Maintenance (P-R)</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                   <FormInput label="Start Date (P)" type="date" value={toISODate(editingItem.startDate)} onChange={val => setEditingItem({...editingItem, startDate: val})} />
                   <FormInput label="Warranty (Q)" type="date" value={toISODate(editingItem.warrantyExpiry)} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                   <FormSelect label="Status (G)" value={editingItem.status || 'Pending'} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                </div>
                <FormInput label="Notes / อะไหล่ (R)" value={editingItem.notes || ''} onChange={val => setEditingItem({...editingItem, notes: val})} />
              </div>

              <div className="space-y-10 text-left">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] ml-8 flex items-center gap-4 text-left"><CheckSquare size={20} className="text-emerald-600" /> PM Checklist (H)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner text-left">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = String(editingItem.activity || '').includes(act);
                    return (
                      <label key={i} className={`flex items-center gap-8 p-7 rounded-[2.5rem] border cursor-pointer text-left ${isChecked ? 'bg-white border-emerald-500 shadow-2xl translate-x-1.5' : 'bg-white border-slate-100'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => {
                          const currentActs = String(editingItem.activity || '').split(' | ').filter(x => x);
                          const newActs = isChecked ? currentActs.filter(a => a !== act) : [...currentActs, act];
                          setEditingItem({...editingItem, activity: newActs.join(' | ')});
                        }} />
                        <div className={`p-2.5 rounded-xl ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={24} /> : <Square size={24} />}</div>
                        <span className={`text-[15px] font-black leading-tight text-left ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 p-12 rounded-[4.5rem] border-2 border-emerald-100/60 flex flex-col md:flex-row items-center justify-between gap-12 shadow-inner text-left">
                <div className="text-left w-full md:w-auto">
                  <p className="text-[12px] font-black text-emerald-600 uppercase mb-4 tracking-[0.3em] text-left">Next PM Forecast / รอบถัดไป</p>
                  <p className="text-5xl font-black text-emerald-900 tracking-tighter text-left">{editingItem.status === 'Completed' ? formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device)) : 'PENDING ACTION'}</p>
                </div>
                <div className="flex gap-8 w-full md:w-auto">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-14 py-7 bg-white text-slate-400 rounded-[3rem] font-black text-xs uppercase hover:text-rose-500 border border-slate-100 shadow-2xl">Cancel / ยกเลิก</button>
                   <button type="submit" className="px-20 py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl flex items-center justify-center gap-5 active:scale-95"><Database size={24} /> Commit & Sync / บันทึกข้อมูล</button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/85 backdrop-blur-xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] shadow-5xl w-full max-w-sm p-14 text-center relative overflow-hidden">
             <button onClick={() => setIsQrModalOpen(false)} className="absolute top-12 right-12 text-slate-300 active:scale-90"><X size={32} /></button>
             <h3 className="text-3xl font-black mb-12 uppercase tracking-tight text-slate-900">Asset QR / คิวอาร์โค้ด</h3>
             <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 inline-block mb-10 shadow-inner group">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`${appBaseUrl}?view=${qrItem.id}`)}`} alt="QR" className="w-56 h-56 rounded-3xl shadow-3xl" />
             </div>

             <div className="space-y-4 mb-8">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Test Connection / วิธีทดสอบ</p>
                <div className="flex flex-col gap-3">
                   <button onClick={() => handleCopyTestLink(qrItem.id)} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-[11px] uppercase border border-emerald-100 hover:bg-emerald-100 flex items-center justify-center gap-3 active:scale-95">
                      <Copy size={18} /> Copy Test Link / คัดลอกลิงก์
                   </button>
                   <button onClick={() => setPublicViewId(qrItem.id)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase shadow-4xl hover:bg-black flex items-center justify-center gap-3 active:scale-95">
                      <Monitor size={18} /> Live View / ดูหน้าสแกนสด
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* Database Settings Modal */}
      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] p-16 w-full max-w-md space-y-12 shadow-5xl relative overflow-hidden text-center">
            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">Cloud Link / ตั้งค่าคลาวด์</h3>
            <FormInput label="GAS Webhook URL / ลิงก์เชื่อมคลาวด์" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/..." />
            <div className="space-y-5 pt-8">
              <button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl hover:bg-emerald-700 flex items-center justify-center gap-5 active:scale-95"><RefreshCw size={22} /> Connect Now / เชื่อมต่อ</button>
              <button onClick={() => setIsDbSettingsOpen(false)} className="w-full text-slate-300 font-black text-[12px] uppercase hover:text-rose-500 transition-colors tracking-widest">Close / ปิด</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[5.5rem] p-16 w-full max-w-sm space-y-14 shadow-5xl relative overflow-hidden text-center">
            <Lock size={64} className="mx-auto text-emerald-600 mb-10" />
            <div className="space-y-4 text-center"><h3 className="text-4xl font-black uppercase tracking-tight text-slate-900">Admin Login / เข้าสู่ระบบ</h3><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.35em]">Authorized Personnel / เฉพาะเจ้าหน้าที่</p></div>
            <form onSubmit={handleLogin} className="space-y-12">
              <div className="space-y-7">
                <FormInput label="Username / ชื่อผู้ใช้" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} />
                <FormInput label="Password / รหัสผ่าน" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} />
              </div>
              {loginError && <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest">{loginError}</p>}
              <div className="space-y-6 pt-5">
                <button type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-5xl hover:bg-emerald-700 active:scale-95">Verify / ล็อกอิน</button>
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-300 font-black text-[12px] uppercase hover:text-slate-900 transition-colors tracking-widest">Cancel / ยกเลิก</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-7 px-12 py-7 rounded-[3.5rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-4xl scale-[1.06] z-10' : 'text-slate-500 border-transparent hover:bg-slate-800/90 hover:text-slate-200'}`}>
    <Icon size={26} className={active ? 'animate-pulse' : ''} /> 
    <span className="text-[15px] font-black uppercase tracking-tight text-left">{label}</span>
  </button>
);

const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = { 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-600/5', 
    teal: 'bg-teal-50 text-teal-600 border-teal-100 shadow-teal-600/5', 
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/5', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-600/5' 
  };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-3xl hover:shadow-5xl hover:-translate-y-2.5 text-left relative z-10">
      <div className={`p-6 rounded-2xl inline-block mb-10 ${themes[color] || themes.emerald} border shadow-inner`}><Icon size={32} /></div>
      <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-[0.25em] text-left">{title}</p>
      <h4 className="text-5xl font-black text-slate-900 truncate tracking-tighter text-left">{value}</h4>
      <p className="text-[11px] text-slate-400 font-black uppercase mt-5 opacity-70 text-left tracking-wide">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; required?: boolean; icon?: any; readOnly?: boolean }> = ({ label, value, onChange, type = "text", placeholder, required, icon: Icon, readOnly = false }) => (
  <div className="space-y-5 text-left">
    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 flex items-center gap-4 text-left">{Icon && <Icon size={16} className="text-emerald-600" />}{label}</label>
    <input type={type} value={value || ''} onChange={e => !readOnly && onChange?.(e.target.value)} placeholder={placeholder} required={required} readOnly={readOnly} className={`w-full px-9 py-7 ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-black' : 'bg-slate-50 border-slate-100 focus:border-emerald-600 focus:bg-white'} border-2 rounded-[2.5rem] text-[16px] font-bold outline-none transition-all shadow-inner text-left`} />
  </div>
);

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-5 text-left">
    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 text-left">{label}</label>
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-9 py-7 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-[16px] font-bold outline-none appearance-none cursor-pointer focus:border-emerald-600 focus:bg-white shadow-inner transition-all text-left">
        {options.map(opt => {
          let display = opt;
          if (opt === 'Computer') display = 'Computer / คอมพิวเตอร์';
          else if (opt === 'Printer') display = 'Printer / เครื่องพิมพ์';
          else if (opt === 'Completed') display = 'Completed / เสร็จสิ้น';
          else if (opt === 'In Progress') display = 'In Progress / กำลังทำ';
          else if (opt === 'Pending') display = 'Pending / รอทำ';
          return <option key={opt} value={opt}>{display}</option>;
        })}
      </select>
      <ChevronRight size={24} className="absolute right-9 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean; icon?: React.ReactNode }> = ({ label, value, mono = false, small = false, icon }) => (
  <div className="bg-slate-50/50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group hover:bg-white transition-all cursor-default">
    <p className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2 text-left">
      <span className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-emerald-400 transition-colors"></span>{label}{icon && <span className="ml-auto text-emerald-400">{icon}</span>}
    </p>
    <p className={`font-black text-slate-800 truncate leading-none text-left ${mono ? 'font-mono text-[16px] tracking-tight' : small ? 'text-[13px]' : 'text-[15px]'}`}>{value || '-'}</p>
  </div>
);

export default App;
