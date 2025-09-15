"""
Test phương pháp xử lý ảnh mới: Xóa nền đen -> trong suốt -> đen
"""

import time
import requests
from captcha_decoder import CaptchaDecoder, decode_captcha_from_url
from PIL import Image
import os

def test_new_processing_method():
    """Test phương pháp xử lý ảnh mới"""
    print("🔍 Test Phương Pháp Xử Lý Ảnh Mới")
    print("=" * 50)
    print("📋 Quy trình:")
    print("   1. Xóa nền đen thành trong suốt")
    print("   2. Chuyển các màu còn lại sang màu đen")
    print("   3. Thực hiện nhận dạng OCR")
    print()
    
    decoder = CaptchaDecoder()
    
    # Test 1: Tải ảnh captcha
    print("1. Tải ảnh captcha...")
    try:
        response = requests.get("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", timeout=10)
        response.raise_for_status()
        
        with open("test_captcha.jpg", "wb") as f:
            f.write(response.content)
        
        print(f"   ✅ Đã tải ảnh ({len(response.content)} bytes)")
        
        # Hiển thị thông tin ảnh
        img = Image.open("test_captcha.jpg")
        print(f"   📐 Kích thước: {img.size[0]}x{img.size[1]} pixels")
        print(f"   🎨 Mode gốc: {img.mode}")
        
    except Exception as e:
        print(f"   ❌ Lỗi tải ảnh: {e}")
        return
    
    print()
    
    # Test 2: Xử lý ảnh với phương pháp mới
    print("2. Xử lý ảnh với phương pháp mới...")
    try:
        processed_images = decoder.preprocess_image("test_captcha.jpg")
        print(f"   ✅ Đã tạo {len(processed_images)} phiên bản ảnh")
        
        # Hiển thị thông tin các ảnh đã xử lý
        for i, img in enumerate(processed_images[:5]):  # Chỉ hiển thị 5 ảnh đầu
            print(f"   📸 Ảnh {i+1}: {img.size[0]}x{img.size[1]}, mode: {img.mode}")
        
        if len(processed_images) > 5:
            print(f"   ... và {len(processed_images) - 5} ảnh khác")
        
    except Exception as e:
        print(f"   ❌ Lỗi xử lý ảnh: {e}")
        return
    
    print()
    
    # Test 3: Giải mã captcha
    print("3. Giải mã captcha...")
    start_time = time.time()
    
    try:
        result = decoder.decode_captcha("test_captcha.jpg")
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if result:
            print(f"   ✅ Thành công!")
            print(f"   🎯 Kết quả: '{result}'")
            print(f"   📏 Độ dài: {len(result)} ký tự")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
            
            # Đánh giá kết quả
            score = decoder.evaluate_result(result)
            print(f"   📊 Điểm số: {score:.2f}/1.0")
            
            if len(result) == 6:
                print("   🎉 Độ dài chính xác (6 ký tự)!")
            else:
                print(f"   ⚠️  Độ dài không chính xác (cần 6, có {len(result)})")
                
        else:
            print(f"   ❌ Không thể giải mã captcha")
            print(f"   ⏱️  Thời gian: {processing_time:.2f} giây")
            
    except Exception as e:
        print(f"   ❌ Lỗi giải mã: {e}")
    
    print()
    
    # Test 4: Test với function tiện ích
    print("4. Test với function tiện ích...")
    start_time = time.time()
    
    try:
        result2 = decode_captcha_from_url()
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
    
    # Test 5: So sánh kết quả
    print("5. So sánh kết quả:")
    if result and result2:
        if result == result2:
            print("   ✅ Kết quả giống nhau - Module hoạt động nhất quán")
        else:
            print(f"   ⚠️  Kết quả khác nhau:")
            print(f"      Method 1: '{result}'")
            print(f"      Method 2: '{result2}'")
    elif result:
        print(f"   📝 Chỉ method 1 thành công: '{result}'")
    elif result2:
        print(f"   📝 Chỉ method 2 thành công: '{result2}'")
    else:
        print("   ❌ Cả hai method đều thất bại")
    
    print()
    
    # Test 6: Thống kê phương pháp mới
    print("6. Thống kê phương pháp mới:")
    print(f"   📁 File ảnh: test_captcha.jpg")
    print(f"   🔗 URL: https://tracuuhoadon.gdt.gov.vn/Captcha.jpg")
    print(f"   📐 Kích thước ảnh: {img.size[0]}x{img.size[1]}")
    print(f"   💾 Dung lượng: {len(response.content)} bytes")
    print(f"   🖼️  Số phiên bản ảnh: {len(processed_images)}")
    print(f"   ⚙️  Số cấu hình OCR: {len(decoder.tesseract_configs)}")
    print(f"   🔧 Phương pháp: Xóa nền đen -> trong suốt -> đen")
    
    if result:
        print(f"   ✅ Kết quả tốt nhất: '{result}'")
        print(f"   📊 Điểm số: {decoder.evaluate_result(result):.2f}")
    
    print()
    print("🎯 Test phương pháp mới hoàn thành!")

def test_multiple_attempts():
    """Test với nhiều lần thử"""
    print("\n🔄 Test với nhiều lần thử")
    print("=" * 50)
    
    decoder = CaptchaDecoder()
    results = []
    times = []
    
    for i in range(3):  # Test 3 lần
        print(f"\n📸 Lần thử {i+1}/3:")
        
        try:
            start_time = time.time()
            result = decoder.decode_from_url()
            end_time = time.time()
            
            processing_time = end_time - start_time
            times.append(processing_time)
            
            if result:
                score = decoder.evaluate_result(result)
                print(f"   ✅ Kết quả: '{result}' (điểm: {score:.2f}, thời gian: {processing_time:.2f}s)")
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
    print("🚀 Test Phương Pháp Xử Lý Ảnh Mới")
    print("=" * 60)
    
    try:
        # Test cơ bản
        test_new_processing_method()
        
        # Hỏi user có muốn test nhiều lần không
        print("\n" + "="*60)
        choice = input("Bạn có muốn test với nhiều lần thử? (y/n): ").lower().strip()
        
        if choice in ['y', 'yes', 'có']:
            test_multiple_attempts()
        
        print("\n🎉 Hoàn thành tất cả tests phương pháp mới!")
        
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
