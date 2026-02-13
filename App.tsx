
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle, Monitor, TrendingUp, FileText, Layers, Edit2, Plus, X, 
  CheckSquare, Square, RefreshCw, Settings, Wrench, QrCode, 
  Activity, Lock, PrinterIcon, Loader2, ChevronRight, 
  Camera, Image as ImageIcon, Upload, Database, Eye, EyeOff,
  AlertCircle, Calendar, ShieldCheck, MapPin, Tag, Cpu, Hash, Key,
  Menu, Server, Copy, ExternalLink, Download, Search, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell, PieChart, Pie 
} from 'recharts';
import { 
  INITIAL_PM_DATA, DEPARTMENTS, 
  COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES 
} from './constants';
import { PMItem } from './types';

// --- CONFIGURATION ---
const COMPANY_NAME = 'TCITRENDGROUP'; 
const LOGO_TEXT = 'T.T.g';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwExkXuVd76opzqQ6EZ8FFAQQ6v6K0Ypypwoc5ur0L1ObQchuwJ23yQbSXC8lO8wua8/exec'; 
const SECURITY_PIN = '1234';
const EXIT_URL = 'https://www.google.com'; 

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

/**
 * Enhanced Sanitize Function to prevent '.googhttps' corruption and DNS errors
 */
const sanitizeUrl = (url: string | null): string => {
  if (!url) return DEFAULT_GAS_URL;
  let cleanUrl = url.trim();

  // 1. Prevent accidental appending of 'https' at the end of the URL
  // ป้องกันกรณีมีการนำ 'https' ไปต่อท้าย String เดิมโดยผิดพลาดซึ่งจะทำให้เกิด DNS Error
  if (cleanUrl.toLowerCase().endsWith('https') && cleanUrl.length > 10) {
    cleanUrl = cleanUrl.substring(0, cleanUrl.length - 5);
  }

  // 2. Fix corruption where URL becomes '.googhttps' instead of '.goog'
  // แก้ไขกรณี URL กลายเป็น '.googhttps' ให้เป็น '.goog' ตามมาตรฐาน Google Cloud
  cleanUrl = cleanUrl.replace(/\.googhttps/gi, '.goog');

  // 3. Ensure the URL starts with a valid protocol and is not empty after cleaning
  // ตรวจสอบความถูกต้องพื้นฐาน
  if (!cleanUrl.startsWith('http')) return DEFAULT_GAS_URL;
  
  return cleanUrl;
};

