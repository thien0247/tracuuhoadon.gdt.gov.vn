"""
Script test tải captcha đơn giản
"""

import requests
import time
import os
from datetime import datetime

def test_download_captcha():
    """Test tải captcha đơn giản"""
    print("🚀 Test tải captcha")
    print("=" * 40)
    
    # Tạo thư mục test
    test_dir = "captcha_dataset/test"
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
        print(f"✅ Đã tạo thư mục: {test_dir}")
    
    # URL captcha
    captcha_url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    
    # Session
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    })
    
    # Tải 5 captcha test
    for i in range(1, 6):
        try:
            print(f"📋 Tải captcha {i}/5")
            
            # Tải captcha
            response = session.get(captcha_url, timeout=10)
            response.raise_for_status()
            
            # Tạo tên file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"test_captcha_{i}_{timestamp}.jpg"
            filepath = os.path.join(test_dir, filename)
            
            # Lưu ảnh
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"   ✅ Đã lưu: {filename} ({len(response.content)} bytes)")
            
            # Nghỉ 1 giây
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Lỗi: {e}")
    
    print(f"\n🎉 Hoàn thành test!")
    print(f"📁 Thư mục: {test_dir}")

if __name__ == "__main__":
    test_download_captcha()
