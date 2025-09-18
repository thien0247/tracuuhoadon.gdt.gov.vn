
tracuuhoadon.gdt.gov.vn

https://tracuuhoadon.gdt.gov.vn/tbphtc.html

Yêu cầu:

- Viết một module Python để giải mã captcha từ trang https://tracuuhoadon.gdt.gov.vn/Captcha.jpg sử dụng thư viện Tesseract OCR.
- Captcha gồm 6 ký tự, không được nhiều hay ít hơn, bao gồm chữ cái thường (a-z) và số (0-9).
- Module cần nhận vào đường dẫn ảnh captcha, trả về chuỗi ký tự giải mã được.
- Ưu tiên độ chính xác cao, có thể thử nhiều cấu hình Tesseract khác nhau.
- Tham khảo function mẫu sử dụng pytesseract, cấu hình whitelist ký tự phù hợp, trả về kết quả có đúng 6 ký tự nếu có, hoặc kết quả gần nhất.
- Có thể log ra các kết quả thử nghiệm để debug.


## Hướng dẫn cập nhật module Python tự động lấy và giải mã captcha, truy vấn thông tin mã số thuế và lưu kết quả JSON

### Bước 1: Tải captcha và duy trì session

- Tạo một đối tượng `requests.Session()` để giữ cookie và session.
- Gửi request GET tới `https://tracuuhoadon.gdt.gov.vn/Captcha.jpg` để lấy ảnh captcha, đồng thời session sẽ được lưu lại.

### Bước 2: Giải mã captcha

- Sử dụng thư viện `pytesseract` để nhận diện ký tự từ ảnh captcha vừa tải về, dùng lại hàm từ `captcha_decoder.py`.

### Bước 3: Gửi request truy vấn thông tin với mã số thuế

- Dùng session đã tạo ở bước 1.
- Gửi request GET tới:  
  `https://tracuuhoadon.gdt.gov.vn/gettin.html?tin=4401120823&captchaCode=<captcha_đã_giải>`
- Lưu nội dung trả về (dạng JSON) vào file để sử dụng hoặc phân tích tiếp.

### Ví dụ code cập nhật:

```python
from tax_query import query_tax_info

# Truy vấn thông tin mã số thuế (sử dụng mã số thuế thực tế)
result = query_tax_info("MÃ_SỐ_THUẾ_THỰC_TẾ")
if result:
    print(f"Thông tin: {result}")
```

⚠️ **Lưu ý quan trọng**: Module không chạy dữ liệu mẫu tự động. Bạn cần cung cấp mã số thuế thực tế để sử dụng.

## 🚀 Module đã hoàn thành

### 1. **captcha_decoder.py** - Giải mã captcha
- Xử lý ảnh captcha với phương pháp tối ưu
- 10 phiên bản ảnh đã xử lý
- 9 cấu hình Tesseract OCR
- Kết quả test: `10e7vf` ✅

### 2. **tax_query.py** - Truy vấn thông tin mã số thuế
- Tự động tải captcha và duy trì session
- Giải mã captcha sử dụng captcha_decoder
- Truy vấn thông tin với mã số thuế
- Lưu kết quả JSON
- Retry mechanism với 3 lần thử

### 3. **Test suite** trong `_test/`
- Unit tests (29/29 PASS)
- Integration tests
- Test với captcha thực tế
- Test với URL cụ thể

### 4. **Documentation** trong `_docs/`
- Hướng dẫn cài đặt
- API Reference
- Ví dụ sử dụng

## 🎯 Cách sử dụng

### Giải mã captcha:
```python
from captcha_decoder import decode_captcha
result = decode_captcha("captcha.jpg")
```

### Truy vấn thông tin mã số thuế:
```python
from tax_query import query_tax_info
result = query_tax_info("MÃ_SỐ_THUẾ_THỰC_TẾ")
```

### Chạy test:
```bash
python _test/run_tests.py
```

## ✅ Hoàn thành yêu cầu

- ✅ Module giải mã captcha với Tesseract OCR
- ✅ Captcha 6 ký tự (a-z, 0-9)
- ✅ Độ chính xác cao với nhiều cấu hình
- ✅ Logging chi tiết để debug
- ✅ Tự động tải captcha và duy trì session
- ✅ Truy vấn thông tin mã số thuế
- ✅ Lưu kết quả JSON
- ✅ Test suite đầy đủ
- ✅ Documentation chi tiết

