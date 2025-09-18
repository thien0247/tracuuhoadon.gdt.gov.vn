# Gemini Captcha Decoder

Module Python để giải mã captcha từ trang tracuuhoadon.gdt.gov.vn sử dụng Google Gemini AI.

## Mô tả

Module này sử dụng Google Gemini Pro Vision để giải mã captcha 6 ký tự từ trang web của Tổng cục Thuế Việt Nam. Captcha bao gồm chữ cái thường (a-z) và số (0-9).

## Ưu điểm của Gemini so với Tesseract

- **Độ chính xác cao hơn**: Gemini AI có khả năng nhận dạng captcha phức tạp tốt hơn
- **Không cần cài đặt OCR engine**: Chỉ cần API key, không cần cài Tesseract
- **Xử lý ảnh tự động**: Gemini tự động xử lý ảnh mà không cần preprocessing
- **Dễ sử dụng**: API đơn giản, ít cấu hình

## Cài đặt

### 1. Cài đặt Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Lấy API key Gemini

- Truy cập https://aistudio.google.com/app/apikey
- Tạo API key miễn phí
- Copy API key để sử dụng

## Sử dụng

### Cách 1: Sử dụng function tiện ích

```python
from gemini_captcha_decoder import decode_captcha_with_gemini, decode_captcha_from_url_with_gemini

# Giải mã từ file ảnh
result = decode_captcha_with_gemini("path/to/captcha.jpg")
print(f"Kết quả: {result}")

# Tải và giải mã từ URL
result = decode_captcha_from_url_with_gemini("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
print(f"Kết quả: {result}")

# Sử dụng API key tùy chỉnh
result = decode_captcha_with_gemini("captcha.jpg", "YOUR_API_KEY")
```

### Cách 2: Sử dụng class GeminiCaptchaDecoder

```python
from gemini_captcha_decoder import GeminiCaptchaDecoder

# Tạo instance với API key mặc định
decoder = GeminiCaptchaDecoder()

# Hoặc sử dụng API key tùy chỉnh
decoder = GeminiCaptchaDecoder("YOUR_API_KEY")

# Kiểm tra kết nối API
if decoder.test_api_connection():
    print("API connection successful")

# Giải mã từ file
result = decoder.decode_captcha("captcha.jpg")

# Tải và giải mã từ URL
result = decoder.decode_from_url()

# Tải captcha về file
temp_path = decoder.download_captcha()
if temp_path:
    result = decoder.decode_captcha(temp_path)
```

## API Reference

### Class GeminiCaptchaDecoder

#### Constructor

```python
GeminiCaptchaDecoder(api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU")
```

**Parameters:**
- `api_key` (str): API key của Google Gemini

#### Methods

##### `test_api_connection() -> bool`

Kiểm tra kết nối API Gemini.

**Returns:**
- `bool`: True nếu kết nối thành công, False nếu thất bại

##### `download_captcha(url: str) -> Optional[str]`

Tải captcha từ URL và lưu vào file tạm.

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[str]`: Đường dẫn file ảnh đã tải về hoặc None nếu lỗi

##### `decode_captcha(image_input: Union[str, bytes, Image.Image]) -> Optional[str]`

Giải mã captcha từ ảnh.

**Parameters:**
- `image_input`: Có thể là:
  - `str`: Đường dẫn đến file ảnh captcha
  - `bytes`: Dữ liệu ảnh dạng bytes
  - `PIL.Image`: Đối tượng ảnh PIL

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

##### `download_captcha_bytes(url: str) -> Optional[bytes]`

Tải captcha từ URL và trả về dữ liệu bytes.

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[bytes]`: Dữ liệu ảnh dạng bytes hoặc None nếu lỗi

##### `decode_from_url(url: str) -> Optional[str]`

Tải và giải mã captcha từ URL.

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu không thành công

##### `decode_from_url_bytes(url: str) -> Optional[str]`

Tải và giải mã captcha từ URL (sử dụng bytes, không tạo file tạm).

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu không thành công

### Functions

#### `decode_captcha_with_gemini(image_input: Union[str, bytes, Image.Image], api_key: str) -> Optional[str]`

Function tiện ích để giải mã captcha từ ảnh.

**Parameters:**
- `image_input`: Có thể là:
  - `str`: Đường dẫn đến file ảnh captcha
  - `bytes`: Dữ liệu ảnh dạng bytes
  - `PIL.Image`: Đối tượng ảnh PIL
- `api_key` (str): API key của Google Gemini

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

