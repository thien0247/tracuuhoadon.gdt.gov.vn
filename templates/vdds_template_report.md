# 📘 BÁO CÁO TEMPLATE HỆ THỐNG VDDS
## HỆ THỐNG ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP — VNPT ĐẮK LẮK

> **Phiên bản:** VDDS v2.5 | **Ngày lập:** 18/09/2026 | **Tác giả:** VNPT Đắk Lắk

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Giới thiệu

VDDS (VNPT Đắk Lắk Dashboard System) là hệ thống điều hành quản trị doanh nghiệp nội bộ được xây dựng theo mô hình **Single Page Application (SPA)** với kiến trúc **Domain-Driven Modular Frontend** kết hợp **Python HTTP Backend**.

| Thông số | Giá trị |
|----------|---------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Python 3.x (HTTPServer thuần) |
| **Database** | PostgreSQL 5433 |
| **Port Dev** | Frontend: 5174, Backend: 5178 |
| **Font** | Plus Jakarta Sans + Quicksand (Google Fonts) |
| **Icon lib** | lucide-react |
| **URL Pattern** | `/?module=<slug>` |

### 1.2. Danh sách Module Hiện Có

| Slug | Tên Hiển Thị | Mô tả |
|------|-------------|-------|
| `kpi` | Kết quả chỉ tiêu điều hành | KPI Tree grid phân cấp |
| `doanh-thu-cntt` | Doanh thu CNTT địa bàn | TH1→TH9 tabs, sync Portal |
| `khach-hang-tcdn` | Khách hàng TCDN | Danh sách khách hàng doanh nghiệp |
| `ban-do-dan-cu` | Bản đồ dân cư | GIS Leaflet 300k+ điểm dân cư |
| `ban-do-report` | Báo cáo thống kê TTVT | 21 báo cáo so sánh TTVT |
| `luong-cntt` | Lương CNTT | Bảng lương 12 kỳ, pivot query |
| `bc-vt-cntt-xa-phuong` | Quản trị VT-CNTT xã/phường | 102 xã phường |
| `quan-ly-cookie` | Quản lý Cookie & Đồng bộ | SSO cookie Portal VDDS |
| `giao-doanh-thu-nhan-vien` | Giao doanh thu nhân viên | Edit chỉ tiêu DT theo tháng |
| `gia-han-cntt` | Gia hạn DV CNTT | Gia hạn theo AM & 102 phường/xã |

---

