export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string; // MSSV for students
  employeeId?: string; // ID for employees
  role: 'student' | 'employee' | 'teacher';
  department?: string;
  avatar?: string;
  qrCode: string; // Generated QR code content
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  user?: User; // User information for display
  mssv: string; // Keep for backward compatibility
  timestamp: string;
  date: string;
  time: string;
  type: 'check-in' | 'check-out';
  location?: string;
  notes?: string;
}

export interface AttendanceSession {
  userId: string;
  date: string;
  checkIn?: AttendanceRecord;
  checkOut?: AttendanceRecord;
  totalHours?: number;
}

export interface QRScanResult {
  text: string;
  format?: string;
}

export interface QRCodeData {
  userId: string;
  type: 'attendance';
  timestamp: string;
  signature?: string; // For security
}