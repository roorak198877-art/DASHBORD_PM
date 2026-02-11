
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
import * as XLSX from 'xlsx';

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
      animate={{ 
        rotate: 360,
        y: [0, -10, 0] 
      }} 
      transition={{ 
        rotate: { repeat: Infinity, duration: 20, ease: "linear" },
        y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
      }}
      className="absolute -top-10 -right-10 text-emerald-900"
    >
      <Settings size={200} strokeWidth={1} />
    </motion.div>
    
    <motion.div 
      animate={{ 
        rotate: -360,
        y: [0, 15, 0] 
      }} 
      transition={{ 
        rotate: { repeat: Infinity, duration: 15, ease: "linear" },
        y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
      }}
      className="absolute top-20 -right-20 text-emerald-700"
    >
      <Settings size={150} strokeWidth={1} />
    </motion.div>
    
    <motion.div 
      animate={{ 
        rotate: 360,
        x: [0, 10, 0]
      }} 
      transition={{ 
        rotate: { repeat: Infinity, duration: 25, ease: "linear" },
        x: { repeat: Infinity, duration: 6, ease: "easeInOut" }
      }}
      className="absolute top-48 right-10 text-emerald-600"
    >
      <Settings size={100} strokeWidth={1} />
    </motion.div>
  </div>
);

