# 🚀 Hướng dẫn sử dụng Scrapy Tax Query

## 📋 Tổng quan

Module Scrapy Tax Query được thiết kế để truy vấn thông tin mã số thuế sử dụng Scrapy framework, hỗ trợ:
- ✅ Xử lý bất đồng bộ (asynchronous)
- ✅ Captcha nhập tay
- ✅ Tự động retry và error handling
- ✅ Session management tự động
- ✅ Lưu kết quả tự động

## 🛠️ Cài đặt

### 1. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 2. Kiểm tra Scrapy
```bash
scrapy version
```

## 🚀 Sử dụng

### Cách 1: Chạy script test đầy đủ
```bash
python test_scrapy_tax.py
```

### Cách 2: Chạy quick test
```bash
python test_scrapy_tax.py --quick
```

### Cách 3: Chạy trực tiếp module
```bash
python scrapy_tax_query.py
```

## 📋 Quy trình sử dụng

### Bước 1: Nhập mã số thuế
- Nhập mã số thuế (10 chữ số)
- Có thể nhập nhiều mã cách nhau bởi dấu phẩy
- Hoặc nhấn Enter để dùng mã mặc định: `0319151229`, `0319153113`, `2301359406`

### Bước 2: Nhập captcha
- Truy cập: `https://tracuuhoadon.gdt.gov.vn/Captcha.jpg` tải captcha về
- Nhìn vào ảnh captcha
- Nhập mã captcha vào script

### Bước 3: Xác nhận và chạy
- Xem lại thông tin
- Xác nhận để bắt đầu chạy

## 📊 Kết quả

### Files được tạo:
- `scrapy_tax_result_{tax_code}_{timestamp}.json` - Kết quả từng mã số thuế
- `scrapy_tax_summary_{timestamp}.json` - Tổng kết toàn bộ
- `scrapy_tax_output_{timestamp}.json` - Output từ Scrapy

### Cấu trúc kết quả:
```json
{
  "tax_code": "0319151229",
  "captcha_code": "abc123",
  "status": "success",
  "timestamp": "2025-01-16 12:00:00",
  "url": "https://tracuuhoadon.gdt.gov.vn/gettin.html?tin=0319151229&captchaCode=abc123",
  "status_code": 200,
  "content_type": "application/json;charset=UTF-8",
  "session_cookies": {...},
  "data": {
    "tinModel": {...}
  }
}
```

## ⚙️ Cấu hình Scrapy

### Settings mặc định:
```python
custom_settings = {
    'DOWNLOAD_DELAY': 2,  # Delay 2 giây giữa các request
    'RANDOMIZE_DOWNLOAD_DELAY': 0.5,  # Random delay 0.5-2.5 giây
    'RETRY_TIMES': 3,  # Retry tối đa 3 lần
    'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
    'CONCURRENT_REQUESTS': 1,  # Chỉ 1 request tại 1 thời điểm
    'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
    'AUTOTHROTTLE_ENABLED': True,  # Tự động điều chỉnh tốc độ
    'AUTOTHROTTLE_START_DELAY': 1,
    'AUTOTHROTTLE_MAX_DELAY': 10,
    'AUTOTHROTTLE_TARGET_CONCURRENCY': 1.0,
    'COOKIES_ENABLED': True,  # Bật cookies để duy trì session
    'COOKIES_DEBUG': True,  # Debug cookies
}
```

## 🔧 Tùy chỉnh

### Thay đổi mã số thuế mặc định:
```python
# Trong scrapy_tax_query.py
test_tax_codes = ['0319151229', '0319153113', '2301359406']  # Thay đổi ở đây
```

### Thay đổi delay:
```python
# Trong custom_settings
'DOWNLOAD_DELAY': 3,  # Tăng delay lên 3 giây
```

### Thay đổi retry:
```python
# Trong custom_settings
'RETRY_TIMES': 5,  # Tăng retry lên 5 lần
```

## 📈 So sánh với requests

| Tính năng | requests | Scrapy |
|-----------|----------|---------|
| **Xử lý đồng thời** | ❌ Tuần tự | ✅ Bất đồng bộ |
| **Session management** | ⚠️ Thủ công | ✅ Tự động |
| **Retry logic** | ⚠️ Tự code | ✅ Tích hợp |
| **Rate limiting** | ⚠️ Tự code | ✅ Tự động |
| **Error handling** | ⚠️ Cơ bản | ✅ Nâng cao |
| **Memory usage** | ⚠️ Cao | ✅ Tối ưu |
| **Scalability** | ❌ Hạn chế | ✅ Rất tốt |

## 🐛 Troubleshooting

### Lỗi thường gặp:

#### 1. ImportError: No module named 'scrapy'
```bash
pip install scrapy
```

#### 2. Lỗi Twisted
```bash
pip install twisted
```

#### 3. Captcha không đúng
- Kiểm tra lại mã captcha
- Thử captcha mới từ website

#### 4. Session timeout
- Chạy lại script với captcha mới
- Kiểm tra kết nối internet

## 🚀 Nâng cấp tương lai

### Tự động giải captcha:
- Tích hợp Tesseract OCR
- Tích hợp Gemini AI
- Fallback mechanism

### Xử lý JavaScript:
- Sử dụng Splash
- Selenium integration

### Scale up:
- Xử lý hàng nghìn mã số thuế
- Distributed crawling
- Database integration

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Logs trong console
2. Files JSON được tạo
3. Kết nối internet
4. Mã captcha có đúng không

---

**Lưu ý**: Module này được thiết kế để test với captcha nhập tay. Sẽ được nâng cấp để tự động giải captcha trong tương lai.
