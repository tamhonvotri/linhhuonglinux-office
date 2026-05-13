---
title: LinhHuong Linux Ecosystem
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: static
pinned: true
license: gpl
---

# 🚀 LinhHuong Linux Office Ecosystem 🐧

**LinhHuong Linux** là hệ điều hành mã nguồn mở tối ưu hóa chuyên sâu cho người dùng Việt Nam. Đi kèm với hệ điều hành là **Bộ ứng dụng văn phòng LinhHuong Office**, mang lại trải nghiệm chuyên nghiệp, nhanh gọn, và tương thích cao, hoàn toàn có thể thay thế các bộ phần mềm thương mại đắt đỏ.

![LinhHuong Office Demo](assets/demo/office_demo.webp)

---

## 🌟 Tính Năng Nổi Bật (Features)

### 1. 📝 Soạn Thảo Văn Bản (LinhHuong Word Processor)
Trình soạn thảo chuẩn mực, hỗ trợ căn chỉnh form hành chính nhà nước (Nghị định 30).
- Giao diện Zero-Menu tinh gọn, tập trung 100% vào nội dung.
- Kho mẫu đa dạng: Công văn, Quyết định, Tờ trình, Thông báo... (Tự động nhảy số).
- Xuất file `.pdf`, `.docx` mượt mà.

![Giao diện Soạn Thảo](assets/demo/soan_thao.png)

### 2. 📊 Bảng Tính Chuyên Nghiệp (LinhHuong Spreadsheet)
Engine tính toán mạnh mẽ, độ trễ bằng 0 (Zero-latency).
- **Hệ thống hàm thuần Việt:** `=TONG()` (SUM), `=TIMKIEMDOC()` (VLOOKUP), `=TIMKIEMNGANG()` (HLOOKUP)... dễ nhớ, dễ dùng.
- **Tính toán chéo Sheet (Cross-sheet):** Xử lý mượt mà dữ liệu khổng lồ liên kết giữa hàng trăm trang tính.
- Kiến trúc AST Evaluator hiện đại giúp phân tích cú pháp chuẩn xác.

![Giao diện Bảng Tính](assets/demo/bang_tinh.png)

### 3. 🛡️ Cửa Hàng Ứng Dụng (Software Center)
Hệ thống tự động liên kết với kho ứng dụng HuggingFace, giúp cập nhật phần mềm (OTA) chỉ với một cú click mà không cần thao tác dòng lệnh phức tạp.

---

## 🎯 Mục Tiêu Phát Triển (Trending Strategy)

Dự án đang hướng tới việc phổ cập Linux tại Việt Nam. Để hỗ trợ dự án **LinhHuong Linux** lên Top Trending của HuggingFace, chúng tôi đang triển khai các chiến lược:
1. **Mã nguồn Mở & Tối ưu:** Cung cấp bộ cài nhỏ gọn (dưới 50MB) chạy mượt trên cả máy tính cũ (RAM 2GB). 
2. **Cộng đồng đóng góp:** Khuyến khích Fork và đóng góp hàm/tính năng mới.
3. **Tích hợp AI Trí tuệ Nhân tạo:** Sắp tới sẽ tích hợp Llama / DeepSeek chạy Offline trực tiếp để tự động soạn văn bản.

## 📥 Cài đặt và Trải nghiệm
Mã nguồn này được viết bằng **Svelte + Tauri** để đóng gói ra đa nền tảng (`.deb`, `.exe`, `.AppImage`).

**Cài đặt môi trường:**
```bash
pnpm install
```

**Chạy thử nghiệm Soạn thảo:**
```bash
cd apps/soan-thao && pnpm dev
```

**Chạy thử nghiệm Bảng tính:**
```bash
cd apps/bang-tinh && pnpm dev
```

> **⭐ Hãy để lại 1 Star / Like nếu bạn thấy dự án hữu ích nhé!** Sự ủng hộ của bạn là động lực để chúng tôi phát triển hệ sinh thái phần mềm Việt.

---

## 📄 Giấy phép (License)

Dự án này được phân phối dưới giấy phép **GNU General Public License v3.0 (GPLv3)**. 
Bạn hoàn toàn có quyền tự do sao chép, chỉnh sửa và phân phối lại mã nguồn này vì mục đích cá nhân, giáo dục hoặc thương mại, với điều kiện mọi phiên bản phái sinh (nếu được phân phối) cũng phải được mở mã nguồn và chia sẻ dưới cùng giấy phép GPLv3.

Xem chi tiết đầy đủ tại file [LICENSE.txt](./LICENSE.txt).
