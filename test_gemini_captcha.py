"""
Test script cho Gemini Captcha Decoder
Kiểm tra chức năng giải mã captcha sử dụng Gemini AI
"""

import os
import sys
import logging
from typing import Optional

# Thêm thư mục gốc vào path để import module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from gemini_captcha_decoder import (
    GeminiCaptchaDecoder, 
    decode_captcha_with_gemini, 
    decode_captcha_from_url_with_gemini
)

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_gemini_connection():
    """Test kết nối Gemini API"""
    print("🔍 Testing Gemini API connection...")
    
    decoder = GeminiCaptchaDecoder()
    if decoder.test_api_connection():
        print("✅ Gemini API connection successful")
        return True
    else:
        print("❌ Gemini API connection failed")
        return False


def test_decode_from_url():
    """Test giải mã captcha từ URL"""
    print("\n🔍 Testing captcha decoding from URL...")
    
    try:
        result = decode_captcha_from_url_with_gemini()
        if result:
            print(f"✅ Captcha decoded successfully: {result}")
            return True
        else:
            print("❌ Failed to decode captcha from URL")
            return False
    except Exception as e:
        print(f"❌ Error decoding captcha from URL: {e}")
        return False


def test_decode_from_file(image_path: str):
    """Test giải mã captcha từ file"""
    print(f"\n🔍 Testing captcha decoding from file: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        result = decode_captcha_with_gemini(image_path)
        if result:
            print(f"✅ Captcha decoded successfully: {result}")
            return True
        else:
            print("❌ Failed to decode captcha from file")
            return False
    except Exception as e:
        print(f"❌ Error decoding captcha from file: {e}")
        return False


def test_with_existing_captcha_files():
    """Test với các file captcha có sẵn trong thư mục test"""
    print("\n🔍 Testing with existing captcha files...")
    
    test_dir = "captcha_dataset/test"
    if not os.path.exists(test_dir):
        print(f"❌ Test directory not found: {test_dir}")
        return False
    
    # Lấy danh sách file ảnh
    image_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        print(f"❌ No image files found in {test_dir}")
        return False
    
    print(f"Found {len(image_files)} image files")
    
    success_count = 0
    for i, image_file in enumerate(image_files[:3]):  # Test tối đa 3 file
        image_path = os.path.join(test_dir, image_file)
        print(f"\n--- Test {i+1}: {image_file} ---")
        
        if test_decode_from_file(image_path):
            success_count += 1
    
    print(f"\n📊 Results: {success_count}/{min(3, len(image_files))} successful")
    return success_count > 0


def test_class_methods():
    """Test các method của class GeminiCaptchaDecoder"""
    print("\n🔍 Testing GeminiCaptchaDecoder class methods...")
    
    try:
        decoder = GeminiCaptchaDecoder()
        
        # Test download_captcha
        print("Testing download_captcha...")
        temp_path = decoder.download_captcha()
        if temp_path and os.path.exists(temp_path):
            print("✅ download_captcha successful")
            
            # Test decode_captcha với file đã tải
            print("Testing decode_captcha...")
            result = decoder.decode_captcha(temp_path)
            if result:
                print(f"✅ decode_captcha successful: {result}")
            else:
                print("❌ decode_captcha failed")
            
            # Cleanup
            os.remove(temp_path)
        else:
            print("❌ download_captcha failed")
            
    except Exception as e:
        print(f"❌ Error testing class methods: {e}")


def main():
    """Chạy tất cả các test"""
    print("🚀 Starting Gemini Captcha Decoder Tests")
    print("=" * 50)
    
    tests = [
        ("API Connection", test_gemini_connection),
        ("Decode from URL", test_decode_from_url),
        ("Class Methods", test_class_methods),
        ("Existing Files", test_with_existing_captcha_files),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {e}")
            results.append((test_name, False))
    
    # Tổng kết
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")


if __name__ == "__main__":
    main()
