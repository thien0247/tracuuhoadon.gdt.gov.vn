#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Captcha Manager - Quản lý captcha cho workflow
Tải captcha, hiển thị, nhập và quản lý session
"""

import requests
import time
import logging
from typing import Optional, Tuple
from PIL import Image
import webbrowser
import os

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CaptchaManager:
    """
    Quản lý captcha cho workflow
    """
    
    def __init__(self, captcha_url: str = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'):
        """
        Khởi tạo captcha manager
        
        Args:
            captcha_url: URL tải captcha
        """
        self.captcha_url = captcha_url
        self.current_session = None
        self.current_captcha = None
        self.captcha_file = None
        
        logger.info(f"🔐 Khởi tạo CaptchaManager với URL: {captcha_url}")
    
    def download_captcha(self) -> Tuple[Optional[str], Optional[requests.Session]]:
        """
        Tải ảnh captcha và tạo session mới
        
        Returns:
            Tuple (captcha_file_path, session) hoặc (None, None) nếu thất bại
        """
        try:
            logger.info("🔄 Đang tải ảnh captcha...")
            
            # Tạo session mới
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Tải captcha
            response = session.get(self.captcha_url, timeout=10)
            response.raise_for_status()
            
            # Lưu ảnh captcha
            timestamp = int(time.time())
            filename = f"captcha_{timestamp}.jpg"
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✅ Đã tải captcha: {filename}")
            logger.info(f"📊 Kích thước: {len(response.content)} bytes")
            logger.info(f"🍪 Session cookies: {dict(session.cookies)}")
            
            # Lưu thông tin
            self.current_session = session
            self.captcha_file = filename
            
            return filename, session
            
        except Exception as e:
            logger.error(f"❌ Lỗi tải captcha: {e}")
            return None, None
    
    def display_captcha(self, captcha_file: str) -> bool:
        """
        Hiển thị ảnh captcha
        
        Args:
            captcha_file: Đường dẫn file ảnh captcha
            
        Returns:
            True nếu thành công
        """
        try:
            # Thử mở bằng PIL
            img = Image.open(captcha_file)
            img.show()
            logger.info(f"🖼️ Đã mở ảnh captcha: {captcha_file}")
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ Không thể mở ảnh bằng PIL: {e}")
            
            # Fallback: mở trong trình duyệt
            try:
                webbrowser.open(self.captcha_url)
                logger.info("🌐 Đã mở captcha trong trình duyệt")
                return True
            except Exception as e2:
                logger.error(f"❌ Không thể mở trong trình duyệt: {e2}")
                return False
    
    def get_captcha_from_user(self, captcha_file: str = None) -> Optional[str]:
        """
        Lấy mã captcha từ người dùng
        
        Args:
            captcha_file: Đường dẫn file ảnh captcha (để hiển thị thông tin)
            
        Returns:
            Mã captcha hoặc None nếu hủy
        """
        print("\n" + "="*60)
        print("🔐 NHẬP MÃ CAPTCHA")
        print("="*60)
        
        if captcha_file:
            print(f"📁 File captcha: {captcha_file}")
        
        print("📋 Hướng dẫn:")
        print("1. Nhìn vào ảnh captcha đã mở")
        print("2. Nhập mã captcha vào đây")
        print("3. Nhấn Enter để tiếp tục")
        print("4. Nhấn Ctrl+C để hủy")
        print("-"*60)
        
        try:
            captcha = input("🔤 Nhập mã captcha: ").strip()
            
            if not captcha:
                print("❌ Chưa nhập mã captcha!")
                return None
            
            if len(captcha) < 4:
                print("⚠️ Mã captcha quá ngắn! Thử lại.")
                return None
            
            print(f"✅ Đã nhận mã captcha: {captcha}")
            self.current_captcha = captcha
            return captcha
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã hủy bởi người dùng")
            return None
        except Exception as e:
            print(f"❌ Lỗi nhập captcha: {e}")
            return None
    
    def get_new_captcha(self) -> Tuple[Optional[str], Optional[requests.Session]]:
        """
        Lấy captcha mới hoàn chỉnh (tải + hiển thị + nhập)
        
        Returns:
            Tuple (captcha_code, session) hoặc (None, None) nếu thất bại
        """
        print("\n🔄 LẤY CAPTCHA MỚI")
        print("="*60)
        
        # Bước 1: Tải captcha
        captcha_file, session = self.download_captcha()
        if not captcha_file or not session:
            print("❌ Không thể tải captcha!")
            return None, None
        
        # Bước 2: Hiển thị captcha
        if not self.display_captcha(captcha_file):
            print("⚠️ Không thể hiển thị captcha, thử tiếp tục...")
        
        # Bước 3: Nhập captcha
        captcha_code = self.get_captcha_from_user(captcha_file)
        if not captcha_code:
            print("❌ Chưa nhập captcha!")
            return None, None
        
        print(f"✅ Hoàn thành lấy captcha: {captcha_code}")
        return captcha_code, session
    
    def validate_captcha(self, captcha_code: str) -> bool:
        """
        Validate mã captcha cơ bản
        
        Args:
            captcha_code: Mã captcha
            
        Returns:
            True nếu hợp lệ
        """
        if not captcha_code:
            return False
        
        if len(captcha_code) < 4:
            return False
        
        # Kiểm tra chỉ chứa chữ cái và số
        if not captcha_code.isalnum():
            return False
        
        return True
    
    def cleanup_old_captcha_files(self, keep_recent: int = 5):
        """
        Dọn dẹp file captcha cũ
        
        Args:
            keep_recent: Số file gần nhất cần giữ lại
        """
        try:
            import glob
            
            # Tìm tất cả file captcha
            captcha_files = glob.glob("captcha_*.jpg")
            captcha_files.sort(key=os.path.getmtime, reverse=True)
            
            # Xóa file cũ
            files_to_delete = captcha_files[keep_recent:]
            
            for file_path in files_to_delete:
                try:
                    os.remove(file_path)
                    logger.info(f"🗑️ Đã xóa file captcha cũ: {file_path}")
                except Exception as e:
                    logger.warning(f"⚠️ Không thể xóa file {file_path}: {e}")
            
            if files_to_delete:
                logger.info(f"🧹 Đã dọn dẹp {len(files_to_delete)} file captcha cũ")
            
        except Exception as e:
            logger.error(f"❌ Lỗi dọn dẹp file captcha: {e}")
    
    def get_current_session(self) -> Optional[requests.Session]:
        """
        Lấy session hiện tại
        
        Returns:
            Session hiện tại hoặc None
        """
        return self.current_session
    
    def get_current_captcha(self) -> Optional[str]:
        """
        Lấy captcha hiện tại
        
        Returns:
            Captcha hiện tại hoặc None
        """
        return self.current_captcha
    
    def reset(self):
        """
        Reset captcha manager
        """
        self.current_session = None
        self.current_captcha = None
        self.captcha_file = None
        logger.info("🔄 Đã reset CaptchaManager")


def test_captcha_manager():
    """
    Test CaptchaManager
    """
    print("🧪 TEST CAPTCHA MANAGER")
    print("="*60)
    
    # Tạo captcha manager
    captcha_manager = CaptchaManager()
    
    try:
        # Test lấy captcha mới
        print("\n🔄 Test lấy captcha mới:")
        captcha_code, session = captcha_manager.get_new_captcha()
        
        if captcha_code and session:
            print(f"✅ Thành công!")
            print(f"   Captcha: {captcha_code}")
            print(f"   Session: {type(session).__name__}")
            print(f"   Cookies: {len(dict(session.cookies))} cookies")
            
            # Test validate
            print(f"\n🔍 Test validate captcha:")
            is_valid = captcha_manager.validate_captcha(captcha_code)
            print(f"   Validate: {'✅ Hợp lệ' if is_valid else '❌ Không hợp lệ'}")
            
        else:
            print("❌ Thất bại!")
        
        # Test dọn dẹp
        print(f"\n🧹 Test dọn dẹp file cũ:")
        captcha_manager.cleanup_old_captcha_files(keep_recent=3)
        
    except Exception as e:
        print(f"❌ Lỗi test: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n✅ Test hoàn thành!")


def main():
    """
    Hàm main
    """
    print("🔐 CAPTCHA MANAGER")
    print("="*60)
    print("📋 Mô tả:")
    print("- Tải ảnh captcha từ server")
    print("- Hiển thị ảnh captcha")
    print("- Nhập mã captcha thủ công")
    print("- Quản lý session")
    print("- Dọn dẹp file cũ")
    print("="*60)
    
    # Test captcha manager
    test_captcha_manager()


if __name__ == "__main__":
    main()
