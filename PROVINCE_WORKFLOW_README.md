# 🏛️ Province Workflow - Module Quét Mã Số Thuế Theo Tỉnh

## 📋 Tổng quan

Module Province Workflow được thiết kế để tự động quét và cập nhật mã số thuế từ `tin_min` của một tỉnh, giảm dần theo batch, kiểm tra và chèn vào bảng `company_info` nếu chưa tồn tại.

## 🏗️ Kiến trúc Module

### **1. Database Models (`database_models.py`)**
- **DatabaseConnection**: Quản lý kết nối PostgreSQL
- **ProvinceCodeModel**: Thao tác với bảng `gdt_prefix_province_codes`
- **CompanyInfoModel**: Thao tác với bảng `company_info`

### **2. Captcha Manager (`captcha_manager.py`)**
- Tải ảnh captcha từ server
- Hiển thị ảnh captcha
- Nhập mã captcha thủ công
- Quản lý session HTTP

### **3. Batch Processor (`batch_processor.py`)**
- Tạo batch mã số thuế giảm dần
- Loại bỏ TIN đã tồn tại
- Validate mã số thuế
- Crawl dữ liệu từ API
- Lưu vào database

### **4. Tax Code Validator (`tax_code_validator.py`)**
- Kiểm tra tính hợp lệ mã số thuế
- Hỗ trợ mã 10 chữ số và 14 chữ số
- Kiểm tra checksum

### **5. Province Workflow (`province_workflow.py`)**
- Workflow chính theo yêu cầu
- Quản lý toàn bộ quy trình
- Thống kê và báo cáo

## 🚀 Cài đặt

### **1. Cài đặt dependencies**
```bash
pip install -r requirements.txt
```

### **2. Cấu hình database**
- PostgreSQL server: `192.168.168.222:5433`
- Database: `masothue`
- Tables: `gdt_prefix_province_codes`, `company_info`

### **3. Cấu hình captcha**
- URL: `https://tracuuhoadon.gdt.gov.vn/Captcha.jpg`
- API: `https://tracuuhoadon.gdt.gov.vn/gettin.html`

## 📋 Quy trình Workflow

### **Bước 1: Nhập thông tin đầu vào**
- Người dùng nhập `code` (mã tỉnh) từ bảng `gdt_prefix_province_codes`
- Kiểm tra tính hợp lệ của `code`

### **Bước 2: Lấy thông tin tỉnh**
- Truy vấn bảng `gdt_prefix_province_codes`
- Lấy `tin_min`, `tin_max`, `name`
- Kiểm tra `tin_min` có tồn tại

### **Bước 3: Khởi tạo captcha**
- Tải ảnh captcha từ server
- Hiển thị ảnh captcha
- Nhập mã captcha thủ công

### **Bước 4: Khởi tạo biến điều khiển**
- `no_new_batch_count = 0`
- `batch_size = 1000`
- `current_tin = tin_min`

### **Bước 5: Vòng lặp xử lý batch**
- **a. Sinh danh sách mã số thuế**: 1000 mã giảm dần từ `current_tin`
- **b. Loại bỏ tin đã tồn tại**: Truy vấn `company_info`
- **c. Kiểm tra hợp lệ**: Dùng `tax_code_validator`
- **d. Crawl dữ liệu**: Gửi request với captcha
- **e. Cập nhật biến điều khiển**: Tăng `no_new_batch_count` nếu không có tin mới
- **f. Cập nhật `current_tin`**: Giảm xuống batch tiếp theo

### **Bước 6: Điều kiện dừng**
- Liên tiếp 10 batch không có tin mới
- Hoặc quét hết dải tin từ `tin_min` đến `tin_max`

## 🎯 Cách sử dụng

### **1. Chạy workflow đầy đủ**
```bash
python province_workflow.py
```

### **2. Test các module riêng lẻ**
```bash
python test_province_workflow.py
```

### **3. Test database models**
```bash
python database_models.py
```

### **4. Test captcha manager**
```bash
python captcha_manager.py
```

