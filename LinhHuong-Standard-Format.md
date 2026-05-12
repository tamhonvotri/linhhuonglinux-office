# Chuẩn Định dạng File và Lưu trữ Tạm thời - LinhHương Linux OS

Để đảm bảo hiệu năng cao, tránh lỗi (corruption) trong quá trình lưu trữ, dễ dàng phục hồi dữ liệu, và thân thiện với LLM, hệ điều hành LinhHương sử dụng chuẩn định dạng mở **.lhof (LinhHuong Open Format)** thay vì các chuẩn nhị phân phức tạp của Microsoft (.docx, .xlsx) hay Mac.

## 1. Cấu trúc File `.lhof` (LinhHuong Open Format)

Định dạng gốc của `.lhof` là một chuẩn cấu trúc **JSON-Markdown Hybrid**. Nó mang tính mở, có thể đọc được bằng mắt thường, và LLM có thể dễ dàng sinh/hiểu (parse/generate) mà không cần thư viện phức tạp.

```json
{
  "version": "1.0",
  "appType": "soan-thao", 
  "metadata": {
    "title": "Tên tài liệu",
    "author": "LinhHương User",
    "createdAt": "2026-05-13T01:00:00Z",
    "lastModified": "2026-05-13T01:00:00Z"
  },
  "content": {
    "blocks": [
      {
        "type": "paragraph",
        "data": "Nội dung văn bản thuần tủy bằng Markdown."
      },
      {
        "type": "formula",
        "data": "\\frac{a}{b}"
      }
    ]
  },
  "history": []
}
```

### Tiêu chí Thiết kế:
1. **Hiệu năng và Hữu dụng:** File nhẹ, chỉ chứa text (base64 cho các media nhẹ nếu cần, nhưng ưu tiên link tham chiếu). Tốc độ mở file cực nhanh.
2. **Khó bị lỗi và Khả năng Khôi phục (Resilience):** Vì là text thuần túy (JSON), nếu quá trình ghi bị ngắt, cấu trúc JSON có thể dễ dàng dùng các công cụ auto-fix JSON để cứu vãn phần lớn dữ liệu, thay vì hỏng toàn bộ như file nhị phân.
3. **Thân thiện với LLM & Developer:** LLM chỉ cần trả về một mảng JSON các `blocks` là ứng dụng có thể render ngay lập tức (đã áp dụng trên app `trinh-chieu`).

## 2. Quy tắc Lưu File Tạm (Auto-save & Temp Files)

Để chống mất dữ liệu khi mất điện hoặc crash ứng dụng, LinhHương OS áp dụng cơ chế **Double-Buffering Temp Storage**.

### Vị trí lưu:
- Mặc định lưu tại thư mục hệ thống: `~/.local/share/linhhuong-office/temp/`
- Hoặc thông qua `localStorage` / `IndexedDB` của trình duyệt WebView.

### Cơ chế hoạt động (Crash-Resistant):
1. Khi có thay đổi, ứng dụng ghi vào file `~/.local/share/linhhuong-office/temp/[ID]-working.lhbak`.
2. Ghi thành công 100% thì mới đổi tên đè lên file `.lhof` gốc hoặc `.lhof.lhbak`.
3. Trong thư mục làm việc luôn có `~[Tên File].lhof.lhbak` (ẩn). Nếu phát hiện file đang mở mà bị sập, lần mở sau OS sẽ tự động báo có bản nháp chưa lưu để phục hồi.
4. **LLM Checkpoint:** Mỗi khi AI sinh nội dung dài, ứng dụng sẽ lưu một điểm checkpoint cục bộ. Nếu user không thích có thể hoàn tác ngay lập tức, dữ liệu này nằm trong mảng `"history"` của file `.lhof` hoặc IndexedDB.

## 3. Khả năng Chịu lỗi khi Cập nhật Phiên bản (Forward/Backward Compatibility)

Để đảm bảo các file tài liệu được tạo ra hôm nay vẫn có thể mở an toàn trên các phiên bản OS tương lai (và ngược lại), cấu trúc `.lhof` bắt buộc tuân thủ nguyên tắc **"Bỏ qua nhưng không xoá" (Ignore but Preserve)**:

1. **Bảo tồn Dữ liệu Lạ (Unknown Fields):** Nếu một phiên bản cũ của app mở một file được tạo bởi phiên bản mới (có chứa block type mới như `3d-model`), app sẽ không bị crash. Nó sẽ ẩn hoặc hiển thị block đó dưới dạng văn bản thô (Fallback Text), và khi lưu lại, nó **bắt buộc phải giữ nguyên cấu trúc block gốc** mà không bị mất đi.
2. **Quản lý Phiên bản Lược đồ (Schema Versioning):** Trường `"version": "1.0"` ở đầu file đóng vai trò cốt lõi. Mỗi khi app được cập nhật, logic `engine.ts` sẽ chạy một hàm `migrateSchema()` lúc nạp file để tự động chuyển hoá cấu trúc cũ sang cấu trúc mới trong bộ nhớ tạm mà không làm hỏng file gốc.
3. **Mô-đun Độc Lập:** Các khối nội dung (blocks) hoạt động độc lập. Nếu một khối bị lỗi cấu trúc do cập nhật, chỉ khối đó bị vô hiệu hoá thay vì làm sập toàn bộ tài liệu.

## 4. Các định dạng mở rộng tương thích
- **Văn bản (`soan-thao`):** Dùng `.lhof` gốc hoặc `.md` (Markdown thuần).
- **Bảng tính (`bang-tinh`):** Cấu trúc mảng 2 chiều JSON hoặc `.csv` mở rộng.
- **Trình chiếu (`trinh-chieu`):** Dòng thời gian các "Scenes" và "Steps" (Mảng JSON).
- **Công thức (`cong-thuc`):** Chứa trực tiếp mã LaTeX hoặc Typst, có thể lưu riêng lẻ dưới dạng `.lhmath`.

*Ghi chú: Việc chuyển đổi (Convert Tool) từ `.docx` hay `.xlsx` sang `.lhof` sẽ được phát triển sau.*
