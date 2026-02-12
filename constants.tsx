
import { PMItem } from './types';

export const DEPARTMENTS = [
  'Maintenance / ซ่อมบำรุง', 
  'Safety / จป.', 
  'Packing / บรรจุ', 
  'QA/QC', 
  'Plating / ชุบ', 
  'Store Inventory / คลังสินค้า', 
  'Wax setting / เซ็ตเทียน', 
  'Wax / ฉีดเทียน', 
  'Polishing / ขัด', 
  'Factory Manager / ผจก.โรงงาน', 
  'Executive Secretary / เลขาฯ', 
  'Accounting / บัญชี', 
  'Import Export / นำเข้า-ส่งออก', 
  'Purchasing / จัดซื้อ', 
  'IT / ไอที', 
  'HR Sup.', 
  'HR admin',
  'Others / อื่นๆ'
];

export const DEVICE_STATUS_OPTIONS = [
  'Ready / ใช้งานได้ปกติ (In Use / กำลังใช้งาน)',
  'Ready / ใช้งานได้ปกติ (Standby / ไม่ได้ใช้งาน)',
  'Broken / เสียกำลังซ่อม (Under Repair)'
];

export const COMPUTER_STANDARD_ACTIVITIES = [
  "1. Clean Screen, Keyboard, Mouse / เช็ดจอ, คีย์บอร์ด, เมาส์",
  "2. Windows & Office Check / ตรวจเช็คระบบ Windows และ Office",
  "3. Antivirus Scan / ตรวจเช็คแอนตี้ไวรัส",
  "4. Disk & RAM Check / ตรวจเช็ค Disk และ RAM",
  "5. Data Backup / สำรองข้อมูลสำคัญ",
  "6. Network & Cable Check / ตรวจเช็คระบบเครือข่ายและสายสัญญาณ",
  "7. Disk Cleanup & Cache / ลบไฟล์ขยะและแคช"
];

export const PRINTER_STANDARD_ACTIVITIES = [
  "1. Clean Exterior & Interior / ทำความสะอาดเครื่อง",
  "2. Roller & Paper Feed Check / ตรวจเช็คชุดดึงกระดาษ",
  "3. Print Head & Ink/Toner Check / ตรวจเช็คหัวพิมพ์",
  "4. Print Quality Test / ทดสอบคุณภาพการพิมพ์",
  "5. Driver & Firmware Update / อัปเดตซอฟต์แวร์",
  "6. Network/USB Connection / ตรวจเช็คการเชื่อมต่อ",
  "7. Consumables Level Check / ตรวจเช็ควัสดุสิ้นเปลือง"
];

export const INITIAL_PM_DATA: PMItem[] = [
  { 
    id: 'PM-2568-001', 
    date: '2025-01-15T10:00:00.000Z', 
    nextPmDate: '2025-07-15T10:00:00.000Z', 
    department: 'IT / ไอที', 
    device: 'Computer', 
    personnel: 'Admin System', 
    technician: 'Staff IT 01',
    status: 'Completed', 
    activity: COMPUTER_STANDARD_ACTIVITIES.slice(0, 5).join(' | '),
    computerName: 'IT-SRV-01', 
    computerUser: 'administrator', 
    password: 'securepass123', 
    antivirus: 'Kaspersky Endpoint',
    assetName: 'Core Server v1',
    modelSpec: 'Dell PowerEdge T440',
    location: 'Server Room'
  }
];