// --- UI COMPONENTS ---
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const publicViewId = queryParams.get('view');
  
  // ปรับการดึง sharedCloudUrl ให้ผ่านการ sanitize ทันทีเพื่อความปลอดภัยสูงสุด
  const sharedCloudUrl = useMemo(() => {
    const rawUrl = queryParams.get('url');
    return rawUrl ? sanitizeUrl(rawUrl) : null;
  }, [queryParams]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [userRole, setUserRole] = useState<'admin' | 'general'>('general');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
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
  
  // sheetUrl state ต้องผ่านการ sanitize เสมอเพื่อป้องกันข้อผิดพลาด .googhttps
  const [sheetUrl, setSheetUrl] = useState(() => {
    if (sharedCloudUrl) {
      localStorage.setItem('pm_sheet_url', sharedCloudUrl);
      return sharedCloudUrl;
    }
    const stored = localStorage.getItem('pm_sheet_url');
    return sanitizeUrl(stored);
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
    const targetUrl = sanitizeUrl(sheetUrl);
    if (!targetUrl || !targetUrl.startsWith('http')) { 
      setIsSyncing(false); 
      setIsCloudConnected(false); 
      return; 
    } 
    setIsSyncing(true);
    try {
      const separator = targetUrl.includes('?') ? '&' : '?';
      // ใช้ targetUrl ที่สะอาดเสมอ ป้องกัน DNS corruption
      const res = await fetch(`${targetUrl}${separator}_t=${Date.now()}`);
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
              device: (getVal(4, 'device') || 'Computer') as any,
              personnel: getVal(5, 'personnel') || '',
              status: (getVal(6, 'status') || 'Pending') as any,
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
          localStorage.setItem('pm_sheet_url', targetUrl);
          localStorage.setItem('pm_dashboard_data', JSON.stringify(mapped));
          if (!silent) setSyncMessage('Sync Successful / ซิงค์ข้อมูลสำเร็จ');
        }
      } else {
        setIsCloudConnected(false);
      }
    } catch (err) { 
      console.error("Cloud Sync Error:", err);
      setIsCloudConnected(false); 
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 2000); 
    }
  };

  useEffect(() => {
    if (publicViewId && items.length <= 1) {
       setIsLoading(true);
       fetchFromSheet(true).finally(() => setIsLoading(false));
    }
  }, [publicViewId]);

  const filteredItems = useMemo(() => {
    const type = pmModule === 'computer' ? 'Computer' : 'Printer';
    return items.filter(item => {
      if (!item) return false;
      const matchesType = item.device === type;
      if (!searchQuery) return matchesType;
      
      const q = searchQuery.toLowerCase();
      return matchesType && (
        item.id.toLowerCase().includes(q) ||
        (item.personnel || '').toLowerCase().includes(q) ||
        (item.assetName || '').toLowerCase().includes(q) ||
        (item.serialNumber || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q)
      );
    });
  }, [items, pmModule, searchQuery]);

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
      { name: 'Completed / เสร็จสิ้น', value: completed },
      { name: 'Doing / กำลังทำ', value: inProgress },
      { name: 'Pending / รอดำเนินการ', value: pending }
    ];

    return { total, completionRate, deptStats, statusStats };
  }, [filteredItems]);

  const pushToCloud = async (item: PMItem) => {
    const targetUrl = sanitizeUrl(sheetUrl);
    if (!targetUrl) return;
    try {
      setSyncMessage("Pushing Updates... / กำลังส่งข้อมูล...");
      const values = [
        item.id, item.date, item.nextPmDate || '', item.department, item.device,
        item.personnel || '', item.status || 'Pending', item.activity || '', item.computerName || '',
        item.computerUser || '', item.password || '', item.serverPassword || '', item.antivirus || '',
        item.imageUrl || '', item.technician || '', item.startDate || '', item.warrantyExpiry || '',
        item.notes || '', item.assetName || '', item.modelSpec || '', item.serialNumber || '',
        item.location || ''
      ];

      await fetch(targetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ values }) 
      });
      setSyncMessage("Cloud Updated / บันทึกสำเร็จ");
      setIsCloudConnected(true);
    } catch (err) { 
      setSyncMessage("Sync Failed / ผิดพลาด"); 
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
      const newItems = exists ? prev.map(i => normalizeId(i.id) === targetId ? finalItem : i) : [...prev, finalItem];
      localStorage.setItem('pm_dashboard_data', JSON.stringify(newItems));
      return newItems;
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
    }
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

  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => ({
      'Asset ID': item.id,
      'Last PM': formatDateDisplay(item.date),
      'Next PM': formatDateDisplay(item.nextPmDate || calculateNextPM(item.date, item.device)),
      'Dept': item.department,
      'Type': item.device,
      'Holder': item.personnel,
      'Status': item.status
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM_RECORDS");
    XLSX.writeFile(wb, `${COMPANY_NAME}_Export.xlsx`);
  };

  const appBaseUrl = window.location.href.split('?')[0];

  if (publicViewId) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-left">
          <Loader2 size={40} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Verifying Passport / กำลังตรวจสอบพาสปอร์ต...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden text-left">
        <SpinningGears />
        {publicItem ? (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-4xl border border-slate-200 overflow-hidden relative z-10 text-left">
            <div className={`p-8 md:p-10 text-white ${publicItem.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4">
                <ShieldCheck size={28} className="text-white" />
                <div className="flex-1 text-left">
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight">Digital Asset Passport / พาสปอร์ตทรัพย์สิน</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">{COMPANY_NAME}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[75vh] no-scrollbar pb-10 text-left">
              {publicItem.imageUrl && <img src={publicItem.imageUrl} className="w-full h-48 md:h-56 object-cover rounded-3xl border-4 border-slate-50 shadow-xl mb-2" alt="Asset" />}
              
              <div className="grid grid-cols-2 gap-3 text-left">
                <DataField label="1. Asset ID / รหัสทรัพย์สิน" value={publicItem.id} mono />
                <DataField label="11. PM Status / สถานะ" value={publicItem.status || 'Pending'} />
                <DataField label="2. Last PM Cycle / รอบล่าสุด" value={formatDateDisplay(publicItem.date)} />
                <DataField label="3. Next Schedule / รอบถัดไป" value={formatDateDisplay(publicItem.nextPmDate || calculateNextPM(publicItem.date, publicItem.device))} />
                
                <DataField label="4. Spec / สเปค" value={publicItem.modelSpec || '-'} small />
                <DataField label="5. S/N / ซีเรียล" value={publicItem.serialNumber || '-'} small />
                <DataField label="6. Department / แผนก" value={publicItem.department} small />
                <DataField label="7. OS User / ผู้ใช้" value={publicItem.computerUser || '-'} small />
                
                <DataField label="8. Antivirus / แอนตี้ไวรัส" value={publicItem.antivirus || '-'} small />
                <DataField label="9. Personnel / ผู้ครอง" value={publicItem.personnel || '-'} small />
                <DataField label="10. Tech Lead / ช่างคุม" value={publicItem.technician || '-'} small />
                <DataField label="12. Install Date / วันติดตั้ง" value={formatDateDisplay(publicItem.startDate)} small />
                <DataField label="13. Warranty / ประกัน" value={formatDateDisplay(publicItem.warrantyExpiry)} small />
                <DataField label="Location / สถานที่" value={publicItem.location || '-'} small />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                 <DataField label="OS Password / รหัสเครื่อง" value={isUnlocked ? (publicItem.password || '-') : '********'} mono={isUnlocked} small icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
                 <DataField label="Admin Password / รหัสแอดมิน" value={isUnlocked ? (publicItem.serverPassword || '-') : '********'} mono={isUnlocked} small icon={isUnlocked ? <Eye size={12}/> : <EyeOff size={12}/>} />
              </div>

              {!isUnlocked && (
                <form onSubmit={handlePinSubmit} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4 shadow-inner text-left">
                  <div className="flex items-center gap-3 text-left text-left"><Lock size={14} className="text-emerald-600" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left uppercase">Unlock System Credentials / ปลดล็อคเพื่อดูรหัส</span></div>
                  <div className="flex gap-3 text-left">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="****" className={`flex-1 px-4 py-3 rounded-xl border-2 text-center font-black tracking-[1.2em] outline-none transition-all text-sm ${pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-emerald-600'}`} />
                    <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Unlock / ยืนยัน</button>
                  </div>
                </form>
              )}

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-left">Maintenance Protocol Checklist / รายการตรวจสอบ</p>
                <div className="space-y-2 text-left">
                  {String(publicItem.activity || '').split('|').map(a => a.trim()).filter(x => x).map((act, i) => (
                    <p key={i} className="text-[10px] md:text-[11px] font-bold text-slate-700 flex items-start gap-3 leading-relaxed text-left text-left"><CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {act}</p>
                  ))}
                </div>
              </div>
              <button onClick={() => { window.location.href = EXIT_URL; }} className="w-full py-4 bg-slate-800 text-white rounded-[1.5rem] font-black text-[11px] uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 mt-4"><ExternalLink size={16} /> Exit Secure Passport / ออกจากระบบ</button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="text-center p-10 bg-white rounded-[3rem] shadow-5xl max-w-sm relative z-10 border border-slate-100 text-left">
            <AlertCircle size={64} className="text-rose-500 mx-auto mb-8" />
            <h2 className="text-xl font-black text-slate-800 mb-4 uppercase tracking-tighter text-center">Reference Not Found / ไม่พบรหัสทรัพย์สิน</h2>
            <button onClick={() => { window.location.href = appBaseUrl; }} className="w-full px-8 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-4xl active:scale-95 transition-all">Go to Hub / ไปหน้าหลัก</button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col md:flex-row relative text-left">
      <SpinningGears />
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[300] px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-4xl font-black text-[10px] uppercase border border-emerald-500 text-center">{syncMessage}</motion.div>
      )}</AnimatePresence>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden sticky top-0 z-[100] bg-slate-900 px-6 py-5 flex items-center justify-between shadow-4xl no-print border-b border-slate-800 text-left">
        <BrandIdentity size="sm" />
        <div className="flex gap-3 text-left">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-slate-800 text-white rounded-xl active:scale-90 transition-all shadow-sm border border-slate-700"><Menu size={22} /></button>
           <button onClick={() => setIsLoginModalOpen(true)} className="p-3 bg-emerald-600 text-white rounded-xl active:scale-90 transition-all shadow-md"><Lock size={20} /></button>
        </div>
      </div>

      {/* --- MOBILE DRAWER MENU --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[200] bg-slate-900 p-8 flex flex-col gap-10 no-print md:hidden shadow-5xl border-r border-slate-800 text-left">
            <div className="flex justify-between items-center text-left">
              <BrandIdentity size="lg" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-slate-400 bg-slate-800 rounded-2xl shadow-inner border border-slate-700 active:scale-90 transition-all"><X size={28} /></button>
            </div>
            
            <nav className="space-y-4 flex-1 pt-6 overflow-y-auto no-scrollbar text-left text-left">
              <NavBtn 
                icon={Monitor} 
                label="Computers / คอมพิวเตอร์" 
                active={pmModule === 'computer' && activeTab === 'dashboard'} 
                onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              />
              <NavBtn 
                icon={PrinterIcon} 
                label="Printers / เครื่องพิมพ์" 
                active={pmModule === 'printer' && activeTab === 'dashboard'} 
                onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              />
              <div className="h-px bg-slate-800/50 my-8 mx-4"></div>
              <NavBtn 
                icon={FileText} 
                label="Asset Ledger / ทะเบียน" 
                active={activeTab === 'table'} 
                onClick={() => { setActiveTab('table'); setIsMobileMenuOpen(false); }} 
              />
              <button onClick={() => { fetchFromSheet(); setIsMobileMenuOpen(false); }} disabled={isSyncing} className="w-full flex items-center gap-6 px-10 py-6 text-emerald-400 bg-emerald-950/30 rounded-[2.5rem] font-black text-[13px] uppercase border border-emerald-900/50 shadow-inner active:scale-95 transition-all text-left">
                {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} Sync Cloud / ซิงค์ข้อมูล
              </button>
            </nav>

            <div className="space-y-4 text-left">
              <button onClick={() => { setIsDbSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-6 text-slate-400 font-black text-[11px] uppercase border border-slate-800 rounded-[2.5rem] flex items-center justify-center gap-4 bg-slate-900 shadow-lg active:scale-95 transition-all hover:bg-slate-800"><Settings size={18} /> Link Config / ตั้งค่าคลาวด์</button>
              {userRole === 'admin' ? (
                <button onClick={() => { setUserRole('general'); setIsMobileMenuOpen(false); }} className="w-full py-6 bg-rose-950/30 text-rose-500 rounded-[2.5rem] font-black text-[11px] uppercase border border-rose-900/30 shadow-md active:scale-95 transition-all">Logout / ออกจากระบบ</button>
              ) : (
                <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase shadow-5xl shadow-emerald-600/20 active:scale-95 transition-all">Admin Gateway / แอดมิน</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-slate-900 p-10 flex-col gap-10 sticky top-0 h-screen z-20 no-print shadow-4xl border-r border-slate-800 text-left">
        <div className="cursor-pointer text-left" onClick={() => setActiveTab('dashboard')}><BrandIdentity size="lg" /></div>
        <nav className="space-y-4 flex-1 pt-8 text-left">
          <NavBtn icon={Monitor} label="Computers / คอมพิวเตอร์" active={pmModule === 'computer' && activeTab === 'dashboard'} onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} />
          <NavBtn icon={PrinterIcon} label="Printers / เครื่องพิมพ์" active={pmModule === 'printer' && activeTab === 'dashboard'} onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} />
          <div className="h-px bg-slate-800/50 my-8 mx-5"></div>
          <NavBtn icon={FileText} label="Asset Ledger / ทะเบียน" active={activeTab === 'table'} onClick={() => setActiveTab('table')} />
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-4 px-8 py-6 text-emerald-400 bg-emerald-950/30 rounded-[2.5rem] font-black text-[11px] uppercase border border-emerald-900/50 mt-10 hover:bg-emerald-900/40 transition-all shadow-3xl active:scale-95">
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} Sync Cloud / ซิงค์ข้อมูล
          </button>
        </nav>
        <div className="space-y-4 text-left">
          <button onClick={() => setIsDbSettingsOpen(true)} className="w-full py-5 text-slate-400 font-black text-[9px] uppercase border border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"><Settings size={14} /> Link Config / ตั้งค่าคลาวด์</button>
          {userRole === 'admin' ? <button onClick={() => setUserRole('general')} className="w-full py-6 bg-rose-950/30 text-rose-500 rounded-[2.5rem] font-black text-[10px] uppercase border border-rose-900/30 shadow-lg">Logout Admin / ออกระบบ</button> : <button onClick={() => setIsLoginModalOpen(true)} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase shadow-3xl hover:scale-105 transition-all">Admin Gateway / แอดมิน</button>}
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-16 overflow-y-auto w-full relative z-10 text-left">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8 no-print text-left">
          <div className="text-left"><h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{pmModule} Ops Hub / ศูนย์ควบคุม</h2><p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mt-3">{COMPANY_NAME} • Maintenance Excellence / การบำรุงรักษาที่เป็นเลิศ</p></div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto text-left">
            <button onClick={handleExportExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-8 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black shadow-md text-[11px] uppercase hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"><Download size={18} /> Export / ส่งออก</button>
            <button onClick={() => { if(userRole !== 'admin') return setIsLoginModalOpen(true); setEditingItem({ id: '', date: new Date().toISOString(), department: DEPARTMENTS[0], device: pmModule === 'computer' ? 'Computer' : 'Printer', personnel: '', technician: '', status: 'Pending', activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '', startDate: '', warrantyExpiry: '', notes: '', imageUrl: '', assetName: '', modelSpec: '', serialNumber: '', location: '' }); setIsModalOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-4xl text-[11px] uppercase hover:scale-95 transition-all"><Plus size={20} /> Register New / เพิ่มทรัพย์สิน</button>
          </div>
        </header>

        {activeTab === 'table' && (
          <div className="mb-8 no-print text-left">
            <div className="relative max-w-md text-left">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search ID, S/N, Personnel... / ค้นหา..." className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm outline-none focus:border-emerald-600 transition-all text-left" />
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-10 text-left">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                <MetricCard icon={Layers} title="Managed Units / จำนวนที่ดูแล" value={stats.total.toString()} subtitle="Current inventory / ทรัพย์สินทั้งหมด" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency / ประสิทธิภาพ" value={`${stats.completionRate}%`} subtitle="Maintenance ratio / อัตราความสำเร็จ" color="teal" />
                <MetricCard icon={Server} title="Connection / การเชื่อมต่อ" value={isCloudConnected ? "Online" : "Manual"} subtitle="Sync status / สถานะซิงค์" color={isCloudConnected ? "emerald" : "amber"} />
                <MetricCard icon={Activity} title="System / สถานะระบบ" value="Live" subtitle="Health check OK / ทำงานปกติ" color="emerald" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left">
                <div className="bg-white p-10 rounded-[3rem] shadow-4xl border border-slate-100 lg:col-span-2 text-left overflow-hidden">
                  <h3 className="text-xl font-black mb-10 uppercase flex items-center gap-4 tracking-tighter text-slate-800 text-left"><Monitor size={22} className="text-emerald-600" /> Distribution By Department / แยกตามแผนก</h3>
                  <ResponsiveContainer width="100%" height={320}>
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
                <div className="bg-white p-10 rounded-[3rem] shadow-4xl border border-slate-100 flex flex-col items-center text-left overflow-hidden">
                  <h3 className="text-xl font-black mb-10 uppercase flex items-center gap-4 tracking-tighter text-slate-800 self-start text-left"><TrendingUp size={22} className="text-emerald-600" /> Workload Summary / สรุปภาระงาน</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={stats.statusStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                        <Cell fill="#059669" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#64748b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" variants={containerVariants} initial="hidden" animate="show" className="bg-white rounded-[3rem] shadow-4xl overflow-hidden border border-slate-100 overflow-x-auto transition-all text-left">
              <table className="w-full text-left border-collapse min-w-[900px] text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-left"><tr className="text-left"><th className="px-10 py-10">Asset ID / รหัสทรัพย์สิน</th><th className="px-10 py-10">Process Status / สถานะ</th><th className="px-10 py-10">Current Holder / ผู้ครอง</th><th className="px-10 py-10">Maintenance / รอบการดูแล</th><th className="px-10 py-10 text-center">Protocol / จัดการ</th></tr></thead>
                <tbody className="divide-y divide-slate-50 text-left">
                  {filteredItems.length > 0 ? filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-all group text-left">
                      <td className="px-10 py-10 text-left">
                        <div className="text-left text-left"><p className="font-black text-slate-800 text-[16px] tracking-tight">{it.assetName || it.id}</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{it.id}</p></div>
                      </td>
                      <td className="px-10 py-10 text-left">
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm ${it.status === 'Completed' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : it.status === 'In Progress' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-400 text-white shadow-slate-400/20'}`}>{it.status || 'Pending'}</span>
                      </td>
                      <td className="px-10 py-10 text-[13px] font-black text-slate-700 text-left">{it.personnel || '-'}</td>
                      <td className="px-10 py-10 text-[11px] font-black text-slate-500 text-left">
                         {formatDateDisplay(it.date)} <span className="text-slate-300 mx-1">→</span> {formatDateDisplay(it.nextPmDate || calculateNextPM(it.date, it.device))}
                      </td>
                      <td className="px-10 py-10 text-center">
                        <div className="flex gap-4 justify-center text-left">
                          <button onClick={() => { setQrItem(it); setIsQrModalOpen(true); }} className="p-4 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 hover:scale-110 shadow-sm transition-all active:scale-95"><QrCode size={18} /></button>
                          {userRole === 'admin' && <button onClick={() => { setEditingItem({...it}); setIsModalOpen(true); }} className="p-4 text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-3 active:scale-95"><Edit2 size={18} /><span className="text-[10px] font-black uppercase tracking-tight">Modify / แก้ไข</span></button>}
                        </div>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan={5} className="px-10 py-24 text-center"><p className="text-slate-400 font-black uppercase tracking-widest text-xs">No matching records found / ไม่พบข้อมูลที่ต้องการ</p></td></tr>)}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- FORM MODAL --- */}
      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center bg-slate-900/85 backdrop-blur-xl overflow-y-auto pt-14 text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[3.5rem] md:rounded-[3.5rem] w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] shadow-5xl border border-slate-200 text-left">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50 text-left text-left">
              <div className="flex items-center gap-6 text-left text-left"><div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-4xl"><Wrench size={28} /></div><div className="text-left text-left"><h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{editingItem.id ? 'Modify Existing Asset / แก้ไขทรัพย์สิน' : 'New Asset Registration / ลงทะเบียนใหม่'}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Operational Protocol / {editingItem.id || 'Draft'}</p></div></div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 shadow-sm transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 md:p-14 space-y-12 overflow-y-auto pb-40 text-left text-left no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                 <div className="md:col-span-1 space-y-4 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-6 flex items-center gap-3 text-left"><ImageIcon size={16} className="text-emerald-600"/> Proof of State / รูปภาพประกอบ</label>
                    <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center overflow-hidden group relative shadow-inner text-left">
                       {editingItem.imageUrl ? (<><img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="Proof" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-6 transition-opacity duration-300"><button type="button" onClick={() => cameraInputRef.current?.click()} className="p-5 bg-emerald-600 text-white rounded-full shadow-lg"><Camera size={30} /></button><button type="button" onClick={() => fileInputRef.current?.click()} className="p-5 bg-white text-emerald-600 rounded-full shadow-lg"><Upload size={30} /></button></div></>) : (<div className="flex flex-col items-center gap-8 text-center px-6"><div className="flex gap-6"><button type="button" onClick={() => cameraInputRef.current?.click()} className="p-6 bg-white text-emerald-600 rounded-[2.5rem] shadow-4xl active:scale-90"><Camera size={38} /></button><button type="button" onClick={() => fileInputRef.current?.click()} className="p-6 bg-white text-emerald-600 rounded-[2.5rem] shadow-4xl active:scale-90"><Upload size={38} /></button></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">UPLOAD IMAGE / อัปโหลดรูป</span></div>)}
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setEditingItem({...editingItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setEditingItem({...editingItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                    </div>
                 </div>
                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-left">
                    <FormInput label="Identifier ID (A) / รหัสทรัพย์สิน" icon={Hash} value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} required placeholder="Ex: ASSET-001" />
                    <FormInput label="Last Cycle Date (B) / รอบล่าสุด" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} required />
                    <FormInput label="Projected Schedule (C) / รอบถัดไป" value={formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))} readOnly icon={Calendar} />
                    <FormInput label="Asset Custom Name (S) / ชื่อย่อ" icon={Tag} value={editingItem.assetName || ''} onChange={val => setEditingItem({...editingItem, assetName: val})} />
                    <FormInput label="Model Specification (T) / สเปคเครื่อง" icon={Cpu} value={editingItem.modelSpec || ''} onChange={val => setEditingItem({...editingItem, modelSpec: val})} />
                    <FormInput label="Serial Number (U) / ซีเรียล" value={editingItem.serialNumber || ''} onChange={val => setEditingItem({...editingItem, serialNumber: val})} />
                    <FormInput label="Deployment Zone (V) / สถานที่ตั้ง" icon={MapPin} value={editingItem.location || ''} onChange={val => setEditingItem({...editingItem, location: val})} />
                    <FormSelect label="Department (D) / แผนก" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                    <FormSelect label="Asset Category (E) / ประเภท" value={editingItem.device} options={['Computer', 'Printer']} onChange={val => setEditingItem({...editingItem, device: val as any})} />
                 </div>
              </div>

              <div className="space-y-8 text-left">
                <div className="flex items-center gap-4 text-left text-left"><div className="w-2 h-8 bg-emerald-600 rounded-full"></div><h4 className="text-lg font-black text-slate-900 uppercase">Secure Access Profile (J-M) / รหัสผ่าน</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
                   <FormInput label="Login Handle (J) / ยูสเซอร์" icon={Lock} value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} />
                   <FormInput label="Password Key (K) / รหัสผ่าน" icon={Key} type="password" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} />
                   <FormInput label="Admin Gateway (L) / รหัสแอดมิน" icon={Key} type="password" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} />
                   <FormInput label="Endpoint Security (M) / โปรแกรมแอนตี้ไวรัส" value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left text-left">
                 <FormInput label="Personnel Assigned (F) / ผู้ครองทรัพย์สิน" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} />
                 <FormInput label="Technical Lead (O) / ผู้ดูแลทางเทคนิค" value={editingItem.technician || ''} onChange={val => setEditingItem({...editingItem, technician: val})} />
                 <FormInput label="Machine Hostname (I) / ชื่อคอมฯ" value={editingItem.computerName || ''} onChange={val => setEditingItem({...editingItem, computerName: val})} />
                 <FormSelect label="Maintenance State (G) / สถานะงาน" value={editingItem.status || 'Pending'} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
              </div>

              <div className="space-y-8 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6 flex items-center gap-3 text-left text-left text-left"><CheckSquare size={18} className="text-emerald-600" /> Operational Protocol Checklist (H) / รายการการตรวจสอบ</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner text-left text-left text-left">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const cleanAct = act.trim();
                    const isChecked = String(editingItem.activity || '').split('|').map(a => a.trim()).includes(cleanAct);
                    return (
                      <label key={i} className={`flex items-center gap-6 p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 ${isChecked ? 'bg-white border-emerald-500 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => { 
                          const currentActs = String(editingItem.activity || '').split('|').map(a => a.trim()).filter(x => x); 
                          const newActs = isChecked ? currentActs.filter(a => a !== cleanAct) : [...currentActs, cleanAct]; 
                          setEditingItem({...editingItem, activity: newActs.join(' | ')}); 
                        }} />
                        <div className={`p-2 rounded-lg transition-colors ${isChecked ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={20} /> : <Square size={20} />}</div>
                        <span className={`text-[13px] font-black leading-tight text-left text-left text-left ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 p-10 rounded-[3.5rem] border-2 border-emerald-100/60 flex flex-col md:flex-row items-center justify-between gap-10 shadow-inner text-left">
                <div className="text-left text-left w-full md:w-auto"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-[0.3em]">Next Cycle Schedule / รอบการบำรุงรักษาถัดไป</p><p className="text-4xl font-black text-emerald-900 tracking-tighter leading-none">{formatDateDisplay(calculateNextPM(editingItem.date, editingItem.device))}</p></div>
                <div className="flex gap-6 w-full md:w-auto text-left text-left text-left"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none px-10 py-6 bg-white text-slate-400 rounded-[2rem] font-black text-[10px] uppercase border border-slate-100 shadow-xl transition-all">Discard / ยกเลิก</button><button type="submit" className="flex-1 md:flex-none px-16 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-4xl flex items-center justify-center gap-4 active:scale-95 transition-all"><Database size={20} /> Commit & Push Sync / บันทึกและซิงค์</button></div>
              </div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* --- QR MODAL --- */}
      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/85 backdrop-blur-xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3rem] shadow-5xl w-full max-w-sm p-12 text-center relative overflow-hidden text-center text-center">
             <button onClick={() => setIsQrModalOpen(false)} className="absolute top-10 right-10 text-slate-300 active:scale-90 transition-all"><X size={28} /></button>
             <h3 className="text-2xl font-black mb-10 uppercase tracking-tight text-slate-900">IDENTITY PASSPORT / รหัสระบุตัวตน</h3>
             <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 inline-block mb-8 shadow-inner text-center">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${appBaseUrl}?view=${qrItem.id}&url=${encodeURIComponent(sanitizeUrl(sheetUrl))}`)}`} 
                 alt="QR" 
                 className="w-48 h-48 rounded-2xl shadow-3xl text-center" 
               />
             </div>
             <div className="space-y-3 mb-6 text-center text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Encryption Key Verified / ยืนยันพาสปอร์ตดิจิทัลแล้ว</p>
                <div className="flex flex-col gap-3 text-center">
                   <button onClick={() => { navigator.clipboard.writeText(`${appBaseUrl}?view=${qrItem.id}&url=${encodeURIComponent(sanitizeUrl(sheetUrl))}`).then(() => setSyncMessage("Link Copied / คัดลอกสำเร็จ")); }} className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-black text-[10px] uppercase border border-emerald-100 hover:bg-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"><Copy size={16} /> Copy Verification Link / คัดลอกลิงก์</button>
                   <button onClick={() => { window.location.href = `${appBaseUrl}?view=${qrItem.id}&url=${encodeURIComponent(sanitizeUrl(sheetUrl))}`; }} className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-4xl hover:bg-black flex items-center justify-center gap-3 active:scale-95 transition-all"><Monitor size={16} /> Open Asset Passport / เปิดพาสปอร์ต</button>
                </div>
             </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>{isDbSettingsOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-3xl no-print text-left text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[3.5rem] p-12 md:p-14 w-full max-w-md space-y-10 shadow-5xl relative overflow-hidden text-center">
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Cloud Sync Config / ตั้งค่าฐานข้อมูล</h3>
            <FormInput label="GAS Webhook URL / ลิงก์เชื่อมระบบ" value={sheetUrl} onChange={setSheetUrl} placeholder="https://script.google.com/..." icon={Globe} />
            <div className="space-y-4 pt-6 text-center"><button onClick={() => { fetchFromSheet(); setIsDbSettingsOpen(false); }} className="w-full py-7 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-4xl hover:bg-emerald-700 flex items-center justify-center gap-4 active:scale-95 transition-all"><RefreshCw size={20} /> Establish Connection / เชื่อมต่อคลาวด์</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* --- LOGIN MODAL --- */}
      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl no-print text-left">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[4rem] p-12 md:p-14 w-full max-w-sm space-y-12 shadow-5xl relative overflow-hidden text-center text-center">
            <Lock size={56} className="mx-auto text-emerald-600 mb-8" /><h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">Admin Gateway / สำหรับแอดมิน</h3>
            <form onSubmit={handleLogin} className="space-y-10 text-left text-left">
              <div className="space-y-6 text-left"><FormInput label="Identifier / ชื่อผู้ใช้" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} /><FormInput label="Auth Key / รหัสผ่าน" type="password" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} /></div>
              <button type="submit" className="w-full py-7 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-5xl active:scale-95 hover:bg-emerald-700 transition-all">Verify Credentials / ยืนยันสิทธิ์</button>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// --- SHARED COMPONENTS ---
const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 px-10 py-6 rounded-[2.5rem] transition-all border-2 ${active ? 'bg-emerald-600 border-emerald-500 text-white shadow-4xl scale-[1.05] z-10' : 'text-slate-500 border-transparent hover:bg-slate-800/90 hover:text-slate-200'}`}><Icon size={22} /><span className="text-[13px] font-black uppercase tracking-tight text-left text-left">{label}</span></button>
);

