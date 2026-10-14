---
id: "01M4TZTR3GXKYNSV7S1QFPCX72"
title: "Bản Khai Báo Dự Án Bắt Buộc (Mandatory Project Intake Manifest)"
description: "Hồ sơ khai báo định danh, tài nguyên cổng, công nghệ và phạm vi nghiệp vụ của Hệ thống GDT Tax Crawler & Search Engine."
tags:
  - project-manifest
  - gdt-tax-crawler
  - intake
  - gatekeeper
category: "manifest"
aliases:
  - "01M4TZTR3GXKYNSV7S1QFPCX72"
  - "PROJECT_MANIFEST"
created_at: "2026-10-13T22:50:00+07:00"
---

# 📋 PROJECT_MANIFEST.md — Hệ Thống Vét Cạn Mã Số Thuế GDT

> **Trạng thái:** ✅ `APPROVED` (Đã phê duyệt đưa vào vận hành chuẩn)  
> **Dự án:** GDT Tax Crawler & Multi-Province Search Engine  
> **Mã định danh:** `gdt-tax-crawler`  

---

## PHẦN 1: ĐỊNH DANH & PHÂN BỔ TÀI NGUYÊN HẠ TẦNG

- [x] **1. Tên dự án (Project Name):** Hệ Thống Vét Cạn Mã Số Thuế & Tra Cứu Doanh Nghiệp GDT
- [x] **2. Mã định danh viết thường (Project Slug):** `gdt-tax-crawler`
- [x] **3. Thư mục chứa mã nguồn (Codebase Path):** `c:\tracuuhoadon.gdt.gov.vn`
- [x] **4. Cổng mạng Backend API Fastify (Web Gateway):** `:8123`
- [x] **5. Cổng mạng Python Worker (AI CAPTCHA Solver):** `:8124`
- [x] **6. Cổng mạng Frontend UI:** `:8123` (Phục vụ file tĩnh Vue 3 SPA qua Fastify hoặc WebView2 Bridge)
- [x] **7. CSDL PostgreSQL:** Port `:5433` (hoặc `:5432`), Database `taxdb`
- [x] **8. URL truy cập cục bộ:**
  - Web Dashboard: `http://127.0.0.1:8123`
  - Python Worker: `http://127.0.0.1:8124`
  - SSE Stream: `http://127.0.0.1:8123/api/stream`

---

## PHẦN 2: PHẠM VI NGHIỆP VỤ & RÀNG BUỘC (SCOPE & BOUNDARIES)

- [x] **1. Bài toán cần giải quyết (Problem Statement):**
  > Vét cạn tự động toàn bộ Mã Số Thuế (MST) doanh nghiệp của 62/63 tỉnh thành Việt Nam từ Tổng cục Thuế (`tracuuhoadon.gdt.gov.vn`), vượt rào F5 WAF, tự giải CAPTCHA bằng AI mô hình cục bộ và đối soát chéo với CSDL Bố cáo ĐKKD.
- [x] **2. Danh sách 5 tính năng cốt lõi (Core Features):**
  1. `Vét cạn đa tỉnh & Rolling Queue:` Tự động phân bổ luồng cào song song có kiểm soát rate limit.
  2. `AI CAPTCHA Solver:` Giải mã hình ảnh CAPTCHA trực tiếp bằng Deep Learning cục bộ (Port 8124) với độ chính xác >98%, không tốn chi phí API bên ngoài.
  3. `F5 WAF Defense & Circuit Breaker:` Cơ chế `safe_request_guard`, tự động hạ tải và cooldown khi phát hiện `Request Rejected`.
  4. `Đối soát Bố Cáo ĐKKD:` So khớp MST mới công bố từ Cổng Dịch vụ công ĐKKD với CSDL Thuế, tự động quét bù những MST chưa xuất hiện.
  5. `Desktop Control Manager:` Ứng dụng Desktop C# .NET 10 WinForms tích hợp WebView2, quản trị Start/Stop/Reset các Windows Service và kiểm tra trạng thái cổng mạng.
- [x] **3. Ranh giới ngoài phạm vi (Out of Scope):**
  - Không bypass trái phép vượt quá hạn ngạch an toàn của hệ thống thuế (`max_global_rps <= 32`).
  - Không lưu trữ thông tin mật/mật mã nộp thuế cá nhân.

---

## PHẦN 3: LỰA CHỌN CÔNG NGHỆ CHÍNH XÁC (TECH STACK)

- [x] **1. Backend Gateway:** Node.js Fastify + TypeScript (Port 8123, Clean Architecture, <180 lines/file).
- [x] **2. Frontend Dashboard:** Vue 3 Composition API SFC (`.vue`) + Vite + Tailwind CSS + SSE Client.
- [x] **3. Desktop Control GUI:** C# .NET 10 Windows Forms + Microsoft.Web.WebView2 Bridge.
- [x] **4. Crawler & AI Core:** Python 3.10+ (FastAPI, `curl_cffi` impersonate Chrome 124, TensorFlow CNN).
- [x] **5. Cơ sở dữ liệu:** PostgreSQL (Bảng `tax_records` 1.1M+ dòng, `bocao_records`, `crawl_stats_daily`).

---

## PHẦN 4: THỰC THỂ DỮ LIỆU & HỢP ĐỒNG API (DATA & CONTRACTS)

- [x] **1. Các bảng dữ liệu chính:**
  - `tax_records`: Lưu trữ thông tin NNT (MST, tên doanh nghiệp, địa chỉ, trạng thái, ngày cấp).
  - `bocao_records`: Lưu trữ dữ liệu công bố từ Cổng Bố cáo Đăng ký kinh doanh Quốc gia.
  - `crawl_stats_daily`: Bảng tổng hợp sản lượng quét theo ngày/tỉnh.
  - `regi_stats_daily`: Bảng thống kê theo ngày thành lập ĐKKD.
- [x] **2. Hợp đồng API Response Envelope:**
  - Định dạng chuẩn: `{ success: boolean, data?: any, error?: string, timestamp?: string }`
- [x] **3. Các trường kiểm toán bắt buộc:** `created_at`, `updated_at`, `scraped_at`.

---

## PHẦN 5: TRẠNG THÁI PHÊ DUYỆT (GATEKEEPER STATUS)

- **Trạng thái phê duyệt:** ✅ `APPROVED`
- **Ngày phê duyệt:** 2026-10-13
- **Quy chuẩn tuân thủ:** `GEMINI.md` (<180 lines ideal, hard cap 200), `AGENTS.md`, `CLAUDE.md`.