## 2. KIẾN TRÚC TỔNG THỂ (Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   React SPA  — http://localhost:5174/?module=<slug>      │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │                   App.tsx                        │   │    │
│  │  │  ┌──────────┐  ┌─────────────────────────────┐  │   │    │
│  │  │  │  Header  │  │     Content Area             │  │   │    │
│  │  │  │ (sticky) │  │  ┌──────────────────────┐   │  │   │    │
│  │  │  └──────────┘  │  │   <ModuleView />      │   │  │   │    │
│  │  │  ┌──────────┐  │  │  (route by ?module=)  │   │  │   │    │
│  │  │  │ Sidebar  │  │  └──────────────────────┘   │  │   │    │
│  │  │  │(240/50px)│  └─────────────────────────────┘  │   │    │
│  │  │  └──────────┘                                    │   │    │
│  │  │  ┌──────────────────────────────────────────┐   │   │    │
│  │  │  │   Footer (copyright + version)           │   │   │    │
│  │  │  └──────────────────────────────────────────┘   │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ fetch /api/*
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Python HTTP Server — http://localhost:5178               │
│  khtcdn_server.py (main router)                                  │
│  ├── cookie_api.py         → /api/cookie/*                       │
│  ├── giahan_cntt_api.py    → /api/gia-han-cntt/*                 │
│  ├── doanhthu_th2_api.py   → /api/doanhthu-th2/*                 │
│  └── ...other_api.py       → /api/<domain>/*                     │
│                              │                                   │
│                              ▼                                   │
│         PostgreSQL :5433    (psycopg2)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1. Cấu trúc thư mục nguồn

```
web-app/src/
├── App.tsx                 # Entry: layout tổng, routing ?module=
├── index.css               # Design tokens (CSS custom properties)
├── App.css                 # Legacy Vite starter CSS (giữ lại)
├── main.tsx                # React.StrictMode mount
├── data/
│   ├── menuData.ts         # FULL_MENU_DATA — cấu hình menu sidebar
│   └── sampleTreeData.ts   # Dữ liệu mẫu KPI Tree
├── shared/                 # Shared UI components dùng chung
│   └── ...
├── assets/                 # Static assets (logo, images)
└── modules/
    ├── core/               # Header, Sidebar, useTheme
    ├── filters/            # TabSelector, ControlBar, useFilters
    ├── kpi-tree/           # KPI phân cấp
    ├── export/             # Excel export utility
    ├── charts/             # Biểu đồ
    ├── stats/              # Thẻ thống kê
    ├── doanh-thu-cntt/     # Module doanh thu (TH1-TH9)
    ├── khach-hang-tcdn/    # Module khách hàng TCDN
    ├── ban-do-dan-cu/      # GIS Leaflet module
    ├── luong-cntt/         # Module lương CNTT
    ├── bc-vt-cntt-xa-phuong/
    ├── quan-ly-cookie/     # Cookie & Portal sync
    ├── giao-doanh-thu-nhan-vien/
    └── gia-han-cntt/       # Module gia hạn CNTT
```

---

## 3. DESIGN SYSTEM — HỆ THỐNG THIẾT KẾ

### 3.1. Design Tokens (CSS Custom Properties)

File: [`index.css`](file:///c:/vdds.vnptdaklak.vn/web-app/src/index.css)

#### 3.1.1. Màu sắc thương hiệu VNPT

```css
/* VNPT Brand Colors */
--vnpt-blue:           #005baa;   /* Primary — header, active states */
--vnpt-blue-light:     #0284c7;   /* Secondary accent */
--vnpt-blue-gradient:  linear-gradient(135deg, #005baa 0%, #0284c7 100%);
--accent-cyan:         #06b6d4;   /* Highlight accent */
```

#### 3.1.2. Nền & Surface

```css
/* Light Mode */
--bg-primary:          #f8fafc;   /* Page background */
--bg-secondary:        #ffffff;   /* Sidebar, footer bg */
--bg-card:             #ffffff;   /* Card background */
--bg-card-hover:       #f1f5f9;   /* Card hover state */
--bg-card-glass:       rgba(255, 255, 255, 0.85); /* Glassmorphism */

/* Dark Mode (data-theme='dark') */
--bg-primary:          #0b1329;
--bg-secondary:        #0f172a;
--bg-card:             #1e293b;
--bg-card-hover:       #26354a;
--bg-card-glass:       rgba(30, 41, 59, 0.85);
```

#### 3.1.3. Text Colors

```css
--text-primary:        #0f172a;   /* Heading, body text */
--text-secondary:      #475569;   /* Subtext, labels */
--text-muted:          #94a3b8;   /* Placeholder, meta info */
```

#### 3.1.4. Badge System (trạng thái)

```css
/* Success/Green */
--badge-green-bg:      #dcfce7;
--badge-green-text:    #15803d;
--badge-green-border:  #86efac;

/* Info/Blue */
--badge-blue-bg:       #e0f2fe;
--badge-blue-text:     #0369a1;
--badge-blue-border:   #7dd3fc;

/* Warning/Amber */
--badge-amber-bg:      #fef3c7;
--badge-amber-text:    #b45309;
--badge-amber-border:  #fcd34d;

/* Danger/Red */
--badge-red-bg:        #fee2e2;
--badge-red-text:      #b91c1c;
--badge-red-border:    #fca5a5;
```

#### 3.1.5. Shadow Levels

```css
--shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-glow: 0 0 15px rgba(0, 91, 170, 0.25);  /* Blue glow on hover */
```

### 3.2. Typography

| Class/Usage | Font | Weight | Size |
|-------------|------|--------|------|
| Body text | Plus Jakarta Sans | 400-500 | 0.875rem |
| Labels | Plus Jakarta Sans | 600 | 0.78-0.82rem |
| Header brand | Quicksand | 800 | 1.25rem |
| Headings (h1) | Plus Jakarta Sans | 700 | 1.35rem |
| Muted/meta | Plus Jakarta Sans | 400 | 0.68-0.74rem |

### 3.3. Utility Classes

```css
/* Buttons */
.btn-primary   { background: var(--vnpt-blue-gradient); color: #fff; ... }
.btn-outline   { background: var(--bg-secondary); border: 1px solid var(--border-color); ... }

/* Glassmorphism Card */
.card-glass    { background: var(--bg-card-glass); backdrop-filter: blur(12px); ... }
```

### 3.4. Custom Scrollbar

```css
::-webkit-scrollbar       { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
```

---

## 4. SHARED COMPONENTS — CÁC COMPONENT DÙNG CHUNG

### 4.1. Header Component

**File:** [`modules/core/components/Header.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/core/components/Header.tsx)

```tsx
<Header
  theme={theme}                    // 'light' | 'dark'
  onToggleTheme={toggleTheme}
  isSidebarCollapsed={collapsed}
  onToggleSidebar={() => setCollapsed(!collapsed)}
  userName="Mai Hoàng Thiên"       // Tên người dùng
  userUnit="VNPT Krông Năng"       // Đơn vị
/>
```

**Đặc điểm:**
- Sticky top (height: 50px), `z-index: 50`
- Màu nền `#005baa` (VNPT Blue)
- Logo box trái thu gọn theo sidebar (240px → 50px)
- Dark/Light toggle (Moon/Sun icon)
- User card với avatar + tên + đơn vị
- Logout button

### 4.2. Sidebar Component

**File:** [`modules/core/components/Sidebar.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/core/components/Sidebar.tsx)

```tsx
<Sidebar
  isCollapsed={isSidebarCollapsed}    // true: 50px width
  activeSubmenu={activeMenu}           // Tên menu đang active
  onSelectSubmenu={handleSelectMenu}   // Callback khi click submenu
/>
```

**Đặc điểm:**
- Width: 240px (mở) / 50px (thu gọn), transition 0.25s
- Sticky, `height: calc(100vh - 50px)`, `top: 50px`
- User panel: avatar gradient + tên + trạng thái Online
- Search box lọc menu realtime
- Menu 2 cấp: Group (icon + tên) → Submenu items
- Active item: `border-left: 3px solid var(--vnpt-blue)`
- Data driven từ `data/menuData.ts` (FULL_MENU_DATA)

### 4.3. MonthPicker Component

**File:** [`modules/doanh-thu-cntt/components/MonthPicker.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/doanh-thu-cntt/components/MonthPicker.tsx)

```tsx
<MonthPicker
  value="09/2026"               // Format: "MM/YYYY"
  onChange={(val) => setMonth(val)}
/>
```

**Đặc điểm:**
- Button trigger hiển thị tháng hiện tại
- Popup calendar: lưới 3×4 (12 tháng)
- Điều hướng năm bằng mũi tên ◀▶
- Click outside để đóng
- Highlight tháng đang chọn (VNPT Blue)

### 4.4. useTheme Hook

**File:** [`modules/core/hooks/useTheme.ts`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/core/hooks/useTheme.ts)

```tsx
const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
// toggleTheme: () => void — gán data-theme vào <html>
```

---

## 5. MODULE PATTERN — CHUẨN CẤU TRÚC MODULE

### 5.1. Cấu trúc thư mục chuẩn

```
src/modules/<feature-name>/
├── components/
│   ├── <Feature>View.tsx       # Entry point (≤250 lines)
│   ├── <Feature>FilterBar.tsx  # Filter/action bar
│   ├── <Feature>Table.tsx      # Data table
│   └── <Feature>Modal.tsx      # Detail modal
├── hooks/
│   └── use<Feature>.ts         # State management (≤150 lines)
├── services/
│   └── <feature>Service.ts     # API calls (≤200 lines)
├── types/
│   └── index.ts                # TypeScript interfaces
├── styles/
│   └── <feature>.css           # Module CSS (≤250 lines)
└── index.ts                    # Public API exports
```

### 5.2. Ví dụ — Module Template đơn giản nhất

```tsx
// modules/my-module/components/MyModuleView.tsx
import React, { useState } from 'react';
import { MyFilterBar } from './MyFilterBar';
import { MyTable } from './MyTable';
import { useMyModule } from '../hooks/useMyModule';

export const MyModuleView: React.FC = () => {
  const { data, loading, namThang, setNamThang } = useMyModule();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MyFilterBar namThang={namThang} onChangeNamThang={setNamThang} />
      {loading ? <div>Đang tải...</div> : <MyTable data={data} />}
    </div>
  );
};
```

### 5.3. Đăng ký module mới vào App.tsx

**Bước 1:** Thêm vào `MENU_TO_SLUG` và `SLUG_TO_MENU`:
```ts
// MENU_TO_SLUG
'Tên Menu': 'my-module-slug',

// SLUG_TO_MENU
'my-module-slug': 'Tên Menu',
```

**Bước 2:** Thêm conditional render:
```tsx
} : activeMenu === 'Tên Menu' ? (
  <MyModuleView />
) : (
```

**Bước 3:** Thêm vào `data/menuData.ts`:
```ts
{
  title: 'Nhóm Menu',
  children: [
    { title: 'Tên Menu', href: '/?module=my-module-slug' }
  ]
}
```

---

## 6. BACKEND PATTERN — PYTHON HTTP SERVER

### 6.1. Cấu trúc Backend

```
c:\vdds.vnptdaklak.vn\
├── khtcdn_server.py        # Main HTTP router (port 5178)
├── cookie_api.py           # Cookie management
├── giahan_cntt_api.py      # Gia hạn CNTT API
├── doanhthu_th2_api.py     # Doanh thu TH2 API
├── coockie.json            # Cookie lưu trữ
└── requirements.txt        # Python dependencies
```

### 6.2. Thêm API mới vào backend

```python
# my_feature_api.py
import json, psycopg2

DB_CONFIG = { 'host': 'localhost', 'port': 5433, 'dbname': 'vdds', ... }

def handle_my_feature_http(handler, path, method):
    if method == 'GET' and path == '/api/my-feature/list':
        data = get_list_from_db()
        handler._send_json({'data': data})
    elif method == 'POST' and path == '/api/my-feature/sync':
        # sync from portal
        result = sync_data()
        handler._send_json(result)

# Trong khtcdn_server.py:
from my_feature_api import handle_my_feature_http

# Trong KHTCDNHandler.do_GET/do_POST:
if path.startswith('/api/my-feature/'):
    handle_my_feature_http(self, path, 'GET')
    return
```

### 6.3. Database Convention

```sql
-- Naming: snake_case, prefix theo domain
CREATE TABLE giahan_cntt_chitiet (
    id              SERIAL PRIMARY KEY,
    nam_thang       INTEGER NOT NULL,         -- YYYYMM
    ma_tb           VARCHAR(50),              -- Mã thuê bao
    ten_tb          TEXT,
    dia_chi         TEXT,
    trang_thai      VARCHAR(50),
    ngay_het_han    DATE,
    ma_am           VARCHAR(50),              -- Mã AM
    ten_am          TEXT,
    synced_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_giahan_nam_thang ON giahan_cntt_chitiet(nam_thang);
CREATE INDEX idx_giahan_ma_am ON giahan_cntt_chitiet(ma_am);
```

---

## 7. TÍCH HỢP PORTAL VDDS

### 7.1. Cookie Management

**Module:** `quan-ly-cookie` | **URL:** `/?module=quan-ly-cookie`

Hệ thống sử dụng phiên SSO từ `https://vdds.vnptdaklak.vn/`:
- Cookie lưu tại `coockie.json` trên server
- API `/api/cookie/status` → kiểm tra hiệu lực cookie
- API `/api/cookie/save` → lưu cookie mới (paste từ browser)
- API `/api/cookie/test` → test live request tới portal

### 7.2. Pattern đồng bộ từ Portal

```python
def sync_from_portal(cookie_headers: dict, payload: dict, portal_url: str):
    """Sync bulk data from VDDS portal to local PostgreSQL."""
    import requests
    response = requests.post(
        portal_url,
        headers=cookie_headers,
        json=payload,
        timeout=30,
        verify=False
    )
    data = response.json()
    # Parse và insert vào DB
    upsert_to_db(data)
    return {'success': True, 'count': len(data)}
```

### 7.3. Cookie Status Badge (Frontend)

```tsx
// Hiển thị trạng thái cookie trong FilterBar của module
const [cookieSt, setCookieSt] = useState({ active: false });

useEffect(() => {
  fetch('/api/cookie/status').then(r => r.json()).then(d => {
    const ok = Boolean(d.hasCookie) && (d.tokenLength || 0) > 0;
    setCookieSt({ active: ok });
  });
}, []);

// Badge:
<a href="/?module=quan-ly-cookie" style={{ color: cookieSt.active ? '#059669' : '#dc2626' }}>
  Cookie: {cookieSt.active ? 'Sẵn sàng' : 'Chưa thiết lập'}
</a>
```

---

## 8. LAYOUT SYSTEM — PHÂN VÙNG GIAO DIỆN

### 8.1. Sơ đồ layout tổng

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER (height: 50px, sticky, bg: #005baa)                     │
│ [Logo VDDS] [☰] [Tên hệ thống...............] [🌙][User][🚪]  │
├─────────────────┬──────────────────────────────────────────────┤
│ SIDEBAR         │ CONTENT AREA                                  │
│ 240px (50px)    │ flex: 1, padding: 14px 18px                  │
│                 │                                               │
│ [User Panel]    │ ┌──────────────────────────────────────────┐ │
│ [Search]        │ │ Page Title (h1) + Breadcrumb              │ │
│                 │ └──────────────────────────────────────────┘ │
│ [Menu Groups]   │                                               │
│   ├─ Item       │ ┌──────────────────────────────────────────┐ │
│   │  ├─ Sub     │ │        <ActiveModuleView />               │ │
│   │  └─ Sub     │ │                                           │ │
│   └─ Item       │ │  FilterBar / TabBar                       │ │
│                 │ │  ─────────────────                        │ │
│ sticky          │ │  Data Table / Charts                      │ │
│ top: 50px       │ │                                           │ │
│                 │ └──────────────────────────────────────────┘ │
├─────────────────┴──────────────────────────────────────────────┤
│ FOOTER (bg: var(--bg-secondary), padding: 10px 20px)           │
│ Bản quyền © 2026 VNPT Đắk Lắk.          Hệ thống VDDS v2.5   │
└────────────────────────────────────────────────────────────────┘
```

### 8.2. CSS Grid/Flex Layout chính

```tsx
// App.tsx — layout skeleton
<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
  <Header />
  <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
    <Sidebar />
    <div style={{
      flex: 1, backgroundColor: 'var(--bg-primary)',
      padding: '14px 18px', minWidth: 0, overflowX: 'hidden'
    }}>
      {/* Page title + breadcrumb */}
      {/* Active module view */}
    </div>
  </div>
  <footer />
</div>
```

---

## 9. TABLE PATTERN — CHUẨN BẢNG DỮ LIỆU

### 9.1. Style mẫu bảng dữ liệu

```css
/* Wrapper */
.table-wrapper {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

/* Header */
thead th {
  background: var(--vnpt-blue-gradient);
  color: #ffffff;
  padding: 8px 10px;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 5;
  border-right: 1px solid rgba(255,255,255,0.2);
}

/* Body rows */
tbody tr:nth-child(odd)  { background: var(--bg-card); }
tbody tr:nth-child(even) { background: var(--bg-primary); }
tbody tr:hover           { background: var(--bg-card-hover); }

/* Cells */
tbody td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}

/* Number columns — right align */
td.number { text-align: right; font-variant-numeric: tabular-nums; }

/* Summary/Total row */
tbody tr.total-row {
  background: rgba(0, 91, 170, 0.08) !important;
  font-weight: 700;
  border-top: 2px solid var(--vnpt-blue);
}
```

### 9.2. Sort Header Pattern

```tsx
const SortableHeader: React.FC<{ label: string; field: string; sort: SortConfig; onSort: (f: string) => void }> = ({
  label, field, sort, onSort
}) => {
  const isActive = sort.field === field;
  return (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label}
      <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.4 }}>
        {isActive ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );
};
```

---

## 10. MODAL PATTERN

### 10.1. Modal Template chuẩn

```tsx
// Modal overlay + dialog
{isOpen && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }} onClick={onClose}>
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 8, width: '90vw', maxWidth: 900,
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--vnpt-blue-gradient)', borderRadius: '8px 8px 0 0'
      }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Modal Title</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Content */}
      </div>
    </div>
  </div>
)}
```

---

## 11. QUY CHUẨN LẬP TRÌNH (GEMINI.md)

### 11.1. Giới hạn số dòng

| Loại file | Giới hạn |
|-----------|---------|
| React Component `.tsx` | **200-250 dòng** |
| Custom Hook `useX.ts` | **150 dòng** |
| Service `.ts` | **200 dòng** |
| Type Definition `.ts` | **150 dòng** |
| CSS file | **250 dòng** |
| Hàm thông thường | **50 dòng** |

### 11.2. Naming Convention

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component/Type | PascalCase | `GiaHanAMTable` |
| Custom Hook | useCamelCase | `useGiaHanCNTT` |
| Hàm/Biến | camelCase | `formatCurrency` |
| Hằng số | UPPER_SNAKE_CASE | `DEFAULT_NAM_THANG` |
| Thư mục | kebab-case | `gia-han-cntt` |

### 11.3. TypeScript Strict

```json
// tsconfig.json — bắt buộc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```
> ❌ Tuyệt đối **không dùng `any`** — dùng `unknown`, generic, hoặc type cụ thể.

