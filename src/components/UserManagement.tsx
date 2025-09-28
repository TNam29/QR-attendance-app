import React, { useState, useEffect } from 'react';
import { User } from '../types/attendance';
import { UserService } from '../services/UserService';
import QRGenerator from './QRGenerator';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState<User | null>(null);
  const [importData, setImportData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    employeeId: '',
    role: 'student' as 'student' | 'employee' | 'teacher',
    department: '',
    isActive: true
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    employees: 0,
    teachers: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    updateStats();
  }, [users, searchQuery]);

  const loadUsers = () => {
    const allUsers = UserService.getAllUsers();
    setUsers(allUsers);
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = UserService.searchUsers(searchQuery);
    setFilteredUsers(filtered);
  };

  const updateStats = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const students = users.filter(u => u.role === 'student').length;
    const employees = users.filter(u => u.role === 'employee').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    
    setStats({ total, active, students, employees, teachers });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      studentId: '',
      employeeId: '',
      role: 'student',
      department: '',
      isActive: true
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Vui lòng nhập đầy đủ tên và email');
      return;
    }

    if (formData.role === 'student' && !formData.studentId.trim()) {
      alert('Vui lòng nhập MSSV cho sinh viên');
      return;
    }

    if ((formData.role === 'employee' || formData.role === 'teacher') && !formData.employeeId.trim()) {
      alert('Vui lòng nhập mã nhân viên');
      return;
    }

    try {
      if (editingUser) {
        await UserService.updateUser(editingUser.id, formData);
      } else {
        await UserService.createUser(formData);
      }
      
      loadUsers();
      resetForm();
      alert(editingUser ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!');
    } catch (error) {
      alert(`Lỗi: ${(error as Error).message}`);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      studentId: user.studentId || '',
      employeeId: user.employeeId || '',
      role: user.role,
      department: user.department || '',
      isActive: user.isActive
    });
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
      UserService.deleteUser(user.id);
      loadUsers();
      alert('Đã xóa người dùng thành công!');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await UserService.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (error) {
      alert(`Lỗi: ${(error as Error).message}`);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Vui lòng nhập dữ liệu CSV');
      return;
    }

    try {
      const result = await UserService.importUsersFromCSV(importData);
      alert(`Import thành công ${result.success} người dùng. ${result.errors.length} lỗi.`);
      
      if (result.errors.length > 0) {
        console.log('Import errors:', result.errors);
      }
      
      loadUsers();
      setShowImportModal(false);
      setImportData('');
    } catch (error) {
      alert(`Lỗi import: ${(error as Error).message}`);
    }
  };

  const handleExport = () => {
    const csvContent = UserService.exportUsersToCSV();
    if (!csvContent) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return '👨‍🎓';
      case 'teacher': return '👩‍🏫';
      case 'employee': return '👨‍💼';
      default: return '👤';
    }
  };

  return (
    <div className="user-management">
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">👥 Tổng số</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">✅ Hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.students}</div>
          <div className="stat-label">👨‍🎓 Sinh viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.employees + stats.teachers}</div>
          <div className="stat-label">👨‍💼 Nhân viên</div>
        </div>
      </div>

      <div className="user-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên, email, MSSV, mã NV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button
            className="primary-button"
            onClick={() => setShowAddForm(true)}
          >
            ➕ Thêm người dùng
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowImportModal(true)}
          >
            📥 Import CSV
          </button>
          <button
            className="secondary-button"
            onClick={handleExport}
          >
            📤 Export CSV
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? '✏️ Sửa người dùng' : '➕ Thêm người dùng mới'}</h3>
              <button className="close-button" onClick={resetForm}>✕</button>
            </div>
            
            <form className="user-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    title="Nhập họ tên đầy đủ"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    title="Nhập địa chỉ email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chức vụ *</label>
                  <select
                    title="Chọn chức vụ"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    required
                  >
                    <option value="student">👨‍🎓 Sinh viên</option>
                    <option value="teacher">👩‍🏫 Giảng viên</option>
                    <option value="employee">👨‍💼 Nhân viên</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phòng/Ban</label>
                  <input
                    type="text"
                    title="Nhập tên phòng ban"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                {formData.role === 'student' ? (
                  <div className="form-group">
                    <label>MSSV *</label>
                    <input
                      type="text"
                      title="Nhập mã số sinh viên"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Mã nhân viên *</label>
                    <input
                      type="text"
                      title="Nhập mã nhân viên"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Tài khoản hoạt động
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={resetForm}>
                  Hủy
                </button>
                <button type="submit" className="submit-button">
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>📥 Import người dùng từ CSV</h3>
              <button className="close-button" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            
            <div className="import-instructions">
              <p>Định dạng CSV cần có các cột sau:</p>
              <code>name,email,studentId,employeeId,role,department,isActive</code>
              <p>Ví dụ: "Nguyễn Văn A","a@email.com","SV001","","student","CNTT","true"</p>
            </div>
            
            <textarea
              className="import-textarea"
              placeholder="Dán nội dung CSV vào đây..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
            />
            
            <div className="form-actions">
              <button 
                className="cancel-button" 
                onClick={() => setShowImportModal(false)}
              >
                Hủy
              </button>
              <button className="submit-button" onClick={handleImport}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Thông tin</th>
              <th>Chức vụ</th>
              <th>MSSV/Mã NV</th>
              <th>Phòng/Ban</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  {searchQuery ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'inactive-user' : ''}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge">
                      {getRoleIcon(user.role)} {
                        user.role === 'student' ? 'Sinh viên' :
                        user.role === 'teacher' ? 'Giảng viên' : 'Nhân viên'
                      }
                    </span>
                  </td>
                  <td className="id-cell">
                    {user.studentId || user.employeeId || 'N/A'}
                  </td>
                  <td>{user.department || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '✅ Hoạt động' : '❌ Vô hiệu'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn qr-btn"
                        onClick={() => setShowQRGenerator(user)}
                        title="Xem QR code"
                      >
                        📱
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(user)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className={`action-btn toggle-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(user)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showQRGenerator && (
        <div className="modal-overlay">
          <div className="modal qr-modal">
            <QRGenerator 
              user={showQRGenerator} 
              onClose={() => setShowQRGenerator(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;