"""
Module test captcha decoder với link ảnh
"""

import requests
import os
import time
from datetime import datetime
from captcha_decoder import decode_captcha, decode_captcha_from_url

def test_captcha_with_url(captcha_url, save_image=True):
    """
    Test captcha decoder với URL ảnh
    
    Args:
        captcha_url: URL của ảnh captcha
        save_image: Có lưu ảnh về local không
        
    Returns:
        Kết quả giải mã captcha
    """
    print(f"🔍 Test captcha với URL: {captcha_url}")
    print("=" * 60)
    
    try:
        # Test 1: Giải mã trực tiếp từ URL
        print("1. Test giải mã trực tiếp từ URL...")
        result_url = decode_captcha_from_url(captcha_url)
        
        if result_url:
            print(f"   ✅ Kết quả từ URL: {result_url}")
        else:
            print("   ❌ Không thể giải mã từ URL")
        
        # Test 2: Tải ảnh về và giải mã từ file
        if save_image:
            print("\n2. Test tải ảnh về và giải mã từ file...")
            
            # Tạo thư mục test nếu chưa có
            test_dir = "test_images"
            if not os.path.exists(test_dir):
                os.makedirs(test_dir)
            
            # Tải ảnh
            response = requests.get(captcha_url, timeout=10)
            response.raise_for_status()
            
            # Tạo tên file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"test_captcha_{timestamp}.jpg"
            filepath = os.path.join(test_dir, filename)
            
            # Lưu ảnh
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"   ✅ Đã lưu ảnh: {filepath} ({len(response.content)} bytes)")
            
            # Giải mã từ file
            result_file = decode_captcha(filepath)
            
            if result_file:
                print(f"   ✅ Kết quả từ file: {result_file}")
            else:
                print("   ❌ Không thể giải mã từ file")
            
            # So sánh kết quả
            print("\n3. So sánh kết quả:")
            if result_url and result_file:
                if result_url == result_file:
                    print(f"   ✅ Kết quả giống nhau: {result_url}")
                else:
                    print(f"   ⚠️  Kết quả khác nhau:")
                    print(f"      URL: {result_url}")
                    print(f"      File: {result_file}")
            elif result_url:
                print(f"   📄 Chỉ có kết quả từ URL: {result_url}")
            elif result_file:
                print(f"   📄 Chỉ có kết quả từ file: {result_file}")
            else:
                print("   ❌ Không có kết quả nào")
            
            return {
                'url_result': result_url,
                'file_result': result_file,
                'image_path': filepath,
                'image_size': len(response.content)
            }
        
        return {
            'url_result': result_url,
            'file_result': None,
            'image_path': None,
            'image_size': None
        }
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_multiple_captchas(captcha_urls, save_images=True):
    """
    Test nhiều captcha với danh sách URL
    
    Args:
        captcha_urls: Danh sách URL captcha
        save_images: Có lưu ảnh về local không
        
    Returns:
        Thống kê kết quả
    """
    print(f"🔍 Test {len(captcha_urls)} captcha")
    print("=" * 60)
    
    results = []
    stats = {
        'total': len(captcha_urls),
        'successful': 0,
        'failed': 0,
        'url_success': 0,
        'file_success': 0,
        'both_success': 0,
        'different_results': 0
    }
    
    for i, url in enumerate(captcha_urls, 1):
        print(f"\n📋 Test {i}/{len(captcha_urls)}")
        print(f"URL: {url}")
        
        result = test_captcha_with_url(url, save_images)
        
        if result:
            results.append(result)
            
            # Thống kê
            if result['url_result']:
                stats['url_success'] += 1
            if result['file_result']:
                stats['file_success'] += 1
            if result['url_result'] and result['file_result']:
                stats['both_success'] += 1
                if result['url_result'] != result['file_result']:
                    stats['different_results'] += 1
            
            if result['url_result'] or result['file_result']:
                stats['successful'] += 1
            else:
                stats['failed'] += 1
        else:
            stats['failed'] += 1
        
        # Nghỉ giữa các lần test
        if i < len(captcha_urls):
            time.sleep(1)
    
    # Hiển thị thống kê
    print(f"\n📊 Thống kê tổng kết:")
    print(f"   📥 Tổng số captcha: {stats['total']}")
    print(f"   ✅ Thành công: {stats['successful']}")
    print(f"   ❌ Thất bại: {stats['failed']}")
    print(f"   🌐 Thành công từ URL: {stats['url_success']}")
    print(f"   📁 Thành công từ file: {stats['file_success']}")
    print(f"   🔄 Thành công cả hai: {stats['both_success']}")
    print(f"   ⚠️  Kết quả khác nhau: {stats['different_results']}")
    
    return results, stats

def test_captcha_from_website():
    """
    Test captcha từ website tracuuhoadon.gdt.gov.vn
    """
    print("🌐 Test captcha từ website tracuuhoadon.gdt.gov.vn")
    print("=" * 60)
    
    captcha_url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    
    # Test 5 lần
    urls = [captcha_url] * 5
    
    return test_multiple_captchas(urls, save_images=True)

def main():
    """Hàm main"""
    print("🚀 Test Captcha Decoder với URL")
    print("=" * 60)
    
    # Test 1: Captcha từ website
    print("📋 Test 1: Captcha từ website tracuuhoadon.gdt.gov.vn")
    results1, stats1 = test_captcha_from_website()
    
    # Test 2: Captcha từ URL khác (nếu có)
    print(f"\n📋 Test 2: Captcha từ URL khác")
    print("Bạn có thể thêm URL captcha khác để test...")
    
    # Test 3: Test với URL cụ thể
    print(f"\n📋 Test 3: Test với URL cụ thể")
    test_url = input("Nhập URL captcha để test (Enter để bỏ qua): ").strip()
    
    if test_url:
        result = test_captcha_with_url(test_url, save_image=True)
        if result:
            print(f"✅ Kết quả: {result}")
    
    print(f"\n🎉 Hoàn thành tất cả tests!")

if __name__ == "__main__":
    main()
