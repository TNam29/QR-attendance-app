# 🎯 QR Attendance App

Ứng dụng điểm danh bằng mã QR được xây dựng với React, TypeScript và Capacitor. Ứng dụng hỗ trợ cả web và mobile, cho phép quản lý điểm danh hiệu quả thông qua mã QR cá nhân.

## ✨ Tính năng chính

### 📱 Điểm danh QR
- **Quét mã QR**: Sử dụng camera để quét mã QR điểm danh
- **Hai chế độ**: Check-in (Vào) và Check-out (Ra)
- **Tự động xác thực**: Hệ thống tự động nhận diện và lưu thông tin
- **Tương thích**: Hỗ trợ cả mã QR mới và mã QR cũ (định dạng ATTEND:<MSSV>)

### � Quản lý người dùng
- **Thêm người dùng**: Tạo mới người dùng với thông tin đầy đủ
- **Phân loại**: Hỗ trợ 3 loại người dùng (Sinh viên, Nhân viên, Giáo viên)
- **Tạo mã QR**: Tự động tạo mã QR cá nhân cho từng người dùng
- **Tìm kiếm & lọc**: Tìm kiếm theo tên, MSSV, email
- **Import/Export**: Nhập dữ liệu từ CSV và xuất báo cáo
- **In mã QR**: Tải xuống và in mã QR cá nhân

### 📋 Lịch sử điểm danh
- **Xem chi tiết**: Theo dõi tất cả bản ghi điểm danh
- **Thống kê**: Báo cáo số liệu điểm danh theo ngày/tháng
- **Phiên làm việc**: Tính toán thời gian làm việc tự động
- **Xuất dữ liệu**: Export CSV cho báo cáo
- **Lọc và sắp xếp**: Tìm kiếm theo tên, ngày, loại điểm danh

### 🔧 Tính năng nâng cao
- **Responsive Design**: Hoạt động mượt mà trên mọi thiết bị
- **LocalStorage**: Lưu trữ dữ liệu cục bộ an toàn
- **Real-time Updates**: Cập nhật dữ liệu theo thời gian thực
- **Thông báo**: Thông báo trạng thái điểm danh thành công/thất bại

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18.3.1**: Thư viện JavaScript cho giao diện người dùng
- **TypeScript 5.6.2**: Ngôn ngữ lập trình có kiểu tĩnh
- **Vite 5.4.8**: Build tool hiện đại và nhanh chóng
- **CSS3**: Styling với responsive design

### Mobile Development
- **Capacitor 6.1.2**: Framework hybrid app development
- **Capacitor Camera Plugin**: Truy cập camera thiết bị
- **Android Support**: Build và deploy ứng dụng Android

### QR Code Processing
- **@zxing/library 0.21.3**: Thư viện đọc mã QR/barcode
- **qrcode 1.5.4**: Tạo mã QR
- **Camera API**: Truy cập camera trình duyệt

### Development Tools
- **ESLint**: Kiểm tra chất lượng code
- **TypeScript ESLint**: Linting cho TypeScript
- **Vite React Plugin**: Hỗ trợ React trong Vite

## 📁 Cấu trúc dự án

```
bt_capacitor-main/
├── src/
│   ├── components/           # Các component React
│   │   ├── AttendanceHistory.tsx    # Lịch sử điểm danh
│   │   ├── QRGenerator.tsx          # Tạo mã QR
│   │   ├── QRScanner.tsx            # Quét mã QR  
│   │   └── UserManagement.tsx       # Quản lý người dùng
│   ├── services/            # Business logic
│   │   ├── AttendanceStorage.ts     # Xử lý dữ liệu điểm danh
│   │   └── UserService.ts           # Xử lý dữ liệu người dùng
│   ├── types/               # TypeScript type definitions
│   │   └── attendance.ts            # Interface và types
│   ├── App.tsx              # Component chính
│   └── main.tsx            # Entry point
├── android/                 # Android app files
├── public/                  # Static assets
├── capacitor.config.ts      # Cấu hình Capacitor
├── vite.config.ts          # Cấu hình Vite
└── package.json            # Dependencies và scripts
```

## 🚀 Cách cài đặt và chạy

### Yêu cầu hệ thống
- **Node.js** >= 18.0.0
- **npm** hoặc **yarn**
- **Android Studio** (cho build Android)
- **Java JDK** >= 11