// กฎเหล็ก: จัดการ Formatting วันที่ (ตัดค่าส่วนเกิน T00:00...Z และแสดงผล DD-MM-YYYY)
const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    const cleanDate = String(dateStr).split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return cleanDate;
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
  
  const [isSyncing, setIsSyncing] = useState(!!(localStorage.getItem('pm_sheet_url') || DEFAULT_GAS_URL));
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) setPublicViewId(viewId.trim());
  }, []);

  useEffect(() => {
    if (publicViewId) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [publicViewId]);

  useEffect(() => { localStorage.setItem('pm_dashboard_data', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('pm_sheet_url', sheetUrl); }, [sheetUrl]);
  useEffect(() => { if (sheetUrl) fetchFromSheet(true); }, [sheetUrl]);

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
              date: row[1], // Column B
              nextPmDate: row[2], // Column C
              department: row[3], // Column D
              device: row[4], // Column E
              personnel: row[5], // Column F
              status: row[6], // Column G
              activity: row[7], // Column H
              computerName: row[8], // Column I
              computerUser: row[9], // Column J (Login)
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

  // --- ASSET TAG VIEW (PUBLIC SCAN VIEW) ---
  if (publicViewId) {
    const item = items.find(i => i && i.id && String(i.id).trim().toLowerCase() === String(publicViewId).trim().toLowerCase());
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 relative overflow-hidden">
        <SpinningGears />
        {item ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-3xl border border-slate-200 overflow-hidden relative z-10 text-left">
            <div className={`p-10 text-white ${item.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                  <ShieldCheck size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight">Verified Asset</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{COMPANY_NAME}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              {item.imageUrl && (
                <div className="relative group">
                  <img src={item.imageUrl} className="w-full h-52 object-cover rounded-3xl border-4 border-slate-50 shadow-lg" alt="proof" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <DataField label="Asset ID" value={item.id} mono />
                <DataField label="Department" value={item.department} />
                <DataField label="Assigned User" value={item.personnel || '-'} />
                <DataField label="Hostname" value={item.computerName || '-'} />
                
                <DataField label="Last PM (B)" value={formatDateDisplay(item.date)} />
                <DataField label="Next PM (C)" value={formatDateDisplay(item.nextPmDate)} />
                
                <DataField label="Status" value={item.status} />
                <DataField label="Technician (O)" value={item.technician || '-'} />
                
                <DataField 
                  label="Login (J)" 
                  value={isUnlocked ? (item.computerUser || '-') : '********'} 
                  mono={isUnlocked} 
                  icon={isUnlocked ? <Eye size={10}/> : <EyeOff size={10}/>}
                />
                <DataField 
                  label="Password (K)" 
                  value={isUnlocked ? (item.password || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={10}/> : <EyeOff size={10}/>}
                />
                <DataField 
                  label="Server Pass (L)" 
                  value={isUnlocked ? (item.serverPassword || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={10}/> : <EyeOff size={10}/>}
                />
                <DataField 
                  label="Antivirus (M)" 
                  value={isUnlocked ? (item.antivirus || '-') : '********'} 
                  mono={isUnlocked}
                  icon={isUnlocked ? <Eye size={10}/> : <EyeOff size={10}/>}
                />
              </div>

              {!isUnlocked && (
                <form onSubmit={handlePinSubmit} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter PIN to Reveal Sensitive Data</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="****"
                      className={`flex-1 px-4 py-3 rounded-xl border-2 text-center font-black tracking-[1em] outline-none transition-all ${pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-emerald-600'}`}
                    />
                    <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Unlock</button>
                  </div>
                  {pinError && <p className="text-[9px] font-bold text-rose-500 text-center uppercase">Incorrect Security PIN</p>}
                </form>
              )}

              {item.location && (
                <div className="p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center gap-3">
                  <MapPin size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fixed Location</p>
                    <p className="text-xs font-bold text-emerald-900">{item.location}</p>
                  </div>
                </div>
              )}

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Maintenance Checklist (H)</p>
                <div className="space-y-2">
                  {String(item.activity || '').split(' | ').filter(x => x).map((act, i) => (
                    <p key={i} className="text-[10px] font-bold text-slate-700 flex items-start gap-2 leading-relaxed">
                      <CheckCircle size={10} className="text-emerald-500 mt-0.5" /> {act}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl max-w-sm relative z-10">
            <AlertCircle size={48} className="text-rose-500 mx-auto mb-6" />
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">Invalid Asset ID</h2>
            <p className="text-slate-400 text-sm">ขออภัย ไม่พบข้อมูลรหัสทรัพย์สินนี้ในระบบ</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] relative font-sans overflow-x-hidden text-left">
      <SpinningGears />
      
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[300] px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-3xl font-black text-[11px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      <div className="md:hidden sticky top-0 z-[100] bg-slate-900 px-6 py-4 flex items-center justify-between shadow-xl no-print">
        <BrandIdentity size="sm" />
        <div className="flex gap-2">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition-colors">
              <Menu size={20} />
           </button>
           <button onClick={() => setIsLoginModalOpen(true)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg">
              <Lock size={18} />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '-100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[150] bg-slate-900 p-8 flex flex-col gap-10 no-print md:hidden"
          >
            <div className="flex justify-between items-center">
              <BrandIdentity size="lg" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            <nav className="space-y-4 flex-1 overflow-y-auto pt-4">
              <NavBtn icon={Monitor} label="Computer" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <NavBtn icon={PrinterIcon} label="Printer" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <div className="h-px bg-slate-800/50 my-8 mx-4"></div>
              <NavBtn icon={FileText} label="Full Records" active={activeTab === 'table'} onClick={() => { setActiveTab('table'); setIsMobileMenuOpen(false); }} />
              
              <button onClick={() => { fetchFromSheet(); setIsMobileMenuOpen(false); }} disabled={isSyncing} className="w-full flex items-center gap-4 px-7 py-5 text-emerald-400 bg-emerald-950/20 rounded-[2.5rem] font-black text-[11px] uppercase border border-emerald-900/50 mt-10 hover:bg-emerald-900/40 transition-all shadow-lg">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync Cloud
              </button>
            </nav>
            <div className="space-y-4">
              <button onClick={() => { setIsDbSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-5 text-slate-400 font-black text-[10px] uppercase border border-slate-800 rounded-2xl flex items-center justify-center gap-2">
                <Settings size={14} /> Database Settings
              </button>
              {userRole === 'admin' ? (
                <button onClick={() => { setUserRole('general'); setIsMobileMenuOpen(false); }} className="w-full py-5 bg-rose-950/30 text-rose-500 rounded-[2rem] font-black text-[11px] uppercase border border-rose-900/30">Admin Logout</button>
              ) : (
                <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase shadow-2xl">Admin Auth</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-slate-900 p-8 flex-col gap-10 sticky top-0 h-screen z-20 no-print shadow-2xl relative overflow-hidden text-left">
        <div className="cursor-pointer relative z-10" onClick={() => setActiveTab('dashboard')}><BrandIdentity size="lg" /></div>
        <nav className="space-y-3 flex-1 relative z-10">
          <NavBtn icon={Monitor} label="Computer" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printer" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-6 mx-4"></div>
          <NavBtn icon={FileText} label="Full Records" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-4 px-7 py-5 text-emerald-400 bg-emerald-950/20 rounded-[2.5rem] font-black text-[11px] uppercase border border-emerald-900/50 mt-6 hover:bg-emerald-900/40 transition-all shadow-lg">
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync Cloud
          </button>
        </nav>
        
        <div className="space-y-4 relative z-10">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase border border-slate-800 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><Settings size={14} /> Database Settings</button>
          {userRole === 'admin' ? (
            <button onClick={() => setUserRole('general')} className="w-full py-5 bg-rose-950/30 text-rose-500 rounded-[2rem] font-black text-[11px] uppercase border border-rose-900/30">Admin Logout</button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase shadow-2xl hover:bg-emerald-50 transition-all">Admin Auth</button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-14 overflow-y-auto w-full mb-28 md:mb-0 relative z-10 text-left">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 no-print">
          <div className="text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{pmModule} PM System</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{COMPANY_NAME} • Professional Monitoring</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <button onClick={() => { 
              if(userRole !== 'admin') return setIsLoginModalOpen(true);
              setEditingItem({ id: '', date: new Date().toISOString(), department: DEPARTMENTS[0], device: pmModule === 'computer' ? 'Computer' : 'Printer', personnel: '', technician: '', status: 'Pending', activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '', startDate: '', warrantyExpiry: '', spareField: '', imageUrl: '', assetName: '', model: '', serialNumber: '', location: '' }); 
              setIsModalOpen(true); 
            }} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-xl text-[12px] uppercase hover:scale-95 transition-all">
              <Plus size={18} /> New Record
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={Layers} title="Total Assets" value={stats.total.toString()} subtitle="Managed Units" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency" value={`${stats.completionRate}%`} subtitle="Maintenance rate" color="teal" />
                <MetricCard icon={ShieldAlert} title="Cloud Sync" value={isCloudConnected ? "Online" : "Offline"} subtitle="Database link" color={isCloudConnected ? "emerald" : "rose"} />
                <MetricCard icon={Activity} title="Status" value="Live" subtitle="System operational" color="amber" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <h3 className="text-lg font-black mb-10 uppercase flex items-center gap-3 tracking-tighter"><Monitor size={20} className="text-emerald-600" /> Dept Workload</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.deptStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} width={140} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={14}>
                        {stats.deptStats.map((_, i) => (<Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <h3 className="text-lg font-black mb-10 uppercase flex items-center gap-3 tracking-tighter"><TrendingUp size={20} className="text-emerald-600" /> Activity Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.dailyTrend}>
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={5} fill="#10b98120" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" variants={containerVariants} initial="hidden" animate="show" className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 overflow-x-auto transition-all text-left">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-8 text-left">Asset Identifier</th>
                    <th className="px-10 py-8 text-left">Status</th>
                    <th className="px-10 py-8 text-left">Assigned User</th>
                    <th className="px-10 py-8 text-left">Date</th>
                    <th className="px-10 py-8 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-8 text-left">
                        <div>
                          <p className="font-black text-slate-800 text-[15px]">{it.assetName || it.computerName || it.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{it.id} | {it.model || '-'}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-left">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${it.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                          {it.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-sm font-extrabold text-slate-700 text-left">{it.personnel || '-'}</td>
                      <td className="px-10 py-8 text-xs font-black text-slate-600 text-left">{formatDateDisplay(it.date)}</td>
                      <td className="px-10 py-8 text-left">
                        <div className="flex gap-3">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-3 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 hover:scale-110 transition-transform"><QrCode size={18} /></button>
                          {userRole === 'admin' && (
                            <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-3 text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-100 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-2">
                              <Edit2 size={18} />
                              <span className="text-[10px] font-black uppercase">แก้ไข</span>
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

      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-sm overflow-y-auto pt-10 no-print">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl text-left">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                  <Wrench size={22} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase tracking-tight">{editingItem.id ? 'Modify Digital Asset Record' : 'Create New Asset Record'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Management Portal • {editingItem.id || 'Draft'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 transition-all"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-12 overflow-y-auto pb-24 text-left no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div className="md:col-span-1 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2"><ImageIcon size={14} /> Documentation Photo (Column P)</label>
                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden group relative shadow-inner">
                       {editingItem.imageUrl ? (
                         <>
                           <img src={editingItem.imageUrl} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-3 bg-emerald-600 text-white rounded-full hover:scale-110 transition-transform"><Camera size={24} /></button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-emerald-600 rounded-full hover:scale-110 transition-transform"><Upload size={24} /></button>
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center gap-6 text-center">
                            <div className="flex gap-4">
                               <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-5 bg-white text-emerald-600 rounded-3xl shadow-xl hover:bg-emerald-50 transition-colors"><Camera size={32} /></button>
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="p-5 bg-white text-emerald-600 rounded-3xl shadow-xl hover:bg-emerald-50 transition-colors"><Upload size={32} /></button>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capture or Upload</span>
                         </div>
                       )}
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </div>
                 </div>

                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <FormInput label="Asset ID (Column A)" icon={Hash} value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} required placeholder="TC-XXXX-XXXX" />
                    <FormInput label="PM Date (Column B)" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} />
                    <FormInput label="Next PM Date (Column C)" value={formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))} readOnly icon={Calendar} />
                    <FormInput label="Asset Name (Common Name)" icon={Tag} value={editingItem.assetName || ''} onChange={val => setEditingItem({...editingItem, assetName: val})} placeholder="Ex: Finance Laptop" />
                    <FormInput label="Model / Spec" icon={Cpu} value={editingItem.model || ''} onChange={val => setEditingItem({...editingItem, model: val})} placeholder="Ex: Dell Latitude 5420" />
                    <FormInput label="Serial Number (S/N)" value={editingItem.serialNumber || ''} onChange={val => setEditingItem({...editingItem, serialNumber: val})} placeholder="Ex: ABC123XYZ" />
                    <FormInput label="Location (Area)" icon={MapPin} value={editingItem.location || ''} onChange={val => setEditingItem({...editingItem, location: val})} placeholder="Ex: Building 2, Floor 3" />
                    <FormSelect label="Department Unit (Column D)" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                    <FormSelect label="Category (Column E)" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                 </div>
              </div>

              <div className="space-y-6 text-left">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Login & Security Controls</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
                   <FormInput label="Login User (Column J)" icon={Lock} value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} placeholder="Login Name" />
                   <FormInput label="Password (Column K)" icon={Key} type="password" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} />
                   <FormInput label="Server Pass (Column L)" icon={Key} type="password" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} />
                   <FormInput label="Antivirus (Column M)" icon={ShieldCheck} value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} placeholder="Protection Software" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                 <FormInput label="Assigned End-User (Column F)" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} placeholder="ชื่อพนักงาน" />
                 <FormInput label="Responsible Technician (Column O)" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} placeholder="ชื่อช่างผู้ตรวจเช็ค" />
                 <FormInput label="System Hostname (Column I)" value={editingItem.computerName || ''} onChange={val => setEditingItem({...editingItem, computerName: val})} placeholder="Ex: LAPTOP-ADMIN01" />
              </div>

              <div className="space-y-6 text-left">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-slate-400 rounded-full"></div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lifecycle & Operation</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                   <FormInput label="Start of Operation" type="date" value={toISODate(editingItem.startDate)} onChange={val => setEditingItem({...editingItem, startDate: val})} />
                   <FormInput label="Warranty Expiry" type="date" value={toISODate(editingItem.warrantyExpiry)} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                   <FormSelect label="Execution Status (Column G)" value={editingItem.status} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                </div>
                <FormInput label="Additional Remarks (Spare)" value={editingItem.spareField || ''} onChange={val => setEditingItem({...editingItem, spareField: val})} placeholder="หมายเหตุเพิ่มเติม..." />
              </div>

              <div className="space-y-6 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2"><CheckSquare size={14} /> Quality Maintenance Checklist (Column H)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = String(editingItem.activity || '').includes(act);
                    return (
                      <label key={i} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${isChecked ? 'bg-white border-emerald-500 shadow-md translate-x-1' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => {
                          const currentActs = String(editingItem.activity || '').split(' | ').filter(x => x);
                          const newActs = isChecked ? currentActs.filter(a => a !== act) : [...currentActs, act];
                          setEditingItem({...editingItem, activity: newActs.join(' | ')});
                        }} />
                        <div className={`p-1.5 rounded-lg transition-colors ${isChecked ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>
                          {isChecked ? <CheckCircle size={16} /> : <Square size={16} />}
                        </div>
                        <span className={`text-xs font-bold ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100/50 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner text-left">
                <div className="text-left w-full md:w-auto">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Next Scheduled Maintenance Cycle Projection</p>
                  <p className="text-3xl font-black text-emerald-900">{editingItem.status === 'Completed' ? formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device)) : 'Cycle Valuation Pending'}</p>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase mt-2 opacity-60 flex items-center gap-2"><Info size={10} /> Auto-calculated upon completion status</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none px-10 py-5 bg-white text-slate-400 rounded-[2rem] font-black text-xs uppercase hover:text-rose-500 transition-colors border border-slate-100 shadow-sm">Discard</button>
                   <button 
                     type="submit" 
                     className="flex-1 md:flex-none px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                   >
                     <Database size={20} /> Establish & Cloud Sync
                   </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] shadow-4xl w-full max-w-sm p-10 text-center relative overflow-hidden">
             <button onClick={() => setIsQrModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
             <h3 className="text-xl font-black mb-8 uppercase tracking-tight text-slate-900">Asset Identity Card</h3>
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 inline-block mb-10 shadow-inner relative group">
                <div className="absolute inset-0 bg-emerald-600/5 scale-110 blur-2xl opacity-0 group-hover:opacity-100 transition-all"></div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${appBaseUrl}?view=${qrItem.id}`)}`} alt="QR" className="w-44 h-44 rounded-xl relative z-10" />
             </div>
             <button 
                onClick={() => setPublicViewId(qrItem.id)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                <Monitor size={16} /> Test View (Verification Mode)
              </button>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] p-12 w-full max-w-md space-y-8 shadow-4xl relative overflow-hidden text-center">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Cloud Integration</h3>
            <FormInput label="GAS Web App Endpoint" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/macros/s/..." />
            <div className="space-y-4 pt-4">
              <button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                <RefreshCw size={16} /> Connect Database
              </button>
              <button onClick={() => setIsDbSettingsOpen(false)} className="w-full text-slate-300 font-black text-[10px] uppercase hover:text-rose-500 transition-colors">Close Portal</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-2xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4rem] p-12 w-full max-w-sm space-y-10 shadow-4xl relative overflow-hidden text-center">
            <div className="p-8 bg-emerald-600 text-white rounded-[2.5rem] inline-block shadow-3xl">
              <Lock size={44} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Secure Access</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
                <FormInput label="Admin Identifier" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} />
                <FormInput label="Security Credential" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} />
              </div>
              {loginError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-bounce">{loginError}</p>}
              <div className="space-y-4 pt-4">
                <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-emerald-700 transition-all">Verify & Login</button>
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-300 font-black text-[10px] uppercase hover:text-slate-900 transition-colors">Discard</button>
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
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[2.5rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl scale-[1.03] z-10' : 'text-slate-500 border-transparent hover:bg-slate-800/80 hover:text-slate-200'}`}>
    <Icon size={22} className={active ? 'animate-pulse' : ''} /> 
    <span className="text-[13px] font-black uppercase tracking-tight">{label}</span>
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
    <motion.div variants={bouncyItem} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 text-left relative z-10">
      <div className={`p-4 rounded-2xl inline-block mb-6 ${themes[color] || themes.emerald} border shadow-inner`}><Icon size={24} /></div>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest text-left">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 truncate tracking-tighter text-left">{value}</h4>
      <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-2 opacity-70 text-left">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; required?: boolean; icon?: any; readOnly?: boolean }> = ({ label, value, onChange, type = "text", placeholder, required, icon: Icon, readOnly = false }) => (
  <div className="space-y-3 text-left">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-5 flex items-center gap-2">
        {Icon && <Icon size={12} className="text-emerald-600" />}
        {label}
    </label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={e => !readOnly && onChange?.(e.target.value)} 
      placeholder={placeholder} 
      required={required} 
      readOnly={readOnly}
      className={`w-full px-7 py-5 ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-emerald-600 focus:bg-white'} border-2 rounded-[1.5rem] text-[14px] font-bold outline-none transition-all shadow-inner`} 
    />
  </div>
);

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-3 text-left">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-5">{label}</label>
    <div className="relative">
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-[14px] font-bold outline-none appearance-none cursor-pointer focus:border-emerald-600 focus:bg-white shadow-inner transition-all"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronRight size={18} className="absolute right-7 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean; icon?: React.ReactNode }> = ({ label, value, mono = false, small = false, icon }) => (
  <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm text-left group hover:bg-white hover:border-emerald-100 transition-all">
    <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
      <div className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-emerald-400 transition-colors"></div>
      {label}
      {icon && <span className="ml-auto">{icon}</span>}
    </p>
    <p className={`font-black text-slate-800 truncate leading-none ${mono ? 'font-mono text-[14px] tracking-tight' : small ? 'text-[11px]' : 'text-[13px]'}`}>
      {value || '-'}
    </p>
  </div>
);

export default App;
