# Kế Hoạch Triển Khai: Tích Hợp CSDL Địa Bàn Hành Chính & Cơ Quan Thuế HTKK (Mô Hình 3 Cấp & 2 Cấp)

Kế hoạch này phân tích toàn diện kho dữ liệu danh mục HTKK (Hỗ Trợ Kê Khai - Tổng cục Thuế), đề xuất cấu trúc bảng chuẩn hóa trong PostgreSQL, viết lại prompt yêu cầu kỹ thuật chuẩn và thiết lập lộ trình thực thi từ CSDL đến REST API.

---

## 1. Bản Viết Lại Prompt Chuẩn (Standardized Technical Specification)

> ### **ĐẶC TẢ YÊU CẦU KỸ THUẬT: HỆ THỐNG DANH MỤC ĐỊA BÀN HÀNH CHÍNH & CƠ QUAN THUẾ HTKK**
>
> **1. Bối Cảnh Nghiệp Vụ:**
> Ngành Thuế và bộ máy hành chính Việt Nam đang trải qua bước chuyển đổi lịch sử:
> - **Mô hình chính quyền 3 cấp truyền thống:** Tỉnh/Thành phố $\rightarrow$ Quận/Huyện/Thị xã $\rightarrow$ Xã/Phường/Thị trấn. Tương ứng với hệ thống Thuế gồm: Cục Thuế Tỉnh $\rightarrow$ Chi cục Thuế Quận/Huyện.
> - **Mô hình chính quyền 2 cấp cải cách:** Tỉnh/Thành phố $\rightarrow$ Xã/Phường (**ĐÃ BỎ CẤP HUYỆN**, giảm trung gian hành chính và sáp nhập mở rộng quy mô các đơn vị). Tương ứng là mạng lưới **Thuế cơ sở** trực thuộc Cục Thuế quản lý trực tiếp theo địa bàn liên xã.
> - Thư mục `htkk/` lưu trữ toàn bộ 137 tệp XML danh mục chính thức từ phiên bản HTKK 526 đến 537.
>
> **2. Mục Tiêu Triển Khai:**
> - **Phân tích toàn diện (ETL Analysis):** Bóc tách cấu trúc 137 tệp XML, phân định rõ ràng các tệp thuộc mô hình 3 cấp, mô hình 2 cấp và các bảng ánh xạ sáp nhập (Mapping).
> - **Thiết kế Schema CSDL PostgreSQL:** Xây dựng hệ thống bảng chuẩn hóa lưu trữ trọn vẹn danh mục địa bàn 3 cấp, địa bàn 2 cấp mới, danh mục cơ quan thuế và các quan hệ ánh xạ chuyển đổi.
> - **Xây dựng ETL Migration Script:** Nhập liệu tự động toàn bộ 15.000+ địa bàn và 3.380+ cơ quan thuế vào PostgreSQL với tốc độ cao, toàn vẹn dữ liệu.
> - **Xây dựng Module API Tra Cứu & Chuẩn Hóa:** Cung cấp REST API cho phép:
>   1. Tra cứu địa bàn và cơ quan thuế theo mô hình 3 cấp cũ.
>   2. Tra cứu địa bàn và thuế cơ sở theo mô hình 2 cấp mới.
>   3. Chuyển đổi qua lại giữa 3 cấp và 2 cấp (Bridge Mapping).
>   4. Chuẩn hóa địa chỉ và tự động xác định cơ quan thuế cho NNT trong bảng `tax_records`.
> - **Lập Tài Liệu Kỹ Thuật Topic 04:** Ghi nhận kiến trúc dữ liệu vào `docs/topics/topic-04-htkk-administrative-tax-taxonomy.md`.

---

## 2. Kết Quả Phân Tích Dữ Liệu Thư Mục `htkk/`

Qua phân tích tự động bằng script trên toàn bộ 137 tệp XML, hệ thống xác định 3 nhóm dữ liệu:

### 2.1. Nhóm Dữ Liệu Mô Hình 3 Cấp (Có cấp Huyện)
| Tệp Tin | Số Bản Ghi | Cấu Trúc Giá Trị (XML Value) | Ý Nghĩa Nghiệp Vụ |
|:---|:---:|:---|:---|
| `Catalogue_Dia_Ban_Tinh.xml` | 64 | `0###[MaTinh]###[TenTinh]` | 63 tỉnh/thành phố truyền thống (Hà Nội `101`, Hải Phòng `103`, TP.HCM `701`...) |
| `Catalogue_Dia_Ban_Huyen.xml` | 718 | `0###[MaTinh]###[MaHuyen]###[TenHuyen]` | 718 Quận/Huyện/Thị xã trên toàn quốc |
| `Catalogue_Dia_Ban_Xa.xml` | 11.966 | `0###[MaTinh]###[MaHuyen]###[MaXa]###[TenXa]` | 11.966 Xã/Phường/Thị trấn (mã 7 chữ số) |

