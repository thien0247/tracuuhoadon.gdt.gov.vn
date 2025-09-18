"""
Module tự động lấy và giải mã captcha, truy vấn thông tin mã số thuế và lưu kết quả JSON
"""

import requests
import json
import time
import os
from typing import Optional, Dict, Any
from captcha_decoder import decode_captcha
from gemini_captcha_decoder import GeminiCaptchaDecoder
from PIL import Image
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class TaxQuery:
    """Class để truy vấn thông tin mã số thuế"""
    
    def __init__(self):
        """Khởi tạo TaxQuery với session"""
        self.session = requests.Session()
        self.base_url = "https://tracuuhoadon.gdt.gov.vn"
        self.captcha_url = f"{self.base_url}/Captcha.jpg"
        self.query_url = f"{self.base_url}/gettin.html"
        
        # Khởi tạo Gemini decoder
        self.gemini_decoder = GeminiCaptchaDecoder()
        
        # Headers để giả lập browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def download_captcha(self) -> Optional[str]:
        """
        Tải captcha và duy trì session
        
        Returns:
            Đường dẫn file captcha hoặc None nếu lỗi
        """
        try:
            logger.info("Đang tải captcha...")
            response = self.session.get(self.captcha_url, timeout=10)
            response.raise_for_status()
            
            # Lưu captcha vào file tạm
            captcha_path = "temp_captcha.jpg"
            with open(captcha_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Đã tải captcha ({len(response.content)} bytes)")
            return captcha_path
            
        except Exception as e:
            logger.error(f"Lỗi tải captcha: {e}")
            return None
    
    def solve_captcha(self, captcha_path: str) -> Optional[str]:
        """
        Giải mã captcha sử dụng captcha_decoder
        
        Args:
            captcha_path: Đường dẫn file captcha
            
        Returns:
            Chuỗi captcha đã giải mã hoặc None nếu lỗi
        """
        try:
            logger.info("Đang giải mã captcha...")
            result = decode_captcha(captcha_path)
            
            if result:
                logger.info(f"Giải mã captcha thành công: {result}")
                return result
            else:
                logger.warning("Không thể giải mã captcha")
                return None
                
        except Exception as e:
            logger.error(f"Lỗi giải mã captcha: {e}")
            return None
    
    def solve_captcha_with_gemini(self, captcha_path: str) -> Optional[str]:
        """
        Giải mã captcha sử dụng Gemini decoder
        
        Args:
            captcha_path: Đường dẫn file captcha
            
        Returns:
            Chuỗi captcha đã giải mã hoặc None nếu lỗi
        """
        try:
            logger.info("Đang giải mã captcha với Gemini...")
            result = self.gemini_decoder.decode_captcha(captcha_path)
            
            if result:
                logger.info(f"Giải mã captcha với Gemini thành công: {result}")
                return result
            else:
                logger.warning("Không thể giải mã captcha với Gemini")
                return None
                
        except Exception as e:
            logger.error(f"Lỗi giải mã captcha với Gemini: {e}")
            return None
    
    def is_captcha_success(self, result: Dict[str, Any]) -> bool:
        """
        Kiểm tra xem captcha có được giải thành công không
        Dựa trên trường 'tinModel' khác null
        
        Args:
            result: Kết quả từ API
            
        Returns:
            True nếu captcha thành công, False nếu không
        """
        try:
            if isinstance(result, dict):
                # Kiểm tra trường tinModel
                if 'tinModel' in result and result['tinModel'] is not None:
                    logger.info("✅ Captcha giải thành công (tinModel khác null)")
                    return True
                else:
                    logger.warning("❌ Captcha giải thất bại (tinModel null hoặc không tồn tại)")
                    return False
            else:
                logger.warning("❌ Kết quả không phải dict")
                return False
        except Exception as e:
            logger.error(f"Lỗi kiểm tra kết quả captcha: {e}")
            return False
    
    def query_tax_info(self, tax_code: str, captcha_code: str) -> Optional[Dict[str, Any]]:
        """
        Truy vấn thông tin mã số thuế
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha đã giải
            
        Returns:
            Thông tin JSON hoặc None nếu lỗi
        """
        try:
            # Tạo URL với tham số
            params = {
                'tin': tax_code,
                'captchaCode': captcha_code
            }
            
            logger.info(f"Đang truy vấn thông tin mã số thuế: {tax_code}")
            logger.info(f"URL: {self.query_url}?tin={tax_code}&captchaCode={captcha_code}")
            
            # Thêm delay trước khi gửi request
            logger.info("⏳ Đợi 2 giây trước khi gửi request...")
            time.sleep(2)
            
            # Gửi request
            response = self.session.get(self.query_url, params=params, timeout=10)
            response.raise_for_status()
            
            # Kiểm tra content type
            content_type = response.headers.get('content-type', '')
            logger.info(f"Content-Type: {content_type}")
            
            # Thử parse JSON
            try:
                data = response.json()
                logger.info("Nhận được dữ liệu JSON")
                return data
            except json.JSONDecodeError:
                # Nếu không phải JSON, trả về text
                logger.info("Nhận được dữ liệu text")
                return {
                    'status': 'success',
                    'content_type': content_type,
                    'data': response.text,
                    'tax_code': tax_code,
                    'captcha_code': captcha_code
                }
                
        except Exception as e:
            logger.error(f"Lỗi truy vấn thông tin: {e}")
            return None
    
    def save_result(self, data: Dict[str, Any], filename: str = None) -> str:
        """
        Lưu kết quả vào file JSON
        
        Args:
            data: Dữ liệu cần lưu
            filename: Tên file (tự động tạo nếu None)
            
        Returns:
            Đường dẫn file đã lưu
        """
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"tax_query_result_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Đã lưu kết quả vào: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Lỗi lưu file: {e}")
            return ""
    
    def query_with_retry(self, tax_code: str, max_tesseract_retries: int = 3, max_gemini_retries: int = 3) -> Optional[Dict[str, Any]]:
        """
        Truy vấn thông tin với retry mechanism theo yêu cầu:
        - Ưu tiên sử dụng captcha_decoder (Tesseract) với tối đa 3 lần thử
        - Nếu thất bại, chuyển sang gemini_captcha_decoder với tối đa 3 lần thử
        - Session được duy trì trong suốt 6 lần thử (3 Tesseract + 3 Gemini)
        
        Args:
            tax_code: Mã số thuế
            max_tesseract_retries: Số lần thử tối đa với Tesseract
            max_gemini_retries: Số lần thử tối đa với Gemini
            
        Returns:
            Thông tin JSON hoặc None nếu thất bại
        """
        # Phase 1: Thử với Tesseract (captcha_decoder)
        logger.info(f"🔄 Phase 1: Thử với Tesseract (tối đa {max_tesseract_retries} lần)")
        
        for attempt in range(max_tesseract_retries):
            logger.info(f"Tesseract - Lần thử {attempt + 1}/{max_tesseract_retries}")
            
            try:
                # Bước 1: Tải captcha
                captcha_path = self.download_captcha()
                if not captcha_path:
                    logger.warning("Không thể tải captcha")
                    continue
                
                # Bước 2: Giải mã captcha với Tesseract
                captcha_code = self.solve_captcha(captcha_path)
                if not captcha_code:
                    logger.warning("Không thể giải mã captcha với Tesseract")
                    # Xóa file captcha tạm
                    if os.path.exists(captcha_path):
                        os.remove(captcha_path)
                    continue
                
                # Bước 3: Truy vấn thông tin
                result = self.query_tax_info(tax_code, captcha_code)
                
                # Xóa file captcha tạm
                if os.path.exists(captcha_path):
                    os.remove(captcha_path)
                
                if result and self.is_captcha_success(result):
                    logger.info("✅ Tesseract: Truy vấn thành công!")
                    # Thêm captcha_code vào result để sử dụng sau này
                    result['captcha_code'] = captcha_code
                    return result
                else:
                    logger.warning("❌ Tesseract: Captcha không đúng hoặc truy vấn thất bại")
                    
            except Exception as e:
                logger.error(f"Lỗi trong lần thử Tesseract {attempt + 1}: {e}")
            
            # Nghỉ giữa các lần thử
            if attempt < max_tesseract_retries - 1:
                logger.info("Nghỉ 2 giây trước khi thử lại...")
                time.sleep(2)
        
        logger.warning(f"❌ Tesseract thất bại sau {max_tesseract_retries} lần thử")
        
        # Phase 2: Thử với Gemini
        logger.info(f"🔄 Phase 2: Chuyển sang Gemini (tối đa {max_gemini_retries} lần)")
        
        for attempt in range(max_gemini_retries):
            logger.info(f"Gemini - Lần thử {attempt + 1}/{max_gemini_retries}")
            
            try:
                # Bước 1: Tải captcha
                captcha_path = self.download_captcha()
                if not captcha_path:
                    logger.warning("Không thể tải captcha")
                    continue
                
                # Bước 2: Giải mã captcha với Gemini
                captcha_code = self.solve_captcha_with_gemini(captcha_path)
                if not captcha_code:
                    logger.warning("Không thể giải mã captcha với Gemini")
                    # Xóa file captcha tạm
                    if os.path.exists(captcha_path):
                        os.remove(captcha_path)
                    continue
                
                # Bước 3: Truy vấn thông tin
                result = self.query_tax_info(tax_code, captcha_code)
                
                # Xóa file captcha tạm
                if os.path.exists(captcha_path):
                    os.remove(captcha_path)
                
                if result and self.is_captcha_success(result):
                    logger.info("✅ Gemini: Truy vấn thành công!")
                    # Thêm captcha_code vào result để sử dụng sau này
                    result['captcha_code'] = captcha_code
                    return result
                else:
                    logger.warning("❌ Gemini: Captcha không đúng hoặc truy vấn thất bại")
                    
            except Exception as e:
                logger.error(f"Lỗi trong lần thử Gemini {attempt + 1}: {e}")
            
            # Nghỉ giữa các lần thử
            if attempt < max_gemini_retries - 1:
                logger.info("Nghỉ 2 giây trước khi thử lại...")
                time.sleep(2)
        
        logger.error(f"❌ Cả Tesseract và Gemini đều thất bại!")
        logger.error("🛑 Dừng chương trình - không thể giải captcha")
        return None
    
    def query_with_existing_captcha(self, tax_code: str, captcha_code: str) -> Optional[Dict[str, Any]]:
        """
        Truy vấn thông tin mã số thuế với captcha đã có sẵn (không cần giải captcha mới)
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha đã giải thành công
            
        Returns:
            Thông tin JSON hoặc None nếu thất bại
        """
        logger.info(f"Truy vấn với captcha có sẵn: {tax_code} - {captcha_code}")
        
        # Debug: Kiểm tra session cookies
        logger.info(f"Session cookies: {dict(self.session.cookies)}")
        logger.info(f"Session headers: {dict(self.session.headers)}")
        
        try:
            # Thêm delay để đợi server trả về đủ
            logger.info("⏳ Đợi 3 giây để server xử lý...")
            time.sleep(3)
            
            result = self.query_tax_info(tax_code, captcha_code)
            
            if result:
                # Thêm thông tin metadata
                result['metadata'] = {
                    'tax_code': tax_code,
                    'captcha_code': captcha_code,
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                    'query_url': f"{self.query_url}?tin={tax_code}&captchaCode={captcha_code}",
                    'method': 'existing_captcha',
                    'session_cookies': dict(self.session.cookies)
                }
                
                # Luôn lưu kết quả để kiểm chứng
                filename = self.save_result(result)
                if filename:
                    logger.info(f"Đã lưu kết quả để kiểm chứng: {filename}")
                
                logger.info("Truy vấn với captcha có sẵn thành công!")
                return result
            else:
                logger.error("Truy vấn với captcha có sẵn thất bại")
                return None
                
        except Exception as e:
            logger.error(f"Lỗi truy vấn với captcha có sẵn: {e}")
            return None

    def process_tax_query(self, tax_code: str, save_file: bool = True) -> Optional[Dict[str, Any]]:
        """
        Xử lý truy vấn thông tin mã số thuế hoàn chỉnh
        
        Args:
            tax_code: Mã số thuế
            save_file: Có lưu file kết quả không
            
        Returns:
            Thông tin JSON hoặc None nếu thất bại
        """
        logger.info(f"Bắt đầu truy vấn thông tin mã số thuế: {tax_code}")
        
        # Truy vấn với retry
        result = self.query_with_retry(tax_code)
        
        if result:
            # Thêm thông tin metadata
            result['metadata'] = {
                'tax_code': tax_code,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'query_url': f"{self.query_url}?tin={tax_code}&captchaCode=<captcha>"
            }
            
            # Lưu file nếu được yêu cầu
            if save_file:
                filename = self.save_result(result)
                result['saved_file'] = filename
            
            logger.info("Hoàn thành truy vấn thông tin!")
            return result
        else:
            logger.error("Không thể truy vấn thông tin")
            return None


def query_tax_info(tax_code: str, save_file: bool = True) -> Optional[Dict[str, Any]]:
    """
    Function tiện ích để truy vấn thông tin mã số thuế
    
    Args:
        tax_code: Mã số thuế
        save_file: Có lưu file kết quả không
        
    Returns:
        Thông tin JSON hoặc None nếu thất bại
        
    Example:
        result = query_tax_info("4401120823")
        if result:
            print(f"Thông tin: {result}")
    """
    tax_query = TaxQuery()
    return tax_query.process_tax_query(tax_code, save_file)


if __name__ == "__main__":
    print("🚀 Tax Query Module - Sẵn sàng sử dụng")
    print("=" * 50)
    print("Module đã sẵn sàng để import và sử dụng:")
    print("from tax_query import query_tax_info")
    print("result = query_tax_info('MÃ_SỐ_THUẾ_CỦA_BẠN')")
    print()
    print("Ví dụ:")
    print("result = query_tax_info('4401120823')")
    print("if result:")
    print("    print(f'Thông tin: {result}')")
    print()
    print("⚠️  Lưu ý: Không chạy dữ liệu mẫu tự động!")
    print("   Hãy sử dụng module với mã số thuế thực tế của bạn.")