### **5. Test batch processor**
```bash
python batch_processor.py
```

### **6. Test tax code validator**
```bash
python tax_code_validator.py
```

## 📊 Tính năng chính

### **✅ Tự động hóa**
- Tự động tạo batch mã số thuế
- Tự động loại bỏ TIN đã tồn tại
- Tự động validate mã số thuế
- Tự động crawl và lưu dữ liệu

### **✅ Quản lý captcha**
- Tải ảnh captcha tự động
- Hiển thị ảnh captcha
- Nhập captcha thủ công
- Quản lý session HTTP

### **✅ Batch processing**
- Xử lý theo batch 1000 TIN
- Logic giảm dần từ `tin_min`
- Loại bỏ TIN đã tồn tại
- Crawl dữ liệu hiệu quả

### **✅ Database integration**
- Kết nối PostgreSQL
- CRUD operations
- Batch insert/update
- Conflict resolution

### **✅ Error handling**
- Xử lý lỗi gracefully
- Retry mechanism
- Logging chi tiết
- Recovery từ lỗi

### **✅ Thống kê và báo cáo**
- Progress tracking
- Thống kê real-time
- Lưu kết quả
- Tổng kết cuối cùng

## 🔧 Cấu hình

### **Database Connection**
```python
db = DatabaseConnection(
    host="192.168.168.222",
    port=5433,
    database="masothue",
    user="postgres",
    password=""
)
```

### **Batch Settings**
```python
batch_size = 1000
max_no_new_batches = 10
delay_between_requests = 0.1
```

### **Captcha Settings**
```python
captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
```

## 📈 Performance

### **Ước tính thời gian**
- **Batch size**: 1000 TIN/batch
- **Delay**: 0.1s/request
- **Thời gian/batch**: ~2-3 phút
- **Tỷ lệ thành công**: 60-80%

### **Tối ưu hóa**
- Validate TIN trước khi crawl
- Loại bỏ TIN đã tồn tại
- Batch processing
- Error handling
- Progress tracking

## 🐛 Troubleshooting

### **Lỗi thường gặp**

#### **1. Database connection failed**
```bash
# Kiểm tra kết nối
python database_models.py
```

#### **2. Captcha không tải được**
```bash
# Kiểm tra URL
curl https://tracuuhoadon.gdt.gov.vn/Captcha.jpg
```

#### **3. TIN không hợp lệ**
```bash
# Test validator
python tax_code_validator.py
```

#### **4. API trả về lỗi**
- Kiểm tra captcha có đúng không
- Kiểm tra session có hết hạn không
- Thử captcha mới

## 📁 File Structure

```
├── database_models.py          # Database connection và models
├── captcha_manager.py          # Quản lý captcha
├── batch_processor.py          # Xử lý batch
├── tax_code_validator.py       # Validate mã số thuế
├── province_workflow.py        # Workflow chính
├── test_province_workflow.py   # Test và demo
├── requirements.txt            # Dependencies
└── PROVINCE_WORKFLOW_README.md # Documentation
```

## 🎯 Ví dụ sử dụng

### **Ví dụ 1: Quét tỉnh Bắc Ninh (code: 23)**
```bash
python province_workflow.py
# Nhập: 23
# tin_min: 2300000000
# Batch 1: [2300000000, 2299999999, ..., 2299999001]
# Batch 2: [2299999000, 2299998999, ..., 2299998001]
# ...
```

### **Ví dụ 2: Test với range nhỏ**
```python
# Trong batch_processor.py
test_tins = processor.generate_tax_codes_batch("4401120823", 10)
# Kết quả: ['4401120823', '4401120822', ..., '4401120814']
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Chạy test từng module riêng lẻ
3. Kiểm tra kết nối database
4. Kiểm tra captcha có đúng không
5. Xem file JSON kết quả được tạo

---

**Lưu ý**: Module này được thiết kế để chạy trong thời gian dài. Hãy đảm bảo có đủ thời gian và kết nối ổn định trước khi chạy.
