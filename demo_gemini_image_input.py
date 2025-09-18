"""
Demo sử dụng Gemini Captcha Decoder với input ảnh
Minh họa các cách sử dụng khác nhau: file path, bytes, PIL.Image
"""

import os
import sys
from PIL import Image
import requests

# Thêm thư mục gốc vào path để import module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from gemini_captcha_decoder import (
    GeminiCaptchaDecoder,
    decode_captcha_with_gemini,
    decode_captcha_from_url_bytes_with_gemini,
    download_captcha_bytes_with_gemini
)


def demo_decode_from_file_path():
    """Demo giải mã từ đường dẫn file"""
    print("🔍 Demo: Giải mã từ đường dẫn file")
    print("-" * 40)
    
    # Tìm file captcha có sẵn
    test_dir = "captcha_dataset/test"
    if os.path.exists(test_dir):
        image_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if image_files:
            image_path = os.path.join(test_dir, image_files[0])
            print(f"Sử dụng file: {image_path}")
            
            result = decode_captcha_with_gemini(image_path)
            if result:
                print(f"✅ Kết quả: {result}")
            else:
                print("❌ Không thể giải mã")
        else:
            print("❌ Không tìm thấy file ảnh trong thư mục test")
    else:
        print("❌ Thư mục test không tồn tại")


def demo_decode_from_bytes():
    """Demo giải mã từ dữ liệu bytes"""
    print("\n🔍 Demo: Giải mã từ dữ liệu bytes")
    print("-" * 40)
    
    # Tải ảnh từ URL dưới dạng bytes
    try:
        url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
        print(f"Tải ảnh từ: {url}")
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            img_bytes = response.content
            print(f"✅ Tải thành công, kích thước: {len(img_bytes)} bytes")
            
            # Giải mã từ bytes
            result = decode_captcha_with_gemini(img_bytes)
            if result:
                print(f"✅ Kết quả: {result}")
            else:
                print("❌ Không thể giải mã")
        else:
            print(f"❌ Lỗi tải ảnh: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")


def demo_decode_from_pil_image():
    """Demo giải mã từ PIL Image object"""
    print("\n🔍 Demo: Giải mã từ PIL Image object")
    print("-" * 40)
    
    # Tải ảnh từ URL và chuyển thành PIL Image
    try:
        url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
        print(f"Tải ảnh từ: {url}")
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Chuyển bytes thành PIL Image
            from io import BytesIO
            img = Image.open(BytesIO(response.content))
            print(f"✅ Tạo PIL Image thành công, kích thước: {img.size}")
            
            # Giải mã từ PIL Image
            result = decode_captcha_with_gemini(img)
            if result:
                print(f"✅ Kết quả: {result}")
            else:
                print("❌ Không thể giải mã")
        else:
            print(f"❌ Lỗi tải ảnh: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")


def demo_class_methods():
    """Demo sử dụng class methods"""
    print("\n🔍 Demo: Sử dụng class methods")
    print("-" * 40)
    
    decoder = GeminiCaptchaDecoder()
    
    # Test tải ảnh dưới dạng bytes
    print("1. Tải ảnh dưới dạng bytes:")
    img_bytes = decoder.download_captcha_bytes()
    if img_bytes:
        print(f"✅ Tải thành công, kích thước: {len(img_bytes)} bytes")
        
        # Giải mã từ bytes
        print("2. Giải mã từ bytes:")
        result = decoder.decode_captcha(img_bytes)
        if result:
            print(f"✅ Kết quả: {result}")
        else:
            print("❌ Không thể giải mã")
    else:
        print("❌ Không thể tải ảnh")
    
    # Test giải mã trực tiếp từ URL (bytes)
    print("\n3. Giải mã trực tiếp từ URL (bytes):")
    result = decoder.decode_from_url_bytes()
    if result:
        print(f"✅ Kết quả: {result}")
    else:
        print("❌ Không thể giải mã")


def demo_utility_functions():
    """Demo sử dụng utility functions"""
    print("\n🔍 Demo: Sử dụng utility functions")
    print("-" * 40)
    
    # Test tải ảnh bytes
    print("1. Tải ảnh bytes với utility function:")
    img_bytes = download_captcha_bytes_with_gemini()
    if img_bytes:
        print(f"✅ Tải thành công, kích thước: {len(img_bytes)} bytes")
    else:
        print("❌ Không thể tải ảnh")
    
    # Test giải mã từ URL bytes
    print("\n2. Giải mã từ URL bytes với utility function:")
    result = decode_captcha_from_url_bytes_with_gemini()
    if result:
        print(f"✅ Kết quả: {result}")
    else:
        print("❌ Không thể giải mã")


def main():
    """Chạy tất cả demo"""
    print("🚀 Demo Gemini Captcha Decoder - Input Ảnh")
    print("=" * 50)
    
    # Kiểm tra kết nối API trước
    decoder = GeminiCaptchaDecoder()
    if not decoder.test_api_connection():
        print("❌ Không thể kết nối Gemini API. Vui lòng kiểm tra:")
        print("   - API key có hợp lệ không")
        print("   - Kết nối internet")
        print("   - Đã cài đặt google-generativeai chưa")
        return
    
    print("✅ Kết nối Gemini API thành công\n")
    
    # Chạy các demo
    demos = [
        ("Giải mã từ file path", demo_decode_from_file_path),
        ("Giải mã từ bytes", demo_decode_from_bytes),
        ("Giải mã từ PIL Image", demo_decode_from_pil_image),
        ("Class methods", demo_class_methods),
        ("Utility functions", demo_utility_functions),
    ]
    
    for demo_name, demo_func in demos:
        print(f"\n{'='*20} {demo_name} {'='*20}")
        try:
            demo_func()
        except Exception as e:
            print(f"❌ Lỗi trong demo '{demo_name}': {e}")
    
    print("\n" + "="*50)
    print("🎉 Hoàn thành tất cả demo!")


if __name__ == "__main__":
    main()
