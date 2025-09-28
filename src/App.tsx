import { useState } from 'react';
import QRScanner from './components/QRScanner';
import AttendanceHistory from './components/AttendanceHistory';
import UserManagement from './components/UserManagement';
import { AttendanceRecord } from './types/attendance';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState<'scanner' | 'history' | 'users'>('scanner');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 5000);
  };

  const handleScanSuccess = (record: AttendanceRecord) => {
    const userName = record.user?.name || `MSSV: ${record.mssv}`;
    const actionText = record.type === 'check-in' ? 'Vào' : 'Ra';
    showStatus(`✅ ${actionText} thành công cho ${userName}`, 'success');
    setRefreshTrigger(prev => prev + 1); // Trigger history refresh
  };

  const handleScanError = (error: string) => {
    showStatus(`❌ ${error}`, 'error');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎯 QR Attendance App</h1>
        <p>Ứng dụng điểm danh bằng mã QR</p>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-button ${currentTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setCurrentTab('scanner')}
        >
          📷 Quét QR
        </button>
        <button 
          className={`tab-button ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentTab('history')}
        >
          📋 Lịch sử
        </button>
        <button 
          className={`tab-button ${currentTab === 'users' ? 'active' : ''}`}
          onClick={() => setCurrentTab('users')}
        >
          👥 Quản lý người dùng
        </button>
      </nav>

      {statusMessage && (
        <div className={`status-message status-${statusType}`}>
          {statusMessage}
        </div>
      )}

      <main className="app-content">
        {currentTab === 'scanner' && (
          <div className="scanner-tab">
            <div className="instructions">
              <h3>📋 Hướng dẫn sử dụng:</h3>
              <ul>
                <li>1️⃣ Chọn chế độ Check-in (Vào) hoặc Check-out (Ra)</li>
                <li>2️⃣ Nhấn "Bắt đầu quét QR" để bật camera</li>
                <li>3️⃣ Đưa mã QR cá nhân vào khung quét</li>
                <li>4️⃣ Hệ thống sẽ tự động xác thực và lưu thông tin</li>
                <li>5️⃣ Mã QR cũ có định dạng ATTEND:&lt;MSSV&gt; vẫn được hỗ trợ</li>
              </ul>
            </div>
            
            <QRScanner 
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          </div>
        )}

        {currentTab === 'history' && (
          <div className="history-tab">
            <AttendanceHistory refreshTrigger={refreshTrigger} />
          </div>
        )}

        {currentTab === 'users' && (
          <div className="users-tab">
            <UserManagement />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 QR Attendance App - Phiên bản 2.0</p>
        <p>📱 Hỗ trợ web và mobile với Capacitor | 🔐 Hệ thống QR cá nhân bảo mật</p>
      </footer>
    </div>
  );
}

export default App;