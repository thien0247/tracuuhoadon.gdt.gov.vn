# Kế Hoạch: Cào Toàn Bộ Các Trang Bố Cáo & Tra Cứu Trực Tuyến Qua API `GetSearch` (DKKD)

## 1. Mục Tiêu Triển Khai
Theo yêu cầu nâng cấp component `<BocaoTab />`:
1. **Bổ sung cào hết các trang đang có:**
   - Thay vì chỉ cào trang 1 (20 tin), hệ thống sẽ hỗ trợ cào toàn bộ các trang hiện diện trong Pager của `DefaultAnnouncements.aspx` (Trang 1, 2, 3, 4, 5... tương ứng ~110 bố cáo mới nhất).
   - Cơ chế: Thu thập tuần tự qua ASP.NET Postback với `__EVENTTARGET = 'ctl00$C$CtlList'` và `__EVENTARGUMENT = 'Page$N'`, kế thừa `__EVENTVALIDATION` và token `ctl00$hdParameter`.
2. **Thêm tính năng tra cứu trực tuyến qua API `GetSearch` của DKKD:**
   - URL: `https://bocaodientu.dkkd.gov.vn/egazette/Public/Srv.aspx/GetSearch`
   - Phương thức: `POST` với payload `{ 'searchField': '<MST hoặc từ khóa>', 'h': '<dynamic_token>' }`
   - Token `h`: Được bóc tách tự động theo thời gian thực từ input ẩn `ctl00_hdParameter` trên trang `DefaultAnnouncements.aspx`.
   - Kết quả trích xuất gồm thông tin cực kỳ phong phú từ cơ sở dữ liệu Apache Solr của Bộ KH&ĐT:
     - **Mã số thuế / Mã số doanh nghiệp** (`Enterprise_Gdt_Code`)
     - **Tên pháp lý tiếng Việt** (`Name`)
     - **Tên tiếng nước ngoài / tiếng Anh** (`Name_F`)
     - **Tên viết tắt** (`Short_Name`)
     - **Người đại diện theo pháp luật** (`Legal_First_Name`)
     - **Địa chỉ trụ sở chính** (`Ho_Address`)
     - **Mã nội bộ DKKD** (`Enterprise_Code`, `Id`, `City_Id`, `Ward_Id`)
   - Hiển thị trực quan trên giao diện `BocaoTab`:
     - Nút **"⚡ Cào Tất Cả Trang"** (All Pages).
     - Ô tra cứu trực tuyến DKKD với popup xem chi tiết đầy đủ tên tiếng Anh, người đại diện và địa chỉ.
     - Nút tra cứu nhanh 🔍 bên cạnh mỗi Mã số thuế trên bảng danh sách.

---

## 2. Thiết Kế Kỹ Thuật Chi Tiết

### 2.1. Nâng cấp Python Worker Service (`server_app/services/bocao_crawler.py`)
- Hàm `crawl_all_bocao_pages(max_pages: int = 5) -> Dict[str, Any]`:
  - Khởi tạo session `curl_cffi` (Chrome 124).
  - Tải Trang 1, trích xuất dữ liệu và xác định các trang kế tiếp từ Pager (`Page$2`, `Page$3`, ...).
  - Lặp qua các trang bằng Postback sạch (chỉ gửi viewstate + event target, không gửi submit buttons).
  - Ghi nhận lô toàn bộ các trang vào bảng `bocao_records` với `ON CONFLICT DO NOTHING`.
  - Trả về tổng số tin tìm thấy và số bản ghi mới thêm vào CSDL.
- Hàm `query_dkkd_solr(search_field: str) -> List[Dict[str, Any]]`:
  - Lấy token `h` mới nhất từ `ctl00_hdParameter`.
  - Gọi POST `/egazette/Public/Srv.aspx/GetSearch` với headers chuẩn và body JSON.
  - Trả về danh sách doanh nghiệp `d` với đầy đủ tên tiếng Anh, người đại diện, địa chỉ.
- Thêm 2 endpoints vào `worker_bridge.py`:
  - `POST /worker/bocao/crawl_all`: Cào toàn bộ các trang.
  - `POST /worker/bocao/get_search`: Tra cứu trực tuyến doanh nghiệp.

### 2.2. Nâng cấp Fastify TypeScript Module (`src/modules/bocao/`)
- `bocao.types.ts`: Bổ sung interface `DkkdEnterpriseProfile` và `BocaoCrawlAllResponse`.
- `bocao.service.ts`:
  - `triggerCrawlAll(maxPages?: number)`: Gọi `POST /worker/bocao/crawl_all`.
  - `searchDkkdOnline(searchField: string)`: Gọi `POST /worker/bocao/get_search`.
- `bocao.routes.ts`:
  - `POST /api/bocao/crawl-all`
  - `POST /api/bocao/dkkd-search`

### 2.3. Nâng cấp Frontend (`static/js/components/bocao-tab.js`)
- Bổ sung nút **"⚡ Cào Tất Cả Trang"** cạnh nút cào trang hiện tại.
- Bổ sung modal hoặc panel **"Tra Cứu Trực Tuyến DKKD Solr"**:
  - Gõ MST hoặc Tên, bấm "Tra cứu DKKD".
  - Hiển thị bảng chi tiết gồm: Tên tiếng Việt, Tên tiếng Anh (`Name_F`), Tên viết tắt, Người đại diện pháp luật, Địa chỉ trụ sở chính, Mã số nội bộ DKKD.
- Đảm bảo độ dài `bocao-tab.js` tuân thủ nghiêm ngặt **< 180 dòng** (nếu cần, tách modal chi tiết sang sub-component).

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu
1. **Kiểm thử cào toàn bộ các trang:**
   - Kích hoạt cào tất cả trang qua API và giao diện.
   - Xác nhận cào thành công ~100-110 bố cáo và lưu vào `bocao_records`.
2. **Kiểm thử tra cứu `GetSearch`:**
   - Gửi yêu cầu tìm kiếm MST `2500785751` và từ khóa công ty.
   - Xác nhận nhận về đầy đủ Tên tiếng Anh, Người đại diện `VŨ THU HẠNH` và Địa chỉ trụ sở.
3. **Kiểm tra Quy Chuẩn Code:**
   - 100% tệp TypeScript < 200 dòng (`check_ts_line_limits.ts`).
   - `bocao-tab.js` < 180 dòng.
   - `npx tsc --noEmit` đạt 0 lỗi.
4. **Quy định Rule 6 (Audit Logs):**
   - Lưu bản sao Kế hoạch vào `docs/logs/24_20260920_143500_implementation_plan.md`.
   - Cập nhật `docs/logs/INDEX.md`.
