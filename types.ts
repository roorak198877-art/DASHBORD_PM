export interface PMItem {
  id: string;
  date: string;
  nextPmDate?: string; 
  department: string;
  device: 'Computer' | 'Printer';
  personnel: string; // Column F: User / ผู้ใช้
  status: 'Completed' | 'In Progress' | 'Pending'; // Column G
  deviceStatus?: string; // Column H
  activity: string;
  // Details
  computerName: string; // Column I
  computerUser: string; // Column J: User computer / ผู้ใช้คอมพิวเตอร์
  password?: string; // Column K
  serverPassword?: string; // Column L
  antivirus?: string; // Column M
  // Lifecycle & Warranty
  startDate?: string;     // วันเริ่มใช้งาน
  warrantyExpiry?: string; // วันหมดประกัน
  spareField?: string;     // ฟิลด์สำรอง / ข้อมูลเพิ่มเติม
  imageUrl?: string;      // รูปภาพอุปกรณ์ (Base64)
}

export interface DeptWorkload {
  name: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

export interface MonthlySummary {
  month: string;
  count: number;
  completion: number;
  note: string;
}