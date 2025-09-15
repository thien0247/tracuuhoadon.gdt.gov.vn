# Hướng dẫn cài đặt Captcha Decoder

## Yêu cầu hệ thống

- Python 3.7 trở lên
- Tesseract OCR engine
- Kết nối internet (để tải captcha từ URL)

## Bước 1: Cài đặt Tesseract OCR

### Windows

1. **Tải Tesseract:**
   - Truy cập: https://github.com/UB-Mannheim/tesseract/wiki
   - Tải phiên bản phù hợp với Windows của bạn (32-bit hoặc 64-bit)

2. **Cài đặt:**
   - Chạy file installer đã tải về
   - Chọn đường dẫn cài đặt (mặc định: `C:\Program Files\Tesseract-OCR`)
   - **Quan trọng:** Ghi nhớ đường dẫn cài đặt

3. **Thêm vào PATH:**
   - Mở System Properties → Environment Variables
   - Thêm đường dẫn Tesseract vào PATH:
     ```
     C:\Program Files\Tesseract-OCR
     ```
   - Hoặc sử dụng PowerShell:
     ```powershell
     $env:PATH += ";C:\Program Files\Tesseract-OCR"
     ```

4. **Kiểm tra cài đặt:**
   ```cmd
   tesseract --version
   ```

### Ubuntu/Debian

```bash
# Cập nhật package list
sudo apt-get update

# Cài đặt Tesseract
sudo apt-get install tesseract-ocr

# Kiểm tra cài đặt
tesseract --version
```

### macOS

```bash
# Sử dụng Homebrew
brew install tesseract

# Kiểm tra cài đặt
tesseract --version
```

## Bước 2: Cài đặt Python Dependencies

### Tạo virtual environment (khuyến nghị)

```bash
# Tạo virtual environment
python -m venv captcha_env

# Kích hoạt virtual environment
# Windows:
captcha_env\Scripts\activate
# Linux/macOS:
source captcha_env/bin/activate
```

### Cài đặt packages

```bash
# Cài đặt từ requirements.txt
pip install -r requirements.txt

# Hoặc cài đặt thủ công
pip install pytesseract Pillow requests
```

## Bước 3: Cấu hình Tesseract cho Python

### Nếu Tesseract không được tìm thấy tự động

```python
import pytesseract

# Windows - chỉ định đường dẫn Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Linux/macOS - thường không cần thiết
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
```

## Bước 4: Kiểm tra cài đặt

Tạo file test đơn giản:

```python
# test_installation.py
import pytesseract
from PIL import Image
import requests

def test_installation():
    try:
        # Test Tesseract
        print("Tesseract version:", pytesseract.get_tesseract_version())
        
        # Test PIL
        print("PIL version:", Image.__version__)
        
        # Test requests
        print("Requests version:", requests.__version__)
        
        print("✅ Tất cả dependencies đã được cài đặt thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return False

if __name__ == "__main__":
    test_installation()
```

Chạy test:
```bash
python test_installation.py
```

## Bước 5: Test với captcha thực

```python
# test_captcha.py
from captcha_decoder import decode_captcha_from_url

def test_captcha():
    try:
        result = decode_captcha_from_url()
        if result:
            print(f"✅ Giải mã thành công: {result}")
        else:
            print("❌ Không thể giải mã captcha")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    test_captcha()
```

## Xử lý sự cố

### Lỗi "tesseract is not installed or it's not in your PATH"

**Windows:**
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### Lỗi "No module named 'PIL'"

```bash
pip install Pillow
```

### Lỗi "No module named 'pytesseract'"

```bash
pip install pytesseract
```

### Lỗi "No module named 'requests'"

```bash
pip install requests
```

### Lỗi kết nối mạng

- Kiểm tra kết nối internet
- Kiểm tra firewall/proxy
- Thử với URL khác để test

### Độ chính xác thấp

1. **Kiểm tra chất lượng ảnh captcha**
2. **Thử các cấu hình Tesseract khác:**
   ```python
   from captcha_decoder import CaptchaDecoder
   
   decoder = CaptchaDecoder()
   # Thêm cấu hình tùy chỉnh
   decoder.tesseract_configs.append('--oem 3 --psm 13 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyz0123456789')
   ```

3. **Điều chỉnh xử lý ảnh:**
   - Thay đổi tham số tăng tương phản
   - Thử các bộ lọc khác nhau

## Cấu hình nâng cao

### Tùy chỉnh đường dẫn Tesseract

```python
import pytesseract
import os

# Tự động tìm Tesseract
def find_tesseract():
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        '/usr/bin/tesseract',
        '/usr/local/bin/tesseract',
        '/opt/homebrew/bin/tesseract'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

tesseract_path = find_tesseract()
if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
```

### Cấu hình logging

```python
import logging

# Cấu hình logging chi tiết
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('captcha_debug.log'),
        logging.StreamHandler()
    ]
)
```

## Hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt:

1. Kiểm tra phiên bản Python: `python --version`
2. Kiểm tra pip: `pip --version`
3. Cập nhật pip: `pip install --upgrade pip`
4. Xem log chi tiết khi chạy module
5. Kiểm tra quyền truy cập file và thư mục
