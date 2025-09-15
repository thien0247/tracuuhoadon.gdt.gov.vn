"""
Script test nhanh captcha với URL
"""

import requests
import os
from datetime import datetime
from captcha_decoder import decode_captcha, decode_captcha_from_url

def quick_test():
    """Test nhanh captcha với URL"""
    print("🚀 Quick Test Captcha với URL")
    print("=" * 40)
    
    # URL captcha
    captcha_url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    
    print(f"🌐 URL: {captcha_url}")
    print()
    
    try:
        # Test 1: Giải mã từ URL
        print("1. Giải mã từ URL...")
        result_url = decode_captcha_from_url(captcha_url)
        print(f"   Kết quả: {result_url}")
        
        # Test 2: Tải về và giải mã từ file
        print("\n2. Tải về và giải mã từ file...")
        
        # Tải ảnh
        response = requests.get(captcha_url, timeout=10)
        response.raise_for_status()
        
        # Lưu ảnh
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quick_test_{timestamp}.jpg"
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        print(f"   Đã lưu: {filename} ({len(response.content)} bytes)")
        
        # Giải mã từ file
        result_file = decode_captcha(filename)
        print(f"   Kết quả: {result_file}")
        
        # So sánh
        print(f"\n3. So sánh kết quả:")
        if result_url == result_file:
            print(f"   ✅ Giống nhau: {result_url}")
        else:
            print(f"   ⚠️  Khác nhau: URL={result_url}, File={result_file}")
        
        # Cleanup
        if os.path.exists(filename):
            os.remove(filename)
            print(f"   🗑️  Đã xóa file tạm")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    quick_test()
