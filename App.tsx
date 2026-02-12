
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { 
  CheckCircle, Monitor, TrendingUp, FileText, Layers, Edit2, Plus, X, 
  CheckSquare, Square, RefreshCw, Settings, Wrench, QrCode, 
  Activity, Lock, PrinterIcon, Loader2, ChevronRight, 
  Camera, Image as ImageIcon, Upload, Database, Eye, EyeOff,
  AlertCircle, Calendar, ShieldCheck, MapPin, Tag, Cpu, Hash, Key,
  Menu, Server, Copy, ExternalLink
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
  if (id === null || id === undefined) return '';
  return String(id).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
};

const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '' || dateStr === '-') return '-';
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

const calculateNextPM = (currentDate: any, device: 'Computer' | 'Printer'): string => {
  if (!currentDate || currentDate === '-') return '';
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
  
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const publicViewId = queryParams.get('view');
  const sharedCloudUrl = queryParams.get('url');

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
  
  const [sheetUrl, setSheetUrl] = useState(() => {
    if (sharedCloudUrl && sharedCloudUrl.startsWith('http')) {
      localStorage.setItem('pm_sheet_url', sharedCloudUrl);
      return sharedCloudUrl;
    }
    return localStorage.getItem('pm_sheet_url') || DEFAULT_GAS_URL;
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const publicItem = useMemo(() => {
    if (!publicViewId) return null;
    const target = normalizeId(publicViewId);
    return items.find(i => i && normalizeId(i.id) === target);
  }, [items, publicViewId]);

  const fetchFromSheet = async (silent = false) => {
    if (!sheetUrl || !sheetUrl.startsWith('http')) { 
      setIsSyncing(false); 
      setIsCloudConnected(false); 
      return; 
    } 
    setIsSyncing(true);
    try {
      const res = await fetch(`${sheetUrl}?_t=${Date.now()}`);
      if (res.ok) { 
        const data = await res.json(); 
        if (Array.isArray(data)) {
          const mapped: PMItem[] = data.map(entry => {
            if (!entry) return null;
            const getVal = (idx: number, key: string) => {
              if (Array.isArray(entry)) return entry[idx];
              return entry[key];
            };
            const id = String(getVal(0, 'id') || '').trim();
            if (!id) return null;
            
            return {
              id: id,
              date: getVal(1, 'date') || '',
              nextPmDate: getVal(2, 'nextPmDate') || '',
              department: getVal(3, 'department') || '',
              device: getVal(4, 'device') || 'Computer',
              personnel: getVal(5, 'personnel') || '',
              status: getVal(6, 'status') || 'Pending',
              activity: String(getVal(7, 'activity') || '').trim(), 
              computerName: getVal(8, 'computerName') || '',
              computerUser: getVal(9, 'computerUser') || '',
              password: getVal(10, 'password') || '',
              serverPassword: getVal(11, 'serverPassword') || '',
              antivirus: getVal(12, 'antivirus') || '',
              imageUrl: getVal(13, 'imageUrl') || '',
              technician: getVal(14, 'technician') || '',
              startDate: getVal(15, 'startDate') || '',
              warrantyExpiry: getVal(16, 'warrantyExpiry') || '',
              notes: getVal(17, 'notes') || '',
              assetName: getVal(18, 'assetName') || '',
              modelSpec: getVal(19, 'modelSpec') || '',
              serialNumber: getVal(20, 'serialNumber') || '',
              location: getVal(21, 'location') || '',
              deviceStatus: 'Ready'
            };
          }).filter(i => i !== null) as PMItem[];
          
          setItems(mapped); 
          setIsCloudConnected(true);
          localStorage.setItem('pm_sheet_url', sheetUrl);
          if (!silent) setSyncMessage('Sync Successful / ซิงค์ข้อมูลสำเร็จ');
        }
      } else {
        setIsCloudConnected(false);
      }
    } catch (err) { 
      console.error("Cloud Error:", err);
      setIsCloudConnected(false); 
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 2000); 
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await fetchFromSheet(true);
      setIsLoading(false);
    };
    initApp();
  }, [sheetUrl]);

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
    
    const statusStats = [
      { name: 'Completed / เสร็จแล้ว', value: completed },
      { name: 'Doing / กำลังทำ', value: inProgress },
      { name: 'Pending / รอดำเนินการ', value: pending }
    ];

    return { total, completionRate, deptStats, statusStats };
  }, [filteredItems]);

  const pushToCloud = async (item: PMItem) => {
    if (!sheetUrl) return;
    try {
      setSyncMessage("Syncing Cloud / กำลังบันทึก...");
      const values = [
        item.id, item.date, item.nextPmDate || '', item.department, item.device,
        item.personnel || '', item.status || 'Pending', item.activity || '', item.computerName || '',
        item.computerUser || '', item.password || '', item.serverPassword || '', item.antivirus || '',
        item.imageUrl || '', item.technician || '', item.startDate || '', item.warrantyExpiry || '',
        item.notes || '', item.assetName || '', item.modelSpec || '', item.serialNumber || '',
        item.location || ''
      ];

      await fetch(sheetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ values }) 
      });
      setSyncMessage("Cloud Saved / บันทึกสำเร็จ");
      setIsCloudConnected(true);
    } catch (err) { 
      setSyncMessage("Sync Error / ผิดพลาด"); 
      setIsCloudConnected(false);
    } finally { setTimeout(() => setSyncMessage(null), 3000); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const finalId = String(editingItem.id || '').trim();
    if (!finalId) return alert('Asset ID required / กรุณาระบุรหัสทรัพย์สิน');
    
    let finalItem = { ...editingItem, id: finalId };
    finalItem.nextPmDate = calculateNextPM(finalItem.date, finalItem.device);
    
    setItems(prev => {
      const targetId = normalizeId(finalId);
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
    } else { setLoginError('Login Failed / เข้าสู่ระบบไม่สำเร็จ'); }
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

  const appBaseUrl = window.location.href.split('?')[0];

  const handleCopyTestLink = (assetId: string) => {
    const fullUrl = `${appBaseUrl}?view=${assetId}${sheetUrl ? `&url=${encodeURIComponent(sheetUrl)}` : ''}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setSyncMessage("Link Copied / คัดลอกแล้ว");
      setTimeout(() => setSyncMessage(null), 2000);
    });
  };

  if (publicViewId) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <Loader2 size={40} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Asset / กำลังโหลด...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
        <SpinningGears />
        {publicItem ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-4xl border border-slate-200 overflow-hidden relative z-10 text-left">
            <div className={`p-10 text-white ${publicItem.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck size={28} className="text-white" />
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight leading-tight">Verified Asset Data</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{COMPANY_NAME}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[72vh] no-scrollbar pb-10">
              {publicItem.imageUrl && <img src={publicItem.imageUrl} className="w-full h-56 object-cover rounded-3xl border-4 border-slate-50 shadow-xl" alt="Asset" />}
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <DataField label="Asset ID (A) / รหัสทรัพย์สิน" value={publicItem.id} mono />
                <DataField label="PM Status (G) / สถานะ" value={publicItem.status || 'Pending'} />
                <DataField label="Last PM (B) / ทำล่าสุด" value={formatDateDisplay(publicItem.date)} />
                <DataField 
                  label="Next PM (C) / กำหนดถัดไป" 
                  value={formatDateDisplay(publicItem.nextPmDate || calculateNextPM(publicItem.date, publicItem.device))} 
                />
                <DataField label="Dept (D) / แผนก" value={publicItem.department} />
                <DataField label="User (F) / ผู้ใช้" value={publicItem.personnel || '-'} />
                
                <DataField label="Login User (J) / ชื่อล็อกอิน" value={isUnlocked ? (publicItem.computerUser || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
                <DataField label="Password (K) / รหัสผ่าน" value={isUnlocked ? (publicItem.password || '-') : '********'} mono={isUnlocked} icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
              </div>

              {!isUnlocked && (
                <form onSubmit={handlePinSubmit} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-5 shadow-inner">
                  <div className="flex items-center gap-3"><Lock size={16} className="text-emerald-600" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Unlock Sensitive Data / ปลดล็อค</span></div>
                  <div className="flex gap-3">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="****" className={`flex-1 px-5 py-4 rounded-2xl border-2 text-center font-black tracking-[1.2em] outline-none transition-all ${pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-emerald-600'}`} />
                    <button type="submit" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all">Unlock</button>
                  </div>
                </form>
              )}

              <div className="p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-left">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">PM Records / รายการตรวจสอบ (H)</p>
                <div className="space-y-3">
                  {String(publicItem.activity || '').split(' | ').filter(x => x && x.trim()).map((act, i) => (
                    <p key={i} className="text-[11px] font-bold text-slate-700 flex items-start gap-3 leading-relaxed text-left"><CheckCircle size={14} className="text-emerald-500 mt-0.5" /> {act}</p>
                  ))}
                  {(!publicItem.activity || publicItem.activity.trim() === '') && <p className="text-[11px] text-slate-400 italic">No activity recorded / ไม่มีบันทึก</p>}
                </div>
              </div>
              <button onClick={() => { window.location.href = EXIT_URL; }} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black text-[12px] uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 mt-6 mb-2"><ExternalLink size={18} /> Company Home</button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="text-center p-12 bg-white rounded-[4rem] shadow-5xl max-w-sm relative z-10 border border-slate-100">
            <AlertCircle size={72} className="text-rose-500 mx-auto mb-10" />
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter leading-none">Asset Not Found</h2>
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-8 text-left space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Searching ID / ค้นหารหัส:</p>
               <p className="text-[16px] font-mono font-black text-emerald-600 truncate text-center uppercase tracking-tight">{publicViewId}</p>
            </div>
            <div className="flex flex-col gap-4">
                <button onClick={() => { setIsLoading(true); fetchFromSheet().then(() => setIsLoading(false)); }} className="w-full px-8 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-4xl hover:scale-95 transition-all"><RefreshCw size={18} className={isSyncing ? "animate-spin" : ""}/> Sync & Retry / ลองใหม่</button>
                <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-emerald-600 transition-colors"><Settings size={14}/> Connection Setup / ตั้งค่าระบบ</button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] relative font-sans overflow-x-hidden text-left">
      <SpinningGears />
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[300] px-10 py-5 bg-emerald-600 text-white rounded-3xl shadow-4xl font-black text-[11px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      <div className="md:hidden sticky top-0 z-[100] bg-slate-900 px-7 py-6 flex items-center justify-between shadow-4xl no-print border-b border-slate-800">
        <BrandIdentity size="sm" />
        <div className="flex gap-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3.5 bg-slate-800 text-white rounded-[1.2rem] active:scale-90"><Menu size={24} /></button>
           <button onClick={() => setIsLoginModalOpen(true)} className="p-3.5 bg-emerald-600 text-white rounded-[1.2rem] active:scale-90"><Lock size={20} /></button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[200] bg-slate-900 p-10 flex flex-col gap-12 no-print md:hidden shadow-4xl">
            <div className="flex justify-between items-center"><BrandIdentity size="lg" /><button onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-slate-400 bg-slate-800 rounded-3xl"><X size={32} /></button></div>
            <nav className="space-y-5 flex-1 pt-8 overflow-y-auto">
              <NavBtn icon={Monitor} label="Computer / คอมพิวเตอร์" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <NavBtn icon={PrinterIcon} label="Printer / เครื่องพิมพ์" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
              <NavBtn icon={FileText} label="Asset Ledger / ทะเบียน" active={activeTab === 'table'} onClick={() => { setActiveTab('table'); setIsMobileMenuOpen(false); }} />
            </nav>
            <div className="space-y-5">
              <button onClick={() => { setIsDbSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-7 text-slate-400 font-black text-[11px] uppercase border border-slate-800 rounded-[3rem] flex items-center justify-center gap-3"><Settings size={18} /> Cloud Setup</button>
              {userRole === 'admin' ? <button onClick={() => setUserRole('general')} className="w-full py-7 bg-rose-950/40 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/40">Logout Admin</button> : <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-4xl">Admin Login</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-80 bg-slate-900 p-12 flex-col gap-12 sticky top-0 h-screen z-20 no-print shadow-4xl border-r border-slate-800 text-left">
        <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}><BrandIdentity size="lg" /></div>
        <nav className="space-y-5 flex-1 pt-10">
          <NavBtn icon={Monitor} label="Computer / คอมพิวเตอร์" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printer / เครื่องพิมพ์" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
          <NavBtn icon={FileText} label="Asset Ledger / ทะเบียน" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-5 px-10 py-7 text-emerald-400 bg-emerald-950/30 rounded-[3rem] font-black text-[12px] uppercase border border-emerald-900/50 mt-12 hover:bg-emerald-900/40 transition-all shadow-3xl">
            {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} Sync Cloud
          </button>
        </nav>
        <div className="space-y-5">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-6 text-slate-400 font-black text-[10px] uppercase border border-slate-800 rounded-[2.5rem] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"><Settings size={16} /> Connection</button>
          {userRole === 'admin' ? <button onClick={() => setUserRole('general')} className="w-full py-7 bg-rose-950/30 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/30">Logout Admin</button> : <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-3xl hover:scale-105 transition-all">Admin Login</button>}
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-20 overflow-y-auto w-full relative z-10 text-left">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-14 gap-10 no-print text-left">
          <div className="text-left"><h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none leading-tight">PM Hub / {pmModule === 'computer' ? 'Computer' : 'Printer'}</h2><p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] mt-4">{COMPANY_NAME} • Management System</p></div>
          <button onClick={() => { if(userRole !== 'admin') return setIsLoginModalOpen(true); setEditingItem({ id: '', date: new Date().toISOString(), department: DEPARTMENTS[0], device: pmModule === 'computer' ? 'Computer' : 'Printer', personnel: '', technician: '', status: 'Pending', activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '', startDate: '', warrantyExpiry: '', notes: '', imageUrl: '', assetName: '', modelSpec: '', serialNumber: '', location: '' }); setIsModalOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-5 px-12 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black shadow-4xl text-[14px] uppercase hover:scale-95 transition-all"><Plus size={22} /> Add New Asset</button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-14">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-left">
                <MetricCard icon={Layers} title="Total Assets / ทั้งหมด" value={stats.total.toString()} subtitle="Current module" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency / ความสำเร็จ" value={`${stats.completionRate}%`} subtitle="Maintenance ratio" color="teal" />
                <MetricCard icon={Server} title="Sync Status / เชื่อมต่อ" value={isCloudConnected ? "Online" : "Offline"} subtitle="Cloud database" color={isCloudConnected ? "emerald" : "amber"} />
                <MetricCard icon={Activity} title="Status / สถาพแอป" value="Active" subtitle="System ready" color="emerald" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100 lg:col-span-2 text-left overflow-hidden">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800 text-left"><Monitor size={28} className="text-emerald-600" /> Dept Distribution / ตามแผนก</h3>
                  <ResponsiveContainer width="100%" height={340}><BarChart data={stats.deptStats} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} width={160} /><Tooltip /><Bar dataKey="count" radius={[0, 15, 15, 0]} barSize={18}>{stats.deptStats.map((_, i) => (<Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100 flex flex-col items-center text-left">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800 self-start text-left"><TrendingUp size={28} className="text-emerald-600" /> PM Workload / งานค้าง</h3>
                  <ResponsiveContainer width="100%" height={340}><PieChart><Pie data={stats.statusStats} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value"><Cell fill="#059669" /><Cell fill="#f59e0b" /><Cell fill="#64748b" /></Pie><Tooltip /></PieChart></ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" variants={containerVariants} initial="hidden" animate="show" className="bg-white rounded-[4rem] shadow-4xl overflow-hidden border border-slate-100 overflow-x-auto transition-all text-left">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[12px] font-black text-slate-400 uppercase tracking-[0.25em]"><tr className="text-left"><th className="px-14 py-12">Asset Detail / ข้อมูล</th><th className="px-14 py-12">PM Status / สถานะ</th><th className="px-14 py-12">User / ผู้ใช้</th><th className="px-14 py-12">Cycle / รอบทำ</th><th className="px-14 py-12 text-center">Manage / จัดการ</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.length > 0 ? filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-all group text-left">
                      <td className="px-14 py-12 text-left">
                        <div className="text-left"><p className="font-black text-slate-800 text-[18px] tracking-tight">{it.assetName || it.id}</p><p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{it.id}</p></div>
                      </td>
                      <td className="px-14 py-12 text-left">
                        <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm ${it.status === 'Completed' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : it.status === 'In Progress' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-400 text-white shadow-slate-400/20'}`}>{it.status || 'Pending'}</span>
                      </td>
                      <td className="px-14 py-12 text-[15px] font-black text-slate-700 text-left">{it.personnel || '-'}</td>
                      <td className="px-14 py-12 text-[13px] font-black text-slate-500 text-left">
                         {formatDateDisplay(it.date)} → {formatDateDisplay(it.nextPmDate || calculateNextPM(it.date, it.device))}
                      </td>
                      <td className="px-14 py-12 text-center">
                        <div className="flex gap-5 justify-center">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-5 text-emerald-600 bg-emerald-50 rounded-3xl border border-emerald-100 hover:scale-110 shadow-md active:scale-95 transition-all"><QrCode size={22} /></button>
                          {userRole === 'admin' && <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-5 text-slate-600 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all shadow-md flex items-center gap-4 active:scale-95"><Edit2 size={22} /><span className="text-[12px] font-black uppercase tracking-tight">Edit</span></button>}
                        </div>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={5} className="px-14 py-32 text-center"><p className="text-slate-400 font-black uppercase tracking-widest">No assets found / ไม่พบข้อมูล</p></td></tr>)}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-slate-900/85 backdrop-blur-xl overflow-y-auto pt-14 text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[4.5rem] md:rounded-[4.5rem] w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] shadow-5xl border border-slate-200 text-left">
            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50 text-left">
              <div className="flex items-center gap-8 text-left"><div className="p-5 bg-emerald-600 text-white rounded-[2.5rem] shadow-4xl"><Wrench size={34} /></div><div className="text-left"><h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">{editingItem.id ? 'Edit Asset Data / แก้ไขข้อมูล' : 'Register New Asset / ทะเบียนใหม่'}</h3><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Asset ID: {editingItem.id || 'NEW'}</p></div></div>
              <button onClick={() => setIsModalOpen(false)} className="p-6 bg-slate-50 text-slate-400 rounded-3xl active:scale-90 shadow-sm transition-all"><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="p-14 space-y-16 overflow-y-auto pb-40 text-left no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-14 text-left">
                 <div className="md:col-span-1 space-y-5 text-left">
                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 flex items-center gap-4 text-left"><ImageIcon size={18} className="text-emerald-600"/> Asset Photo / รูปภาพ</label>
                    <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[5rem] flex flex-col items-center justify-center overflow-hidden group relative shadow-inner">
                       {editingItem.imageUrl ? (<><img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="Proof" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-8 transition-opacity duration-300"><button type="button" onClick={() => cameraInputRef.current?.click()} className="p-6 bg-emerald-600 text-white rounded-full"><Camera size={36} /></button><button type="button" onClick={() => fileInputRef.current?.click()} className="p-6 bg-white text-emerald-600 rounded-full"><Upload size={36} /></button></div></>) : (<div className="flex flex-col items-center gap-10 text-center px-8"><div className="flex gap-8"><button type="button" onClick={() => cameraInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl active:scale-90"><Camera size={48} /></button><button type="button" onClick={() => fileInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl active:scale-90"><Upload size={48} /></button></div><span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em]">Capture/Upload</span></div>)}
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setEditingItem({...editingItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setEditingItem({...editingItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                    </div>
                 </div>
                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                    <FormInput label="Asset ID (A) / รหัสทรัพย์สิน" icon={Hash} value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} required placeholder="Ex: TTG-01" />
                    <FormInput label="Last PM (B) / วันที่ทำล่าสุด" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} required />
                    <FormInput label="Next PM (C) / กำหนดครั้งหน้า" value={formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))} readOnly icon={Calendar} />
                    <FormInput label="Asset Name (S) / ชื่อเครื่อง" icon={Tag} value={editingItem.assetName || ''} onChange={val => setEditingItem({...editingItem, assetName: val})} />
                    <FormInput label="Model Spec (T) / สเปคเครื่อง" icon={Cpu} value={editingItem.modelSpec || ''} onChange={val => setEditingItem({...editingItem, modelSpec: val})} />
                    <FormInput label="Serial No. (U) / ซีเรียล" value={editingItem.serialNumber || ''} onChange={val => setEditingItem({...editingItem, serialNumber: val})} />
                    <FormInput label="Location (V) / สถานที่" icon={MapPin} value={editingItem.location || ''} onChange={val => setEditingItem({...editingItem, location: val})} />
                    <FormSelect label="Department (D) / แผนก" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                    <FormSelect label="Device Type (E) / ประเภท" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                 </div>
              </div>

              <div className="space-y-10 text-left">
                <div className="flex items-center gap-5"><div className="w-2.5 h-10 bg-emerald-600 rounded-full"></div><h4 className="text-xl font-black text-slate-900 uppercase">Security Keys / รหัสเข้าถึง</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                   <FormInput label="OS Username (J) / ชื่อผู้ใช้" icon={Lock} value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} />
                   <FormInput label="OS Password (K) / รหัสผ่าน" icon={Key} type="password" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} />
                   <FormInput label="Admin Pass (L) / แอดมิน" icon={Key} type="password" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} />
                   <FormInput label="Antivirus (M) / แอนตี้ไวรัส" value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                 <FormInput label="Holder Name (F) / ผู้ถือครอง" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} />
                 <FormInput label="Lead Tech (O) / ผู้รับผิดชอบ" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} />
                 <FormInput label="Hostname (I) / ชื่อเครือข่าย" value={editingItem.computerName || ''} onChange={val => setEditingItem({...editingItem, computerName: val})} />
                 <FormSelect label="Status (G) / สถานะการทำ PM" value={editingItem.status || 'Pending'} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
              </div>

              <div className="space-y-10 text-left">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] ml-8 flex items-center gap-4"><CheckSquare size={20} className="text-emerald-600" /> PM Standard Activities (H) / รายการตรวจสอบ</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const cleanAct = act.trim();
                    const isChecked = String(editingItem.activity || '').split('|').map(a => a.trim()).includes(cleanAct);
                    
                    return (
                      <label key={i} className={`flex items-center gap-8 p-7 rounded-[2.5rem] border cursor-pointer transition-all duration-300 ${isChecked ? 'bg-white border-emerald-500 shadow-xl translate-x-1.5' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => { 
                          const currentActs = String(editingItem.activity || '').split('|').map(a => a.trim()).filter(x => x); 
                          const newActs = isChecked ? currentActs.filter(a => a !== cleanAct) : [...currentActs, cleanAct]; 
                          setEditingItem({...editingItem, activity: newActs.join(' | ')}); 
                        }} />
                        <div className={`p-2.5 rounded-xl transition-colors ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={24} /> : <Square size={24} />}</div>
                        <span className={`text-[15px] font-black leading-tight ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 p-12 rounded-[4.5rem] border-2 border-emerald-100/60 flex items-center justify-between gap-12 shadow-inner text-left">
                <div className="text-left w-full md:w-auto"><p className="text-[12px] font-black text-emerald-600 uppercase mb-4 tracking-[0.3em]">Next Cycle / แผนรอบหน้า</p><p className="text-5xl font-black text-emerald-900 tracking-tighter leading-none">{formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))}</p></div>
                <div className="flex gap-8 w-full md:w-auto"><button type="button" onClick={() => setIsModalOpen(false)} className="px-14 py-7 bg-white text-slate-400 rounded-[3rem] font-black text-xs uppercase border border-slate-100 shadow-2xl transition-all">Cancel / ยกเลิก</button><button type="submit" className="px-20 py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl flex items-center justify-center gap-5 active:scale-95 transition-all"><Database size={24} /> Save & Cloud Sync</button></div>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/85 backdrop-blur-xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] shadow-5xl w-full max-w-sm p-14 text-center relative overflow-hidden">
             <button onClick={() => setIsQrModalOpen(false)} className="absolute top-12 right-12 text-slate-300 active:scale-90 transition-all"><X size={32} /></button>
             <h3 className="text-3xl font-black mb-12 uppercase tracking-tight text-slate-900">Asset QR Tag</h3>
             <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 inline-block mb-10 shadow-inner">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`${appBaseUrl}?view=${qrItem.id}${sheetUrl ? `&url=${encodeURIComponent(sheetUrl)}` : ''}`)}`} 
                 alt="QR" 
                 className="w-56 h-56 rounded-3xl shadow-3xl" 
               />
             </div>
             <div className="space-y-4 mb-8">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Smart Cloud Link Enabled</p>
                <div className="flex flex-col gap-3">
                   <button onClick={() => handleCopyTestLink(qrItem.id)} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-[11px] uppercase border border-emerald-100 hover:bg-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"><Copy size={18} /> Copy Link</button>
                   <button onClick={() => { window.location.href = `${appBaseUrl}?view=${qrItem.id}${sheetUrl ? `&url=${encodeURIComponent(sheetUrl)}` : ''}`; }} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase shadow-4xl hover:bg-black flex items-center justify-center gap-3 active:scale-95 transition-all"><Monitor size={18} /> Live View</button>
                </div>
             </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] p-16 w-full max-w-md space-y-12 shadow-5xl relative overflow-hidden text-center">
            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">Connect Cloud</h3>
            <FormInput label="GAS Webhook URL" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/macros/s/..." />
            <div className="space-y-5 pt-8"><button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl hover:bg-emerald-700 flex items-center justify-center gap-5 active:scale-95 transition-all"><RefreshCw size={22} /> Connect</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[5.5rem] p-16 w-full max-w-sm space-y-14 shadow-5xl relative overflow-hidden text-center">
            <Lock size={64} className="mx-auto text-emerald-600 mb-10" /><h3 className="text-4xl font-black uppercase tracking-tight text-slate-900">Admin Login</h3>
            <form onSubmit={handleLogin} className="space-y-12">
              <div className="space-y-7"><FormInput label="Admin User" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} /><FormInput label="Password" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} /></div>
              <button type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-5xl active:scale-95 hover:bg-emerald-700 transition-all">Verify / ยืนยัน</button>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-7 px-12 py-7 rounded-[3.5rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-4xl scale-[1.06] z-10' : 'text-slate-500 border-transparent hover:bg-slate-800/90 hover:text-slate-200'}`}><Icon size={26} /><span className="text-[15px] font-black uppercase tracking-tight text-left">{label}</span></button>
);

const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = { emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-600/5', teal: 'bg-teal-50 text-teal-600 border-teal-100 shadow-teal-600/5', rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/5', amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-600/5' };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-3xl text-left relative z-10">
      <div className={`p-6 rounded-2xl inline-block mb-10 ${themes[color] || themes.emerald} border shadow-inner`}><Icon size={32} /></div>
      <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-[0.25em] text-left">{title}</p>
      <h4 className="text-5xl font-black text-slate-900 truncate tracking-tighter text-left leading-none">{value}</h4>
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
        {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
      <ChevronRight size={24} className="absolute right-9 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean; icon?: React.ReactNode }> = ({ label, value, mono = false, small = false, icon }) => (
  <div className="bg-slate-50/50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group hover:bg-white transition-all cursor-default">
    <p className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2 text-left"><span className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-emerald-400 transition-colors"></span>{label}{icon && <span className="ml-auto text-emerald-400">{icon}</span>}</p>
    <p className={`font-black text-slate-800 truncate leading-none text-left ${mono ? 'font-mono text-[16px] tracking-tight uppercase' : small ? 'text-[13px]' : 'text-[15px]'}`}>{value || '-'}</p>
  </div>
);

export default App;
