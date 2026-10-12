# Các quy tắc phát triển và vận hành dự án (AI Instructions)

Tài liệu này ghi lại các quy tắc đã được thống nhất để AI hoặc các nhà phát triển sau này tuân thủ khi chỉnh sửa dự án.
Tôi đang triển khai ứng dụng từ github qua vercel, hãy kiểm tra giúp tôi các file vercel.json, index.html có tham chiếu đúng chưa và hướng dẫn tôi setup api key gemini để người dùng tự nhập API key của họ để chạy app

## 1. Cấu hình Model AI & Cơ chế Fallback
- **Model mặc định**: `gemini-3-pro-preview`
- **Model dự phòng**: Tự động chuyển đổi nếu model hiện tại gặp lỗi/quá tải:
  1. `gemini-3-flash-preview`
  2. `gemini-3-pro-preview`
  3. `gemini-2.5-flash`
- **Cơ chế Retry**:
  - Nếu một bước xử lý (Step 1, 2, hoặc 3) gặp lỗi API, hệ thống **tự động** thử lại ngay lập tức với model tiếp theo trong danh sách.
  - Vẫn giữ nguyên kết quả của các bước trước đó, chỉ retry bước đang lỗi.

## 2. Quản lý API Key
- **Cơ chế**:
  - Người dùng nhập API key vào Modal hoặc qua nút Settings trên Header.
  - Lưu vào `localStorage` của trình duyệt.
  - Ưu tiên sử dụng key từ `localStorage`.
- **Giao diện**:
  - **Thiết lập Model & API Key**: Cần hiển thị như hình mẫu.
    - Hiển thị danh sách chọn Model AI (dạng thẻ/Cards).
    - Thứ tự hiển thị: `gemini-3-flash-preview` (Default), `gemini-3-pro-preview`, `gemini-2.5-flash`.
  - Nút **Settings (API Key)** kèm dòng chữ màu đỏ "Lấy API key để sử dụng app" phải luôn hiển thị trên Header để người dùng dễ dàng thay đổi key khi hết quota. 
  - Khi chưa có key, hiển thị Modal bắt buộc nhập.
  - Việc nhập key ban đầu trước khi dùng app, hướng dẫn người dùng vào https://aistudio.google.com/api-keys để lấy key API

## 3. Quản lý Trạng thái & Lỗi (State Management)
- **Hiển thị lỗi**:
  - Nếu tất cả các model đều thất bại -> Hiện thông báo lỗi màu đỏ, hiển thị nguyên văn lỗi từ API (VD: `429 RESOURCE_EXHAUSTED`).
  - Trạng thái các cột đang chờ phải chuyển thành **"Đã dừng do lỗi"**, tuyệt đối không được hiện "Hoàn tất" hoặc checkmark xanh nếu quy trình bị gián đoạn.
- **Tiến trình**:
  - Progress bar chỉ hiển thị trạng thái hoàn thành (xanh) khi bước đó thực sự thành công.

## 4. Triển khai (Deployment)
- **Nền tảng**: Vercel.
- **File bắt buộc**: `vercel.json` ở root để xử lý SPA routing.
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

## 5. Quy trình Đồng bộ Kho GitHub Desktop & Triển khai (Deployment Workflow)
- **Thư mục làm việc / phát triển chính**: `C:\Users\Admin\Desktop\newapp`
- **Kho Git cục bộ liên kết GitHub Desktop**: `C:\Users\Admin\Documents\GitHub\webhay`
- **Quy tắc đồng bộ chuẩn (BẮT BUỘC TUÂN THỦ TẤT CẢ CÁC LẦN SAU)**:
  1. **Kiểm tra build**: Sau khi sửa code, luôn chạy kiểm tra biên dịch (`npm run build` và `npm run lint`) tại `C:\Users\Admin\Desktop\newapp` đảm bảo đạt Exit code 0.
  2. **Đồng bộ file**: Sao chép toàn bộ các thư mục và file đã sửa đổi (`src/`, `public/`, `.github/`, `package.json`, `package-lock.json`, v.v.) từ `C:\Users\Admin\Desktop\newapp` sang `C:\Users\Admin\Documents\GitHub\webhay`.
  3. **Tạo Commit tại kho GitHub Desktop**: Chạy lệnh `git add .` và `git commit` trực tiếp trong kho `C:\Users\Admin\Documents\GitHub\webhay` với commit message chi tiết.
  4. **Không tự ý chạy lệnh push dài hạn gây treo**: Tránh chạy `git push` trực tiếp trên terminal nếu mạng chập chờn gây xoay task running. Luôn để sẵn commit ở trạng thái `Your branch is ahead of 'origin/main' by 1 commit` để Thầy chỉ cần mở **GitHub Desktop** và bấm nút **Push origin** an toàn 100%.

