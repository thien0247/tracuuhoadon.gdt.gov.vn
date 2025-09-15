"""
Module giải mã captcha từ trang tracuuhoadon.gdt.gov.vn
Sử dụng Tesseract OCR để nhận dạng captcha 6 ký tự (a-z, 0-9)
"""

import logging
import os
import re
from typing import Optional, List, Tuple
import requests
from PIL import Image, ImageEnhance, ImageFilter

# Import pytesseract với xử lý lỗi
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  Cảnh báo: pytesseract chưa được cài đặt. Chạy: pip install pytesseract")

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CaptchaDecoder:
    """Class chính để giải mã captcha"""
    
    def __init__(self):
        """Khởi tạo decoder với các cấu hình mặc định"""
        self.whitelist = "abcdefghijklmnopqrstuvwxyz0123456789"
        self.expected_length = 6
        
        # Kiểm tra Tesseract
        if not TESSERACT_AVAILABLE:
            logger.error("Tesseract không khả dụng. Vui lòng cài đặt pytesseract và Tesseract OCR.")
            return
        
        # Thử cấu hình Tesseract
        try:
            pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {pytesseract.get_tesseract_version()}")
        except Exception as e:
            logger.error(f"Không thể truy cập Tesseract: {e}")
            logger.error("Vui lòng cài đặt Tesseract OCR và thêm vào PATH")
            return
        
        # Các cấu hình Tesseract tối ưu cho captcha đã xử lý
        self.tesseract_configs = [
            # Cấu hình tốt nhất cho captcha đơn giản (ưu tiên cao)
            f'--oem 3 --psm 8 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho single word với legacy engine
            f'--oem 1 --psm 8 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho text line
            f'--oem 3 --psm 7 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho single text line với legacy engine
            f'--oem 1 --psm 7 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho uniform block
            f'--oem 3 --psm 6 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho single character
            f'--oem 3 --psm 10 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình cho sparse text
            f'--oem 3 --psm 13 -c tessedit_char_whitelist={self.whitelist}',
            # Cấu hình với threshold thấp
            f'--oem 3 --psm 8 -c tessedit_char_whitelist={self.whitelist} -c textord_min_linesize=2.0',
            # Cấu hình với threshold cao
            f'--oem 3 --psm 8 -c tessedit_char_whitelist={self.whitelist} -c textord_min_linesize=3.0',
        ]
    
    def download_captcha(self, url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[str]:
        """
        Tải captcha từ URL và lưu vào file tạm
        
        Args:
            url: URL của captcha image
            
        Returns:
            Đường dẫn file ảnh đã tải về hoặc None nếu lỗi
        """
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Lưu vào file tạm
            temp_path = "temp_captcha.jpg"
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Đã tải captcha từ {url}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Lỗi khi tải captcha: {e}")
            return None
    
    def preprocess_image(self, image_path: str) -> List[Image.Image]:
        """
        Tiền xử lý ảnh captcha với phương pháp tối ưu:
        1. Xóa nền đen thành trắng
        2. Chuyển text sang màu đen
        3. Tạo nhiều phiên bản với các ngưỡng khác nhau
        
        Args:
            image_path: Đường dẫn đến ảnh captcha
            
        Returns:
            List các ảnh đã được xử lý với các phương pháp khác nhau
        """
        try:
            # Đọc ảnh gốc
            original = Image.open(image_path)
            logger.info(f"Ảnh gốc: {original.size[0]}x{original.size[1]}, mode: {original.mode}")
            
            processed_images = []
            
            # Phương pháp 1: Xử lý cơ bản với ngưỡng thấp
            processed_img = self._process_captcha_image(original, threshold=30)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 2: Xử lý với ngưỡng trung bình
            processed_img = self._process_captcha_image(original, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 3: Xử lý với ngưỡng cao
            processed_img = self._process_captcha_image(original, threshold=80)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 4: Xử lý với ngưỡng rất cao
            processed_img = self._process_captcha_image(original, threshold=100)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 5: Tăng tương phản trước khi xử lý
            enhanced = ImageEnhance.Contrast(original).enhance(2.0)
            processed_img = self._process_captcha_image(enhanced, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 6: Tăng tương phản mạnh
            enhanced_strong = ImageEnhance.Contrast(original).enhance(3.0)
            processed_img = self._process_captcha_image(enhanced_strong, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 7: Làm sắc nét trước khi xử lý
            sharpened = original.filter(ImageFilter.SHARPEN)
            processed_img = self._process_captcha_image(sharpened, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 8: Kết hợp sắc nét + tương phản
            sharp_contrast = ImageEnhance.Contrast(sharpened).enhance(2.0)
            processed_img = self._process_captcha_image(sharp_contrast, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 9: Tăng độ sáng
            brightened = ImageEnhance.Brightness(original).enhance(1.2)
            processed_img = self._process_captcha_image(brightened, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            # Phương pháp 10: Giảm độ sáng
            darkened = ImageEnhance.Brightness(original).enhance(0.8)
            processed_img = self._process_captcha_image(darkened, threshold=50)
            if processed_img:
                processed_images.append(processed_img)
            
            logger.info(f"Đã tạo {len(processed_images)} phiên bản ảnh đã xử lý")
            return processed_images
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý ảnh: {e}")
            return []
    
    def _process_captcha_image(self, image: Image.Image, threshold: int = 50) -> Optional[Image.Image]:
        """
        Xử lý ảnh captcha: xóa nền đen, chuyển text sang màu đen
        Phương pháp tối ưu cho captcha có nền đen
        
        Args:
            image: Ảnh gốc
            threshold: Ngưỡng để phân biệt nền đen và text (0-255)
            
        Returns:
            Ảnh đã được xử lý hoặc None nếu lỗi
        """
        try:
            # Chuyển sang grayscale
            if image.mode != 'L':
                gray = image.convert('L')
            else:
                gray = image
            
            # Tạo ảnh kết quả: nền trắng, text đen
            width, height = gray.size
            result_image = Image.new('L', (width, height), 255)  # Nền trắng
            
            # Xử lý từng pixel
            for x in range(width):
                for y in range(height):
                    pixel_value = gray.getpixel((x, y))
                    
                    # Nếu pixel sáng hơn ngưỡng (text), chuyển thành màu đen
                    if pixel_value > threshold:
                        result_image.putpixel((x, y), 0)  # Đen
                    # Nếu pixel tối hơn ngưỡng (nền đen), giữ màu trắng
            
            return result_image
            
        except Exception as e:
            logger.error(f"Lỗi xử lý ảnh captcha: {e}")
            return None
    
    def clean_text(self, text: str) -> str:
        """
        Làm sạch text từ OCR, chỉ giữ lại ký tự hợp lệ
        
        Args:
            text: Text thô từ OCR
            
        Returns:
            Text đã được làm sạch
        """
        if not text:
            return ""
        
        # Chỉ giữ lại ký tự trong whitelist
        cleaned = re.sub(f'[^{self.whitelist}]', '', text.lower())
        
        # Loại bỏ khoảng trắng
        cleaned = cleaned.replace(' ', '').replace('\n', '').replace('\t', '')
        
        return cleaned
    
    def decode_captcha(self, image_path: str) -> Optional[str]:
        """
        Giải mã captcha từ đường dẫn ảnh
        
        Args:
            image_path: Đường dẫn đến ảnh captcha
            
        Returns:
            Chuỗi ký tự giải mã được hoặc None nếu không thành công
        """
        if not os.path.exists(image_path):
            logger.error(f"File ảnh không tồn tại: {image_path}")
            return None
        
        logger.info(f"Bắt đầu giải mã captcha từ: {image_path}")
        
        # Tiền xử lý ảnh
        processed_images = self.preprocess_image(image_path)
        if not processed_images:
            return None
        
        best_results = []
        
        # Thử với từng ảnh đã xử lý và từng cấu hình Tesseract
        for img_idx, image in enumerate(processed_images):
            for config_idx, config in enumerate(self.tesseract_configs):
                try:
                    # OCR với cấu hình hiện tại
                    raw_text = pytesseract.image_to_string(image, config=config)
                    cleaned_text = self.clean_text(raw_text)
                    
                    logger.info(f"Ảnh {img_idx}, Config {config_idx}: '{raw_text}' -> '{cleaned_text}'")
                    
                    # Đánh giá kết quả
                    score = self.evaluate_result(cleaned_text)
                    best_results.append((cleaned_text, score, img_idx, config_idx))
                    
                except Exception as e:
                    logger.warning(f"Lỗi OCR với ảnh {img_idx}, config {config_idx}: {e}")
                    continue
        
        # Sắp xếp theo điểm số (cao nhất trước)
        best_results.sort(key=lambda x: x[1], reverse=True)
        
        # Log kết quả tốt nhất
        if best_results:
            best_text, best_score, best_img, best_config = best_results[0]
            logger.info(f"Kết quả tốt nhất: '{best_text}' (điểm: {best_score}, ảnh: {best_img}, config: {best_config})")
            
            # Trả về kết quả có độ dài đúng hoặc gần nhất
            if len(best_text) == self.expected_length:
                return best_text
            elif best_text:  # Trả về kết quả tốt nhất dù không đúng độ dài
                return best_text
        
        logger.warning("Không thể giải mã captcha")
        return None
    
    def evaluate_result(self, text: str) -> float:
        """
        Đánh giá chất lượng kết quả OCR
        
        Args:
            text: Text đã được làm sạch
            
        Returns:
            Điểm số từ 0-1 (1 là tốt nhất)
        """
        if not text:
            return 0.0
        
        score = 0.0
        
        # Điểm cho độ dài đúng
        if len(text) == self.expected_length:
            score += 0.5
        elif len(text) > 0:
            # Điểm giảm dần theo độ lệch độ dài
            length_diff = abs(len(text) - self.expected_length)
            score += max(0, 0.5 - length_diff * 0.1)
        
        # Điểm cho ký tự hợp lệ
        valid_chars = sum(1 for c in text if c in self.whitelist)
        score += (valid_chars / len(text)) * 0.3 if text else 0
        
        # Điểm bonus cho kết quả có độ dài đúng
        if len(text) == self.expected_length:
            score += 0.2
        
        return min(score, 1.0)
    
    def decode_from_url(self, url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[str]:
        """
        Tải và giải mã captcha từ URL
        
        Args:
            url: URL của captcha image
            
        Returns:
            Chuỗi ký tự giải mã được hoặc None nếu không thành công
        """
        # Tải captcha
        temp_path = self.download_captcha(url)
        if not temp_path:
            return None
        
        try:
            # Giải mã
            result = self.decode_captcha(temp_path)
            return result
        finally:
            # Xóa file tạm
            if os.path.exists(temp_path):
                os.remove(temp_path)


def decode_captcha(image_path: str) -> Optional[str]:
    """
    Function chính để giải mã captcha từ file ảnh
    
    Args:
        image_path: Đường dẫn đến file ảnh captcha
        
    Returns:
        Chuỗi ký tự giải mã được hoặc None nếu không thành công
        
    Example:
        result = decode_captcha("captcha.jpg")
        if result:
            print(f"Captcha: {result}")
    """
    decoder = CaptchaDecoder()
    return decoder.decode_captcha(image_path)


def decode_captcha_from_url(url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[str]:
    """
    Function phụ để tải và giải mã captcha từ URL (không khuyến nghị)
    
    Args:
        url: URL của captcha image
        
    Returns:
        Chuỗi ký tự giải mã được hoặc None nếu không thành công
        
    Note:
        Khuyến nghị sử dụng decode_captcha() với file ảnh thay vì URL
    """
    decoder = CaptchaDecoder()
    return decoder.decode_from_url(url)


if __name__ == "__main__":
    # Test với file ảnh (khuyến nghị)
    import sys
    
    if len(sys.argv) > 1:
        # Sử dụng file ảnh được cung cấp
        image_path = sys.argv[1]
        print(f"Giải mã captcha từ file: {image_path}")
        result = decode_captcha(image_path)
    else:
        # Test với URL (fallback)
        print("Không có file ảnh được cung cấp, sử dụng URL...")
        result = decode_captcha_from_url()
    
    if result:
        print(f"Kết quả giải mã captcha: {result}")
    else:
        print("Không thể giải mã captcha")