---

## 12. HƯỚNG DẪN TÁI SỬ DỤNG CHO ỨNG DỤNG MỚI

### 12.1. Checklist khởi tạo dự án mới

```bash
# 1. Scaffold với Vite + React + TypeScript
npx create-vite@latest my-app -- --template react-ts
cd my-app
npm install lucide-react

# 2. Copy các file template
# - src/index.css              (Design tokens)
# - src/modules/core/          (Header, Sidebar, useTheme)
# - src/data/menuData.ts       (Menu structure — điều chỉnh menu)

# 3. Cấu hình vite.config.ts proxy
# proxy: { '/api': 'http://localhost:5178' }

# 4. Khởi động
npm run dev
```

### 12.2. Điều chỉnh cho tổ chức mới

| Yếu tố | Vị trí | Cách thay đổi |
|--------|--------|--------------|
| Tên hệ thống | `Header.tsx:82` | Sửa chuỗi `"HỆ THỐNG..."` |
| Logo/Brand | `Header.tsx:59` | Sửa `'VDDS'` thành tên mới |
| Màu thương hiệu | `index.css:22` | Thay `--vnpt-blue: #005baa` |
| Màu header | `Header.tsx:26` | Thay `backgroundColor: '#005baa'` |
| Tên người dùng | `App.tsx:126` | Lấy từ auth session |
| Menu items | `data/menuData.ts` | Cấu hình FULL_MENU_DATA |
| DB connection | Các `*_api.py` | Sửa DB_CONFIG |
| Backend port | `vite.config.ts` | Sửa proxy target |
| Copyright | `App.tsx:215` | Sửa footer text |