const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = { emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-600/5', teal: 'bg-teal-50 text-teal-600 border-teal-100 shadow-teal-600/5', rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/5', amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-600/5' };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-3xl text-left text-left relative z-10 overflow-hidden text-left">
      <div className={`p-4 md:p-5 rounded-xl inline-block mb-8 ${themes[color] || themes.emerald} border shadow-inner text-left text-left`}><Icon size={26} /></div>
      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.25em] text-left text-left">{title}</p>
      <h4 className="text-3xl md:text-4xl font-black text-slate-900 truncate tracking-tighter text-left text-left leading-none">{value}</h4>
      <p className="text-[9px] text-slate-400 font-black uppercase mt-4 opacity-70 text-left text-left tracking-wide">{subtitle}</p>
    </motion.div>
  );
};

const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; required?: boolean; icon?: any; readOnly?: boolean }> = ({ label, value, onChange, type = "text", placeholder, required, icon: Icon, readOnly = false }) => (
  <div className="space-y-4 text-left text-left text-left">
    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-6 flex items-center gap-3 text-left text-left text-left">{Icon && <Icon size={14} className="text-emerald-600" />}{label}</label>
    <input type={type} value={value || ''} onChange={e => !readOnly && onChange?.(e.target.value)} placeholder={placeholder} required={required} readOnly={readOnly} className={`w-full px-7 py-5 md:py-6 ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-black' : 'bg-slate-50 border-slate-100 focus:border-emerald-600 focus:bg-white'} border-2 rounded-[1.8rem] text-sm font-bold outline-none transition-all shadow-inner text-left text-left`} />
  </div>
);

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-4 text-left text-left">
    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-6 text-left text-left">{label}</label>
    <div className="relative text-left text-left">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-7 py-5 md:py-6 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] text-sm font-bold outline-none appearance-none cursor-pointer focus:border-emerald-600 focus:bg-white shadow-inner transition-all text-left text-left">
        {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
      <ChevronRight size={18} className="absolute right-7 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean; small?: boolean; icon?: React.ReactNode }> = ({ label, value, mono = false, small = false, icon }) => (
  <div className="bg-slate-50/50 p-5 md:p-6 rounded-[1.8rem] border border-slate-100 shadow-sm text-left text-left group hover:bg-white transition-all cursor-default overflow-hidden text-left">
    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-2 text-left text-left leading-none uppercase"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-emerald-400 transition-colors"></span>{label}{icon && <span className="ml-auto text-emerald-400">{icon}</span>}</p>
    <p className={`font-black text-slate-800 truncate leading-none text-left text-left ${mono ? 'font-mono text-[14px] tracking-tight uppercase' : small ? 'text-[11px]' : 'text-[13px]'}`}>{value || '-'}</p>
  </div>
);

export default App;
