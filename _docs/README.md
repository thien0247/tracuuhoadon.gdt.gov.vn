# Captcha Decoder Module

Module Python để giải mã captcha từ trang tracuuhoadon.gdt.gov.vn sử dụng Tesseract OCR.

## Mô tả

Module này được thiết kế để giải mã captcha 6 ký tự từ trang web của Tổng cục Thuế Việt Nam. Captcha bao gồm chữ cái thường (a-z) và số (0-9).

## Cài đặt

### 1. Cài đặt Tesseract OCR

**Windows:**
- Tải và cài đặt từ: https://github.com/UB-Mannheim/tesseract/wiki
- Thêm đường dẫn cài đặt vào PATH

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 2. Cài đặt Python dependencies

```bash
pip install -r requirements.txt
```

## Sử dụng

### Cách 1: Sử dụng function tiện ích

```python
from captcha_decoder import decode_captcha, decode_captcha_from_url

# Giải mã từ file ảnh
result = decode_captcha("path/to/captcha.jpg")
print(f"Kết quả: {result}")

# Tải và giải mã từ URL
result = decode_captcha_from_url("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
print(f"Kết quả: {result}")
```

### Cách 2: Sử dụng class CaptchaDecoder

```python
from captcha_decoder import CaptchaDecoder

# Tạo instance
decoder = CaptchaDecoder()

# Giải mã từ file
result = decoder.decode_captcha("captcha.jpg")

# Tải và giải mã từ URL
result = decoder.decode_from_url()

# Tải captcha về file
temp_path = decoder.download_captcha()
if temp_path:
    result = decoder.decode_captcha(temp_path)
```

## Tính năng

### Xử lý ảnh thông minh
- Chuyển đổi sang grayscale
- Tăng độ tương phản
- Làm sắc nét ảnh
- Áp dụng threshold
- Kết hợp nhiều phương pháp xử lý

### Nhiều cấu hình OCR
Module thử nghiệm với 5 cấu hình Tesseract khác nhau:
- OEM 3 với PSM 8, 7, 6
- OEM 1 với PSM 8, 7
- Mỗi cấu hình sử dụng whitelist ký tự phù hợp

### Đánh giá kết quả
- Ưu tiên kết quả có đúng 6 ký tự
- Đánh giá chất lượng dựa trên độ dài và ký tự hợp lệ
- Trả về kết quả tốt nhất nếu không có kết quả hoàn hảo

### Logging chi tiết
- Log tất cả các bước xử lý
- Hiển thị kết quả từ mỗi cấu hình
- Thông tin debug để tối ưu hóa

## API Reference

### Functions

#### `decode_captcha(image_path: str) -> Optional[str]`
Giải mã captcha từ đường dẫn file ảnh.

**Parameters:**
- `image_path`: Đường dẫn đến file ảnh captcha

**Returns:**
- Chuỗi ký tự giải mã được hoặc None nếu thất bại

#### `decode_captcha_from_url(url: str) -> Optional[str]`
Tải và giải mã captcha từ URL.

**Parameters:**
- `url`: URL của ảnh captcha (mặc định: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg)

**Returns:**
- Chuỗi ký tự giải mã được hoặc None nếu thất bại

### Class CaptchaDecoder

#### Methods

##### `__init__()`
Khởi tạo decoder với cấu hình mặc định.

##### `download_captcha(url: str) -> Optional[str]`
Tải captcha từ URL và lưu vào file tạm.

##### `preprocess_image(image_path: str) -> List[Image.Image]`
Tiền xử lý ảnh với nhiều phương pháp khác nhau.

##### `decode_captcha(image_path: str) -> Optional[str]`
Giải mã captcha từ đường dẫn ảnh.

##### `decode_from_url(url: str) -> Optional[str]`
Tải và giải mã captcha từ URL.

##### `evaluate_result(text: str) -> float`
Đánh giá chất lượng kết quả OCR (0-1).

## Xử lý lỗi

Module xử lý các lỗi phổ biến:
- File ảnh không tồn tại
- Lỗi tải ảnh từ URL
- Lỗi OCR
- Lỗi xử lý ảnh

Tất cả lỗi được log chi tiết để debug.

## Tối ưu hóa

### Để tăng độ chính xác:
1. Đảm bảo Tesseract được cài đặt đúng
2. Sử dụng ảnh captcha chất lượng tốt
3. Kiểm tra log để xem cấu hình nào hoạt động tốt nhất
4. Có thể điều chỉnh các tham số xử lý ảnh

### Cấu hình Tesseract:
- OEM 3: LSTM OCR Engine
- PSM 8: Treat the image as a single word
- PSM 7: Treat the image as a single text line
- PSM 6: Assume a single uniform block of text

## Ví dụ sử dụng

Xem file `example.py` để có ví dụ chi tiết về cách sử dụng module.

## Test

Chạy test suite:
```bash
python -m pytest _test/
```

## Lưu ý

- Module được thiết kế đặc biệt cho captcha của tracuuhoadon.gdt.gov.vn
- Độ chính xác phụ thuộc vào chất lượng ảnh captcha
- Có thể cần điều chỉnh cấu hình cho các loại captcha khác