**Module đã sẵn sàng sử dụng trong production!** 🚀


Để Tesseract OCR nhận diện chính xác từng ký tự trong ảnh captcha, bạn cần tạo các bounding box (hộp giới hạn) cho từng ký tự. Việc này giúp Tesseract biết chính xác vị trí và vùng chứa của mỗi ký tự, từ đó tăng độ chính xác khi nhận diện. Có thể sử dụng các công cụ như labelImg, makesense.ai hoặc tự viết script Python với OpenCV để cắt từng ký tự ra khỏi ảnh gốc, sau đó lưu thông tin vị trí (tọa độ box) vào file label (ví dụ định dạng Pascal VOC hoặc YOLO). Khi huấn luyện hoặc nhận diện, Tesseract sẽ sử dụng các box này để tập trung vào từng ký tự riêng biệt thay vì nhận diện cả dòng, giúp giảm nhầm lẫn giữa các ký tự liền kề.

Các từ/ký tự dễ bị nhận diện sai (hay nhầm lẫn):

**Chọn lọc ảnh để tạo box training lại Tesseract (giống thư mục `captcha_dataset`):**

Khi tạo bộ dữ liệu huấn luyện cho Tesseract, nên ưu tiên chọn các ảnh captcha chứa các ký tự dễ nhầm lẫn dưới đây để vẽ bounding box (box) cho từng ký tự. Điều này giúp Tesseract học phân biệt tốt hơn các trường hợp khó.

Các cặp ký tự dễ nhầm lẫn nên ưu tiên chọn ảnh chứa:

- 0 (số không) ↔ o (chữ o)
- 1 (số một) ↔ l (chữ L thường) ↔ i (chữ i thường)
- 2 ↔ z
- 5 ↔ s
- 6 ↔ b
- 8 ↔ b
- c ↔ e
- g ↔ q
- m ↔ n
- u ↔ v
- w ↔ vv
- t ↔ f
- y ↔ v
- d ↔ cl

Danh sách ký tự: abcdefghijklmnopqrstuvwxyz0123456789

**Cách làm:**  
- Duyệt thư mục `captcha_dataset/labels/` để tìm các file label chứa các ký tự trên.
- Ưu tiên chọn các ảnh có nhiều ký tự dễ nhầm lẫn.
- Sử dụng các công cụ như labelImg, makesense.ai hoặc script Python để tạo box cho từng ký tự trong ảnh.
- Lưu thông tin box vào file label (Pascal VOC, YOLO, ...).

Việc chọn lọc kỹ các ảnh này sẽ giúp quá trình training lại Tesseract hiệu quả hơn, tăng độ chính xác nhận diện các ký tự khó.

---

**Các bước tiếp theo sau khi tạo box:**

1. **Chuyển đổi định dạng box (nếu cần):**  
   Đảm bảo các file box (label) đúng định dạng mà Tesseract yêu cầu, ví dụ định dạng `.box` cho training Tesseract hoặc chuyển đổi từ Pascal VOC/YOLO sang `.box` bằng script.

2. **Tạo file ground truth text:**  
   Với mỗi ảnh captcha, tạo file text chứa chuỗi ký tự đúng tương ứng (ground truth) để Tesseract sử dụng khi training.

3. **Chạy lệnh training Tesseract:**  
   Sử dụng các công cụ như `tesstrain.sh` hoặc `tesseract` CLI để huấn luyện lại model với dữ liệu đã gán box. Tham khảo tài liệu Tesseract về training custom data.

4. **Kiểm tra và đánh giá model:**  
   Sau khi training, kiểm tra độ chính xác của model mới trên tập captcha thực tế, đặc biệt với các ký tự dễ nhầm lẫn.

5. **Lặp lại (nếu cần):**  
   Nếu kết quả chưa tốt, tiếp tục bổ sung ảnh, chỉnh sửa box hoặc ground truth, rồi training lại để cải thiện model.

Việc thực hiện đầy đủ các bước trên sẽ giúp tăng đáng kể độ chính xác nhận diện captcha của Tesseract, đặc biệt với các ký tự khó phân biệt.



## 🚀 Sử dụng Gemini AI để giải mã Captcha

Project này đã được tích hợp sẵn **Gemini AI** để giải mã captcha với độ chính xác cao hơn Tesseract.