### 2.2. Nhóm Dữ Liệu Mô Hình 2 Cấp Mới (Đã Bỏ Cấp Huyện)
| Tệp Tin | Số Bản Ghi | Cấu Trúc Giá Trị (XML Value) | Ý Nghĩa Nghiệp Vụ |
|:---|:---:|:---|:---|
| `Catalogue_Dia_Ban_Tinh_Moi.xml` | 35 | `0###[MaTinh]###[TenTinh]` | 34 tỉnh/thành phố mới sau quy hoạch sáp nhập |
| `Catalogue_Dia_Ban_Xa_Moi.xml` | 3.322 | `[MaTinh]###[MaXaMoi]###[TenXaMoi]` | 3.322 xã/phường mới (mã 8 chữ số). **Trực tiếp thuộc Tỉnh, không có cấp Huyện** |
| `Catalogue_CoQuanThu.xml` | 3.386 | `[MaTinh]###[MaCQThu]###[TenCQThu]` | Danh mục cơ quan thu mới gồm Cục thuế và các **Thuế cơ sở** theo địa bàn |
| `Catalogue_CQThu_Dia_Ban.xml` | 3.383 | `MaXa="[MaXa]" MaCQThu="[MaCQT]" TenCQThu="[Ten]"` | Ánh xạ trực tiếp từng Xã mới sang Thuế cơ sở quản lý |

### 2.3. Nhóm Bảng Ánh Xạ Chuyển Đổi (Mapping / Bridge)
| Tệp Tin | Số Bản Ghi | Cấu Trúc | Ý Nghĩa Nghiệp Vụ |
|:---|:---:|:---|:---|
| `Catalogue_Dia_Ban_Tinh_Map.xml` | 34 | `MaCu="103,107" MaMoi="103"` | Ánh xạ các tỉnh cũ sáp nhập vào tỉnh mới (VD: Hải Phòng 103 + Hải Dương 107 $\rightarrow$ Hải Phòng 103) |
| `Catalogue_Dia_Ban_Xa_Map.xml` | 3 | `MaCu="1010101,1010103,..." MaMoi="1010107"` | Ánh xạ danh sách xã cũ sáp nhập vào xã mới |
| `Catalogue_CQT_Dia_Ban.xml` | 3.386 | `[MaXa]###[MaCQT]###[TenCQT]` | Tra cứu cơ quan thuế quản lý theo mã địa bàn |

---

## User Review Required

> [!IMPORTANT]
> **Quyết Định Kiến Trúc Lưu Trữ Trong PostgreSQL:**
> Đề xuất tạo tiền tố bảng `htkk_` để cách ly hoàn toàn với các bảng lõi của hệ thống (`tax_records`, `provinces`), đảm bảo tính độc lập và toàn vẹn của từ điển dữ liệu chuẩn.

> [!TIP]
> **Tạo View Hợp Nhất (Consolidated Cross-Reference View):**
> Sẽ tạo sẵn View `v_htkk_administrative_mapping` liên kết trực tiếp:
> `Tỉnh cũ -> Huyện cũ -> Xã cũ <=> Tỉnh mới -> Xã mới -> Thuế cơ sở quản lý`.

---

## Open Questions

Không có câu hỏi chặn. Hệ thống tuân thủ nguyên tắc Modular Architecture và Line Limits (< 200 dòng/file).

---

## Proposed Changes

### Component 1: CSDL PostgreSQL — Migration DDL

#### [NEW] [`src/db/migrations/003_create_htkk_tables.sql`](file:///c:/tracuuhoadon.gdt.gov.vn/src/db/migrations/003_create_htkk_tables.sql)
- `htkk_provinces_v3` (Mô hình 3 cấp - Tỉnh): `province_code`, `province_name`, `version`
- `htkk_districts_v3` (Mô hình 3 cấp - Huyện): `district_code`, `province_code`, `district_name`
- `htkk_communes_v3` (Mô hình 3 cấp - Xã): `commune_code`, `district_code`, `province_code`, `commune_name`, `is_expired`
- `htkk_provinces_v2` (Mô hình 2 cấp - Tỉnh mới): `province_code`, `province_name`, `version`
- `htkk_communes_v2` (Mô hình 2 cấp - Xã mới, BỎ HUYỆN): `commune_code`, `province_code`, `commune_name`
- `htkk_tax_offices` (Danh mục Cơ quan thuế / Thuế cơ sở): `tax_office_code`, `tax_office_name`, `province_code`, `tax_office_type`
- `htkk_commune_tax_office_map` (Ánh xạ Xã mới $\rightarrow$ Thuế cơ sở)
- `htkk_province_map` (Ánh xạ Tỉnh cũ $\rightarrow$ Tỉnh mới)
- `v_htkk_administrative_mapping` (View hợp nhất đa cấp)

---

