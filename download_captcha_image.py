#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script tải và hiển thị ảnh captcha
Giúp người dùng nhìn thấy captcha để nhập vào Scrapy
"""

import requests
import time
import os
from PIL import Image
import webbrowser
import logging

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def download_captcha():
    """
    Tải ảnh captcha từ server
    """
    captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
    
    try:
        logger.info("🔄 Đang tải ảnh captcha...")
        
        # Tạo session để duy trì cookies
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Tải captcha
        response = session.get(captcha_url, timeout=10)
        response.raise_for_status()
        
        # Lưu ảnh
        timestamp = int(time.time())
        filename = f"captcha_{timestamp}.jpg"
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"✅ Đã tải captcha: {filename}")
        logger.info(f"📊 Kích thước: {len(response.content)} bytes")
        logger.info(f"🍪 Cookies: {dict(session.cookies)}")
        
        return filename, session.cookies
        
    except Exception as e:
        logger.error(f"❌ Lỗi tải captcha: {e}")
        return None, None


def display_captcha(filename):
    """
    Hiển thị ảnh captcha
    """
    try:
        # Mở ảnh bằng PIL
        img = Image.open(filename)
        img.show()
        
        logger.info(f"🖼️ Đã mở ảnh captcha: {filename}")
        logger.info("📋 Hướng dẫn:")
        logger.info("1. Nhìn vào ảnh captcha đã mở")
        logger.info("2. Nhập mã captcha vào script")
        logger.info("3. Nhấn Enter để tiếp tục")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Lỗi hiển thị ảnh: {e}")
        return False


def open_captcha_in_browser():
    """
    Mở captcha trong trình duyệt
    """
    captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
    
    try:
        logger.info("🌐 Đang mở captcha trong trình duyệt...")
        webbrowser.open(captcha_url)
        logger.info("✅ Đã mở captcha trong trình duyệt")
        logger.info("📋 Hướng dẫn:")
        logger.info("1. Nhìn vào ảnh captcha trong trình duyệt")
        logger.info("2. Nhập mã captcha vào script")
        logger.info("3. Nhấn Enter để tiếp tục")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Lỗi mở trình duyệt: {e}")
        return False


def get_captcha_from_user():
    """
    Lấy captcha từ người dùng
    """
    print("\n" + "="*60)
    print("🔐 NHẬP MÃ CAPTCHA")
    print("="*60)
    
    try:
        captcha = input("🔤 Nhập mã captcha: ").strip()
        
        if not captcha:
            print("❌ Chưa nhập mã captcha!")
            return None
        
        if len(captcha) < 4:
            print("⚠️ Mã captcha quá ngắn! Thử lại.")
            return None
        
        print(f"✅ Đã nhận mã captcha: {captcha}")
        return captcha
        
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return None
    except Exception as e:
        print(f"❌ Lỗi nhập captcha: {e}")
        return None


def main():
    """
    Hàm main
    """
    print("🖼️ CAPTCHA DOWNLOADER & VIEWER")
    print("="*60)
    print("📋 Mô tả:")
    print("- Tải ảnh captcha từ server")
    print("- Hiển thị ảnh captcha")
    print("- Hỗ trợ nhập captcha thủ công")
    print("="*60)
    
    # Tải captcha
    filename, cookies = download_captcha()
    
    if not filename:
        print("❌ Không thể tải captcha!")
        return
    
    # Hiển thị captcha
    print(f"\n🖼️ Hiển thị ảnh captcha: {filename}")
    
    # Thử hiển thị bằng PIL
    if display_captcha(filename):
        print("✅ Đã mở ảnh captcha bằng PIL")
    else:
        print("⚠️ Không thể mở ảnh bằng PIL, thử mở trong trình duyệt...")
        open_captcha_in_browser()
    
    # Lấy captcha từ người dùng
    captcha = get_captcha_from_user()
    
    if captcha:
        print(f"\n🎯 Captcha đã nhập: {captcha}")
        print("💡 Bây giờ bạn có thể sử dụng captcha này để chạy Scrapy!")
        print("🚀 Chạy: python test_scrapy_tax.py")
    else:
        print("❌ Chưa nhập captcha!")


if __name__ == "__main__":
    main()
