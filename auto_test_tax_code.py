#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto Test Tax Code - Tự động tải captcha và test mã số thuế
"""

import requests
import time
import json
import logging
from typing import Dict, Any, Optional
from PIL import Image
import webbrowser

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def auto_test_tax_code(tax_code: str):
    """
    Tự động test mã số thuế với captcha
    
    Args:
        tax_code: Mã số thuế cần test
    """
    print(f"🧪 AUTO TEST MÃ SỐ THUẾ: {tax_code}")
    print("="*60)
    
    # URLs
    captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
    query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
    
    # Tạo session
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    try:
        # Bước 1: Tải captcha
        print("🔄 Bước 1: Tải ảnh captcha...")
        captcha_response = session.get(captcha_url, timeout=10)
        captcha_response.raise_for_status()
        
        # Lưu ảnh captcha
        timestamp = int(time.time())
        captcha_filename = f"captcha_{timestamp}.jpg"
        
        with open(captcha_filename, 'wb') as f:
            f.write(captcha_response.content)
        
        print(f"✅ Đã tải captcha: {captcha_filename}")
        print(f"📊 Kích thước: {len(captcha_response.content)} bytes")
        print(f"🍪 Session cookies: {dict(session.cookies)}")
        
        # Hiển thị ảnh captcha
        try:
            img = Image.open(captcha_filename)
            img.show()
            print(f"🖼️ Đã mở ảnh captcha: {captcha_filename}")
        except Exception as e:
            print(f"⚠️ Không thể mở ảnh: {e}")
            # Fallback: mở trong trình duyệt
            webbrowser.open(captcha_url)
            print("🌐 Đã mở captcha trong trình duyệt")
        
        # Bước 2: Nhập captcha
        print(f"\n🔐 Bước 2: Nhập mã captcha cho {tax_code}")
        print("-"*60)
        
        try:
            captcha = input("🔤 Nhập mã captcha: ").strip()
            
            if not captcha:
                print("❌ Chưa nhập captcha!")
                return False
            
            if len(captcha) < 4:
                print("⚠️ Mã captcha quá ngắn!")
                return False
            
            print(f"✅ Captcha: {captcha}")
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã hủy bởi người dùng")
            return False
        except Exception as e:
            print(f"❌ Lỗi nhập captcha: {e}")
            return False
        
        # Bước 3: Test với mã số thuế
        print(f"\n🚀 Bước 3: Test {tax_code} với captcha {captcha}")
        print("-"*60)
        
        url = f"{query_url}?tin={tax_code}&captchaCode={captcha}"
        print(f"🔗 URL: {url}")
        
        # Thêm delay
        print("⏳ Đợi 3 giây...")
        time.sleep(3)
        
        # Gửi request
        response = session.get(url, timeout=30)
        print(f"📊 Status: {response.status_code}")
        print(f"🍪 Final cookies: {dict(session.cookies)}")
        
        if response.status_code != 200:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
        
        # Parse JSON
        try:
            data = response.json()
            print("✅ Nhận được dữ liệu JSON")
            print(f"📄 Dữ liệu đầy đủ:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            
            # Kiểm tra kết quả
            tin_model = data.get('tinModel')
            if tin_model is not None and tin_model != {}:
                print("🎉 THÀNH CÔNG! Dữ liệu trả về đúng")
                print(f"📄 tinModel: {tin_model}")
                
                # Lưu kết quả thành công
                result = {
                    'tax_code': tax_code,
                    'captcha_code': captcha,
                    'status': 'success',
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                    'url': url,
                    'status_code': response.status_code,
                    'session_cookies': dict(session.cookies),
                    'data': data
                }
                
                filename = f"auto_test_success_{tax_code}_{timestamp}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                
                print(f"💾 Đã lưu kết quả: {filename}")
                return True
            else:
                print("⚠️ THẤT BẠI! tinModel null hoặc rỗng")
                print(f"📄 tinModel: {tin_model}")
                
                # Lưu kết quả thất bại
                result = {
                    'tax_code': tax_code,
                    'captcha_code': captcha,
                    'status': 'failed',
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                    'url': url,
                    'status_code': response.status_code,
                    'session_cookies': dict(session.cookies),
                    'data': data
                }
                
                filename = f"auto_test_failed_{tax_code}_{timestamp}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                
                print(f"💾 Đã lưu kết quả: {filename}")
                return False
                
        except json.JSONDecodeError as e:
            print(f"❌ Lỗi parse JSON: {e}")
            print(f"📄 Response text: {response.text[:500]}...")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi test: {e}")
        return False


def main():
    """
    Hàm main
    """
    print("🧪 AUTO TEST TAX CODE")
    print("="*60)
    print("📋 Mô tả:")
    print("- Tự động tải ảnh captcha")
    print("- Hiển thị ảnh captcha")
    print("- Nhập captcha thủ công")
    print("- Test mã số thuế")
    print("="*60)
    
    # Mã số thuế cần test
    tax_code = "0319151229"
    
    print(f"🔢 Mã số thuế: {tax_code}")
    print("-"*60)
    
    # Test
    success = auto_test_tax_code(tax_code)
    
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
