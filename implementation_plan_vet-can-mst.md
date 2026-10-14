# Prompt Chuẩn Hóa & Kế hoạch Thực thi

## Mục tiêu
Xây dựng công cụ **Vét cạn Mã số Thuế (MST) tỉnh Đắk Lắk** theo các ràng buộc sau:

### 1. Phạm vi MST
- Prefix tỉnh Đắk Lắk = `60` → toàn bộ dải `6000000000` → `6099999999` (100 triệu số).
- **Tối ưu hóa trước khi gửi request**: áp dụng **thuật toán checksum** từ `ktraCTrucTIN` (JavaScript → Python). Chỉ những MST vượt qua checksum mới được gửi lên API. Điều này giảm ~90% số request không cần thiết (chỉ còn ~10M MST hợp lệ).

### 2. Session Management (Tái sử dụng Session)
- Mỗi CAPTCHA chỉ cần giải **1 lần** và server lưu session cookie.
- Sau khi giải CAPTCHA thành công, dùng cùng `requests.Session()` để gửi nhiều request tra cứu MST liên tiếp.
- Khi session hết hạn (server trả về lỗi captcha/session), tự động làm mới CAPTCHA và tái tạo session.

### 3. Tối ưu hóa & Tránh nghẽn hệ thống
- **Concurrency**: Dùng `ThreadPoolExecutor` với 3-5 luồng song song (không dùng quá nhiều để không bị block IP).
- **Rate Limiting**: Độ trễ ngẫu nhiên 0.3 - 0.8 giây giữa các request.
- **Retry Logic**: Tự động retry tối đa 3 lần khi timeout hoặc lỗi mạng.
- **Resume**: Lưu trạng thái vào SQLite, cho phép tiếp tục từ nơi đã dừng (không query lại MST đã có).

### 4. Cơ sở dữ liệu (SQLite)
File: `dak_lak_tax.db`

Bảng `tax_records` với đầy đủ cột từ `tinModel`:
| Cột | Kiểu | Mô tả |
|-----|------|--------|
| `tin` | TEXT PRIMARY KEY | Mã số thuế |
| `norm_name` | TEXT | Tên đơn vị |
| `status` | TEXT | Mã trạng thái |
| `statusName` | TEXT | Mô tả trạng thái |
| `econ_name` | TEXT | Loại kinh tế |
| `economy` | TEXT | Mã loại kinh tế |
| `tran_addr` | TEXT | Địa chỉ |
| `tran_dist` | TEXT | Mã quận/huyện |
| `tran_tel` | TEXT | Số điện thoại |
| `tran_fax` | TEXT | Số fax |
| `pay_taxo_id` | TEXT | Mã cơ quan thuế |
| `pay_taxo_name` | TEXT | Tên cơ quan thuế |
| `pay_taxo_name_blhd` | TEXT | Tên cơ quan thuế (rút gọn) |
| `regi_date` | TEXT | Ngày đăng ký |
| `chan_date` | TEXT | Ngày thay đổi |
| `tu_ngay` | TEXT | Từ ngày |
| `den_ngay` | TEXT | Đến ngày |
| `pare_tin` | TEXT | MST công ty mẹ |
| `link` | TEXT | Link liên kết |
| `dvsd` | TEXT | Đơn vị sử dụng |
| `scraped_at` | TEXT | Thời điểm crawl |

Bảng `scan_progress`:
- `last_tin` TEXT: MST cuối cùng đã quét (để resume)
- `total_found` INT: Số lượng tìm thấy

### 5. Giao diện GUI
- **Nút Start/Pause/Resume/Stop**
- Hiển thị tiến độ: tổng MST đã quét / tổng hợp lệ / tìm thấy
- Hiển thị log các MST tìm thấy theo thời gian thực
- Hiển thị CAPTCHA hiện tại và giá trị giải được
- Thanh progress bar

## Files sẽ tạo
- `crawler_dak_lak.py` — Core: checksum filter, session manager, crawler engine, SQLite writer
- `crawler_gui.py` — GUI Tkinter điều khiển crawler
