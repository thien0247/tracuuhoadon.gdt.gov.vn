"""
Test module với file ảnh captcha
"""

import sys
import os
# Thêm thư mục gốc vào path để import module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import requests
from captcha_decoder import decode_captcha

def download_test_captcha():
    """Tải captcha để test"""
    print("📥 Tải captcha để test...")
    try:
        response = requests.get("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", timeout=10)
        response.raise_for_status()
        
        with open("test_captcha.jpg", "wb") as f:
            f.write(response.content)
        
        print(f"✅ Đã tải captcha ({len(response.content)} bytes)")
        return True
    except Exception as e:
        print(f"❌ Lỗi tải captcha: {e}")
        return False

def test_with_file():
    """Test với file ảnh"""
    print("🔍 Test Captcha Decoder với file ảnh")
    print("=" * 50)
    
    # Tải captcha nếu chưa có
    if not os.path.exists("test_captcha.jpg"):
        if not download_test_captcha():
            return
    
    # Test với file ảnh
    print("🔄 Đang giải mã captcha từ file...")
    start_time = time.time()
    
    try:
        result = decode_captcha("test_captcha.jpg")
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if result:
            print(f"✅ Thành công!")
            print(f"🎯 Kết quả: '{result}'")
            print(f"📏 Độ dài: {len(result)} ký tự")
            print(f"⏱️  Thời gian: {processing_time:.2f} giây")
            
            if len(result) == 6:
                print("🎉 Độ dài chính xác (6 ký tự)!")
            else:
                print(f"⚠️  Độ dài không chính xác (cần 6, có {len(result)})")
        else:
            print(f"❌ Không thể giải mã captcha")
            print(f"⏱️  Thời gian: {processing_time:.2f} giây")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    
    print("\n🎯 Test hoàn thành!")

def test_with_command_line():
    """Test với command line arguments"""
    print("\n🔧 Test với command line arguments")
    print("=" * 50)
    
    if not os.path.exists("test_captcha.jpg"):
        if not download_test_captcha():
            return
    
    # Test với command line
    print("🔄 Chạy module với file ảnh...")
    os.system("python ../captcha_decoder.py test_captcha.jpg")

def main():
    """Hàm main"""
    print("🚀 Test Captcha Decoder với file ảnh")
    print("=" * 60)
    
    try:
        # Test cơ bản với file
        test_with_file()
        
        # Test với command line
        test_with_command_line()
        
        print("\n🎉 Hoàn thành tất cả tests!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
    
    finally:
        # Cleanup
        if os.path.exists("test_captcha.jpg"):
            try:
                os.remove("test_captcha.jpg")
                print("\n🧹 Đã xóa file ảnh tạm")
            except:
                pass

if __name__ == "__main__":
    main()
