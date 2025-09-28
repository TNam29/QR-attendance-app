import { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceSession } from '../types/attendance';
import { AttendanceStorage } from '../services/AttendanceStorage';

interface AttendanceHistoryProps {
  refreshTrigger: number;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ refreshTrigger }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [viewMode, setViewMode] = useState<'records' | 'sessions' | 'stats'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'check-in' | 'check-out'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttendance: 0,
    totalRecords: 0,
    averageHours: 0
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = () => {
    const allRecords = AttendanceStorage.getAllRecords();
    const allSessions = AttendanceStorage.getAllSessions();
    const attendanceStats = AttendanceStorage.getAttendanceStats();
    
    setRecords(allRecords);
    setSessions(allSessions);
    setStats(attendanceStats);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu điểm danh?')) {
      AttendanceStorage.clearAllRecords();
      setRecords([]);
      setSessions([]);
      setStats({ totalUsers: 0, todayAttendance: 0, totalRecords: 0, averageHours: 0 });
    }
  };

  const handleExportCSV = () => {
    if (viewMode === 'sessions') {
      AttendanceStorage.downloadCSV('sessions');
    } else {
      AttendanceStorage.downloadCSV('records');
    }
  };

  const getFilteredRecords = () => {
    let filtered = records;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(record => 
        record.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.user?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.user?.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        record.date.includes(searchTerm) ||
        record.time.includes(searchTerm)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.type === filterType);
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === filterDate;
      });
    }

    return filtered;
  };

  const getSortedRecords = (filtered: AttendanceRecord[]) => {
    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'date') {
        compareValue = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'name') {
        const nameA = a.user?.name || a.mssv;
        const nameB = b.user?.name || b.mssv;
        compareValue = nameA.localeCompare(nameB);
      } else if (sortBy === 'id') {
        compareValue = a.mssv.localeCompare(b.mssv);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  const getSortedSessions = () => {
    let filtered = sessions;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(session => {
        const user = session.checkIn?.user || session.checkOut?.user;
        const mssv = session.checkIn?.mssv || session.checkOut?.mssv || '';
        
        return (
          mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user?.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          session.date.includes(searchTerm)
        );
      });
    }

    // Filter by date
    if (filterDate) {
      const filterDateFormatted = new Date(filterDate).toLocaleDateString('vi-VN');
      filtered = filtered.filter(session => session.date === filterDateFormatted);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.checkIn?.timestamp || a.checkOut?.timestamp || 0);
        const dateB = new Date(b.checkIn?.timestamp || b.checkOut?.timestamp || 0);
        const compareValue = dateA.getTime() - dateB.getTime();
        return sortOrder === 'asc' ? compareValue : -compareValue;
      }
      
      const nameA = a.checkIn?.user?.name || a.checkOut?.user?.name || a.checkIn?.mssv || a.checkOut?.mssv || '';
      const nameB = b.checkIn?.user?.name || b.checkOut?.user?.name || b.checkIn?.mssv || b.checkOut?.mssv || '';
      const compareValue = nameA.localeCompare(nameB);
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  const toggleSort = (column: 'date' | 'name' | 'id') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: 'date' | 'name' | 'id') => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const renderRecordsView = () => {
    const filteredRecords = getFilteredRecords();
    const sortedRecords = getSortedRecords(filteredRecords);

    return (
      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th 
                onClick={() => toggleSort('name')}
                className="sortable-header"
              >
                Người dùng {getSortIcon('name')}
              </th>
              <th 
                onClick={() => toggleSort('id')}
                className="sortable-header"
              >
                MSSV/Mã NV {getSortIcon('id')}
              </th>
              <th>Loại</th>
              <th 
                onClick={() => toggleSort('date')}
                className="sortable-header"
              >
                Thời gian {getSortIcon('date')}
              </th>
              <th>Địa điểm</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <tr key={`${record.id}-${index}`}>
                <td className="user-cell">
                  {record.user ? (
                    <div className="user-info-compact">
                      <div className="user-avatar-small">
                        {record.user.avatar ? (
                          <img src={record.user.avatar} alt={record.user.name} />
                        ) : (
                          <div className="avatar-placeholder-small">
                            {record.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-details-compact">
                        <div className="user-name-small">{record.user.name}</div>
                        <div className="user-role-small">
                          {record.user.role === 'student' ? '👨‍🎓 SV' : 
                           record.user.role === 'teacher' ? '👩‍🏫 GV' : '👨‍💼 NV'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="legacy-user">👤 Không xác định</span>
                  )}
                </td>
                <td className="mssv-cell">{record.mssv}</td>
                <td>
                  <span className={`type-badge ${record.type}`}>
                    {record.type === 'check-in' ? '🟢 Vào' : '🔴 Ra'}
                  </span>
                </td>
                <td className="timestamp-cell">
                  <div className="time-info">
                    <div className="date-part">{record.date}</div>
                    <div className="time-part">{record.time}</div>
                  </div>
                </td>
                <td className="location-cell">{record.location || '-'}</td>
                <td className="notes-cell">{record.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSessionsView = () => {
    const sortedSessions = getSortedSessions();

    return (
      <div className="table-container">
        <table className="history-table sessions-table">
          <thead>
            <tr>
              <th 
                onClick={() => toggleSort('name')}
                className="sortable-header"
              >
                Người dùng {getSortIcon('name')}
              </th>
              <th 
                onClick={() => toggleSort('date')}
                className="sortable-header"
              >
                Ngày {getSortIcon('date')}
              </th>
              <th>Giờ vào</th>
              <th>Giờ ra</th>
              <th>Tổng giờ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sortedSessions.map((session, index) => {
              const user = session.checkIn?.user || session.checkOut?.user;
              const mssv = session.checkIn?.mssv || session.checkOut?.mssv || 'N/A';
              const status = session.checkIn && session.checkOut ? 'complete' : 
                           session.checkIn ? 'partial' : 'missing';
              
              return (
                <tr key={`${session.userId}-${session.date}-${index}`}>
                  <td className="user-cell">
                    {user ? (
                      <div className="user-info-compact">
                        <div className="user-avatar-small">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="user-details-compact">
                          <div className="user-name-small">{user.name}</div>
                          <div className="user-id-small">{mssv}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="legacy-session">
                        <span className="legacy-user">👤 {mssv}</span>
                      </div>
                    )}
                  </td>
                  <td className="date-cell">{session.date}</td>
                  <td className="time-cell">
                    {session.checkIn ? session.checkIn.time : '-'}
                  </td>
                  <td className="time-cell">
                    {session.checkOut ? session.checkOut.time : '-'}
                  </td>
                  <td className="hours-cell">
                    {session.totalHours ? `${session.totalHours}h` : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${status}`}>
                      {status === 'complete' ? '✅ Hoàn thành' : 
                       status === 'partial' ? '⏳ Chưa checkout' : '❌ Thiếu dữ liệu'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStatsView = () => {
    const today = new Date();
    const todayStr = today.toDateString();
    const thisWeekRecords = records.filter(r => {
      const recordDate = new Date(r.timestamp);
      const diffTime = today.getTime() - recordDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays <= 7;
    });

    const uniqueUsersThisWeek = new Set(thisWeekRecords.map(r => r.userId)).size;
    const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === todayStr);
    const checkedInToday = todayRecords.filter(r => r.type === 'check-in').length;
    const checkedOutToday = todayRecords.filter(r => r.type === 'check-out').length;

    return (
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">👥 Tổng người dùng</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{stats.todayAttendance}</div>
            <div className="stat-label">📅 Có mặt hôm nay</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{checkedInToday}</div>
            <div className="stat-label">🟢 Check-in hôm nay</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{checkedOutToday}</div>
            <div className="stat-label">🔴 Check-out hôm nay</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{uniqueUsersThisWeek}</div>
            <div className="stat-label">📊 Hoạt động tuần này</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{stats.averageHours}h</div>
            <div className="stat-label">⏱️ Trung bình giờ làm</div>
          </div>
        </div>
        
        <div className="today-summary">
          <h3>📈 Tóm tắt hôm nay</h3>
          <div className="today-details">
            <p>🔢 Tổng số lượt điểm danh: <strong>{todayRecords.length}</strong></p>
            <p>👥 Số người có mặt: <strong>{stats.todayAttendance}</strong></p>
            <p>✅ Đã check-in: <strong>{checkedInToday}</strong></p>
            <p>❌ Chưa check-out: <strong>{checkedInToday - checkedOutToday}</strong></p>
          </div>
        </div>
      </div>
    );
  };

  const dataCount = viewMode === 'records' ? getFilteredRecords().length : 
                   viewMode === 'sessions' ? getSortedSessions().length : 0;

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>
          📋 {viewMode === 'records' ? 'Lịch sử điểm danh' : 
              viewMode === 'sessions' ? 'Phiên điểm danh' : 
              'Thống kê điểm danh'}
          {viewMode !== 'stats' && ` (${dataCount} bản ghi)`}
        </h2>
        
        <div className="view-mode-tabs">
          <button 
            className={`tab-btn ${viewMode === 'records' ? 'active' : ''}`}
            onClick={() => setViewMode('records')}
          >
            📝 Bản ghi
          </button>
          <button 
            className={`tab-btn ${viewMode === 'sessions' ? 'active' : ''}`}
            onClick={() => setViewMode('sessions')}
          >
            ⏰ Phiên làm việc
          </button>
          <button 
            className={`tab-btn ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            📊 Thống kê
          </button>
        </div>
      </div>

      {viewMode !== 'stats' && (
        <div className="history-controls">
          <div className="filters">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm tên, email, MSSV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            {viewMode === 'records' && (
              <select
                title="Lọc theo loại điểm danh"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">Tất cả loại</option>
                <option value="check-in">🟢 Check-in</option>
                <option value="check-out">🔴 Check-out</option>
              </select>
            )}
            
            <input
              type="date"
              title="Lọc theo ngày"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-filter"
            />
            
            {(searchTerm || filterType !== 'all' || filterDate) && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterDate('');
                }}
              >
                🗑️ Xóa bộ lọc
              </button>
            )}
          </div>
          
          <div className="control-buttons">
            <button 
              className="success-button" 
              onClick={handleExportCSV}
              disabled={dataCount === 0}
            >
              📊 Xuất CSV
            </button>
            <button 
              className="danger-button" 
              onClick={handleClearAll}
              disabled={records.length === 0}
            >
              🗑️ Xóa tất cả
            </button>
          </div>
        </div>
      )}

      {dataCount === 0 && viewMode !== 'stats' ? (
        <div className="no-records">
          <p>{searchTerm || filterType !== 'all' || filterDate ? 
              '🔍 Không tìm thấy kết quả nào' : 
              '📝 Chưa có dữ liệu điểm danh'}</p>
        </div>
      ) : (
        <>
          {viewMode === 'records' && renderRecordsView()}
          {viewMode === 'sessions' && renderSessionsView()}
          {viewMode === 'stats' && renderStatsView()}
        </>
      )}
    </div>
  );
};

export default AttendanceHistory;