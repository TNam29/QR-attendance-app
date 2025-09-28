import React, { useState, useEffect } from 'react';
import { User } from '../types/attendance';
import { UserService } from '../services/UserService';
import './QRGenerator.css';

interface QRGeneratorProps {
  user: User;
  onClose?: () => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ user, onClose }) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRImage();
  }, [user]);

  const generateQRImage = async () => {
    try {
      setIsLoading(true);
      setError('');
      const imageUrl = await UserService.generateQRImage(user);
      setQrImageUrl(imageUrl);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrImageUrl) return;
    
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR_${user.name}_${user.studentId || user.employeeId || user.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrImageUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${user.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 20px;
            }
            .qr-card {
              border: 2px solid #000;
              padding: 20px;
              display: inline-block;
              margin: 20px;
              background: white;
            }
            .user-info {
              margin-bottom: 15px;
            }
            .user-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .user-id {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .user-role {
              font-size: 14px;
              color: #888;
            }
            .qr-image {
              margin: 15px 0;
            }
            .instructions {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-id">
                ${user.studentId ? `MSSV: ${user.studentId}` : ''}
                ${user.employeeId ? `Mã NV: ${user.employeeId}` : ''}
              </div>
              <div class="user-role">
                ${user.role === 'student' ? 'Học sinh/Sinh viên' : 
                  user.role === 'teacher' ? 'Giảng viên' : 'Nhân viên'}
                ${user.department ? ` - ${user.department}` : ''}
              </div>
            </div>
            <div class="qr-image">
              <img src="${qrImageUrl}" alt="QR Code" style="width: 200px; height: 200px;">
            </div>
            <div class="instructions">
              Quét mã QR này để điểm danh. Mỗi người chỉ được sử dụng mã QR của riêng mình.
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const copyQRData = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(user.qrCode).then(() => {
        alert('Đã sao chép dữ liệu QR vào clipboard!');
      }).catch(() => {
        alert('Không thể sao chép dữ liệu QR');
      });
    }
  };

  return (
    <div className="qr-generator-container">
      <div className="qr-generator-header">
        <h3>🎯 Mã QR cá nhân</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="user-card">
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
          <h4>{user.name}</h4>
          <p className="user-id">
            {user.studentId && <span>MSSV: {user.studentId}</span>}
            {user.employeeId && <span>Mã NV: {user.employeeId}</span>}
          </p>
          <p className="user-role">
            {user.role === 'student' ? '👨‍🎓 Học sinh/Sinh viên' : 
             user.role === 'teacher' ? '👩‍🏫 Giảng viên' : '👨‍💼 Nhân viên'}
          </p>
          {user.department && <p className="user-department">🏢 {user.department}</p>}
          <p className="user-email">📧 {user.email}</p>
        </div>
      </div>

      <div className="qr-section">
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tạo mã QR...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={generateQRImage}>Thử lại</button>
          </div>
        )}

        {qrImageUrl && !isLoading && (
          <div className="qr-display">
            <div className="qr-image-container">
              <img src={qrImageUrl} alt="QR Code" className="qr-image" />
            </div>
            
            <div className="qr-actions">
              <button className="primary-button" onClick={downloadQRCode}>
                💾 Tải xuống
              </button>
              <button className="secondary-button" onClick={printQRCode}>
                🖨️ In QR
              </button>
              <button className="secondary-button" onClick={copyQRData}>
                📋 Sao chép dữ liệu
              </button>
            </div>

            <div className="qr-instructions">
              <h4>📱 Hướng dẫn sử dụng:</h4>
              <ul>
                <li>Mỗi người chỉ được sử dụng mã QR của riêng mình</li>
                <li>Đưa mã QR này lên camera khi điểm danh</li>
                <li>Mã QR có tính bảo mật và chống giả mạo</li>
                <li>Không chia sẻ mã QR cho người khác</li>
                <li>Nếu mất mã QR, liên hệ admin để tạo lại</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;