#### `decode_captcha_from_url_with_gemini(url: str, api_key: str) -> Optional[str]`

Function tiện ích để tải và giải mã captcha từ URL.

**Parameters:**
- `url` (str): URL của captcha image
- `api_key` (str): API key của Google Gemini

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

#### `decode_captcha_from_url_bytes_with_gemini(url: str, api_key: str) -> Optional[str]`

Function tiện ích để tải và giải mã captcha từ URL (bytes, không tạo file tạm).

**Parameters:**
- `url` (str): URL của captcha image
- `api_key` (str): API key của Google Gemini

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

#### `download_captcha_bytes_with_gemini(url: str, api_key: str) -> Optional[bytes]`

Function tiện ích để tải captcha từ URL và trả về bytes.

**Parameters:**
- `url` (str): URL của captcha image
- `api_key` (str): API key của Google Gemini

**Returns:**
- `Optional[bytes]`: Dữ liệu ảnh dạng bytes hoặc None nếu thất bại

## Chi phí sử dụng

### Quota miễn phí
- Google cung cấp quota miễn phí cho Gemini API
- Kiểm tra quota tại: https://aistudio.google.com/app/apikey

### Tối ưu chi phí
- Sử dụng prompt ngắn gọn
- Chỉ gửi ảnh captcha cần thiết
- Theo dõi usage trên Google Cloud Console

## So sánh với Tesseract

| Tính năng | Gemini | Tesseract |
|-----------|--------|-----------|
| Độ chính xác | Cao | Trung bình |
| Cài đặt | Dễ (chỉ cần API key) | Phức tạp (cần cài OCR engine) |
| Chi phí | Có (sau quota miễn phí) | Miễn phí |
| Tốc độ | Nhanh | Chậm hơn |
| Xử lý ảnh | Tự động | Cần preprocessing |

## Troubleshooting

### Lỗi thường gặp

1. **ImportError: No module named 'google.generativeai'**
   ```bash
   pip install google-generativeai
   ```

2. **API key không hợp lệ**
   - Kiểm tra API key tại https://aistudio.google.com/app/apikey
   - Đảm bảo API key có quyền truy cập Gemini

3. **Quota exceeded**
   - Kiểm tra quota usage
   - Chờ reset quota hoặc nâng cấp plan

4. **Network timeout**
   - Kiểm tra kết nối internet
   - Thử lại sau vài phút

### Logs

Module sử dụng Python logging để ghi lại thông tin debug:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

## Ví dụ hoàn chỉnh

### Ví dụ 1: Sử dụng cơ bản

```python
from gemini_captcha_decoder import GeminiCaptchaDecoder

def main():
    # Khởi tạo decoder
    decoder = GeminiCaptchaDecoder()
    
    # Kiểm tra kết nối
    if not decoder.test_api_connection():
        print("Không thể kết nối Gemini API")
        return
    
    # Giải mã captcha từ URL
    result = decoder.decode_from_url()
    
    if result:
        print(f"Captcha đã được giải mã: {result}")
    else:
        print("Không thể giải mã captcha")

if __name__ == "__main__":
    main()
```

### Ví dụ 2: Sử dụng với input ảnh khác nhau

```python
from gemini_captcha_decoder import decode_captcha_with_gemini
import requests
from PIL import Image
from io import BytesIO

# 1. Giải mã từ file path
result = decode_captcha_with_gemini("captcha.jpg")
print(f"Từ file: {result}")

# 2. Giải mã từ bytes
response = requests.get("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
img_bytes = response.content
result = decode_captcha_with_gemini(img_bytes)
print(f"Từ bytes: {result}")

# 3. Giải mã từ PIL Image
img = Image.open(BytesIO(img_bytes))
result = decode_captcha_with_gemini(img)
print(f"Từ PIL Image: {result}")
```

### Ví dụ 3: Sử dụng bytes (không tạo file tạm)

```python
from gemini_captcha_decoder import GeminiCaptchaDecoder

decoder = GeminiCaptchaDecoder()

# Tải ảnh dưới dạng bytes
img_bytes = decoder.download_captcha_bytes()
if img_bytes:
    print(f"Tải thành công: {len(img_bytes)} bytes")
    
    # Giải mã từ bytes
    result = decoder.decode_captcha(img_bytes)
    print(f"Kết quả: {result}")

# Hoặc giải mã trực tiếp từ URL (bytes)
result = decoder.decode_from_url_bytes()
print(f"Kết quả trực tiếp: {result}")
```
