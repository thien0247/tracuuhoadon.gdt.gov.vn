#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script test Scrapy Tax Query
Test với 3 mã số thuế và captcha nhập tay
"""

import sys
import time
import logging
from typing import List, Optional
from scrapy_tax_query import run_scrapy_tax_query, TaxQuerySpider
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_captcha_from_user() -> Optional[str]:
    """
    Lấy captcha từ người dùng
    
    Returns:
        Mã captcha hoặc None nếu hủy
    """
    print("\n" + "="*60)
    print("🔐 NHẬP MÃ CAPTCHA")
    print("="*60)
    print("📋 Hướng dẫn:")
    print("1. Truy cập: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
    print("2. Nhìn vào ảnh captcha")
    print("3. Nhập mã captcha vào đây")
    print("4. Nhấn Enter để tiếp tục")
    print("5. Nhấn Ctrl+C để hủy")
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
        return captcha
        
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return None
    except Exception as e:
        print(f"❌ Lỗi nhập captcha: {e}")
        return None


def get_tax_codes_from_user() -> List[str]:
    """
    Lấy danh sách mã số thuế từ người dùng
    
    Returns:
        Danh sách mã số thuế
    """
    print("\n" + "="*60)
    print("📋 NHẬP MÃ SỐ THUẾ")
    print("="*60)
    print("📋 Hướng dẫn:")
    print("1. Nhập mã số thuế (10 chữ số)")
    print("2. Nhập nhiều mã cách nhau bởi dấu phẩy")
    print("3. Hoặc nhấn Enter để dùng mã mặc định")
    print("4. Mã mặc định: 0319151229, 0319153113, 2301359406")
    print("-"*60)
    
    try:
        user_input = input("🔢 Nhập mã số thuế (hoặc Enter để dùng mặc định): ").strip()
        
        if not user_input:
            # Sử dụng mã mặc định
            default_codes = ['0319151229', '0319153113', '2301359406']
            print(f"✅ Sử dụng mã mặc định: {default_codes}")
            return default_codes
        
        # Parse mã từ input
        tax_codes = [code.strip() for code in user_input.split(',')]
        tax_codes = [code for code in tax_codes if code]  # Loại bỏ empty
        
        if not tax_codes:
            print("❌ Không có mã số thuế hợp lệ!")
            return []
        
        # Validate mã số thuế
        valid_codes = []
        for code in tax_codes:
            if len(code) == 10 and code.isdigit():
                valid_codes.append(code)
            else:
                print(f"⚠️ Mã không hợp lệ: {code} (phải có 10 chữ số)")
        
        if not valid_codes:
            print("❌ Không có mã số thuế hợp lệ!")
            return []
        
        print(f"✅ Đã nhận {len(valid_codes)} mã số thuế: {valid_codes}")
        return valid_codes
        
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return []
    except Exception as e:
        print(f"❌ Lỗi nhập mã số thuế: {e}")
        return []


def run_test():
    """
    Chạy test Scrapy Tax Query
    """
    print("🚀 SCRAPY TAX QUERY TEST")
    print("="*60)
    print("📋 Mô tả:")
    print("- Test với 3 mã số thuế")
    print("- Captcha nhập tay")
    print("- Xử lý bất đồng bộ với Scrapy")
    print("- Tự động lưu kết quả")
    print("="*60)
    
    # Lấy mã số thuế
    tax_codes = get_tax_codes_from_user()
    if not tax_codes:
        print("❌ Không có mã số thuế để test!")
        return
    
    # Lấy captcha
    captcha = get_captcha_from_user()
    if not captcha:
        print("❌ Không có captcha để test!")
        return
    
    # Xác nhận trước khi chạy
    print("\n" + "="*60)
    print("📋 XÁC NHẬN TRƯỚC KHI CHẠY")
    print("="*60)
    print(f"🔢 Mã số thuế: {tax_codes}")
    print(f"🔐 Captcha: {captcha}")
    print(f"📊 Số lượng request: {len(tax_codes)}")
    print("-"*60)
    
    try:
        confirm = input("✅ Bạn có muốn tiếp tục? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes', 'có']:
            print("⏹️ Đã hủy bởi người dùng")
            return
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return
    
    # Chạy Scrapy
    print("\n🚀 BẮT ĐẦU CHẠY SCRAPY...")
    print("="*60)
    
    try:
        start_time = time.time()
        
        # Chạy Scrapy Tax Query
        run_scrapy_tax_query(tax_codes, captcha)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n🏁 HOÀN THÀNH!")
        print("="*60)
        print(f"⏱️ Thời gian: {duration:.2f} giây")
        print(f"📊 Tốc độ: {len(tax_codes)/duration:.2f} request/giây")
        print("💾 Kết quả đã được lưu vào các file JSON")
        print("="*60)
        
    except KeyboardInterrupt:
        print("\n⏹️ Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi chạy Scrapy: {e}")
        import traceback
        traceback.print_exc()


def run_quick_test():
    """
    Chạy test nhanh với dữ liệu mặc định
    """
    print("⚡ QUICK TEST - SCRAPY TAX QUERY")
    print("="*60)
    
    # Dữ liệu mặc định
    tax_codes = ['0319151229', '0319153113', '2301359406']
    
    print(f"🔢 Mã số thuế: {tax_codes}")
    print("🔐 Captcha: Cần nhập thủ công")
    print("-"*60)
    
    # Lấy captcha
    captcha = get_captcha_from_user()
    if not captcha:
        print("❌ Không có captcha để test!")
        return
    
    # Chạy
    print(f"\n🚀 Chạy quick test với captcha: {captcha}")
    run_scrapy_tax_query(tax_codes, captcha)


def main():
    """
    Hàm main
    """
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        run_quick_test()
    else:
        run_test()


if __name__ == "__main__":
    main()