### 12.3. Bộ khởi tạo module tối thiểu (5 phút)

```tsx
// 1. src/modules/my-feature/types/index.ts
export interface MyItem { id: number; name: string; value: number; }

// 2. src/modules/my-feature/services/myService.ts
export const myService = {
  async getList(namThang: number): Promise<MyItem[]> {
    const r = await fetch(`/api/my-feature/list?namThang=${namThang}`);
    return r.ok ? r.json() : [];
  }
};

// 3. src/modules/my-feature/hooks/useMyFeature.ts
import { useState, useEffect } from 'react';
import type { MyItem } from '../types';
import { myService } from '../services/myService';

export function useMyFeature() {
  const [data, setData] = useState<MyItem[]>([]);
  const [namThang, setNamThang] = useState(202609);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    myService.getList(namThang).then(d => { setData(d); setLoading(false); });
  }, [namThang]);

  return { data, loading, namThang, setNamThang };
}

// 4. src/modules/my-feature/index.ts
export { MyFeatureView } from './components/MyFeatureView';
```

---

## 13. SCREENSHOT GIAO DIỆN

> *(Xem recording tại thư mục artifacts)*

### 13.1. Layout tổng thể
- **Header:** Nền VNPT Blue (#005baa), logo VDDS, tên hệ thống, user card, theme toggle
- **Sidebar:** 240px, có thu gọn về 50px, menu 2 cấp với icon Lucide
- **Content:** Nền `#f8fafc`, padding 14px 18px, breadcrumb + h1

### 13.2. Các tính năng nổi bật
- ✅ **Dark/Light Mode** — chuyển đổi tức thì, lưu trong localStorage
- ✅ **MonthPicker** — calendar popup chọn tháng/năm
- ✅ **Sticky Header + Sidebar** — cuộn nội dung không ảnh hưởng navigation
- ✅ **Custom Scrollbar** — styled scrollbar đồng bộ theme
- ✅ **Table Sort/Filter** — click header để sort, input để filter
- ✅ **Modal Detail** — overlay mờ, scroll body riêng
- ✅ **Cookie Status Badge** — realtime check cookie health
- ✅ **Sync from Portal** — bulk sync VDDS Portal → PostgreSQL

---

## 14. DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/react": "^18.x"
  }
}
```

**Python Backend:**
```
psycopg2-binary
requests
beautifulsoup4
urllib3
openpyxl
```

---

## 15. TÀI LIỆU LIÊN QUAN

| Tài liệu | Đường dẫn |
|----------|----------|
| GEMINI.md (Quy chuẩn) | [`c:/vdds.vnptdaklak.vn/GEMINI.md`](file:///c:/vdds.vnptdaklak.vn/GEMINI.md) |
| Topics Log | [`docs/TOPICS.md`](file:///c:/vdds.vnptdaklak.vn/docs/TOPICS.md) |
| Audit Index | [`docs/logs/INDEX.md`](file:///c:/vdds.vnptdaklak.vn/docs/logs/INDEX.md) |
| index.css (tokens) | [`web-app/src/index.css`](file:///c:/vdds.vnptdaklak.vn/web-app/src/index.css) |
| App.tsx (routing) | [`web-app/src/App.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/App.tsx) |
| Header.tsx | [`modules/core/components/Header.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/core/components/Header.tsx) |
| Sidebar.tsx | [`modules/core/components/Sidebar.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/core/components/Sidebar.tsx) |
| MonthPicker.tsx | [`modules/doanh-thu-cntt/components/MonthPicker.tsx`](file:///c:/vdds.vnptdaklak.vn/web-app/src/modules/doanh-thu-cntt/components/MonthPicker.tsx) |

---

*Báo cáo này được tạo tự động bởi Antigravity AI — 18/09/2026 16:39 ICT*
