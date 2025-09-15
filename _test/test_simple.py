"""
Test đơn giản để kiểm tra module captcha decoder
"""

def test_imports():
    """Test import các module cần thiết"""
    print("🔍 Kiểm tra imports...")
    
    try:
        import requests
        print("   ✅ requests: OK")
    except ImportError as e:
        print(f"   ❌ requests: {e}")
        return False
    
    try:
        from PIL import Image
        print("   ✅ PIL (Pillow): OK")
    except ImportError as e:
        print(f"   ❌ PIL (Pillow): {e}")
        return False
    
    try:
        import pytesseract
        print("   ✅ pytesseract: OK")
    except ImportError as e:
        print(f"   ❌ pytesseract: {e}")
        print("   💡 Chạy: pip install pytesseract")
        return False
    
    return True

def test_tesseract():
    """Test Tesseract OCR"""
    print("\n🔍 Kiểm tra Tesseract OCR...")
    
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"   ✅ Tesseract version: {version}")
        return True
    except Exception as e:
        print(f"   ❌ Tesseract error: {e}")
        print("   💡 Cài đặt Tesseract OCR:")
        print("      Windows: https://github.com/UB-Mannheim/tesseract/wiki")
        print("      Ubuntu: sudo apt-get install tesseract-ocr")
        print("      macOS: brew install tesseract")
        return False

def test_download():
    """Test tải ảnh captcha"""
    print("\n🔍 Test tải ảnh captcha...")
    
    try:
        import requests
        response = requests.get("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", timeout=10)
        response.raise_for_status()
        
        print(f"   ✅ Tải thành công: {len(response.content)} bytes")
        
        # Lưu ảnh để kiểm tra
        with open("test_captcha.jpg", "wb") as f:
            f.write(response.content)
        print("   📁 Đã lưu: test_captcha.jpg")
        
        return True
    except Exception as e:
        print(f"   ❌ Lỗi tải ảnh: {e}")
        return False

def test_image_processing():
    """Test xử lý ảnh"""
    print("\n🔍 Test xử lý ảnh...")
    
    try:
        from PIL import Image
        img = Image.open("test_captcha.jpg")
        print(f"   ✅ Mở ảnh: {img.size[0]}x{img.size[1]} pixels")
        print(f"   🎨 Mode: {img.mode}")
        
        # Test chuyển đổi
        gray = img.convert('L')
        print("   ✅ Chuyển grayscale: OK")
        
        return True
    except Exception as e:
        print(f"   ❌ Lỗi xử lý ảnh: {e}")
        return False

def test_ocr():
    """Test OCR"""
    print("\n🔍 Test OCR...")
    
    try:
        import pytesseract
        from PIL import Image
        
        img = Image.open("test_captcha.jpg")
        
        # Test OCR đơn giản
        text = pytesseract.image_to_string(img, config='--psm 8')
        print(f"   📝 OCR result: '{text.strip()}'")
        
        # Test với whitelist
        text_whitelist = pytesseract.image_to_string(
            img, 
            config='--psm 8 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyz0123456789'
        )
        print(f"   🎯 OCR với whitelist: '{text_whitelist.strip()}'")
        
        return True
    except Exception as e:
        print(f"   ❌ Lỗi OCR: {e}")
        return False

def test_module():
    """Test module captcha decoder"""
    print("\n🔍 Test module captcha decoder...")
    
    try:
        from captcha_decoder import CaptchaDecoder
        
        decoder = CaptchaDecoder()
        print("   ✅ Khởi tạo CaptchaDecoder: OK")
        
        # Test với ảnh đã tải
        result = decoder.decode_captcha("test_captcha.jpg")
        
        if result:
            print(f"   ✅ Kết quả: '{result}'")
            print(f"   📏 Độ dài: {len(result)} ký tự")
        else:
            print("   ⚠️  Không có kết quả")
        
        return True
    except Exception as e:
        print(f"   ❌ Lỗi module: {e}")
        return False

def main():
    """Hàm main"""
    print("🚀 Test Captcha Decoder - Kiểm tra từng bước")
    print("=" * 60)
    
    tests = [
        ("Imports", test_imports),
        ("Tesseract", test_tesseract),
        ("Download", test_download),
        ("Image Processing", test_image_processing),
        ("OCR", test_ocr),
        ("Module", test_module),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ Lỗi không mong đợi: {e}")
            results.append((test_name, False))
    
    # Tổng kết
    print("\n" + "=" * 60)
    print("📊 TỔNG KẾT:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Kết quả: {passed}/{len(results)} tests PASS")
    
    if passed == len(results):
        print("🎉 Tất cả tests PASS! Module sẵn sàng sử dụng.")
    else:
        print("⚠️  Một số tests FAIL. Vui lòng kiểm tra và sửa lỗi.")
    
    # Cleanup
    import os
    if os.path.exists("test_captcha.jpg"):
        try:
            os.remove("test_captcha.jpg")
            print("\n🧹 Đã xóa file test tạm")
        except:
            pass

if __name__ == "__main__":
    main()
