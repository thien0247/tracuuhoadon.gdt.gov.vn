"""
Test đơn giản để kiểm tra kết nối Gemini API
"""

import sys
import os

# Thêm thư mục gốc vào path để import module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from gemini_captcha_decoder import GeminiCaptchaDecoder

def test_connection():
    """Test kết nối Gemini API"""
    print("🔍 Testing Gemini API connection...")
    
    try:
        decoder = GeminiCaptchaDecoder()
        
        if decoder.test_api_connection():
            print("✅ Gemini API connection successful!")
            return True
        else:
            print("❌ Gemini API connection failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_simple_captcha():
    """Test giải mã captcha đơn giản"""
    print("\n🔍 Testing captcha decoding...")
    
    try:
        decoder = GeminiCaptchaDecoder()
        
        # Test giải mã từ URL
        result = decoder.decode_from_url_bytes()
        if result:
            print(f"✅ Captcha decoded successfully: {result}")
            return True
        else:
            print("❌ Failed to decode captcha")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Gemini API Test")
    print("=" * 30)
    
    # Test kết nối
    if test_connection():
        # Test giải mã captcha
        test_simple_captcha()
    else:
        print("\n❌ Cannot proceed with captcha test due to connection failure")
        print("\nTroubleshooting:")
        print("1. Check if API key is valid")
        print("2. Check internet connection")
        print("3. Install google-generativeai: pip install google-generativeai")
        print("4. Check if you have quota remaining")
