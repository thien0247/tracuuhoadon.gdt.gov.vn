"""
Demo nhanh cho captcha decoder
"""

from captcha_decoder import decode_captcha_from_url

def main():
    print("🔍 Demo Captcha Decoder")
    print("=" * 30)
    
    try:
        print("Đang tải và giải mã captcha...")
        result = decode_captcha_from_url()
        
        if result:
            print(f"✅ Thành công! Captcha: {result}")
        else:
            print("❌ Không thể giải mã captcha")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        print("\n💡 Kiểm tra:")
        print("- Tesseract đã được cài đặt chưa?")
        print("- Kết nối internet có ổn định không?")
        print("- Dependencies đã được cài đặt chưa?")

if __name__ == "__main__":
    main()
