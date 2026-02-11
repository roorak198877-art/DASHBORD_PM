import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area
} from 'recharts';
import { 
  CheckCircle, Monitor, TrendingUp, FileText, Layers, Edit2, Plus, X, Trash2,
  CheckSquare, Square, RefreshCw, Settings, Wrench, QrCode, Share2, 
  Activity, Lock, PrinterIcon, ShieldAlert, Loader2, ChevronRight, 
  Download, Camera, Image as ImageIcon, Upload, Database, Globe, Eye, EyeOff,
  AlertCircle, Calendar, Info, ArrowLeft, ShieldCheck, MapPin, Tag, Cpu, Hash, Key,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_PM_DATA, DEPARTMENTS, COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES } from './constants';
import { PMItem } from './types';

// --- CONFIGURATION ---
const COMPANY_NAME = 'TCITRENDGROUP'; 
const LOGO_TEXT = 'T.T.g';
const DEFAULT_GAS_URL = ''; 
const SECURITY_PIN = '1234';

const CHART_COLORS = ['#065f46', '#0f172a', '#059669', '#1e293b', '#10b981', '#334155', '#34d399', '#064e3b'];
const bouncySpring = { type: "spring" as const, stiffness: 400, damping: 25 };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const bouncyItem = { hidden: { opacity: 0, scale: 0.8, y: 30 }, show: { opacity: 1, scale: 1, y: 0, transition: bouncySpring } };
const modalAnimate = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: bouncySpring },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

