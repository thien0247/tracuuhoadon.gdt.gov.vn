"""
Module giải mã captcha từ trang tracuuhoadon.gdt.gov.vn sử dụng Gemini AI
Sử dụng Google Gemini Pro Vision để nhận dạng captcha 6 ký tự (a-z, 0-9)
"""

import logging
import os
import re
from typing import Optional, Union
import requests
from PIL import Image
import io

# Import google.generativeai với xử lý lỗi
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  Cảnh báo: google-generativeai chưa được cài đặt. Chạy: pip install google-generativeai")

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GeminiCaptchaDecoder:
    """Class chính để giải mã captcha sử dụng Gemini AI"""
    
    def __init__(self, api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU"):
        """
        Khởi tạo decoder với API key Gemini
        
        Args:
            api_key: API key của Google Gemini (mặc định sử dụng key có sẵn)
        """
        self.api_key = api_key
        self.whitelist = "abcdefghijklmnopqrstuvwxyz0123456789"
        self.expected_length = 6
        
        # Kiểm tra Gemini
        if not GEMINI_AVAILABLE:
            logger.error("Google Generative AI không khả dụng. Vui lòng cài đặt: pip install google-generativeai")
            return
        
        # Cấu hình API key
        try:
            genai.configure(api_key=self.api_key)
            logger.info("Đã cấu hình Gemini API key thành công")
        except Exception as e:
            logger.error(f"Lỗi cấu hình Gemini API: {e}")
            return
        
        # Khởi tạo model
        try:
            # Sử dụng model mới nhất theo tài liệu
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            logger.info("Đã khởi tạo Gemini 2.5 Flash model thành công")
        except Exception as e:
            logger.error(f"Lỗi khởi tạo Gemini model: {e}")
            # Thử với model khác
            try:
                self.model = genai.GenerativeModel("gemini-2.5-pro")
                logger.info("Đã khởi tạo Gemini 2.5 Pro model thành công")
            except Exception as e2:
                logger.error(f"Lỗi khởi tạo Gemini model thay thế: {e2}")
                return
    
    def download_captcha(self, url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[str]:
        """
        Tải captcha từ URL và lưu vào file tạm
        
        Args:
            url: URL của captcha image
            
        Returns:
            Đường dẫn file ảnh đã tải về hoặc None nếu lỗi
        """
        try:
            logger.info(f"Đang tải captcha từ: {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Tạo file tạm
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            logger.info(f"Đã tải captcha thành công: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Lỗi tải captcha: {e}")
            return None
    
    def download_captcha_bytes(self, url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[bytes]:
        """
        Tải captcha từ URL và trả về dữ liệu bytes
        
        Args:
            url: URL của captcha image
            
        Returns:
            Dữ liệu ảnh dạng bytes hoặc None nếu lỗi
        """
        try:
            logger.info(f"Đang tải captcha từ: {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            logger.info(f"Đã tải captcha thành công, kích thước: {len(response.content)} bytes")
            return response.content
            
        except Exception as e:
            logger.error(f"Lỗi tải captcha: {e}")
            return None
    
    def clean_text(self, text: str) -> str:
        """
        Làm sạch text từ Gemini response
        
        Args:
            text: Text thô từ Gemini
            
        Returns:
            Text đã được làm sạch
        """
        if not text:
            return ""
        
        # Loại bỏ khoảng trắng và ký tự đặc biệt
        cleaned = re.sub(r'[^a-z0-9]', '', text.lower())
        
        # Chỉ giữ lại ký tự trong whitelist
        cleaned = ''.join(c for c in cleaned if c in self.whitelist)
        
        return cleaned
    
    def decode_captcha(self, image_input: Union[str, bytes, Image.Image]) -> Optional[str]:
        """
        Giải mã captcha từ ảnh sử dụng Gemini
        
        Args:
            image_input: Có thể là:
                - str: Đường dẫn đến file ảnh
                - bytes: Dữ liệu ảnh dạng bytes
                - PIL.Image: Đối tượng ảnh PIL
            
        Returns:
            Chuỗi ký tự giải mã được hoặc None nếu thất bại
        """
        if not GEMINI_AVAILABLE:
            logger.error("Gemini không khả dụng")
            return None
        
        try:
            # Xử lý input ảnh
            img_bytes = self._process_image_input(image_input)
            if not img_bytes:
                return None
            
            # Tạo prompt tối ưu cho captcha
            prompt = """Nhận diện chính xác chuỗi ký tự trong ảnh captcha này. 
            - Captcha có 6 ký tự
            - Chỉ chứa chữ cái thường (a-z) và số (0-9)
            - Chỉ trả về chuỗi ký tự, không giải thích gì thêm
            - Ví dụ: abc123, xyz789"""
            
            logger.info("Đang gửi request tới Gemini...")
            
            # Gửi request tới Gemini với format mới
            response = self.model.generate_content([prompt, {"mime_type": "image/jpeg", "data": img_bytes}])
            
            # Xử lý response
            raw_text = response.text.strip()
            cleaned_text = self.clean_text(raw_text)
            
            logger.info(f"Gemini response: '{raw_text}' -> cleaned: '{cleaned_text}'")
            
            # Kiểm tra kết quả
            if len(cleaned_text) == self.expected_length:
                logger.info(f"Giải mã thành công: {cleaned_text}")
                return cleaned_text
            elif cleaned_text:
                logger.warning(f"Kết quả không đúng độ dài: {cleaned_text} (độ dài: {len(cleaned_text)})")
                return cleaned_text
            else:
                logger.warning("Không thể giải mã captcha")
                return None
                
        except Exception as e:
            logger.error(f"Lỗi giải mã captcha với Gemini: {e}")
            return None
    
    def _process_image_input(self, image_input: Union[str, bytes, Image.Image]) -> Optional[bytes]:
        """
        Xử lý input ảnh và chuyển đổi thành bytes
        
        Args:
            image_input: Input ảnh (str path, bytes, hoặc PIL.Image)
            
        Returns:
            Dữ liệu ảnh dạng bytes hoặc None nếu lỗi
        """
        try:
            if isinstance(image_input, str):
                # Đường dẫn file
                if not os.path.exists(image_input):
                    logger.error(f"File ảnh không tồn tại: {image_input}")
                    return None
                
                with open(image_input, "rb") as f:
                    return f.read()
                    
            elif isinstance(image_input, bytes):
                # Dữ liệu bytes
                return image_input
                
            elif isinstance(image_input, Image.Image):
                # PIL Image object
                img_buffer = io.BytesIO()
                image_input.save(img_buffer, format='JPEG')
                return img_buffer.getvalue()
                
            else:
                logger.error(f"Loại input không được hỗ trợ: {type(image_input)}")
                return None
                
        except Exception as e:
            logger.error(f"Lỗi xử lý input ảnh: {e}")
            return None
    
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
    
    def decode_from_url_bytes(self, url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg") -> Optional[str]:
        """
        Tải và giải mã captcha từ URL (sử dụng bytes, không tạo file tạm)
        
        Args:
            url: URL của captcha image
            
        Returns:
            Chuỗi ký tự giải mã được hoặc None nếu không thành công
        """
        # Tải captcha dưới dạng bytes
        img_bytes = self.download_captcha_bytes(url)
        if not img_bytes:
            return None
        
        # Giải mã trực tiếp từ bytes
        return self.decode_captcha(img_bytes)
    
    def test_api_connection(self) -> bool:
        """
        Kiểm tra kết nối API Gemini
        
        Returns:
            True nếu kết nối thành công, False nếu thất bại
        """
        if not GEMINI_AVAILABLE:
            logger.error("Gemini không khả dụng")
            return False
        
        try:
            # Test đơn giản với text only (không cần ảnh)
            test_prompt = "Hello, this is a test message. Please respond with 'OK'."
            response = self.model.generate_content(test_prompt)
            
            if response and response.text:
                logger.info("Kết nối Gemini API thành công")
                return True
            else:
                logger.error("Gemini API không trả về response")
                return False
                
        except Exception as e:
            logger.error(f"Lỗi kết nối Gemini API: {e}")
            return False


def decode_captcha_with_gemini(image_input: Union[str, bytes, Image.Image], api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU") -> Optional[str]:
    """
    Function tiện ích để giải mã captcha sử dụng Gemini
    
    Args:
        image_input: Có thể là:
            - str: Đường dẫn đến file ảnh captcha
            - bytes: Dữ liệu ảnh dạng bytes
            - PIL.Image: Đối tượng ảnh PIL
        api_key: API key của Google Gemini
        
    Returns:
        Chuỗi ký tự giải mã được hoặc None nếu thất bại
    """
    decoder = GeminiCaptchaDecoder(api_key)
    return decoder.decode_captcha(image_input)


def decode_captcha_from_url_with_gemini(url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", 
                                       api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU") -> Optional[str]:
    """
    Function tiện ích để tải và giải mã captcha từ URL sử dụng Gemini
    
    Args:
        url: URL của captcha image
        api_key: API key của Google Gemini
        
    Returns:
        Chuỗi ký tự giải mã được hoặc None nếu thất bại
    """
    decoder = GeminiCaptchaDecoder(api_key)
    return decoder.decode_from_url(url)


def decode_captcha_from_url_bytes_with_gemini(url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", 
                                            api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU") -> Optional[str]:
    """
    Function tiện ích để tải và giải mã captcha từ URL sử dụng Gemini (bytes, không tạo file tạm)
    
    Args:
        url: URL của captcha image
        api_key: API key của Google Gemini
        
    Returns:
        Chuỗi ký tự giải mã được hoặc None nếu thất bại
    """
    decoder = GeminiCaptchaDecoder(api_key)
    return decoder.decode_from_url_bytes(url)


def download_captcha_bytes_with_gemini(url: str = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", 
                                      api_key: str = "AIzaSyAkBBSiV8qubl7jiyvRQ5V-dhPxoDhsljU") -> Optional[bytes]:
    """
    Function tiện ích để tải captcha từ URL và trả về bytes
    
    Args:
        url: URL của captcha image
        api_key: API key của Google Gemini
        
    Returns:
        Dữ liệu ảnh dạng bytes hoặc None nếu thất bại
    """
    decoder = GeminiCaptchaDecoder(api_key)
    return decoder.download_captcha_bytes(url)


if __name__ == "__main__":
    # Test cơ bản
    decoder = GeminiCaptchaDecoder()
    
    # Test kết nối API
    if decoder.test_api_connection():
        print("✅ Kết nối Gemini API thành công")
        
        # Test giải mã từ URL (file tạm)
        print("\n--- Test decode_from_url (file tạm) ---")
        result = decoder.decode_from_url()
        if result:
            print(f"✅ Giải mã captcha thành công: {result}")
        else:
            print("❌ Không thể giải mã captcha")
        
        # Test giải mã từ URL (bytes)
        print("\n--- Test decode_from_url_bytes (không file tạm) ---")
        result = decoder.decode_from_url_bytes()
        if result:
            print(f"✅ Giải mã captcha thành công: {result}")
        else:
            print("❌ Không thể giải mã captcha")
        
        # Test tải ảnh dưới dạng bytes
        print("\n--- Test download_captcha_bytes ---")
        img_bytes = decoder.download_captcha_bytes()
        if img_bytes:
            print(f"✅ Tải ảnh thành công, kích thước: {len(img_bytes)} bytes")
            
            # Test giải mã từ bytes
            print("\n--- Test decode_captcha với bytes ---")
            result = decoder.decode_captcha(img_bytes)
            if result:
                print(f"✅ Giải mã captcha từ bytes thành công: {result}")
            else:
                print("❌ Không thể giải mã captcha từ bytes")
        else:
            print("❌ Không thể tải ảnh")
            
    else:
        print("❌ Lỗi kết nối Gemini API")
