"""
Ví dụ sử dụng module captcha_decoder
"""

import os
import time
from captcha_decoder import CaptchaDecoder, decode_captcha, decode_captcha_from_url


def example_basic_usage():
    """Ví dụ sử dụng cơ bản"""
    print("=== Ví dụ sử dụng cơ bản ===")
    
    # Sử dụng function tiện ích
    print("1. Giải mã captcha từ URL:")
    result = decode_captcha_from_url()
    if result:
        print(f"   Kết quả: {result}")
    else:
        print("   Không thể giải mã captcha")
    
    print()


def example_advanced_usage():
    """Ví dụ sử dụng nâng cao"""
    print("=== Ví dụ sử dụng nâng cao ===")
    
    # Tạo decoder instance
    decoder = CaptchaDecoder()
    
    print("1. Tải captcha từ URL:")
    temp_path = decoder.download_captcha()
    if temp_path:
        print(f"   Đã tải captcha về: {temp_path}")
        
        print("2. Giải mã captcha:")
        result = decoder.decode_captcha(temp_path)
        if result:
            print(f"   Kết quả: {result}")
        else:
            print("   Không thể giải mã captcha")
        
        # Xóa file tạm
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print("   Đã xóa file tạm")
    else:
        print("   Không thể tải captcha")
    
    print()


def example_custom_config():
    """Ví dụ với cấu hình tùy chỉnh"""
    print("=== Ví dụ với cấu hình tùy chỉnh ===")
    
    decoder = CaptchaDecoder()
    
    # Thêm cấu hình tùy chỉnh
    custom_config = '--oem 3 --psm 13 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyz0123456789'
    decoder.tesseract_configs.append(custom_config)
    
    print(f"Đã thêm cấu hình tùy chỉnh: {custom_config}")
    print(f"Tổng số cấu hình: {len(decoder.tesseract_configs)}")
    
    # Test với cấu hình mới
    result = decoder.decode_from_url()
    if result:
        print(f"Kết quả với cấu hình tùy chỉnh: {result}")
    else:
        print("Không thể giải mã với cấu hình tùy chỉnh")
    
    print()


def example_batch_processing():
    """Ví dụ xử lý hàng loạt"""
    print("=== Ví dụ xử lý hàng loạt ===")
    
    decoder = CaptchaDecoder()
    
    # Danh sách URLs để test (có thể thay đổi)
    urls = [
        "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg",
        # Có thể thêm nhiều URL khác
    ]
    
    results = []
    
    for i, url in enumerate(urls, 1):
        print(f"Xử lý captcha {i}/{len(urls)}: {url}")
        
        start_time = time.time()
        result = decoder.decode_from_url(url)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if result:
            print(f"   ✅ Thành công: {result} (thời gian: {processing_time:.2f}s)")
            results.append(result)
        else:
            print(f"   ❌ Thất bại (thời gian: {processing_time:.2f}s)")
            results.append(None)
        
        # Nghỉ giữa các request để tránh spam
        if i < len(urls):
            time.sleep(1)
    
    print(f"\nTổng kết: {len([r for r in results if r])}/{len(results)} thành công")
    print()


def example_error_handling():
    """Ví dụ xử lý lỗi"""
    print("=== Ví dụ xử lý lỗi ===")
    
    decoder = CaptchaDecoder()
    
    # Test với file không tồn tại
    print("1. Test với file không tồn tại:")
    result = decoder.decode_captcha("nonexistent.jpg")
    print(f"   Kết quả: {result}")
    
    # Test với URL không hợp lệ
    print("2. Test với URL không hợp lệ:")
    result = decoder.decode_from_url("http://invalid-url.com/captcha.jpg")
    print(f"   Kết quả: {result}")
    
    # Test với URL timeout
    print("3. Test với URL có thể timeout:")
    result = decoder.decode_from_url("http://httpstat.us/200?sleep=10000")
    print(f"   Kết quả: {result}")
    
    print()


def example_debug_mode():
    """Ví dụ chế độ debug"""
    print("=== Ví dụ chế độ debug ===")
    
    import logging
    
    # Bật logging chi tiết
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    decoder = CaptchaDecoder()
    
    print("Chạy với logging chi tiết...")
    result = decoder.decode_from_url()
    
    if result:
        print(f"Kết quả: {result}")
    else:
        print("Không thể giải mã captcha")
    
    print()


def example_performance_test():
    """Ví dụ test hiệu suất"""
    print("=== Ví dụ test hiệu suất ===")
    
    decoder = CaptchaDecoder()
    
    # Test nhiều lần để đo hiệu suất
    num_tests = 3
    times = []
    results = []
    
    print(f"Chạy {num_tests} lần test hiệu suất...")
    
    for i in range(num_tests):
        print(f"Test {i+1}/{num_tests}...")
        
        start_time = time.time()
        result = decoder.decode_from_url()
        end_time = time.time()
        
        processing_time = end_time - start_time
        times.append(processing_time)
        results.append(result)
        
        print(f"   Thời gian: {processing_time:.2f}s, Kết quả: {result}")
        
        # Nghỉ giữa các test
        if i < num_tests - 1:
            time.sleep(2)
    
    # Thống kê
    avg_time = sum(times) / len(times)
    success_rate = len([r for r in results if r]) / len(results) * 100
    
    print(f"\nThống kê:")
    print(f"   Thời gian trung bình: {avg_time:.2f}s")
    print(f"   Thời gian nhanh nhất: {min(times):.2f}s")
    print(f"   Thời gian chậm nhất: {max(times):.2f}s")
    print(f"   Tỷ lệ thành công: {success_rate:.1f}%")
    
    print()


def main():
    """Hàm main chạy tất cả ví dụ"""
    print("🚀 Ví dụ sử dụng Captcha Decoder Module")
    print("=" * 50)
    
    try:
        # Chạy các ví dụ
        example_basic_usage()
        example_advanced_usage()
        example_custom_config()
        example_batch_processing()
        example_error_handling()
        
        # Hỏi user có muốn chạy debug mode không
        print("Bạn có muốn chạy chế độ debug? (y/n): ", end="")
        choice = input().lower().strip()
        if choice in ['y', 'yes', 'có']:
            example_debug_mode()
        
        # Hỏi user có muốn test hiệu suất không
        print("Bạn có muốn test hiệu suất? (y/n): ", end="")
        choice = input().lower().strip()
        if choice in ['y', 'yes', 'có']:
            example_performance_test()
        
        print("✅ Hoàn thành tất cả ví dụ!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        print("Vui lòng kiểm tra cài đặt Tesseract và dependencies")


if __name__ == "__main__":
    main()
