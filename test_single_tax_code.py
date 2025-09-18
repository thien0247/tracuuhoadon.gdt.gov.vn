#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test single tax code - Test riêng một mã số thuế
"""

import requests
import time
import json
import logging
from typing import Dict, Any, Optional

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_single_tax_code(tax_code: str, captcha_code: str):
    """
    Test một mã số thuế với captcha
    
    Args:
        tax_code: Mã số thuế
        captcha_code: Mã captcha
    """
    print(f"🧪 TEST MÃ SỐ THUẾ: {tax_code}")
    print("="*60)
    print(f"🔐 Captcha: {captcha_code}")
    print("-"*60)
    
    # URLs
    captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
    query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
    
    # Tạo session
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    try:
        # Bước 1: Tải captcha mới để có session
        logger.info("🔄 Tải captcha mới để có session...")
        captcha_response = session.get(captcha_url, timeout=10)
        captcha_response.raise_for_status()
        
        logger.info(f"✅ Đã tải captcha mới ({len(captcha_response.content)} bytes)")
        logger.info(f"🍪 Session cookies: {dict(session.cookies)}")
        
        # Bước 2: Test với mã số thuế
        url = f"{query_url}?tin={tax_code}&captchaCode={captcha_code}"
        logger.info(f"🔗 URL: {url}")
        
        # Thêm delay
        logger.info("⏳ Đợi 3 giây...")
        time.sleep(3)
        
        # Gửi request
        response = session.get(url, timeout=30)
        logger.info(f"📊 Status: {response.status_code}")
        logger.info(f"🍪 Final cookies: {dict(session.cookies)}")
        
        if response.status_code != 200:
            logger.error(f"❌ HTTP Error: {response.status_code}")
            return False
        
        # Parse JSON
        try:
            data = response.json()
            logger.info("✅ Nhận được dữ liệu JSON")
            logger.info(f"📄 Dữ liệu đầy đủ:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            
            # Kiểm tra kết quả
            tin_model = data.get('tinModel')
            if tin_model is not None and tin_model != {}:
                logger.info("🎉 THÀNH CÔNG! Dữ liệu trả về đúng")
                logger.info(f"📄 tinModel: {tin_model}")
                return True
            else:
                logger.warning("⚠️ THẤT BẠI! tinModel null hoặc rỗng")
                logger.warning(f"📄 tinModel: {tin_model}")
                return False
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Lỗi parse JSON: {e}")
            logger.error(f"📄 Response text: {response.text[:500]}...")
            return False
            
    except Exception as e:
        logger.error(f"❌ Lỗi test: {e}")
        return False


def main():
    """
    Hàm main
    """
    print("🧪 TEST SINGLE TAX CODE")
    print("="*60)
    
    # Mã số thuế cần test
    tax_code = "0319151229"
    
    print(f"🔢 Mã số thuế: {tax_code}")
    print("🔐 Cần nhập captcha mới")
    print("-"*60)
    
    # Nhập captcha
    try:
        captcha = input("🔤 Nhập mã captcha: ").strip()
        
        if not captcha:
            print("❌ Chưa nhập captcha!")
            return
        
        if len(captcha) < 4:
            print("⚠️ Mã captcha quá ngắn!")
            return
        
        print(f"✅ Captcha: {captcha}")
        
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return
    except Exception as e:
        print(f"❌ Lỗi nhập captcha: {e}")
        return
    
    # Test
    print(f"\n🚀 Bắt đầu test {tax_code}...")
    success = test_single_tax_code(tax_code, captcha)
    
    # Kết quả
    print(f"\n🏁 KẾT QUẢ:")
    print("="*60)
    if success:
        print(f"✅ {tax_code}: THÀNH CÔNG!")
        print("🎉 Mã số thuế này có dữ liệu trong hệ thống")
    else:
        print(f"❌ {tax_code}: THẤT BẠI!")
        print("💡 Có thể:")
        print("   - Mã số thuế không tồn tại")
        print("   - Captcha không đúng")
        print("   - Server trả về lỗi")
    print("="*60)


if __name__ == "__main__":
    main()
