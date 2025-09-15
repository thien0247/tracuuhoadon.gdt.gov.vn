# API Reference - Captcha Decoder

## Overview

Module `captcha_decoder` cung cấp các function và class để giải mã captcha từ trang tracuuhoadon.gdt.gov.vn sử dụng Tesseract OCR.

## Functions

### `decode_captcha(image_path: str) -> Optional[str]`

Giải mã captcha từ đường dẫn file ảnh.

**Parameters:**
- `image_path` (str): Đường dẫn đến file ảnh captcha

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

**Example:**
```python
from captcha_decoder import decode_captcha

result = decode_captcha("captcha.jpg")
if result:
    print(f"Captcha: {result}")
```

**Raises:**
- Không raise exception, trả về None khi có lỗi

---

### `decode_captcha_from_url(url: str) -> Optional[str]`

Tải và giải mã captcha từ URL.

**Parameters:**
- `url` (str): URL của ảnh captcha (mặc định: "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu thất bại

**Example:**
```python
from captcha_decoder import decode_captcha_from_url

result = decode_captcha_from_url()
if result:
    print(f"Captcha: {result}")
```

**Raises:**
- Không raise exception, trả về None khi có lỗi

---

## Class CaptchaDecoder

### Constructor

#### `__init__()`

Khởi tạo CaptchaDecoder với cấu hình mặc định.

**Attributes:**
- `whitelist` (str): "abcdefghijklmnopqrstuvwxyz0123456789"
- `expected_length` (int): 6
- `tesseract_configs` (List[str]): Danh sách cấu hình Tesseract

**Example:**
```python
decoder = CaptchaDecoder()
```

---

### Methods

#### `download_captcha(url: str) -> Optional[str]`

Tải captcha từ URL và lưu vào file tạm.

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[str]`: Đường dẫn file ảnh đã tải về hoặc None nếu lỗi

**Example:**
```python
decoder = CaptchaDecoder()
temp_path = decoder.download_captcha("https://example.com/captcha.jpg")
if temp_path:
    print(f"Đã tải về: {temp_path}")
```

**Raises:**
- Không raise exception, trả về None khi có lỗi

---

#### `preprocess_image(image_path: str) -> List[Image.Image]`

Tiền xử lý ảnh captcha để tăng độ chính xác OCR.

**Parameters:**
- `image_path` (str): Đường dẫn đến ảnh captcha

**Returns:**
- `List[Image.Image]`: Danh sách các ảnh đã được xử lý với các phương pháp khác nhau

**Processing Methods:**
1. Ảnh gốc
2. Grayscale
3. Tăng độ tương phản
4. Làm sắc nét
5. Kết hợp tương phản + sắc nét
6. Threshold

**Example:**
```python
decoder = CaptchaDecoder()
processed_images = decoder.preprocess_image("captcha.jpg")
print(f"Đã tạo {len(processed_images)} phiên bản ảnh")
```

**Raises:**
- Không raise exception, trả về list rỗng khi có lỗi

---

#### `clean_text(text: str) -> str`

Làm sạch text từ OCR, chỉ giữ lại ký tự hợp lệ.

**Parameters:**
- `text` (str): Text thô từ OCR

**Returns:**
- `str`: Text đã được làm sạch

**Cleaning Process:**
- Chỉ giữ ký tự trong whitelist
- Loại bỏ khoảng trắng, xuống dòng, tab
- Chuyển về chữ thường

**Example:**
```python
decoder = CaptchaDecoder()
cleaned = decoder.clean_text("a b c 1 2 3!@#")
print(cleaned)  # "abc123"
```

---

#### `decode_captcha(image_path: str) -> Optional[str]`

Giải mã captcha từ đường dẫn ảnh.

**Parameters:**
- `image_path` (str): Đường dẫn đến ảnh captcha

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu không thành công

**Process:**
1. Tiền xử lý ảnh với nhiều phương pháp
2. Thử OCR với nhiều cấu hình Tesseract
3. Đánh giá và chọn kết quả tốt nhất
4. Trả về kết quả có độ dài đúng hoặc gần nhất

**Example:**
```python
decoder = CaptchaDecoder()
result = decoder.decode_captcha("captcha.jpg")
if result:
    print(f"Kết quả: {result}")
```

---

#### `decode_from_url(url: str) -> Optional[str]`

Tải và giải mã captcha từ URL.

**Parameters:**
- `url` (str): URL của captcha image

**Returns:**
- `Optional[str]`: Chuỗi ký tự giải mã được hoặc None nếu không thành công

**Process:**
1. Tải captcha từ URL
2. Giải mã captcha
3. Xóa file tạm
4. Trả về kết quả

**Example:**
```python
decoder = CaptchaDecoder()
result = decoder.decode_from_url("https://example.com/captcha.jpg")
```

---

#### `evaluate_result(text: str) -> float`

Đánh giá chất lượng kết quả OCR.

**Parameters:**
- `text` (str): Text đã được làm sạch

**Returns:**
- `float`: Điểm số từ 0-1 (1 là tốt nhất)

**Scoring Criteria:**
- Độ dài đúng (6 ký tự): +0.5 điểm
- Ký tự hợp lệ: +0.3 điểm
- Bonus cho độ dài đúng: +0.2 điểm

**Example:**
```python
decoder = CaptchaDecoder()
score = decoder.evaluate_result("abc123")
print(f"Điểm số: {score}")  # 1.0
```

---

## Configuration

### Tesseract Configurations

Module sử dụng 5 cấu hình Tesseract khác nhau:

1. `--oem 3 --psm 8`: LSTM OCR, single word
2. `--oem 3 --psm 7`: LSTM OCR, single text line
3. `--oem 3 --psm 6`: LSTM OCR, uniform block
4. `--oem 1 --psm 8`: Legacy OCR, single word
5. `--oem 1 --psm 7`: Legacy OCR, single text line

### Whitelist Characters

Mặc định: `"abcdefghijklmnopqrstuvwxyz0123456789"`

### Expected Length

Mặc định: 6 ký tự

---

## Error Handling

Module xử lý các lỗi phổ biến:

- **File không tồn tại**: Trả về None
- **Lỗi tải ảnh**: Trả về None, log lỗi
- **Lỗi OCR**: Bỏ qua cấu hình lỗi, thử cấu hình khác
- **Lỗi xử lý ảnh**: Trả về list rỗng, log lỗi

Tất cả lỗi được log chi tiết để debug.

---

## Logging

Module sử dụng Python logging với các level:

- **INFO**: Thông tin chung về quá trình xử lý
- **WARNING**: Cảnh báo về lỗi không nghiêm trọng
- **ERROR**: Lỗi nghiêm trọng

**Example cấu hình logging:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

---

## Performance Notes

- **Xử lý ảnh**: Tạo 6 phiên bản ảnh khác nhau
- **OCR**: Thử 5 cấu hình Tesseract khác nhau
- **Tổng**: Tối đa 30 lần thử OCR cho mỗi captcha
- **Thời gian**: Thường 2-5 giây tùy thuộc vào chất lượng ảnh

---

## Dependencies

- `pytesseract`: Python wrapper cho Tesseract OCR
- `Pillow`: Xử lý ảnh
- `requests`: Tải ảnh từ URL

---

## Examples

### Basic Usage
```python
from captcha_decoder import decode_captcha_from_url

result = decode_captcha_from_url()
print(result)
```

### Advanced Usage
```python
from captcha_decoder import CaptchaDecoder

decoder = CaptchaDecoder()
result = decoder.decode_from_url()
print(result)
```

### Custom Configuration
```python
from captcha_decoder import CaptchaDecoder

decoder = CaptchaDecoder()
decoder.tesseract_configs.append('--oem 3 --psm 13')
result = decoder.decode_from_url()
```

### Error Handling
```python
from captcha_decoder import decode_captcha

result = decode_captcha("captcha.jpg")
if result is None:
    print("Không thể giải mã captcha")
else:
    print(f"Kết quả: {result}")
```