### 1. Cài đặt Node.js (>= 18)
- Tải tại: https://nodejs.org/

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy ứng dụng phát triển
```bash
npm run dev
### 1. Clone repository
```bash
git clone <repository-url>
cd bt_capacitor-main
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy ứng dụng web (Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 4. Build cho production
```bash
npm run build
```

### 5. Preview build
```bash
npm run preview
```

## 📱 Build ứng dụng mobile

### Android
1. **Sync với Capacitor**
```bash
npx cap sync android
```

2. **Mở Android Studio**
```bash
npx cap open android
```

3. **Build APK**
- Trong Android Studio: Build > Build Bundle(s)/APK(s) > Build APK(s)
- Hoặc dùng command line:
```bash
cd android
./gradlew assembleDebug
```

### Cấu hình Android
- **App ID**: `com.qrattendance.app`
- **App Name**: QR Attendance App
- **Target SDK**: 34
- **Min SDK**: 24
- **Permissions**: Camera access

## � Sử dụng ứng dụng

### Bước 1: Quản lý người dùng
1. Vào tab "👥 Quản lý người dùng"
2. Thêm người dùng mới với thông tin: tên, email, MSSV/ID nhân viên
3. Tạo và tải mã QR cá nhân cho từng người dùng

### Bước 2: Điểm danh
1. Vào tab "📷 Quét QR"  
2. Chọn chế độ Check-in hoặc Check-out
3. Nhấn "Bắt đầu quét QR" và đưa mã QR vào camera
4. Hệ thống tự động lưu thông tin điểm danh

### Bước 3: Xem báo cáo
1. Vào tab "📋 Lịch sử"
2. Xem chi tiết các lần điểm danh
3. Xuất báo cáo CSV để phân tích

## � Cấu hình

### Camera Permissions
Ứng dụng yêu cầu quyền truy cập camera. Đảm bảo cấp quyền khi được hỏi.

### LocalStorage
Dữ liệu được lưu trong LocalStorage của trình duyệt. Không xóa dữ liệu trình duyệt để tránh mất thông tin.

### QR Code Format
- **Mã QR mới**: JSON format với userId, type, timestamp
- **Mã QR cũ**: ATTEND:<MSSV> format (backward compatibility)

## 🔐 Bảo mật & Lưu ý

### Tính năng bảo mật
- **Mã QR cá nhân**: Mỗi người dùng có mã QR riêng biệt
- **Chữ ký số**: QR code có chữ ký để tránh giả mạo
- **Kiểm tra tài khoản**: Xác minh người dùng còn hoạt động
- **Timestamp**: Mã QR có thể expire theo thời gian

### Lưu ý sử dụng
- Không chia sẻ mã QR cá nhân cho người khác
- Báo cáo ngay nếu mất mã QR để được cấp lại
- Dữ liệu lưu trong LocalStorage, có thể tích hợp backend

## 🚀 Triển khai Production

### Web Hosting
```bash
npm run build
# Deploy thư mục dist/ lên web server
```

### Android Play Store
1. Build signed APK/AAB trong Android Studio
2. Upload lên Google Play Console
3. Thiết lập store listing và publish

## 🔧 Scripts có sẵn

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run preview      # Preview production build
npm run lint         # Kiểm tra code với ESLint
npx cap sync         # Sync với Capacitor
npx cap open android # Mở Android Studio
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## � License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

## � Liên hệ

- **Phiên bản**: 2.0
- **Năm phát triển**: 2025
- **Framework**: React + Capacitor
- **Platform**: Web & Mobile (Android)

---

*Ứng dụng điểm danh QR hiện đại với giao diện thân thiện và tính năng đầy đủ cho mọi tổ chức.*

## ⚠️ Lưu ý

1. **Quyền truy cập camera**: Ứng dụng cần quyền truy cập camera để quét QR
2. **HTTPS**: Trên mobile và một số trình duyệt cần HTTPS để sử dụng camera
3. **Định dạng QR**: Chỉ chấp nhận định dạng `ATTEND:<MSSV>`
4. **Điểm danh trùng**: Không cho phép điểm danh trùng trong cùng một ngày

## 🔧 Cấu hình

### Android Permissions

File `android/app/src/main/AndroidManifest.xml` đã được cấu hình:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### iOS Permissions

File `ios/App/App/Info.plist` cần thêm:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses the camera to scan QR codes for attendance tracking.</string>
```

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.