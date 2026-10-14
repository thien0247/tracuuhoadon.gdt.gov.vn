# Kế Hoạch Triển Khai: Module Auto Crawl Bố Cáo Định Kỳ 2h Cho Component BocaoTab

> **Mục tiêu:** Xây dựng module/panel kích hoạt Auto Crawl Bố Cáo Điện Tử định kỳ (mặc định mỗi 2h) tích hợp vào component `BocaoTab` (`static/js/components/bocao-tab.js`), hỗ trợ tùy chỉnh chu kỳ, start/stop, trạng thái đếm ngược trực quan và nhật ký hoạt động.

---

## 1. Bối Cảnh & Phân Tích Kỹ Thuật

1. **Thực trạng component `BocaoTab`:**
   - Trước đây người dùng chỉ có thể cào thủ công bằng nút "⚡ Trang 1" hoặc "Cào Tất Cả".
   - Tệp `static/js/components/bocao-tab.js` đang có 177 dòng (rất sát giới hạn tối đa 180 dòng của Vue Component trong `GEMINI.md`).
   - Nếu viết trực tiếp toàn bộ logic lập lịch, đếm ngược, lưu trữ `localStorage` và log panel vào `bocao-tab.js`, tệp sẽ vượt quá 260+ dòng (vi phạm quy chuẩn).

2. **Giải pháp phân rã mô-đun:**
   - Tạo sub-component mới: `static/js/components/bocao-auto-crawl.js` (`<bocao-auto-crawl>`).
   - Nhúng sub-component này vào đầu component `BocaoTab` thông qua cơ chế Component Registration của Vue 3:
     `components: { 'bocao-auto-crawl': window.BocaoAutoCrawl }`.
   - Kết nối sự kiện `@crawled`: Mỗi khi một phiên auto crawl hoàn tất thành công, sub-component phát emit `@crawled` để `BocaoTab` tự động gọi `loadStats()` và `loadRecords(1)`.
   - Lưu trữ trạng thái cấu hình và lịch sử vào `localStorage` để giữ nguyên trạng thái khi reload trang.

---

## 2. Danh Sách Tệp Thay Đổi
- **[MỚI]** `static/js/components/bocao-auto-crawl.js`: Quản lý chu kỳ (30m, 1h, 2h, 4h, 6h, 12h), số trang (3, 5, 10, 20), start/stop, countdown và log panel (< 180 dòng).
- **[SỬA]** `static/js/components/bocao-tab.js`: Nhúng `<bocao-auto-crawl @crawled="onAutoCrawled" />`, tinh gọn template giữ tệp <= 180 dòng.
- **[SỬA]** `templates/index.html`: Khai báo script nạp `bocao-auto-crawl.js` trước `bocao-tab.js`.

---

## 3. Kế Hoạch Kiểm Thử
1. Kiểm tra số dòng code: `bocao-auto-crawl.js` <= 180 dòng, `bocao-tab.js` <= 180 dòng.
2. Kiểm tra countdown đếm ngược chuẩn từng giây.
3. Kiểm tra tính bền vững: Bật Auto Crawl, F5 trang web -> Kiểm tra xem trạng thái vẫn tiếp tục chạy.
4. Kiểm tra nút "Cào Ngay" và nút "Xóa nhật ký".
