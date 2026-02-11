import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area
} from 'recharts';
import { 
  CheckCircle, Monitor, TrendingUp, FileText, Layers, Edit2, Plus, X, Trash2,
  CheckSquare, Square, RefreshCw, Settings, Wrench, QrCode, Share2, 
  Activity, Lock, PrinterIcon, ShieldAlert, Loader2, ChevronRight, 
  Download, Camera, Image as ImageIcon, Upload, Database, Globe, Eye, EyeOff,
  AlertCircle, Calendar, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_PM_DATA, DEPARTMENTS, DEVICE_STATUS_OPTIONS, COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES } from './constants';
import { PMItem } from './types';
import * as XLSX from 'xlsx';

// --- CONFIGURATION ---
const COMPANY_NAME = 'TCITRENDGROUP'; 
const LOGO_TEXT = 'T.T.g';
const DEFAULT_GAS_URL = ''; 
const SECURITY_PIN = '1234';
const REDIRECT_URL = 'https://www.google.com';

const CHART_COLORS = ['#065f46', '#0f172a', '#059669', '#1e293b', '#10b981', '#334155', '#34d399', '#064e3b'];
const bouncySpring = { type: "spring" as const, stiffness: 400, damping: 25 };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const bouncyItem = { hidden: { opacity: 0, scale: 0.8, y: 30 }, show: { opacity: 1, scale: 1, y: 0, transition: bouncySpring } };
const modalAnimate = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: bouncySpring },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    
    // กฎเหล็ก: จัดรูปแบบวันที่เป็น d-m-yyyy (เช่น 11-2-2026) และตัดเวลาออกอย่างสมบูรณ์
    const day = d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Asia/Bangkok' });
    const month = d.toLocaleDateString('en-GB', { month: 'numeric', timeZone: 'Asia/Bangkok' });
    const year = d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Asia/Bangkok' });
    
    return `${day}-${month}-${year}`;
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
    <motion.div className="flex items-center gap-3 relative z-10" animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -translate-x-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute text-white/10"><Settings size={isLg ? 80 : 50} strokeWidth={1} /></motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute text-white/15 translate-x-4 -translate-y-3"><Settings size={isLg ? 60 : 40} strokeWidth={1} /></motion.div>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-emerald-600 shadow-sm border border-emerald-500" style={{ width: isLg ? 35 : 30, height: isLg ? 35 : 30 }}><span className="font-black text-[12px] text-white tracking-tighter">{LOGO_TEXT}</span></div>
        <div className="flex flex-col">
          <h1 className={`${isLg ? 'text-lg' : 'text-sm'} font-black text-white tracking-tighter leading-none uppercase`}>{COMPANY_NAME}</h1>
          {isLg && <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">PM System Cloud</p>}
        </div>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [pmModule, setPmModule] = useState<'computer' | 'printer'>('computer');
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const [isAdminSession, setIsAdminSession] = useState(false); 
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) setPublicViewId(viewId.trim());
  }, []);

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
    filteredItems.forEach(item => { if(item.date) { const d = toISODate(item.date); trendMap[d] = (trendMap[d] || 0) + 1; } });
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
        item.startDate || '', item.warrantyExpiry || '', item.spareField || ''
      ];

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ values: payload }),
      });
      setSyncMessage("บันทึกสำเร็จ (Cloud Sync)");
      setIsCloudConnected(true);
    } catch (err) { 
      setSyncMessage("ล้มเหลว! ตรวจสอบ URL หรืออินเทอร์เน็ต"); 
      setIsCloudConnected(false);
    } finally { setTimeout(() => setSyncMessage(null), 3000); }
  };

  const fetchFromSheet = async (silent = false) => {
    if (!sheetUrl) return; 
    setIsSyncing(true);
    try {
      const res = await fetch(`${sheetUrl}?_t=${Date.now()}`);
      if (res.ok) { 
        const data = await res.json(); 
        if (Array.isArray(data)) {
          const mapped: PMItem[] = data.map(row => {
            if (!row || !row[0]) return null;
            return {
              id: String(row[0]).trim(), date: row[1], nextPmDate: row[2], department: row[3],
              device: row[4], personnel: row[5], status: row[6], activity: row[7],
              computerName: row[8], computerUser: row[9], password: row[10],
              serverPassword: row[11], antivirus: row[12], imageUrl: row[13], technician: row[14],
              startDate: row[15], warrantyExpiry: row[16], spareField: row[17],
              deviceStatus: row[7]?.includes('Broken') ? 'Broken' : 'Ready'
            };
          }).filter(i => i !== null) as PMItem[];
          
          setItems(mapped); 
          setIsCloudConnected(true);
          if (!silent) setSyncMessage('เชื่อมต่อ Cloud สำเร็จ');
        } else {
          setIsCloudConnected(false);
          if (!silent) setSyncMessage('รูปแบบข้อมูล Cloud ไม่ถูกต้อง');
        }
      } else { 
        setIsCloudConnected(false);
        if (!silent) setSyncMessage('เชื่อมต่อ Cloud ล้มเหลว (404/500)');
      }
    } catch (err) { 
      setIsCloudConnected(false);
      if (!silent) setSyncMessage('ไม่สามารถเข้าถึง Cloud ได้');
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 2000); 
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.id) return alert('กรุณาระบุ Asset ID (A)');
    
    let finalItem = { ...editingItem, id: String(editingItem.id).trim() };
    if (finalItem.status === 'Completed') {
      finalItem.nextPmDate = calculateNextPM(finalItem.date, finalItem.device);
    } else {
      finalItem.nextPmDate = ''; 
    }
    
    setItems(prev => {
      const exists = prev.find(i => String(i.id).trim() === finalItem.id);
      return exists ? prev.map(i => String(i.id).trim() === finalItem.id ? finalItem : i) : [...prev, finalItem];
    });
    
    setIsModalOpen(false); 
    setEditingItem(null); 
    await pushToCloud(finalItem);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'tci@1234') {
      setUserRole('admin'); setIsLoginModalOpen(false); setLoginForm({ username: '', password: '' });
      setSyncMessage("สิทธิ์ Admin เปิดใช้งาน"); setTimeout(() => setSyncMessage(null), 3000);
    } else { setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
  };

  const handleRequestUnlock = () => {
    const pin = window.prompt("กรุณาใส่รหัส Admin PIN (1234):");
    if (pin === SECURITY_PIN) { 
      setIsAdminSession(true); 
      setSyncMessage("ปลดล็อกสำเร็จ"); 
      setTimeout(() => setSyncMessage(null), 3000); 
    }
    else if (pin !== null) alert("PIN ไม่ถูกต้อง");
  };

  const exportToExcel = () => {
    const exportData = filteredItems.map(item => ({
      'ID': item.id, 'Date': formatDateDisplay(item.date), 'Next PM': formatDateDisplay(item.nextPmDate),
      'Dept': item.department, 'Device': item.device, 'User': item.personnel, 'Status': item.status,
      'Activity': item.activity, 'Host': item.computerName, 'Login': item.computerUser, 'Tech': item.technician
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM_Report");
    XLSX.writeFile(wb, `${COMPANY_NAME}_PM_Report.xlsx`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingItem({ ...editingItem, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handlePublicClose = () => { window.location.href = REDIRECT_URL; };

  if (publicViewId) {
    const item = items.find(i => i.id?.toString().trim() === publicViewId.trim());
    
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 select-none">
        <button onClick={handlePublicClose} className="fixed top-6 left-6 z-[100] p-4 bg-white rounded-2xl shadow-xl text-slate-600 border border-slate-200"><X size={24} /></button>
        
        {item ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[3rem] shadow-3xl border border-slate-200 overflow-hidden">
            <div className={`p-10 text-white ${item.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4 mb-4"><BrandIdentity size="sm" /><h2 className="text-2xl font-black uppercase ml-2">Tag</h2></div>
              <p className="text-[11px] opacity-70 font-bold uppercase tracking-widest">{COMPANY_NAME} • Secure Link</p>
            </div>
            <div className="p-8 space-y-6">
              {item.imageUrl && <div className="w-full h-56 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl"><img src={item.imageUrl} alt="Asset" className="w-full h-full object-cover" /></div>}
              <div className="grid grid-cols-2 gap-4">
                <DataField label="ID (A)" value={item.id} mono />
                <DataField label="Hostname (I)" value={item.computerName || 'N/A'} />
                <DataField label="Last PM (B)" value={formatDateDisplay(item.date)} small />
                <DataField label="Next PM (C)" value={formatDateDisplay(item.nextPmDate)} small />
                <DataField label="Department (D)" value={item.department} />
                <DataField label="User (F)" value={item.personnel} />
                <DataField label="Technician (O)" value={item.technician || '-'} />
              </div>
              <div className="space-y-3 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase text-center">Verified PM Checklist (H)</p>
                <div className="space-y-1">
                  {item.activity && String(item.activity).split(' | ').map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 py-1 border-b border-slate-200/50 last:border-none"><CheckCircle size={12} className="text-emerald-500" /><span>{act}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : isSyncing ? (
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-emerald-600 mx-auto mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-[11px]">กำลังค้นหาข้อมูล Asset ใน Cloud Database...</p>
          </div>
        ) : (
          <div className="text-center p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100 max-w-sm">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">ไม่พบข้อมูล Asset</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-6">Asset ID: {publicViewId}<br/>กรุณาตรวจสอบว่าข้อมูลได้ถูกซิงค์ลง Cloud แล้ว หรือ Asset ID ถูกต้อง</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              <RefreshCw size={16} /> รีเฟรชเพื่อลองใหม่
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative font-sans overflow-x-hidden">
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[200] px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-3xl font-black text-[11px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      <div className="md:hidden sticky top-0 z-50 bg-slate-900 px-6 py-4 flex items-center justify-between shadow-2xl border-b border-slate-800 no-print">
        <div className="cursor-pointer" onClick={() => { setActiveTab('dashboard'); setPmModule('computer'); }}><BrandIdentity size="sm" /></div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isCloudConnected ? 'bg-emerald-50 shadow-[0_0_8px_#10b981]' : isCloudConnected === false ? 'bg-red-500' : 'bg-slate-600 animate-pulse'}`}></div>
          <button onClick={() => setIsLoginModalOpen(true)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg"><Lock size={18} /></button>
        </div>
      </div>

      <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 p-8 flex-col gap-10 sticky top-0 h-screen z-10 no-print shadow-2xl">
        <div className="cursor-pointer" onClick={() => { setActiveTab('dashboard'); setPmModule('computer'); }}><BrandIdentity size="lg" /></div>
        <nav className="space-y-3 flex-1">
          <NavBtn icon={Monitor} label="Computer" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printer" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-6 mx-4"></div>
          <NavBtn icon={FileText} label="Full Records" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <div className="px-6 py-5 mt-6 bg-slate-800/40 rounded-[2rem] border border-slate-700/30">
            <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Cloud Sync</span><div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-slate-600'}`}></div></div>
            <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center justify-center gap-3 py-3 text-emerald-400 bg-emerald-950/20 rounded-xl font-black text-[10px] uppercase border border-emerald-800/40 hover:bg-emerald-900/30 transition-all shadow-lg">
              {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} <span>Sync Database</span>
            </button>
          </div>
        </nav>
        <div className="space-y-4">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all"><Database size={14} /> Link Database</button>
          {userRole === 'general' ? <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase shadow-2xl hover:bg-emerald-500">Admin Auth</button> : <button onClick={() => { setUserRole('general'); setIsAdminSession(false); }} className="w-full py-5 bg-rose-950/40 text-rose-500 rounded-[2rem] font-black text-[11px] uppercase border border-rose-900/30">Logout</button>}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-around z-[100] pb-safe no-print shadow-3xl">
          <button onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} className={`p-4 rounded-2xl transition-all ${pmModule === 'computer' && activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'text-slate-500'}`}><Monitor size={24} /></button>
          <button onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} className={`p-4 rounded-2xl transition-all ${pmModule === 'printer' && activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'text-slate-500'}`}><PrinterIcon size={24} /></button>
          <button onClick={() => setActiveTab('table')} className={`p-4 rounded-2xl transition-all ${activeTab === 'table' ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'text-slate-500'}`}><FileText size={24} /></button>
          <button onClick={() => setIsLoginModalOpen(true)} className={`p-4 rounded-2xl text-slate-500`}><Lock size={24} /></button>
      </nav>

      <main className="flex-1 p-4 md:p-14 overflow-y-auto w-full mb-28 md:mb-0 bg-[#f8fafc]">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 no-print">
          <div>
            <div className="flex items-center gap-4 mb-2"><div className="p-3 bg-emerald-600 text-white rounded-[1.25rem] shadow-xl"><Wrench size={24} /></div><h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight capitalize">{pmModule} PM Dashboard</h2></div>
            <p className="text-slate-400 font-semibold text-xs md:text-sm">{COMPANY_NAME} • Professional IT Dashboard • GMT+7</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <button onClick={() => { 
                const dev = pmModule === 'computer' ? 'Computer' : 'Printer';
                setEditingItem({ 
                  id: '', 
                  date: new Date().toISOString(), 
                  department: DEPARTMENTS[0], 
                  device: dev, 
                  personnel: '', 
                  technician: '', 
                  status: 'Pending', 
                  activity: '', 
                  computerName: '', 
                  computerUser: '',
                  password: '',
                  serverPassword: '',
                  antivirus: '',
                  imageUrl: '',
                  startDate: '',
                  warrantyExpiry: '',
                  spareField: ''
                });
                setIsModalOpen(true);
            }} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-[1.5rem] font-black shadow-2xl text-[12px] uppercase hover:scale-95 transition-all"><Plus size={20} /> Add Record</button>
            <button onClick={exportToExcel} className="flex-1 lg:flex-none p-4 text-slate-700 bg-white rounded-[1.5rem] border border-slate-200 shadow-xl font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"><Download size={18} /> Export Excel</button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-8 md:space-y-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                <MetricCard icon={Layers} title="Total Assets" value={stats.total.toString()} subtitle="Managed Units" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency" value={`${stats.completionRate}%`} subtitle="Completion" color="teal" />
                <MetricCard icon={ShieldAlert} title="Status" value={isCloudConnected ? "Live" : "No Link"} subtitle="Cloud Sync Status" color={isCloudConnected ? "emerald" : "rose"} />
                <MetricCard icon={Activity} title="Workload" value={stats.total > 0 ? "Active" : "Idle"} subtitle="System Analysis" color="amber" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                <motion.div variants={bouncyItem} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-4 mb-8"><Activity size={24} className="text-emerald-600" /><h3 className="text-xl font-black text-slate-800">Unit Distribution (Dept)</h3></div>
                  <ResponsiveContainer width="100%" height={320}><BarChart data={stats.deptStats} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} width={140} /><Tooltip cursor={{ fill: 'rgba(5, 150, 105, 0.05)' }} /><Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={18}>{stats.deptStats.map((_, i) => (<Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer>
                </motion.div>
                <motion.div variants={bouncyItem} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-4 mb-8"><TrendingUp size={24} className="text-emerald-500" /><h3 className="text-xl font-black text-slate-800">PM Activity Trend</h3></div>
                  <ResponsiveContainer width="100%" height={320}><AreaChart data={stats.dailyTrend}><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" /></AreaChart></ResponsiveContainer>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-3xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-10 py-8">Asset (A)</th><th className="px-10 py-8">Status (G)</th><th className="px-10 py-8">User (F) / Tech (O)</th><th className="px-10 py-8">Date (B)</th><th className="px-10 py-8 text-emerald-600">Next PM (C)</th>{pmModule === 'computer' && <th className="px-10 py-8">PC Auth (K)</th>}<th className="px-10 py-8 text-right no-print">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map(it => (
                      <motion.tr key={it.id} variants={bouncyItem} className="transition-colors group hover:bg-emerald-50/10">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            {it.imageUrl ? <img src={it.imageUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100" alt="S" /> : <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200"><ImageIcon size={20} /></div>}
                            <div><p className="font-black text-slate-900 text-[15px]">{it.computerName || 'UNNAMED'}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{it.id} • {it.department}</p></div>
                          </div>
                        </td>
                        <td className="px-10 py-8"><span className={`px-4 py-2 rounded-xl text-[10px] font-black border shadow-sm uppercase ${it.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{it.status}</span></td>
                        <td className="px-10 py-8"><p className="text-sm font-extrabold text-slate-800 truncate max-w-[140px]">{it.personnel}</p><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">{it.technician || '-'}</p></td>
                        <td className="px-10 py-8"><span className="text-[11px] font-black text-slate-700">{formatDateDisplay(it.date)}</span></td>
                        <td className="px-10 py-8"><span className={`text-[11px] font-black ${it.status === 'Completed' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'} px-3 py-1.5 rounded-lg`}>{it.nextPmDate ? formatDateDisplay(it.nextPmDate) : '-'}</span></td>
                        {pmModule === 'computer' && <td className="px-10 py-8"><p className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{isAdminSession ? it.password || 'N/A' : '••••••••'}</p></td>}
                        <td className="px-10 py-8 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all no-print">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-3.5 text-emerald-600 bg-emerald-50 rounded-2xl hover:bg-emerald-100 shadow-sm"><QrCode size={18} /></button>
                          <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-3.5 text-slate-600 bg-slate-50 rounded-2xl hover:bg-slate-100 shadow-sm"><Edit2 size={18} /></button>
                          {userRole === 'admin' && (<button onClick={() => { if(window.confirm('ยืนยันลบข้อมูล?')) setItems(prev => prev.filter(i => String(i.id).trim() !== String(it.id).trim())); }} className="p-3.5 text-red-600 bg-rose-50 rounded-2xl hover:bg-rose-100 shadow-sm"><Trash2 size={18} /></button>)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] shadow-4xl w-full max-w-lg p-10 space-y-8">
            <div className="flex justify-between items-center"><div className="flex items-center gap-4"><Database className="text-emerald-600" size={28} /><h3 className="text-xl font-black uppercase tracking-tight">Cloud Database</h3></div><button onClick={() => setIsDbSettingsOpen(false)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:text-red-500"><X size={24} /></button></div>
            
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] space-y-4">
              <div className="flex gap-4"><AlertCircle className="text-amber-600 shrink-0" size={20} /><p className="text-[12px] font-bold text-amber-900 leading-relaxed"><strong>คำแนะนำสำคัญ:</strong> เพื่อป้องกัน Error "null reading getDataRange" กรุณาตรวจสอบว่าใน Google Sheets ของคุณมีแผ่นงานที่ชื่อว่า <span className="underline font-black">Data</span> อยู่ด้วยครับ</p></div>
              <ul className="text-[10px] text-amber-800 font-bold list-disc ml-8 space-y-1">
                <li>Extensions &gt; Apps Script</li>
                <li>Deploy &gt; New Deployment &gt; Web App</li>
                <li>Who has access: <strong>Anyone</strong></li>
              </ul>
            </div>

            <div className="space-y-6">
              <FormInput label="Google Script Web App URL" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/macros/s/..." />
              <button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase shadow-3xl hover:bg-emerald-500 active:scale-95 transition-all">บันทึกและเชื่อมต่อ</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] shadow-4xl w-full max-sm p-10 space-y-8">
            <div className="text-center space-y-4"><div className="inline-block p-5 bg-emerald-600 text-white rounded-[1.5rem] shadow-2xl"><Lock size={32} /></div><h3 className="text-2xl font-black uppercase">Admin Auth</h3></div>
            <form onSubmit={handleLogin} className="space-y-6">
              <FormInput label="Username" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} />
              <FormInput label="Password" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} />
              {loginError && <p className="text-[11px] font-black text-red-500 uppercase text-center bg-red-50 py-2 rounded-lg">{loginError}</p>}
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase shadow-3xl hover:bg-emerald-500 transition-all">ยืนยันตัวตน</button>
              <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-400 font-black text-[11px] uppercase tracking-widest text-center">ยกเลิก</button>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-md no-print overflow-y-auto">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[3rem] md:rounded-[4rem] shadow-4xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4"><div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl"><Wrench size={20} /></div><h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{editingItem.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h3></div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:text-red-500 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 md:p-10 overflow-y-auto space-y-10 flex-1 pb-28">
              <div className="space-y-6">
                <div className="flex items-center gap-3"><ImageIcon size={22} className="text-emerald-500" /><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Hardware Link / Proof Image (Column N)</label></div>
                <div className="flex flex-col sm:flex-row gap-8 items-center bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <div className="w-full sm:w-48 h-48 rounded-[2rem] bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {editingItem.imageUrl ? <><img src={editingItem.imageUrl} alt="S" className="w-full h-full object-cover" /><button type="button" onClick={() => setEditingItem({...editingItem, imageUrl: ''})} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"><Trash2 size={16} /></button></> : <Camera size={40} className="text-slate-200" />}
                   </div>
                   <label className="flex-1 flex items-center justify-center gap-3 w-full py-5 bg-emerald-600 text-white rounded-2xl border border-emerald-500 font-black text-[11px] uppercase cursor-pointer hover:bg-emerald-500 transition-all shadow-xl"><Upload size={18} /> <span>Upload / Capture Link (N)</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                <FormInput label="Asset Identity (A)" value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} placeholder="ตัวอย่าง: PM-2568-001" required />
                <FormInput label="Inspection Date (B)" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} />
                <div className="bg-emerald-50/50 p-5 rounded-[1.5rem] border border-emerald-100/50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Calendar size={18} /></div>
                      <div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Calculated Next PM (C)</p>
                        <p className="font-black text-emerald-900 text-[13px]">{editingItem.status === 'Completed' ? formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device)) : 'Waiting for Completed status'}</p>
                      </div>
                   </div>
                   <div className="text-[9px] font-bold text-emerald-500 uppercase px-2 py-1 bg-white rounded-md border border-emerald-100">{editingItem.device === 'Computer' ? '+6 Months' : '+2 Months'}</div>
                </div>
                <FormSelect label="Department Unit (D)" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                <FormSelect label="Device Type (E)" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                <FormInput label="Personnel User (F)" value={editingItem.personnel} onChange={val => setEditingItem({...editingItem, personnel: val})} placeholder="ชื่อ-นามสกุล ผู้ใช้งาน" />
                <FormInput label="Assigned Technician (O)" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} placeholder="ชื่อช่างผู้ปฏิบัติงาน" />
                <FormInput label="Hostname (I)" value={editingItem.computerName} onChange={val => setEditingItem({...editingItem, computerName: val})} placeholder="IT-PC-MAIN" />
                <FormInput label="Login Account (J)" value={editingItem.computerUser} onChange={val => setEditingItem({...editingItem, computerUser: val})} placeholder="Domain User" />
                <FormSelect label="Work Status (G)" value={editingItem.status} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                {editingItem.device === 'Computer' && (
                  <>
                    <FormInput label="PC Auth Credential (K)" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                    <FormInput label="Server Auth Access (L)" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                    <FormInput label="Anti-Virus Status (M)" value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} />
                  </>
                )}
              </div>

              {/* Lifecycle & Warranty (Old Fields Restored) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3"><Info size={22} className="text-emerald-500" /><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Lifecycle & Lifecycle Proof</label></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7 p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <FormInput label="วันเริ่มใช้งาน (Start Date)" type="date" value={editingItem.startDate || ''} onChange={val => setEditingItem({...editingItem, startDate: val})} />
                  <FormInput label="วันหมดประกัน (Warranty Expiry)" type="date" value={editingItem.warrantyExpiry || ''} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                  <div className="md:col-span-2">
                    <FormInput label="หมายเหตุเพิ่มเติม (Spare Field / Notes)" value={editingItem.spareField || ''} onChange={val => setEditingItem({...editingItem, spareField: val})} placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับอุปกรณ์..." />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3"><CheckSquare size={22} className="text-emerald-500" /><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Full PM Verification Checklist (H)</label></div>
                <div className="grid grid-cols-1 gap-3 p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = String(editingItem.activity || '').includes(act);
                    return (<label key={i} className="flex items-center gap-4 p-4.5 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-emerald-400 transition-all shadow-md group">
                      <input type="checkbox" className="hidden" checked={!!isChecked} onChange={() => {
                        const acts = String(editingItem.activity || '').split(' | ').filter(x => x);
                        const next = isChecked ? acts.filter(x => x !== act) : [...acts, act];
                        setEditingItem({...editingItem, activity: next.join(' | ')});
                      }} /><div className={`p-1.5 rounded-lg transition-all ${isChecked ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={18} /> : <Square size={18} />}</div><span className={`text-[12px] font-extrabold ${isChecked ? 'text-emerald-800' : 'text-slate-500'}`}>{act}</span>
                    </label>);
                  })}
                </div>
              </div>
              <div className="sticky bottom-0 bg-white pt-6 pb-6 border-t border-slate-100 z-10"><button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-3xl hover:bg-emerald-500 active:scale-95 transition-all">Establish & Sync Record (A-R)</button></div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl no-print">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] shadow-4xl w-full max-w-sm p-10 text-center space-y-8 relative">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Identity Key</h3><button onClick={() => setIsQrModalOpen(false)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:text-red-500"><X size={26} /></button></div>
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 inline-block shadow-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`)}`} alt="QR" className="w-48 h-48 rounded-2xl" /></div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`); setSyncMessage("ลิงค์ถูกคัดลอกแล้ว"); setTimeout(() => setSyncMessage(null), 2000); }} className="w-full p-5 bg-slate-100 text-slate-700 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase border border-slate-200 hover:bg-slate-200 transition-all"><Share2 size={18} /> Copy URL Link</button>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// --- HELPERS ---
const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-7 py-5 rounded-[2rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl scale-105' : 'text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-100'}`}><Icon size={20} /> <span className="text-sm font-black uppercase tracking-tight">{label}</span></button>
);

const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = { emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', teal: 'bg-teal-50 text-teal-600 border-teal-100', rose: 'bg-red-50 text-red-600 border-red-100', amber: 'bg-orange-50 text-orange-600 border-orange-100' };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl group transition-all hover:scale-105">
      <div className={`p-4 rounded-2xl inline-block mb-4 ${themes[color] || themes.emerald} border shadow-lg transition-transform group-hover:scale-110`}><Icon size={22} /></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl md:text-3xl font-black text-slate-900 truncate">{value}</h4>
      <p className="text-[9px] text-slate-400 font-extrabold mt-1 uppercase tracking-tight">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ 
  label: string; 
  value: string; 
  onChange?: (val: string) => void; 
  type?: string; 
  placeholder?: string; 
  showToggle?: boolean; 
  isLocked?: boolean; 
  onUnlock?: () => void; 
  required?: boolean;
}> = ({ label, value, onChange, type = "text", placeholder, showToggle = false, isLocked = false, onUnlock, required }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const inputType = showToggle ? (internalVisible && !isLocked ? "text" : "password") : type;

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
      <div className="relative group">
        <input 
          type={inputType} 
          value={value || ''} 
          onChange={e => onChange?.(e.target.value)} 
          placeholder={placeholder} 
          disabled={isLocked}
          required={required}
          className={`w-full px-5 py-4.5 rounded-2xl text-[13px] font-extrabold border-2 outline-none shadow-inner transition-all focus:ring-4 focus:ring-emerald-500/10 ${
            isLocked 
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-emerald-600'
          }`} 
        />
        
        {isLocked && onUnlock && (
          <button 
            type="button" 
            onClick={onUnlock} 
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-white border border-slate-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-2 group-hover:scale-105"
          >
            <Lock size={12} /> ปลดล็อค
          </button>
        )}

        {showToggle && !isLocked && (
          <button 
            type="button" 
            onClick={() => setInternalVisible(!internalVisible)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-600"
          >
            {internalVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-3">
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-5 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-extrabold outline-none focus:border-emerald-600 appearance-none cursor-pointer shadow-inner">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean }> = ({ label, value, mono = false, small = false }) => (
  <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</p>
    <p className={`font-black text-slate-800 truncate ${mono ? 'font-mono text-[13px]' : small ? 'text-[11px]' : 'text-[13px]'}`}>{value}</p>
  </div>
);

export default App;