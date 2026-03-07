# Khánh Linh Shop - Áo Min

Mã nguồn Frontend và Backend giao diện cửa hàng (Landing Page) được thiết kế tối ưu, nhẹ, chuẩn Mobile-first. 

## 🚀 Tính năng nổi bật
* **Giao diện người dùng (UI):** Tối ưu hóa trải nghiệm trên thiết bị di động, tích hợp bộ đếm ngược Flash Sale, gallery ảnh trượt ngang và bảng chọn Sản phẩm/Màu sắc/Size bằng cúc bấm.
* **API Địa chính:** Tự động lấy danh sách Tỉnh/Thành phố, Quận/Huyện, Phường/Xã tại Việt Nam.
* **Backend xử lý đơn hàng:** Viết bằng PHP, thu thập dữ liệu khách hàng và thông tin sản phẩm.
* **Gửi Email Tự động:** Sử dụng thư viện **PHPMailer** kết hợp với **Gmail SMTP** để khắc phục lỗi chặn tính năng gửi mail (`mail()`) trên các hosting miễn phí (như InfinityFree). Đơn hàng sẽ được gửi trực tiếp về email của chủ shop.
* **Thank You Page:** Điều hướng người dùng sang trang đích chuyên nghiệp sau khi đặt hàng thành công.

## 📂 Cấu trúc dự án
- `index_replica.html` - Trang chủ hiển thị sản phẩm.
- `thank_you.html` - Trang thông báo đặt hàng thành công.
- `process_order.php` - Source code PHP để xử lý và gửi mail.
- `PHPMailer/` - Thư viện PHPMailer.
- `css/style_replica.css` - Tệp CSS chính.
- `js/script_replica.js` - Tệp Javascript xử lý logic giao diện ứng dụng.

## ⚙️ Cài đặt Backend (Nhận email qua Gmail)

Để nhận được email mỗi khi có người đặt hàng, bạn cần cấu hình mật khẩu ứng dụng Gmail (App Password):
1. Truy cập vào tài khoản Gmail dùng để nhận email (ví dụ: `yasuaola@gmail.com`).
2. Kích hoạt [Xác minh 2 bước (2-Step Verification)](https://myaccount.google.com/security).
3. Truy cập mục [App Passwords (Mật khẩu ứng dụng)](https://myaccount.google.com/apppasswords) và tạo một mật khẩu ứng dụng mới (ví dụ với tên "Shop Web").
4. Mở file `process_order.php` và thay thế đoạn mã `xxxx xxxx xxxx xxxx` tại dòng định nghĩa `GMAIL_APP_PASSWORD` bằng Mật khẩu ứng dụng 16 ký tự vừa copy được.
5. Đẩy toàn bộ source code này lên htdocs của Hosting (ví dụ InfinityFree). Đổi tên `index_replica.html` thành `index.html` để chạy làm trang mặc định.
