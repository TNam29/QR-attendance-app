import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { AttendanceStorage } from '../services/AttendanceStorage';
import { UserService } from '../services/UserService';
import { AttendanceRecord } from '../types/attendance';

interface QRScannerProps {
  onScanSuccess: (record: AttendanceRecord) => void;
  onScanError: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    checkCameraPermission();

    return () => {
      stopScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
    } catch (error) {
      console.error('Error checking camera:', error);
      setHasCamera(false);
      onScanError('Không thể truy cập camera');
    }
  };

  const startScanner = async () => {
    if (!codeReader.current || !videoRef.current || !hasCamera) {
      onScanError('Camera không khả dụng');
      return;
    }

    try {
      setIsScanning(true);
      
      // Get video devices
      const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = videoInputDevices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('Không tìm thấy camera');
      }

      // Use back camera if available, otherwise use first available
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const deviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;

      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            handleQRResult(scannedText);
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scanning error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      onScanError('Lỗi khi khởi động camera: ' + (error as Error).message);
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const handleQRResult = (scannedText: string) => {
    console.log('Scanned:', scannedText);
    
    try {
      // Try parsing as new QR format first
      const qrData = UserService.parseQRCode(scannedText);
      
      if (qrData) {
        // New format: JSON QR code with user data
        const user = UserService.getUserById(qrData.userId);
        if (!user) {
          onScanError('Không tìm thấy thông tin người dùng trong hệ thống');
          return;
        }

        if (!user.isActive) {
          onScanError('Tài khoản người dùng đã bị vô hiệu hóa');
          return;
        }

        const record = AttendanceStorage.saveAttendance(user, scanMode);
        onScanSuccess(record);
        stopScanner();
        return;
      }

      // Fallback to legacy format: ATTEND:<MSSV>
      const attendPattern = /^ATTEND:(.+)$/i;
      const match = scannedText.match(attendPattern);
      
      if (!match) {
        onScanError('QR code không đúng định dạng. Cần có dạng: ATTEND:<MSSV> hoặc mã QR cá nhân');
        return;
      }

      const mssv = match[1].trim();
      
      if (!mssv) {
        onScanError('MSSV không hợp lệ');
        return;
      }

      // Try to find user by student ID
      let user = UserService.getUserByStudentId(mssv);
      
      if (!user) {
        // Try by employee ID
        user = UserService.getUserByEmployeeId(mssv);
      }

      if (user) {
        // Found user in system, use new system
        if (!user.isActive) {
          onScanError('Tài khoản người dùng đã bị vô hiệu hóa');
          return;
        }
        
        const record = AttendanceStorage.saveAttendance(user, scanMode);
        onScanSuccess(record);
      } else {
        // User not found, use legacy system
        const record = AttendanceStorage.saveAttendanceLegacy(mssv);
        onScanSuccess(record);
      }
      
      stopScanner();
    } catch (error) {
      onScanError((error as Error).message);
    }
  };

  if (!hasCamera) {
    return (
      <div className="scanner-container">
        <div className="status-message status-error">
          <p>⚠️ Không thể truy cập camera</p>
          <p>Vui lòng cấp quyền truy cập camera và làm mới trang</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <div className="scan-mode-selector">
        <h4>📋 Chế độ điểm danh:</h4>
        <div className="mode-buttons">
          <button
            className={`mode-button ${scanMode === 'check-in' ? 'active' : ''}`}
            onClick={() => setScanMode('check-in')}
          >
            🟢 Check-in (Vào)
          </button>
          <button
            className={`mode-button ${scanMode === 'check-out' ? 'active' : ''}`}
            onClick={() => setScanMode('check-out')}
          >
            🔴 Check-out (Ra)
          </button>
        </div>
        <p className="current-mode">
          Chế độ hiện tại: <strong>
            {scanMode === 'check-in' ? '🟢 Check-in (Vào)' : '🔴 Check-out (Ra)'}
          </strong>
        </p>
      </div>

      <div className="video-container">
        <video 
          ref={videoRef} 
          id="video" 
          className={isScanning ? 'video-visible' : 'video-hidden'} 
        />
        {isScanning && <div className="scanner-overlay" />}
        {!isScanning && (
          <div className="video-placeholder">
            <p>📷 Nhấn "Bắt đầu quét" để sử dụng camera</p>
            <p className="scan-mode-info">
              Chế độ: {scanMode === 'check-in' ? '🟢 Điểm danh vào' : '🔴 Điểm danh ra'}
            </p>
          </div>
        )}
      </div>
      
      <div className="controls">
        {!isScanning ? (
          <button className="primary-button" onClick={startScanner}>
            📷 Bắt đầu quét QR
          </button>
        ) : (
          <button className="danger-button" onClick={stopScanner}>
            ⏹️ Dừng quét
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;