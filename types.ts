
export interface PMItem {
  // A-O (Indices 0-14)
  id: string;               // A: ID (Required)
  date: string;             // B: Date (Required)
  nextPmDate?: string;      // C: Next PM Date
  department: string;       // D: Department (Required)
  device: 'Computer' | 'Printer'; // E: Device Type (Required)
  personnel?: string;       // F: Personnel
  status?: 'Completed' | 'In Progress' | 'Pending'; // G: Status
  activity?: string;        // H: Activities
  computerName?: string;    // I: Hostname
  computerUser?: string;    // J: Username
  password?: string;        // K: Password
  serverPassword?: string;  // L: Server Password
  antivirus?: string;       // M: Antivirus
  imageUrl?: string;        // N: Image
  technician?: string;      // O: Technician

  // P-V (Indices 15-21)
  startDate?: string;       // P: Start Date
  warrantyExpiry?: string;  // Q: Warranty
  notes?: string;           // R: Notes
  assetName?: string;       // S: Asset Name
  modelSpec?: string;       // T: Spec
  serialNumber?: string;    // U: Serial
  location?: string;        // V: Location

  // UI Only
  deviceStatus?: string; 
}

export interface DeptWorkload {
  name: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}
