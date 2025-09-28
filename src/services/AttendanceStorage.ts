import { AttendanceRecord, User, AttendanceSession } from '../types/attendance';

const STORAGE_KEY = 'attendance_records';
const SESSIONS_STORAGE_KEY = 'attendance_sessions';

export class AttendanceStorage {
  /**
   * Save attendance record with new user system
   */
  static saveAttendance(
    user: User, 
    type: 'check-in' | 'check-out' = 'check-in',
    location?: string,
    notes?: string
  ): AttendanceRecord {
    const now = new Date();
    const dateString = now.toDateString();
    
    const record: AttendanceRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      user: user,
      mssv: user.studentId || user.employeeId || user.id, // Backward compatibility
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('vi-VN'),
      time: now.toLocaleTimeString('vi-VN'),
      type,
      location,
      notes
    };

    const records = this.getAllRecords();
    
    // Check existing attendance for today
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.timestamp).toDateString();
      return r.userId === user.id && recordDate === dateString;
    });

    if (type === 'check-in') {
      const existingCheckIn = todayRecords.find(r => r.type === 'check-in');
      if (existingCheckIn) {
        throw new Error(`${user.name} đã check-in hôm nay lúc ${existingCheckIn.time}`);
      }
    } else if (type === 'check-out') {
      const existingCheckIn = todayRecords.find(r => r.type === 'check-in');
      if (!existingCheckIn) {
        throw new Error(`${user.name} chưa check-in hôm nay, không thể check-out`);
      }
      
      const existingCheckOut = todayRecords.find(r => r.type === 'check-out');
      if (existingCheckOut) {
        throw new Error(`${user.name} đã check-out hôm nay lúc ${existingCheckOut.time}`);
      }
    }

    records.unshift(record); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    // Update session data
    this.updateAttendanceSession(user, record);
    
    return record;
  }

  /**
   * Legacy method for backward compatibility
   */
  static saveAttendanceLegacy(mssv: string): AttendanceRecord {
    const now = new Date();
    const record: AttendanceRecord = {
      id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `legacy_${mssv}`,
      mssv: mssv,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('vi-VN'),
      time: now.toLocaleTimeString('vi-VN'),
      type: 'check-in'
    };

    const records = this.getAllRecords();
    
    // Check if MSSV already exists today
    const today = now.toDateString();
    const existingToday = records.find(r => {
      const recordDate = new Date(r.timestamp).toDateString();
      return r.mssv === mssv && recordDate === today;
    });

    if (existingToday) {
      throw new Error(`MSSV ${mssv} đã điểm danh hôm nay`);
    }

    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return record;
  }

  /**
   * Update attendance session data
   */
  private static updateAttendanceSession(user: User, record: AttendanceRecord): void {
    const sessions = this.getAllSessions();
    const dateKey = record.date;
    
    let session = sessions.find(s => s.userId === user.id && s.date === dateKey);
    
    if (!session) {
      session = {
        userId: user.id,
        date: dateKey
      };
      sessions.push(session);
    }

    if (record.type === 'check-in') {
      session.checkIn = record;
    } else if (record.type === 'check-out') {
      session.checkOut = record;
    }

    // Calculate total hours if both check-in and check-out exist
    if (session.checkIn && session.checkOut) {
      const checkInTime = new Date(session.checkIn.timestamp);
      const checkOutTime = new Date(session.checkOut.timestamp);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      session.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }

  /**
   * Get all attendance records
   */
  static getAllRecords(): AttendanceRecord[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get all attendance sessions
   */
  static getAllSessions(): AttendanceSession[] {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get records for a specific user
   */
  static getUserRecords(userId: string): AttendanceRecord[] {
    const records = this.getAllRecords();
    return records.filter(record => record.userId === userId);
  }

  /**
   * Get today's records for a user
   */
  static getTodayUserRecords(userId: string): AttendanceRecord[] {
    const today = new Date().toDateString();
    const records = this.getUserRecords(userId);
    return records.filter(record => {
      const recordDate = new Date(record.timestamp).toDateString();
      return recordDate === today;
    });
  }

  /**
   * Get user session for a specific date
   */
  static getUserSessionByDate(userId: string, date: string): AttendanceSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.userId === userId && s.date === date) || null;
  }

  /**
   * Get attendance statistics
   */
  static getAttendanceStats(): {
    totalUsers: number;
    todayAttendance: number;
    totalRecords: number;
    averageHours: number;
  } {
    const records = this.getAllRecords();
    const sessions = this.getAllSessions();
    const today = new Date().toDateString();
    
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.timestamp).toDateString();
      return recordDate === today;
    });

    const uniqueUsers = new Set(records.map(r => r.userId));
    const sessionsWithHours = sessions.filter(s => s.totalHours);
    const averageHours = sessionsWithHours.length > 0 
      ? sessionsWithHours.reduce((sum, s) => sum + (s.totalHours || 0), 0) / sessionsWithHours.length
      : 0;

    return {
      totalUsers: uniqueUsers.size,
      todayAttendance: new Set(todayRecords.map(r => r.userId)).size,
      totalRecords: records.length,
      averageHours: Math.round(averageHours * 100) / 100
    };
  }

  /**
   * Clear all records
   */
  static clearAllRecords(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  }

  /**
   * Export to CSV with enhanced data
   */
  static exportToCSV(): string {
    const records = this.getAllRecords();
    if (records.length === 0) return '';

    const headers = [
      'Tên', 'MSSV/Mã NV', 'Email', 'Chức vụ', 'Phòng ban', 
      'Loại', 'Ngày', 'Giờ', 'Địa điểm', 'Ghi chú', 'Timestamp'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.user?.name || 'N/A',
        record.mssv,
        record.user?.email || 'N/A',
        record.user?.role || 'N/A',
        record.user?.department || 'N/A',
        record.type === 'check-in' ? 'Vào' : 'Ra',
        record.date,
        record.time,
        record.location || '',
        record.notes || '',
        record.timestamp
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export sessions to CSV
   */
  static exportSessionsToCSV(): string {
    const sessions = this.getAllSessions();
    if (sessions.length === 0) return '';

    const headers = [
      'Ngày', 'Tên', 'MSSV/Mã NV', 'Giờ vào', 'Giờ ra', 'Tổng giờ', 'Trạng thái'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sessions.map(session => {
        const checkInTime = session.checkIn?.time || '';
        const checkOutTime = session.checkOut?.time || '';
        const status = session.checkIn && session.checkOut ? 'Hoàn thành' : 
                      session.checkIn ? 'Chưa checkout' : 'Không có dữ liệu';
        
        return [
          session.date,
          session.checkIn?.user?.name || session.checkOut?.user?.name || 'N/A',
          session.checkIn?.mssv || session.checkOut?.mssv || 'N/A',
          checkInTime,
          checkOutTime,
          session.totalHours || '',
          status
        ].map(field => `"${field}"`).join(',');
      })
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  static downloadCSV(type: 'records' | 'sessions' = 'records'): void {
    const csvContent = type === 'records' ? this.exportToCSV() : this.exportSessionsToCSV();
    if (!csvContent) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const filename = type === 'records' 
      ? `diem_danh_${new Date().toISOString().split('T')[0]}.csv`
      : `phien_diem_danh_${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}