### ✨ Tính năng Gemini Decoder

- **Độ chính xác cao**: Gemini AI nhận dạng captcha tốt hơn Tesseract
- **Dễ sử dụng**: Chỉ cần API key, không cần cài đặt OCR engine
- **Tự động xử lý ảnh**: Không cần preprocessing phức tạp
- **API đơn giản**: Sử dụng dễ dàng với function tiện ích

### 📦 Cài đặt

```bash
# Cài đặt dependencies (bao gồm google-generativeai)
pip install -r requirements.txt
```

### 🎯 Sử dụng nhanh

```python
from gemini_captcha_decoder import decode_captcha_from_url_with_gemini

# Giải mã captcha từ URL (sử dụng API key có sẵn)
result = decode_captcha_from_url_with_gemini()
print(f"Captcha: {result}")
```

### 🔧 Sử dụng chi tiết

```python
from gemini_captcha_decoder import GeminiCaptchaDecoder

# Tạo decoder với API key mặc định
decoder = GeminiCaptchaDecoder()

# Hoặc sử dụng API key riêng
decoder = GeminiCaptchaDecoder("YOUR_API_KEY")

# Giải mã từ file
result = decoder.decode_captcha("captcha.jpg")

# Giải mã từ URL
result = decoder.decode_from_url()
```

### 📊 So sánh Gemini vs Tesseract

| Tính năng | Gemini | Tesseract |
|-----------|--------|-----------|
| Độ chính xác | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cài đặt | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Chi phí | ⭐⭐⭐ (có quota miễn phí) | ⭐⭐⭐⭐⭐ |
| Tốc độ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### 💰 Chi phí

- **Quota miễn phí**: Google cung cấp quota miễn phí cho Gemini
- **Theo dõi usage**: Kiểm tra tại https://aistudio.google.com/app/apikey
- **Tối ưu**: Sử dụng prompt ngắn gọn, chỉ gửi ảnh cần thiết

### 📚 Tài liệu chi tiết

Xem file `_docs/GEMINI_DECODER.md` để biết thêm chi tiết về:
- API Reference đầy đủ
- Troubleshooting
- Ví dụ nâng cao
- So sánh chi tiết với Tesseract


[GEMINI-API-KEY]
https://aistudio.google.com/apikey
AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU
https://ai.google.dev/gemini-api/docs?hl=vi




Quy trình kiểm thử và mô tả logic cho tax_query.py:

### Bước 1: Khởi tạo session và tải captcha
- Tạo một đối tượng `requests.Session()` để duy trì cookie và session.
- Gửi request GET tới `https://tracuuhoadon.gdt.gov.vn/Captcha.jpg` để lấy ảnh captcha.

### Bước 2: Giải mã captcha bằng Tesseract
- Sử dụng hàm từ `captcha_decoder.py` (dựa trên pytesseract) để giải mã captcha vừa tải về.
- Nếu giải mã thành công (trả về chuỗi hợp lệ 6 ký tự), chuyển sang bước 3.
- Nếu không thành công, lặp lại bước 1 và 2 tối đa 3 lần. Nếu sau 3 lần vẫn thất bại, chuyển sang bước 4.

### Bước 3: Truy vấn thông tin mã số thuế
- Sử dụng session đã tạo, gửi request GET tới:  
  `https://tracuuhoadon.gdt.gov.vn/gettin.html?tin=<MST>&captchaCode=<captcha_đã_giải>`
- Lưu nội dung trả về (dạng JSON) vào file để sử dụng hoặc phân tích tiếp.
- Kiểm tra trường `"tinModel"` trong JSON:
    - Nếu `"tinModel"` khác null: trả về session và captcha thành công.
    - Nếu `"tinModel"` là null: quay lại bước 1 (tối đa 3 lần thử với Tesseract).

### Bước 4: Giải mã captcha bằng Gemini
- Nếu Tesseract thất bại sau 3 lần, sử dụng Gemini để giải mã captcha (tối đa 3 lần thử).
- Mỗi lần thử: tải lại captcha mới, giải mã bằng Gemini, sau đó thực hiện lại bước 3.
- Nếu sau 3 lần với Gemini vẫn không thành công, dừng chương trình và thông báo lỗi.