### Component 2: ETL Pipeline Nạp Dữ Liệu HTKK

#### [NEW] [`src/modules/htkk/htkk.importer.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/htkk/htkk.importer.ts) (Dự kiến ~160 dòng, < 180 dòng)
- Bộ nạp dữ liệu XML streaming / DOM parser:
  - Đọc và phân rã các chuỗi `###` của 137 tệp XML trong `htkk/`.
  - Batch insert bằng PostgreSQL `UNNEST` hoặc prepared statement lô 1.000 dòng.
  - Tự động hoàn thành toàn bộ quá trình nạp trong < 5 giây.

---

### Component 3: Backend Module Tra Cứu HTKK (`src/modules/htkk/`)

#### [NEW] [`src/modules/htkk/htkk.types.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/htkk/htkk.types.ts) (~80 dòng, < 150 dòng)
- Interfaces cho đơn vị hành chính 3 cấp, 2 cấp, cơ quan thuế, mapping DTOs.

#### [NEW] [`src/modules/htkk/htkk.service.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/htkk/htkk.service.ts) (~150 dòng, < 180 dòng)
- Các hàm nghiệp vụ:
  - `getProvincesV3()`, `getDistrictsV3(provinceCode)`, `getCommunesV3(districtCode)`
  - `getProvincesV2()`, `getCommunesV2(provinceCode)`
  - `getTaxOffices(provinceCode?)`, `getTaxOfficeByCommune(communeCode)`
  - `lookupAddressMapping(addressText)`: Phân tích địa chỉ văn bản, bóc tách và chuyển đổi giữa 3 cấp và 2 cấp.

#### [NEW] [`src/modules/htkk/htkk.routes.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/htkk/htkk.routes.ts) (~120 dòng, < 170 dòng)
- REST endpoints Fastify:
  - `GET /api/htkk/v3/provinces`
  - `GET /api/htkk/v3/districts/:provinceCode`
  - `GET /api/htkk/v3/communes/:districtCode`
  - `GET /api/htkk/v2/provinces`
  - `GET /api/htkk/v2/communes/:provinceCode`
  - `GET /api/htkk/tax-offices`
  - `POST /api/htkk/import`: Kích hoạt nạp dữ liệu từ thư mục `htkk/`

#### [NEW] [`src/modules/htkk/index.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/htkk/index.ts) (~20 dòng)
- Barrel export của module.

#### [MODIFY] [`src/app.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/app.ts)
- Đăng ký `htkkRoutes` vào Fastify instance.

---

### Component 4: Tài Liệu Kỹ Thuật Topic 04

#### [NEW] [`docs/topics/topic-04-htkk-administrative-tax-taxonomy.md`](file:///c:/tracuuhoadon.gdt.gov.vn/docs/topics/topic-04-htkk-administrative-tax-taxonomy.md)
- Phân tích chi tiết mô hình chính quyền 3 cấp (có huyện) vs mô hình 2 cấp (đã bỏ huyện).
- Sơ đồ ERD quan hệ dữ liệu giữa các bảng `htkk_*`.
- Ma trận chuyển đổi địa giới hành chính và tổ chức cơ quan thuế mới.

#### [MODIFY] [`docs/TOPICS.md`](file:///c:/tracuuhoadon.gdt.gov.vn/docs/TOPICS.md)
- Bổ sung Topic 04 vào mục lục tài liệu kỹ thuật.

---

## Verification Plan

### Automated Tests
1. **Kiểm tra giới hạn số dòng code TypeScript (< 200 dòng):**
   ```bash
   npx tsx tests/check_ts_line_limits.ts
   ```
2. **Kiểm tra giới hạn số dòng code Python & Vue (< 200 dòng):**
   ```bash
   python -c "from test_modular import check_line_counts; check_line_counts()"
   ```
3. **Biên dịch TypeScript:**
   ```bash
   npm run build
   ```

### Data Verification Tests
1. **Kiểm tra số lượng bản ghi nạp vào CSDL:**
   - `htkk_provinces_v3`: 64 bản ghi
   - `htkk_districts_v3`: 718 bản ghi
   - `htkk_communes_v3`: 11.966 bản ghi
   - `htkk_provinces_v2`: 35 bản ghi
   - `htkk_communes_v2`: 3.322 bản ghi
   - `htkk_tax_offices`: 3.386 bản ghi
   - `htkk_commune_tax_office_map`: 3.383 bản ghi
   - `htkk_province_map`: 34 bản ghi
2. **Kiểm tra API Fastify:**
   - Tra cứu địa bàn 3 cấp của Hà Nội: `GET /api/htkk/v3/districts/101`
   - Tra cứu địa bàn 2 cấp của Hà Nội (không còn huyện): `GET /api/htkk/v2/communes/101`
   - Tra cứu Thuế cơ sở phụ trách xã mới: `GET /api/htkk/tax-offices?communeCode=10129087`
