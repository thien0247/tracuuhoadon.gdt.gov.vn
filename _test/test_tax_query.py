"""
Test module tax_query.py
"""

import sys
import os
# Thêm thư mục gốc vào path để import module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import json
from tax_query import TaxQuery, query_tax_info

def test_tax_query():
    """Test module tax_query"""
    print("🔍 Test Tax Query Module")
    print("=" * 50)
    
    # Yêu cầu người dùng nhập mã số thuế thực tế
    print("⚠️  Lưu ý: Test với dữ liệu thực tế!")
    tax_code = input("Nhập mã số thuế để test: ").strip()
    
    if not tax_code:
        print("❌ Không có mã số thuế, bỏ qua test này")
        return
    
    print(f"Mã số thuế: {tax_code}")
    print()
    
    try:
        # Test 1: Tạo TaxQuery instance
        print("1. Tạo TaxQuery instance...")
        tax_query = TaxQuery()
        print("   ✅ Tạo thành công")
        
        # Test 2: Tải captcha
        print("\n2. Tải captcha...")
        captcha_path = tax_query.download_captcha()
        if captcha_path:
            print(f"   ✅ Đã tải captcha: {captcha_path}")
        else:
            print("   ❌ Không thể tải captcha")
            return
        
        # Test 3: Giải mã captcha
        print("\n3. Giải mã captcha...")
        captcha_code = tax_query.solve_captcha(captcha_path)
        if captcha_code:
            print(f"   ✅ Giải mã thành công: {captcha_code}")
        else:
            print("   ❌ Không thể giải mã captcha")
            return
        
        # Test 4: Truy vấn thông tin
        print("\n4. Truy vấn thông tin...")
        result = tax_query.query_tax_info(tax_code, captcha_code)
        if result:
            print("   ✅ Truy vấn thành công!")
            print(f"   📄 Kết quả: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print("   ❌ Truy vấn thất bại")
        
        # Test 5: Lưu kết quả
        if result:
            print("\n5. Lưu kết quả...")
            filename = tax_query.save_result(result)
            if filename:
                print(f"   ✅ Đã lưu vào: {filename}")
            else:
                print("   ❌ Không thể lưu file")
        
        # Cleanup
        if os.path.exists(captcha_path):
            os.remove(captcha_path)
            print(f"\n🧹 Đã xóa file captcha tạm")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

def test_with_retry():
    """Test với retry mechanism"""
    print("\n🔄 Test với retry mechanism")
    print("=" * 50)
    
    # Yêu cầu người dùng nhập mã số thuế thực tế
    print("⚠️  Lưu ý: Test với dữ liệu thực tế!")
    tax_code = input("Nhập mã số thuế để test retry: ").strip()
    
    if not tax_code:
        print("❌ Không có mã số thuế, bỏ qua test này")
        return
    
    print(f"Mã số thuế: {tax_code}")
    
    try:
        tax_query = TaxQuery()
        result = tax_query.query_with_retry(tax_code, max_retries=2)
        
        if result:
            print("✅ Truy vấn thành công với retry!")
            print(f"📄 Kết quả: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print("❌ Truy vấn thất bại")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

def test_utility_function():
    """Test utility function"""
    print("\n🔧 Test utility function")
    print("=" * 50)
    
    # Yêu cầu người dùng nhập mã số thuế thực tế
    print("⚠️  Lưu ý: Test với dữ liệu thực tế!")
    tax_code = input("Nhập mã số thuế để test utility function: ").strip()
    
    if not tax_code:
        print("❌ Không có mã số thuế, bỏ qua test này")
        return
    
    print(f"Mã số thuế: {tax_code}")
    
    try:
        result = query_tax_info(tax_code, save_file=True)
        
        if result:
            print("✅ Utility function hoạt động!")
            print(f"📄 Kết quả: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            if 'saved_file' in result:
                print(f"💾 Đã lưu vào: {result['saved_file']}")
        else:
            print("❌ Utility function thất bại")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

def main():
    """Hàm main"""
    print("🚀 Test Tax Query Module")
    print("=" * 60)
    
    try:
        # Test cơ bản
        test_tax_query()
        
        # Test với retry
        test_with_retry()
        
        # Test utility function
        test_utility_function()
        
        print("\n🎉 Hoàn thành tất cả tests!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")

if __name__ == "__main__":
    main()