### Bước 5: Kết thúc khi thành công
- Nếu Bước 1 thành công (giải captcha đúng và tinModel khác null):
    - **Kết thúc chương trình** - không cần test thêm
    - **Session/cookie vẫn được duy trì trong suốt quá trình** từ lần đầu tải captcha
    - **Logic hoạt động đúng theo yêu cầu**

Tóm lại:  
**Bước 1**: Giải captcha thành công với mã mặc định (Tesseract 3 lần → Gemini 3 lần).  
**Kết thúc**: Nếu thành công → dừng chương trình. **Session/cookie vẫn được duy trì trong suốt quá trình**.



function ktraCTrucTIN(strTINObj){
    var strTIN = strTINObj.replace(/\s+/g, '');
    if(strTIN != '' && (strTIN.length < 10 || strTIN.length > 14)){
        alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
        strTINObj.focus();
        return false;
    }
    if(strTIN.length == 10){
        var n1 = (strTIN.substring(0,1))*31;
        var n2 = (strTIN.substring(1,2))*29;
        var n3 = (strTIN.substring(2,3))*23;
        var n4 = (strTIN.substring(3,4))*19;
        var n5 = (strTIN.substring(4,5))*17;
        var n6 = (strTIN.substring(5,6))*13;
        var n7 = (strTIN.substring(6,7))*7;
        var n8 = (strTIN.substring(7,8))*5;
        var n9 = (strTIN.substring(8,9))*3;
        var n10 = strTIN.substring(9,10);

        var soDu = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9)%11;
        var hieuSo = 10 - soDu;
        if(strTIN != '' && hieuSo != n10){
            alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
            strTINObj.focus();
            return false;
        }
    }
    if(strTIN.length > 10 && strTIN.length < 14){
        alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
        strTINObj.focus();
        return false;
    }
/*    if(strTIN.length == 13){
        var n11 = toNumber(strTIN.substring(10,11));
        var n12 = toNumber(strTIN.substring(11,12));
        var n13 = toNumber(strTIN.substring(12,13));
        if(!(n11 >= 0 || n11 <= 9) || !(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9)){
            alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
            strTINObj.focus();
            return false;
        }
    }*/
    if(strTIN.length == 14){
        var n11 = strTIN.substring(10,11);
        var n12 = toNumber(strTIN.substring(11,12));
        var n13 = toNumber(strTIN.substring(12,13));
        var n14 = toNumber(strTIN.substring(13,14));

        if(n11 != '-'){
            alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
            strTINObj.focus();
            return false;
        }
        else{
            if(!(n12 >= 0 || n12 <= 9) || !(n13 >= 0 || n13 <= 9) || !(n14 >= 0 || n14 <= 9)){
                alert('MĂ£ sá»‘ thuáº¿ khĂ´ng Ä‘Ăºng, hĂ£y nháº­p láº¡i');
                strTINObj.focus();
                return false;
            }
        }
    }
    return true;
}


gdt_prefix_province_codes
company_info

[DATABASE]
Type: PostgreSQL
Host: 192.168.168.222
Port: 5433
Database: masothue
Username: zzsadmin
Password: Zzs23123456789

Module cập nhật tin_min bị thiếu cho một tỉnh từ bảng gdt_prefix_province_codes vào bảng company_info

**Mục tiêu:**  
Tự động quét và cập nhật các mã số thuế (tin) bắt đầu từ `tin_min` của một tỉnh (theo `code`), giảm dần, kiểm tra và chèn vào bảng `company_info` nếu chưa tồn tại.

**Chi tiết quy trình thực hiện:**

1. **Nhập thông tin đầu vào:**
   - Người dùng nhập `code` (mã tỉnh) cần quét từ bảng `gdt_prefix_province_codes`.
   - Kiểm tra tính hợp lệ của `code` (tồn tại trong bảng).

2. **Lấy thông tin tỉnh:**
   - Truy vấn bảng `gdt_prefix_province_codes` để lấy các trường: `tin_min`, `tin_max`, `name` tương ứng với `code` vừa nhập.
   - Nếu không có `tin_min`, thông báo lỗi và dừng.

3. **Khởi tạo captcha:**
   - Tải ảnh captcha từ link https://tracuuhoadon.gdt.gov.vn/Captcha.jpg và lưu tạm vào file (ví dụ: `captcha.jpg`).
   - Hiển thị ảnh captcha cho người dùng và yêu cầu nhập mã captcha.
   - Lưu giá trị captcha vừa nhập để sử dụng cho các request tiếp theo.
   - Nếu captcha hết hạn hoặc sai, lặp lại bước này để lấy captcha mới.