// --- ANIMATION COMPONENTS ---
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
      animate={{ rotate: -360, y: [0, 15, 0] }} 
      transition={{ rotate: { repeat: Infinity, duration: 15, ease: "linear" }, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
      className="absolute top-20 -right-20 text-emerald-700"
    >
      <Settings size={150} strokeWidth={1} />
    </motion.div>
    <motion.div 
      animate={{ rotate: 360, x: [0, 10, 0] }} 
      transition={{ rotate: { repeat: Infinity, duration: 25, ease: "linear" }, x: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
      className="absolute top-48 right-10 text-emerald-600"
    >
      <Settings size={100} strokeWidth={1} />
    </motion.div>
  </div>
);

// กฎเหล็ก: จัดการ Formatting วันที่ (ตัดค่าส่วนเกิน T00:00...Z และแสดงผล YYYY-MM-DD ตามคำสั่งล่าสุด)
const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    // แสดงผลเฉพาะส่วนวันที่ YYYY-MM-DD โดยใช้ split('T')[0]
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

const BrandIdentity: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
  const isLg = size === 'lg';
  return (
    <div className="flex items-center gap-3 relative z-10">
      <div className="flex items-center justify-center rounded-lg bg-emerald-600 shadow-sm border border-emerald-500" style={{ width: isLg ? 35 : 30, height: isLg ? 35 : 30 }}>
        <span className="font-black text-[12px] text-white tracking-tighter">{LOGO_TEXT}</span>
      </div>
      <div className="flex flex-col text-left">
        <h1 className={`${isLg ? 'text-lg' : 'text-sm'} font-black text-white tracking-tighter leading-none uppercase`}>{COMPANY_NAME}</h1>
        {isLg && <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">PM System Cloud</p>}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [pmModule, setPmModule] = useState<'computer' | 'printer'>('computer');
  const [publicViewId, setPublicViewId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view')?.trim() || null;
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

  // CRITICAL: Restore useEffect and fetching logic to ensure IDs are captured and synced
  useEffect(() => {
    const fetchOnMount = async () => {
      setIsLoading(true);
      if (sheetUrl && sheetUrl.startsWith('http')) {
        await fetchFromSheet(true);
      } else {
        // Give local data a moment to "load" for UI consistency
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setIsLoading(false);
    };
    fetchOnMount();
  }, [sheetUrl]);

  // Lock logic to isolate the public verification view
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
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const deptMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item.department) deptMap[item.department] = (deptMap[item.department] || 0) + 1; });
    const deptStats = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const trendMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item.date) { const d = toISODate(item.date); if(d) trendMap[d] = (trendMap[d] || 0) + 1; } });
    const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date: formatDateDisplay(date), count })).sort((a, b) => a.date.localeCompare(b.date));
    return { total, completionRate, deptStats, dailyTrend };
  }, [filteredItems]);

  const pushToCloud = async (item: PMItem) => {
    if (!sheetUrl) return;
    try {
      setSyncMessage("กำลังบันทึกไปยัง Cloud...");
      const payload = [
        item.id, item.date, item.nextPmDate || '', item.department, item.device,
        item.personnel, item.status, item.activity, item.computerName, item.computerUser,
        item.password || '', item.serverPassword || '', item.antivirus || '', item.imageUrl || '', item.technician || '',
        item.startDate || '', item.warrantyExpiry || '', item.spareField || '',
        item.assetName || '', item.model || '', item.serialNumber || '', item.location || ''
      ];
      await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ values: payload }) });
      setSyncMessage("บันทึกสำเร็จ (Cloud Sync)");
      setIsCloudConnected(true);
    } catch (err) { 
      setSyncMessage("เชื่อมต่อ Cloud ล้มเหลว"); 
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
          const mapped: PMItem[] = data.map(row => {
            if (!row || !row[0]) return null;
            return {
              id: String(row[0]).trim(), 
              date: row[1], // Column B: Last PM
              nextPmDate: row[2], // Column C: Next PM
              department: row[3], // Column D
              device: row[4], // Column E
              personnel: row[5], // Column F
              status: row[6], // Column G
              activity: row[7], // Column H
              computerName: row[8], // Column I
              computerUser: row[9], // Column J: Login
              password: row[10], // Column K
              serverPassword: row[11], // Column L
              antivirus: row[12], // Column M
              technician: row[14], // Column O
              imageUrl: row[15], // Column P
              startDate: row[16] || '',
              warrantyExpiry: row[17] || '',
              spareField: row[18] || '',
              assetName: row[19] || '',
              model: row[20] || '',
              serialNumber: row[21] || '',
              location: row[22] || '',
              deviceStatus: row[7]?.includes('Broken') ? 'Broken' : 'Ready'
            };
          }).filter(i => i !== null) as PMItem[];
          setItems(mapped); 
          setIsCloudConnected(true);
          if (!silent) setSyncMessage('ซิงค์ข้อมูลสำเร็จ');
        } else { setIsCloudConnected(false); }
      } else { setIsCloudConnected(false); }
    } catch (err) { setIsCloudConnected(false); } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 2000); 
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.id) return alert('กรุณาระบุ Asset ID');
    let finalItem = { ...editingItem, id: String(editingItem.id).trim() };
    if (finalItem.status === 'Completed') {
      finalItem.nextPmDate = calculateNextPM(finalItem.date, finalItem.device);
    } else { finalItem.nextPmDate = ''; }
    
    setItems(prev => {
      const exists = prev.find(i => String(i.id).trim().toLowerCase() === finalItem.id.toLowerCase());
      return exists ? prev.map(i => String(i.id).trim().toLowerCase() === finalItem.id.toLowerCase() ? finalItem : i) : [...prev, finalItem];
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
      setLoginForm({ username: '', password: '' });
    } else { setLoginError('รหัสผ่านไม่ถูกต้อง'); }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SECURITY_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
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

  // --- ASSET TAG VIEW (PUBLIC) ---
  if (publicViewId) {
    // Robust search for the asset item
    const item = items.find(i => 
      i && i.id && String(i.id).trim().toLowerCase() === String(publicViewId).trim().toLowerCase()
    );
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
          <SpinningGears />
          <Loader2 size={40} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Verifying Asset Connectivity...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 relative overflow-hidden">
        <SpinningGears />
        {item ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-4xl border border-slate-200 overflow-hidden relative z-10 text-left">
            <div className={`p-10 text-white ${item.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                  <ShieldCheck size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight">Verified Digital Asset</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{COMPANY_NAME}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[72vh] no-scrollbar pb-10">
              {item.imageUrl && (
                <div className="relative group">
                  <img src={item.imageUrl} className="w-full h-56 object-cover rounded-3xl border-4 border-slate-50 shadow-xl" alt="proof documentation" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <DataField label="Asset Identifier (A)" value={item.id} mono />
                <DataField label="Maintenance Status (G)" value={item.status} />
                <DataField label="Last PM Cycle (B)" value={formatDateDisplay(item.date)} />
                <DataField label="Next Schedule (C)" value={formatDateDisplay(item.nextPmDate)} />
                
                <DataField label="Business Unit (D)" value={item.department} />
                <DataField label="Current End-User (F)" value={item.personnel || '-'} />
                <DataField label="Hostname ID (I)" value={item.computerName || '-'} />
                <DataField label="Duty Technician (O)" value={item.technician || '-'} />
                
                {/* STRICT ORDER: Column J-M PIN Lock protection */}
                <DataField 
                  label="Login Account (J)" 
                  value={isUnlocked ? (item.computerUser || '-') : '********'} 
                  mono={isUnlocked} 
                  icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>}
                />
                <DataField 
                  label="Password Hash (K)" 
                  value={isUnlocked ? (item.password || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>}
                />
                <DataField 
                  label="Server Credential (L)" 
                  value={isUnlocked ? (item.serverPassword || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>}
                />
                <DataField 
                  label="Antivirus Suite (M)" 
                  value={isUnlocked ? (item.antivirus || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>}
                />
              </div>

              {!isUnlocked && (
                <form onSubmit={handlePinSubmit} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-5 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify PIN to reveal sensitive data</span>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="password" 
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="****"
                      className={`flex-1 px-5 py-4 rounded-2xl border-2 text-center font-black tracking-[1.2em] outline-none transition-all ${pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-emerald-600'}`}
                    />
                    <button type="submit" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all">Unlock</button>
                  </div>
                  {pinError && <p className="text-[9px] font-bold text-rose-500 text-center uppercase tracking-widest animate-pulse">Credential Invalid</p>}
                </form>
              )}

              {item.location && (
                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-4 text-left">
                  <MapPin size={22} className="text-emerald-600" />
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-left">Fixed Deployment Area</p>
                    <p className="text-[13px] font-black text-emerald-900 text-left">{item.location}</p>
                  </div>
                </div>
              )}

              <div className="p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-left">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Maintenance Record (H)</p>
                <div className="space-y-3">
                  {String(item.activity || '').split(' | ').filter(x => x).map((act, i) => (
                    <p key={i} className="text-[11px] font-bold text-slate-700 flex items-start gap-3 leading-relaxed text-left">
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5" /> {act}
                    </p>
                  ))}
                </div>
              </div>
              
              {/* EXIT BUTTON: Bounces to Google for session safety */}
              <button 
                onClick={() => {
                   window.location.href = 'https://www.google.com';
                }}
                className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black text-[12px] uppercase shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-95 mt-6 mb-2"
              >
                <X size={18} /> Close & Exit Verification
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center p-14 bg-white rounded-[4rem] shadow-4xl max-w-sm relative z-10 border border-slate-100">
            <AlertCircle size={56} className="text-rose-500 mx-auto mb-8" />
            <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">INVALID ASSET ID</h2>
            <p className="text-slate-400 text-sm font-bold leading-relaxed px-4">Sorry, we couldn't find a matching record for this identifier in our cloud database.</p>
            <div className="flex flex-col gap-4 mt-10">
                <button onClick={() => window.location.reload()} className="w-full px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                  <RefreshCw size={16}/> Synchronize & Retry
                </button>
                <button onClick={() => window.location.href = 'https://www.google.com'} className="w-full px-12 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">
                  Exit System
                </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- PRIVATE DASHBOARD (ADMIN/STAFF) ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] relative font-sans overflow-x-hidden text-left">
      <SpinningGears />
      
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[300] px-10 py-5 bg-emerald-600 text-white rounded-3xl shadow-4xl font-black text-[11px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      {/* MOBILE HEADER & NAV */}
      <div className="md:hidden sticky top-0 z-[100] bg-slate-900 px-7 py-6 flex items-center justify-between shadow-4xl no-print border-b border-slate-800">
        <BrandIdentity size="sm" />
        <div className="flex gap-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3.5 bg-slate-800 text-white rounded-[1.2rem] shadow-xl active:scale-95 transition-all">
              <Menu size={24} />
           </button>
           <button onClick={() => setIsLoginModalOpen(true)} className="p-3.5 bg-emerald-600 text-white rounded-[1.2rem] shadow-xl active:scale-95 transition-all">
              <Lock size={20} />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[200] bg-slate-900 p-10 flex flex-col gap-12 no-print md:hidden shadow-4xl"
          >
            <div className="flex justify-between items-center">
              <BrandIdentity size="lg" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-3xl shadow-2xl">
                <X size={32} />
              </button>
            </div>
            <nav className="space-y-5 flex-1 overflow-y-auto pt-8">
              <NavBtn icon={Monitor} label="Computer Module" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <NavBtn icon={PrinterIcon} label="Printer Module" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
              <NavBtn icon={FileText} label="Asset Ledger" active={activeTab === 'table'} onClick={() => { setActiveTab('table'); setIsMobileMenuOpen(false); }} />
              
              <button onClick={() => { fetchFromSheet(); setIsMobileMenuOpen(false); }} disabled={isSyncing} className="w-full flex items-center gap-5 px-10 py-7 text-emerald-400 bg-emerald-950/40 rounded-[3rem] font-black text-[13px] uppercase border border-emerald-900/60 mt-12 hover:bg-emerald-900/50 transition-all shadow-2xl active:scale-95">
                {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} Synchronize Database
              </button>
            </nav>
            <div className="space-y-5">
              <button onClick={() => { setIsDbSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-7 text-slate-400 font-black text-[11px] uppercase border border-slate-800 rounded-[3rem] flex items-center justify-center gap-3 active:scale-95 hover:bg-slate-800 transition-colors">
                <Settings size={18} /> Integration Settings
              </button>
              {userRole === 'admin' ? (
                <button onClick={() => { setUserRole('general'); setIsMobileMenuOpen(false); }} className="w-full py-7 bg-rose-950/40 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/40 active:scale-95">Revoke Root Access</button>
              ) : (
                <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-4xl active:scale-95">Administrator Auth</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-80 bg-slate-900 p-12 flex-col gap-12 sticky top-0 h-screen z-20 no-print shadow-4xl relative overflow-hidden text-left border-r border-slate-800">
        <div className="cursor-pointer relative z-10" onClick={() => setActiveTab('dashboard')}><BrandIdentity size="lg" /></div>
        <nav className="space-y-5 flex-1 relative z-10 pt-10">
          <NavBtn icon={Monitor} label="Computer" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printer" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-10 mx-6"></div>
          <NavBtn icon={FileText} label="Full Ledger" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-5 px-10 py-7 text-emerald-400 bg-emerald-950/30 rounded-[3rem] font-black text-[12px] uppercase border border-emerald-900/50 mt-12 hover:bg-emerald-900/40 transition-all shadow-3xl active:scale-95">
            {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} Update Cloud
          </button>
        </nav>
        
        <div className="space-y-5 relative z-10">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-6 text-slate-400 font-black text-[10px] uppercase border border-slate-800 rounded-[2.5rem] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"><Settings size={16} /> Link Configuration</button>
          {userRole === 'admin' ? (
            <button onClick={() => setUserRole('general')} className="w-full py-7 bg-rose-950/30 text-rose-500 rounded-[3rem] font-black text-[11px] uppercase border border-rose-900/30 active:scale-95">Logout Admin</button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-[11px] uppercase shadow-3xl hover:bg-emerald-500 transition-all active:scale-95">Admin Gateway</button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 md:p-20 overflow-y-auto w-full mb-32 md:mb-0 relative z-10 text-left">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-14 gap-10 no-print text-left">
          <div className="text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{pmModule} PM Hub</h2>
            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] mt-4">{COMPANY_NAME} • Maintenance Excellence System</p>
          </div>
          <div className="flex gap-5 w-full lg:w-auto">
            <button onClick={() => { 
              if(userRole !== 'admin') return setIsLoginModalOpen(true);
              setEditingItem({ id: '', date: new Date().toISOString(), department: DEPARTMENTS[0], device: pmModule === 'computer' ? 'Computer' : 'Printer', personnel: '', technician: '', status: 'Pending', activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '', startDate: '', warrantyExpiry: '', spareField: '', imageUrl: '', assetName: '', model: '', serialNumber: '', location: '' }); 
              setIsModalOpen(true); 
            }} className="flex-1 lg:flex-none flex items-center justify-center gap-5 px-12 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black shadow-4xl text-[14px] uppercase hover:scale-95 transition-all">
              <Plus size={22} /> Register Asset
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-14">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                <MetricCard icon={Layers} title="Managed Units" value={stats.total.toString()} subtitle="Total Asset Population" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency" value={`${stats.completionRate}%`} subtitle="Maintenance Ratio" color="teal" />
                <MetricCard icon={ShieldAlert} title="Cloud Sync" value={isCloudConnected ? "Established" : "Broken"} subtitle="Database State" color={isCloudConnected ? "emerald" : "rose"} />
                <MetricCard icon={Activity} title="System" value="Live" subtitle="Operations Operational" color="amber" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800"><Monitor size={28} className="text-emerald-600" /> Dept Volume Distribution</h3>
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
                <div className="bg-white p-14 rounded-[4rem] shadow-4xl border border-slate-100">
                  <h3 className="text-2xl font-black mb-14 uppercase flex items-center gap-5 tracking-tighter text-slate-800"><TrendingUp size={28} className="text-emerald-600" /> Maintenance Velocity</h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={stats.dailyTrend}>
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={7} fill="#10b98120" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" variants={containerVariants} initial="hidden" animate="show" className="bg-white rounded-[4rem] shadow-4xl overflow-hidden border border-slate-100 overflow-x-auto transition-all text-left">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[12px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  <tr>
                    <th className="px-14 py-12">Asset Identification</th>
                    <th className="px-14 py-12">Deployment Status</th>
                    <th className="px-14 py-12">Responsible User</th>
                    <th className="px-14 py-12">Last Cycle</th>
                    <th className="px-14 py-12 text-center">Protocol Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-all group">
                      <td className="px-14 py-12">
                        <div>
                          <p className="font-black text-slate-800 text-[18px] tracking-tight">{it.assetName || it.computerName || it.id}</p>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{it.id} | {it.model || '-'}</p>
                        </div>
                      </td>
                      <td className="px-14 py-12">
                        <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm ${it.status === 'Completed' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                          {it.status}
                        </span>
                      </td>
                      <td className="px-14 py-12 text-[15px] font-black text-slate-700">{it.personnel || '-'}</td>
                      <td className="px-14 py-12 text-[13px] font-black text-slate-500">{formatDateDisplay(it.date)}</td>
                      <td className="px-14 py-12">
                        <div className="flex gap-5 justify-center">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-5 text-emerald-600 bg-emerald-50 rounded-3xl border border-emerald-100 hover:scale-110 transition-transform shadow-md active:scale-95"><QrCode size={22} /></button>
                          {userRole === 'admin' && (
                            <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-5 text-slate-600 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all shadow-md flex items-center gap-4 active:scale-95">
                              <Edit2 size={22} />
                              <span className="text-[12px] font-black uppercase tracking-tight">Modify</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ASSET EDIT/CREATE MODAL */}
      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-slate-900/85 backdrop-blur-xl overflow-y-auto pt-14 no-print">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[4.5rem] md:rounded-[4.5rem] w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] shadow-5xl text-left border border-slate-200">
            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50 text-left">
              <div className="flex items-center gap-8 text-left">
                <div className="p-5 bg-emerald-600 text-white rounded-[2.5rem] shadow-4xl">
                  <Wrench size={34} />
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">{editingItem.id ? 'Modify Ledger Record' : 'Register New Hardware'}</h3>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Asset Intelligence Hub • Ref: {editingItem.id || 'Drafting Session'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-6 bg-slate-50 text-slate-400 rounded-3xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90 shadow-sm"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-14 space-y-16 overflow-y-auto pb-40 text-left no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-14 text-left">
                 <div className="md:col-span-1 space-y-5">
                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 flex items-center gap-4"><ImageIcon size={18} className="text-emerald-600"/> Asset Imagery (P)</label>
                    <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[5rem] flex flex-col items-center justify-center overflow-hidden group relative shadow-inner hover:border-emerald-300 transition-all duration-500">
                       {editingItem.imageUrl ? (
                         <>
                           <img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="physical asset doc" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-8">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-6 bg-emerald-600 text-white rounded-full hover:scale-110 transition-transform shadow-5xl"><Camera size={36} /></button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-6 bg-white text-emerald-600 rounded-full hover:scale-110 transition-transform shadow-5xl"><Upload size={36} /></button>
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center gap-10 text-center px-8">
                            <div className="flex gap-8">
                               <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl hover:bg-emerald-50 active:scale-90 transition-all"><Camera size={48} /></button>
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="p-7 bg-white text-emerald-600 rounded-[3rem] shadow-4xl hover:bg-emerald-50 active:scale-90 transition-all"><Upload size={48} /></button>
                            </div>
                            <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em]">Initialize Capture</span>
                         </div>
                       )}
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </div>
                 </div>

                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                    <FormInput label="Identifier ID (A)" icon={Hash} value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} required placeholder="Ex: TC-XXXX-XXXX" />
                    <FormInput label="Last Cycle Date (B)" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} />
                    <FormInput label="Projected Next PM (C)" value={formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))} readOnly icon={Calendar} />
                    
                    <FormInput label="Commercial Asset Name" icon={Tag} value={editingItem.assetName || ''} onChange={val => setEditingItem({...editingItem, assetName: val})} placeholder="Ex: Finance Terminal 04" />
                    <FormInput label="Model / Spec Profile" icon={Cpu} value={editingItem.model || ''} onChange={val => setEditingItem({...editingItem, model: val})} placeholder="Ex: Dell Precision 3660" />
                    <FormInput label="Serial Reference (S/N)" value={editingItem.serialNumber || ''} onChange={val => setEditingItem({...editingItem, serialNumber: val})} placeholder="Ex: SN-882-991-P" />
                    
                    <FormInput label="Deployment Area" icon={MapPin} value={editingItem.location || ''} onChange={val => setEditingItem({...editingItem, location: val})} placeholder="Ex: Server Room B1" />
                    <FormSelect label="Business Unit (D)" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                    <FormSelect label="Asset Category (E)" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                 </div>
              </div>

              {/* SECURITY DATA (J-M) */}
              <div className="space-y-10 text-left">
                <div className="flex items-center gap-5">
                   <div className="w-2.5 h-10 bg-emerald-600 rounded-full shadow-lg"></div>
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Access & Protocol Configuration (J-M)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                   <FormInput label="Login Username (J)" icon={Lock} value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} placeholder="System Username" />
                   <FormInput label="Account Key (K)" icon={Key} type="password" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} />
                   <FormInput label="Server Gateway Pass (L)" icon={Key} type="password" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} />
                   <FormInput label="Security Antivirus (M)" icon={ShieldCheck} value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} placeholder="Protective Engine" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                 <FormInput label="Assigned End-User (F)" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} placeholder="Employee Name" />
                 <FormInput label="Responsible Technician (O)" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} placeholder="Staff Technologist" />
                 <FormInput label="Network Hostname (I)" value={editingItem.computerName || ''} onChange={val => setEditingItem({...editingItem, computerName: val})} placeholder="DNS Hostname" />
              </div>

              <div className="space-y-10 text-left">
                <div className="flex items-center gap-5">
                   <div className="w-2.5 h-10 bg-slate-400 rounded-full shadow-lg"></div>
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lifecycle Intelligence</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                   <FormInput label="Operational Start" type="date" value={toISODate(editingItem.startDate)} onChange={val => setEditingItem({...editingItem, startDate: val})} />
                   <FormInput label="Warranty Expiration" type="date" value={toISODate(editingItem.warrantyExpiry)} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                   <FormSelect label="Current Deployment (G)" value={editingItem.status} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                </div>
                <FormInput label="Technical Ledger / Spare Notes" value={editingItem.spareField || ''} onChange={val => setEditingItem({...editingItem, spareField: val})} placeholder="Log system anomalies or upgrades..." />
              </div>

              <div className="space-y-10 text-left">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] ml-8 flex items-center gap-4"><CheckSquare size={20} className="text-emerald-600" /> Maintenance Protocol Checklist (H)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-12 bg-slate-50 rounded-[4rem] border border-slate-100 shadow-inner">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = String(editingItem.activity || '').includes(act);
                    return (
                      <label key={i} className={`flex items-center gap-8 p-7 rounded-[2.5rem] border transition-all cursor-pointer ${isChecked ? 'bg-white border-emerald-500 shadow-2xl translate-x-1.5' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => {
                          const currentActs = String(editingItem.activity || '').split(' | ').filter(x => x);
                          const newActs = isChecked ? currentActs.filter(a => a !== act) : [...currentActs, act];
                          setEditingItem({...editingItem, activity: newActs.join(' | ')});
                        }} />
                        <div className={`p-2.5 rounded-xl transition-all duration-300 ${isChecked ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-slate-100 text-slate-300'}`}>
                          {isChecked ? <CheckCircle size={24} /> : <Square size={24} />}
                        </div>
                        <span className={`text-[15px] font-black leading-tight ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 p-12 rounded-[4.5rem] border-2 border-emerald-100/60 flex flex-col md:flex-row items-center justify-between gap-12 shadow-inner text-left">
                <div className="text-left w-full md:w-auto">
                  <p className="text-[12px] font-black text-emerald-600 uppercase mb-4 tracking-[0.3em]">Projected Maintenance Horizon</p>
                  <p className="text-5xl font-black text-emerald-900 tracking-tighter">{editingItem.status === 'Completed' ? formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device)) : 'VALUATION PENDING'}</p>
                  <p className="text-[11px] text-emerald-500 font-black uppercase mt-5 opacity-80 flex items-center gap-3"><Info size={14} /> System calculation acquired upon 'Completed' cycle state</p>
                </div>
                <div className="flex gap-8 w-full md:w-auto">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none px-14 py-7 bg-white text-slate-400 rounded-[3rem] font-black text-xs uppercase hover:text-rose-500 transition-all border border-slate-100 shadow-2xl active:scale-95">Discard</button>
                   <button 
                     type="submit" 
                     className="flex-1 md:flex-none px-20 py-7 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-5 active:scale-95"
                   >
                     <Database size={24} /> Commit Changes & Sync
                   </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/85 backdrop-blur-xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] shadow-5xl w-full max-w-sm p-14 text-center relative overflow-hidden">
             <button onClick={() => setIsQrModalOpen(false)} className="absolute top-12 right-12 text-slate-300 hover:text-rose-500 transition-colors active:scale-90"><X size={32} /></button>
             <h3 className="text-3xl font-black mb-12 uppercase tracking-tight text-slate-900">IDENTITY PASSPORT</h3>
             <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 inline-block mb-14 shadow-inner relative group">
                <div className="absolute inset-0 bg-emerald-600/15 scale-125 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`${appBaseUrl}?view=${qrItem.id}`)}`} alt="Hardware QR Passport" className="w-56 h-56 rounded-3xl relative z-10 shadow-3xl group-hover:rotate-1 transition-transform" />
             </div>
             <button 
                onClick={() => setPublicViewId(qrItem.id)}
                className="w-full py-7 bg-slate-900 text-white rounded-[3rem] font-black text-[12px] uppercase shadow-4xl hover:bg-black transition-all flex items-center justify-center gap-5 active:scale-95"
              >
                <Monitor size={22} /> VERIFY LIVE VIEW
              </button>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4.5rem] p-16 w-full max-w-md space-y-12 shadow-5xl relative overflow-hidden text-center">
            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">CLOUD SYNC ENGINE</h3>
            <FormInput label="GAS Gateway Webhook" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/..." />
            <div className="space-y-5 pt-8">
              <button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-4xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-5 active:scale-95">
                <RefreshCw size={22} /> ESTABLISH CLOUD LINK
              </button>
              <button onClick={() => setIsDbSettingsOpen(false)} className="w-full text-slate-300 font-black text-[12px] uppercase hover:text-rose-500 transition-colors tracking-widest active:scale-95">ABORT CONNECTION</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[5.5rem] p-16 w-full max-w-sm space-y-14 shadow-5xl relative overflow-hidden text-center">
            <div className="p-12 bg-emerald-600 text-white rounded-[3.5rem] inline-block shadow-5xl">
              <Lock size={64} />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black uppercase tracking-tight text-slate-900">ROOT IDENTITY</h3>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.35em]">ADMINISTRATOR ACCESS ONLY</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-12">
              <div className="space-y-7">
                <FormInput label="Security Identifier" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} />
                <FormInput label="Access Credential" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} />
              </div>
              {loginError && <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest animate-bounce">{loginError}</p>}
              <div className="space-y-6 pt-5">
                <button type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-xs uppercase shadow-5xl hover:bg-emerald-700 transition-all active:scale-95">VERIFY & PROCEED</button>
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-300 font-black text-[12px] uppercase hover:text-slate-900 transition-colors tracking-widest active:scale-95">EXIT GATEWAY</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// --- COMPONENTS & HELPERS ---
const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-7 px-12 py-7 rounded-[3.5rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-4xl scale-[1.06] z-10' : 'text-slate-500 border-transparent hover:bg-slate-800/90 hover:text-slate-200'}`}>
    <Icon size={26} className={active ? 'animate-pulse' : ''} /> 
    <span className="text-[15px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = { 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-600/5', 
    teal: 'bg-teal-50 text-teal-600 border-teal-100 shadow-teal-600/5', 
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-600/5', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-600/5' 
  };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-3xl transition-all hover:shadow-5xl hover:-translate-y-2.5 text-left relative z-10">
      <div className={`p-6 rounded-2xl inline-block mb-10 ${themes[color] || themes.emerald} border shadow-inner`}><Icon size={32} /></div>
      <p className="text-[12px] font-black text-slate-400 uppercase mb-4 tracking-[0.25em] text-left">{title}</p>
      <h4 className="text-5xl font-black text-slate-900 truncate tracking-tighter text-left">{value}</h4>
      <p className="text-[11px] text-slate-400 font-black uppercase mt-5 opacity-70 text-left tracking-wide">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; required?: boolean; icon?: any; readOnly?: boolean }> = ({ label, value, onChange, type = "text", placeholder, required, icon: Icon, readOnly = false }) => (
  <div className="space-y-5 text-left">
    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8 flex items-center gap-4">
        {Icon && <Icon size={16} className="text-emerald-600" />}
        {label}
    </label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={e => !readOnly && onChange?.(e.target.value)} 
      placeholder={placeholder} 
      required={required} 
      readOnly={readOnly}
      className={`w-full px-9 py-7 ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-black' : 'bg-slate-50 border-slate-100 focus:border-emerald-600 focus:bg-white'} border-2 rounded-[2.5rem] text-[16px] font-bold outline-none transition-all shadow-inner`} 
    />
  </div>
);

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-5 text-left">
    <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em] ml-8">{label}</label>
    <div className="relative">
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-9 py-7 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-[16px] font-bold outline-none appearance-none cursor-pointer focus:border-emerald-600 focus:bg-white shadow-inner transition-all"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronRight size={24} className="absolute right-9 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean; icon?: React.ReactNode }> = ({ label, value, mono = false, small = false, icon }) => (
  <div className="bg-slate-50/50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm text-left group hover:bg-white hover:border-emerald-100 transition-all active:scale-[0.98] cursor-default">
    <p className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
      <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-emerald-400 transition-colors"></div>
      {label}
      {icon && <span className="ml-auto text-emerald-400">{icon}</span>}
    </p>
    <p className={`font-black text-slate-800 truncate leading-none ${mono ? 'font-mono text-[16px] tracking-tight' : small ? 'text-[13px]' : 'text-[15px]'}`}>
      {value || '-'}
    </p>
  </div>
);

export default App;