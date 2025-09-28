import { User, QRCodeData } from '../types/attendance';
import QRCode from 'qrcode';

const USERS_STORAGE_KEY = 'app_users';

export class UserService {
  /**
   * Generate a unique user ID
   */
  private static generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate QR code data for a user
   */
  private static generateQRCodeData(userId: string): string {
    const qrData: QRCodeData = {
      userId,
      type: 'attendance',
      timestamp: new Date().toISOString(),
      signature: this.generateSignature(userId)
    };
    return JSON.stringify(qrData);
  }

  /**
   * Generate a simple signature for QR code security
   */
  private static generateSignature(userId: string): string {
    const secret = 'QR_ATTENDANCE_SECRET_2024'; // In production, this should be from environment
    const data = userId + secret;
    // Simple hash function (in production, use crypto libraries)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verify QR code signature
   */
  static verifyQRSignature(qrData: QRCodeData): boolean {
    const expectedSignature = this.generateSignature(qrData.userId);
    return qrData.signature === expectedSignature;
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<User, 'id' | 'qrCode' | 'createdAt'>): Promise<User> {
    const userId = this.generateUserId();
    const qrCodeData = this.generateQRCodeData(userId);
    
    const user: User = {
      ...userData,
      id: userId,
      qrCode: qrCodeData,
      createdAt: new Date().toISOString()
    };

    const users = this.getAllUsers();
    
    // Check for duplicate student/employee ID
    const duplicateStudent = users.find(u => 
      u.studentId && userData.studentId && u.studentId === userData.studentId
    );
    const duplicateEmployee = users.find(u => 
      u.employeeId && userData.employeeId && u.employeeId === userData.employeeId
    );
    
    if (duplicateStudent) {
      throw new Error(`MSSV ${userData.studentId} đã tồn tại`);
    }
    if (duplicateEmployee) {
      throw new Error(`Mã nhân viên ${userData.employeeId} đã tồn tại`);
    }

    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return user;
  }

  /**
   * Get all users
   */
  static getAllUsers(): User[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get user by ID
   */
  static getUserById(userId: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === userId) || null;
  }

  /**
   * Get user by student ID
   */
  static getUserByStudentId(studentId: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.studentId === studentId) || null;
  }

  /**
   * Get user by employee ID
   */
  static getUserByEmployeeId(employeeId: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.employeeId === employeeId) || null;
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Check for duplicate IDs if updating
    if (updates.studentId) {
      const duplicate = users.find((u, i) => 
        i !== userIndex && u.studentId === updates.studentId
      );
      if (duplicate) {
        throw new Error(`MSSV ${updates.studentId} đã tồn tại`);
      }
    }

    if (updates.employeeId) {
      const duplicate = users.find((u, i) => 
        i !== userIndex && u.employeeId === updates.employeeId
      );
      if (duplicate) {
        throw new Error(`Mã nhân viên ${updates.employeeId} đã tồn tại`);
      }
    }

    // Regenerate QR code if user data changed
    const updatedUser = { ...users[userIndex], ...updates };
    updatedUser.qrCode = this.generateQRCodeData(updatedUser.id);

    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    return updatedUser;
  }

  /**
   * Delete user
   */
  static deleteUser(userId: string): boolean {
    const users = this.getAllUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    
    if (users.length === filteredUsers.length) {
      return false; // User not found
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
    return true;
  }

  /**
   * Generate QR code image for a user
   */
  static async generateQRImage(user: User): Promise<string> {
    try {
      const qrImageUrl = await QRCode.toDataURL(user.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrImageUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }

  /**
   * Parse QR code data
   */
  static parseQRCode(qrText: string): QRCodeData | null {
    try {
      const qrData = JSON.parse(qrText) as QRCodeData;
      
      // Validate required fields
      if (!qrData.userId || !qrData.type || qrData.type !== 'attendance') {
        return null;
      }

      // Verify signature for security
      if (!this.verifyQRSignature(qrData)) {
        console.warn('QR code signature verification failed');
        return null;
      }

      return qrData;
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  /**
   * Get active users only
   */
  static getActiveUsers(): User[] {
    return this.getAllUsers().filter(user => user.isActive);
  }

  /**
   * Search users by name or ID
   */
  static searchUsers(query: string): User[] {
    const users = this.getAllUsers();
    const lowercaseQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      (user.studentId && user.studentId.toLowerCase().includes(lowercaseQuery)) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(lowercaseQuery)) ||
      (user.department && user.department.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Import users from CSV data
   */
  static async importUsersFromCSV(csvData: string): Promise<{ success: number; errors: string[] }> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = { success: 0, errors: [] as string[] };
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const userData = {
          name: values[headers.indexOf('name')] || '',
          email: values[headers.indexOf('email')] || '',
          studentId: values[headers.indexOf('studentId')] || undefined,
          employeeId: values[headers.indexOf('employeeId')] || undefined,
          role: (values[headers.indexOf('role')] || 'student') as 'student' | 'employee' | 'teacher',
          department: values[headers.indexOf('department')] || undefined,
          isActive: (values[headers.indexOf('isActive')] || 'true') === 'true'
        };

        if (!userData.name || !userData.email) {
          results.errors.push(`Dòng ${i + 1}: Thiếu tên hoặc email`);
          continue;
        }

        await this.createUser(userData);
        results.success++;
      } catch (error) {
        results.errors.push(`Dòng ${i + 1}: ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Export users to CSV format
   */
  static exportUsersToCSV(): string {
    const users = this.getAllUsers();
    if (users.length === 0) return '';

    const headers = ['name', 'email', 'studentId', 'employeeId', 'role', 'department', 'isActive', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.name,
        user.email,
        user.studentId || '',
        user.employeeId || '',
        user.role,
        user.department || '',
        user.isActive,
        user.createdAt
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}