4. **Khởi tạo biến điều khiển:**
   - `no_new_batch_count = 0` (đếm số batch liên tiếp không có tin mới).
   - `batch_size = 1000`.
   - `current_tin = tin_min` (bắt đầu từ tin_min, giảm dần).

5. **Vòng lặp xử lý batch:**
   - **a. Sinh danh sách mã số thuế cho batch hiện tại:**
     - Sinh ra một danh sách gồm 1000 mã số thuế liên tiếp, giảm dần từ `current_tin`, mỗi mã đều được kiểm tra hợp lệ bằng hàm tax_code_validator. Ví dụ: nếu `current_tin = 1234567890`, danh sách batch sẽ là [1234567890, 1234567889, ..., 1234566891].
     - Nếu vượt quá `tin_max` (nếu có), dừng lại ở `tin_max`.
   - **b. Loại bỏ tin đã tồn tại:**
     - Truy vấn bảng `company_info` để lấy danh sách các tin đã có trong batch.
     - Loại bỏ các tin đã tồn tại, chỉ giữ lại các tin chưa có trong DB.
   - **c. Kiểm tra hợp lệ mã số thuế:**
     - Dùng hàm `tax_code_validator` để lọc ra các mã số thuế hợp lệ trong batch (theo quy tắc kiểm tra mã số thuế của GDT).
   - **d. Crawl dữ liệu từng tin hợp lệ:**
     - Với mỗi tin hợp lệ chưa có trong DB:
       - Gửi request truy vấn thông tin lên https://tracuuhoadon.gdt.gov.vn/gettin.html?tin={TIN}&captchaCode={CAPTCHA}.
       - Nếu trả về lỗi captcha, yêu cầu nhập lại captcha mới và thử lại tin đó.
       - Nếu trả về dữ liệu hợp lệ, lưu thông tin vào bảng `company_info` (bao gồm cả json_data gốc nếu cần).
       - Nếu trả về không tìm thấy hoặc lỗi khác, bỏ qua tin đó.
   - **e. Cập nhật biến điều khiển:**
     - Nếu batch này không có tin mới nào được thêm vào DB, tăng `no_new_batch_count` lên 1.
     - Nếu có tin mới, đặt lại `no_new_batch_count = 0`.
   - **f. Cập nhật `current_tin`:**
     - Giảm `current_tin` xuống batch tiếp theo (trừ đi `batch_size`).

6. **Điều kiện dừng:**
   - Nếu liên tiếp 10 batch không có tin mới nào được thêm vào DB (`no_new_batch_count >= 10`), dừng tiến trình.
   - Hoặc nếu đã quét hết dải tin từ `tin_min` đến `tin_max` (nếu có), dừng.

7. **Tóm tắt luồng chính:**
   - Nhập code tỉnh → lấy tin_min, tin_max → nhập captcha → lặp qua từng batch 1000 tin giảm dần → loại bỏ tin đã có → validate → crawl → cập nhật DB → kiểm tra điều kiện dừng → lặp lại hoặc kết thúc.

**Lưu ý bổ sung:**
- Nên log lại các tin đã crawl thất bại hoặc lỗi captcha để dễ debug.


**Ví dụ luồng thực tế:**
1. Nhập code: `23` (Bắc Ninh)
2. Lấy tin_min: `2300000000`
3. Nhập captcha: `abc123`
4. Quét batch đầu: [2300000000, 2299999999, ..., 2299999001]
5. Loại bỏ tin đã có, validate, crawl, cập nhật DB
6. Nếu batch không có tin mới, tăng biến đếm, nếu có thì reset biến đếm
7. Lặp lại cho batch tiếp theo cho đến khi đủ 10 batch không có tin mới hoặc hết dải tin



**Lưu ý bổ sung:**
- Nên log lại các tin đã crawl thất bại hoặc lỗi captcha để dễ debug.
- Có thể bổ sung sleep/throttle giữa các request để tránh bị chặn IP.
- Có thể chạy đa luồng cho nhiều tỉnh khác nhau, nhưng mỗi thread/process phải có captcha riêng.
- Nên kiểm tra và chuẩn hóa lại định dạng tin (padding 0, kiểm tra độ dài, v.v.) trước khi gửi request.