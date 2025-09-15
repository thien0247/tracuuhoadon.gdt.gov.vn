"""
Test module với URL cụ thể: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg
"""

import sys
import os
# Thêm thư mục gốc vào path để import module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import requests
from captcha_decoder import decode_captcha_from_url, CaptchaDecoder
from PIL import Image

def test_with_specific_url():
    """Test với URL cụ thể"""
    print("🔍 Test Captcha Decoder với URL cụ thể")
    print("=" * 60)
    print("🔗 URL: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
    print()
    
    # Test 1: Tải và lưu ảnh từ URL
    print("1. Tải ảnh captcha từ URL...")
    url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Lưu ảnh để xem
        with open("captcha_from_url.jpg", "wb") as f:
            f.write(response.content)
        
        print(f"   ✅ Đã tải ảnh captcha ({len(response.content)} bytes)")
        print(f"   📁 Lưu tại: captcha_from_url.jpg")
        
        # Hiển thị thông tin ảnh
        img = Image.open("captcha_from_url.jpg")
        print(f"   📐 Kích thước: {img.size[0]}x{img.size[1]} pixels")
        print(f"   🎨 Mode: {img.mode}")
        
    except Exception as e:
        print(f"   ❌ Lỗi tải ảnh: {e}")
        return
    
    print()
    
    # Test 2: Giải mã từ file ảnh đã tải
    print("2. Giải mã captcha từ file ảnh...")
    start_time = time.time()
    
    try:
        from captcha_decoder import decode_captcha
        result1 = decode_captcha("captcha_from_url.jpg")
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if result1:
            print(f"   ✅ Thành công!")
            print(f"   🎯 Kết quả: '{result1}'")
            print(f"   📏 Độ dài: {len(result1)} ký tự")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
            
            if len(result1) == 6:
                print("   🎉 Độ dài chính xác (6 ký tự)!")
            else:
                print(f"   ⚠️  Độ dài không chính xác (cần 6, có {len(result1)})")
        else:
            print(f"   ❌ Không thể giải mã captcha")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
            
    except Exception as e:
        print(f"   ❌ Lỗi giải mã: {e}")
    
    print()
    
    # Test 3: Giải mã trực tiếp từ URL
    print("3. Giải mã captcha trực tiếp từ URL...")
    start_time = time.time()
    
    try:
        result2 = decode_captcha_from_url(url)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if result2:
            print(f"   ✅ Thành công!")
            print(f"   🎯 Kết quả: '{result2}'")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
        else:
            print(f"   ❌ Không thể giải mã")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
            
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
    
    print()
    
    # Test 4: So sánh kết quả
    print("4. So sánh kết quả:")
    if result1 and result2:
        if result1 == result2:
            print("   ✅ Kết quả giống nhau - Module hoạt động nhất quán")
        else:
            print(f"   ⚠️  Kết quả khác nhau:")
            print(f"      Từ file: '{result1}'")
            print(f"      Từ URL: '{result2}'")
    elif result1:
        print(f"   📝 Chỉ giải mã từ file thành công: '{result1}'")
    elif result2:
        print(f"   📝 Chỉ giải mã từ URL thành công: '{result2}'")
    else:
        print("   ❌ Cả hai phương pháp đều thất bại")
    
    print()
    
    # Test 5: Thống kê
    print("5. Thống kê:")
    print(f"   🔗 URL: {url}")
    print(f"   📁 File ảnh: captcha_from_url.jpg")
    print(f"   📐 Kích thước ảnh: {img.size[0]}x{img.size[1]}")
    print(f"   💾 Dung lượng: {len(response.content)} bytes")
    
    if result1:
        print(f"   ✅ Kết quả từ file: '{result1}'")
    if result2:
        print(f"   ✅ Kết quả từ URL: '{result2}'")
    
    print()
    print("🎯 Test hoàn thành!")

def test_multiple_url_requests():
    """Test với nhiều request URL"""
    print("\n🔄 Test với nhiều request URL")
    print("=" * 50)
    
    url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
    results = []
    times = []
    
    for i in range(3):  # Test 3 lần
        print(f"\n📸 Request {i+1}/3:")
        
        try:
            start_time = time.time()
            result = decode_captcha_from_url(url)
            end_time = time.time()
            
            processing_time = end_time - start_time
            times.append(processing_time)
            
            if result:
                print(f"   ✅ Kết quả: '{result}' (thời gian: {processing_time:.2f}s)")
                results.append(result)
            else:
                print(f"   ❌ Thất bại (thời gian: {processing_time:.2f}s)")
                results.append(None)
                
        except Exception as e:
            print(f"   ❌ Lỗi: {e}")
            results.append(None)
            times.append(0)
        
        # Nghỉ giữa các request
        if i < 2:
            print("   ⏳ Nghỉ 2 giây...")
            time.sleep(2)
    
    # Thống kê
    print(f"\n📊 Thống kê tổng hợp:")
    success_count = len([r for r in results if r])
    print(f"   ✅ Thành công: {success_count}/3")
    print(f"   📈 Tỷ lệ thành công: {success_count/3*100:.1f}%")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"   ⏱️  Thời gian trung bình: {avg_time:.2f}s")
        print(f"   ⚡ Thời gian nhanh nhất: {min(times):.2f}s")
        print(f"   🐌 Thời gian chậm nhất: {max(times):.2f}s")
    
    if success_count > 0:
        print(f"   🎯 Kết quả: {[r for r in results if r]}")
        
        # Phân tích kết quả
        lengths = [len(r) for r in results if r]
        if lengths:
            avg_length = sum(lengths) / len(lengths)
            print(f"   📏 Độ dài trung bình: {avg_length:.1f} ký tự")
            
            correct_length = len([l for l in lengths if l == 6])
            print(f"   🎯 Độ dài chính xác: {correct_length}/{len(lengths)}")

def main():
    """Hàm main"""
    print("🚀 Test Captcha Decoder với URL cụ thể")
    print("=" * 70)
    
    try:
        # Test cơ bản
        test_with_specific_url()
        
        # Hỏi user có muốn test nhiều request không
        print("\n" + "="*70)
        choice = input("Bạn có muốn test với nhiều request URL? (y/n): ").lower().strip()
        
        if choice in ['y', 'yes', 'có']:
            test_multiple_url_requests()
        
        print("\n🎉 Hoàn thành tất cả tests!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
    
    finally:
        # Cleanup
        if os.path.exists("captcha_from_url.jpg"):
            try:
                os.remove("captcha_from_url.jpg")
                print("\n🧹 Đã xóa file ảnh tạm")
            except:
                pass

if __name__ == "__main__":
    main()
