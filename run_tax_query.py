"""
Script chạy truy vấn thông tin mã số thuế với retry logic khi captcha sai
"""

import sys
import os
import time
import json
from tax_query import TaxQuery

def check_captcha_success(result):
    """
    Kiểm tra xem captcha có đúng không dựa trên tinModel
    
    Args:
        result: Kết quả từ API
        
    Returns:
        True nếu captcha đúng, False nếu sai
    """
    if not result:
        return False
    
    # Kiểm tra tinModel trong kết quả
    if isinstance(result, dict):
        # Kiểm tra trực tiếp tinModel
        if 'tinModel' in result:
            if result['tinModel'] is not None:
                print(f"   ✅ tinModel: {result['tinModel']} (captcha đúng)")
                return True
            else:
                print(f"   ❌ tinModel: null (captcha sai)")
                return False
        
        # Nếu có data và chứa tinModel
        if 'data' in result and isinstance(result['data'], str):
            try:
                # Thử parse JSON từ data
                data_json = json.loads(result['data'])
                if 'tinModel' in data_json:
                    if data_json['tinModel'] is not None:
                        print(f"   ✅ tinModel trong data: {data_json['tinModel']} (captcha đúng)")
                        return True
                    else:
                        print(f"   ❌ tinModel trong data: null (captcha sai)")
                        return False
            except:
                pass
        
        # Nếu có content và chứa tinModel
        if 'content' in result and isinstance(result['content'], str):
            try:
                # Thử parse JSON từ content
                content_json = json.loads(result['content'])
                if 'tinModel' in content_json:
                    if content_json['tinModel'] is not None:
                        print(f"   ✅ tinModel trong content: {content_json['tinModel']} (captcha đúng)")
                        return True
                    else:
                        print(f"   ❌ tinModel trong content: null (captcha sai)")
                        return False
            except:
                pass
    
    print("   ❌ Không tìm thấy tinModel trong kết quả")
    return False

def run_tax_query_with_new_logic(tax_code):
    """
    Chạy truy vấn thông tin mã số thuế với logic mới:
    - Ưu tiên Tesseract (3 lần) rồi Gemini (3 lần)
    - Kiểm tra tinModel để xác nhận thành công
    - Session được duy trì trong suốt 6 lần thử
    
    Args:
        tax_code: Mã số thuế
        
    Returns:
        Kết quả cuối cùng hoặc None nếu thất bại
    """
    print(f"🚀 Bắt đầu truy vấn thông tin mã số thuế: {tax_code}")
    print("🔄 Logic mới: Tesseract (3 lần) → Gemini (3 lần)")
    print("🎯 Kiểm tra tinModel để xác nhận thành công")
    print("🔍 Session được duy trì trong suốt 6 lần thử")
    print("=" * 60)
    
    tax_query = TaxQuery()
    
    # Sử dụng method mới với logic ưu tiên
    result = tax_query.query_with_retry(tax_code, max_tesseract_retries=3, max_gemini_retries=3)
    
    if result:
        print("\n🎉 HOÀN THÀNH!")
        print("=" * 60)
        print("✅ Truy vấn thành công với captcha đúng!")
        print(f"📄 Kết quả cuối cùng:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Lưu kết quả
        filename = tax_query.save_result(result)
        if filename:
            print(f"💾 File đã lưu: {filename}")
        
        return result, tax_query
    else:
        print("\n❌ THẤT BẠI!")
        print("=" * 60)
        print("🛑 Cả Tesseract và Gemini đều thất bại!")
        print("Không thể giải captcha sau tất cả các lần thử")
        return None, None

def test_with_default_tax_code():
    """Test với mã số thuế mặc định 4401120823"""
    print("🧪 TEST 1: Mã số thuế mặc định")
    print("=" * 60)
    
    tax_code = "4401120823"
    print(f"📋 Mã số thuế: {tax_code}")
    print("🎯 Mục tiêu: Kiểm tra độ chính xác của giải mã captcha")
    print("✅ Thành công nếu tinModel khác null")
    print()
    
    try:
        result, tax_query = run_tax_query_with_new_logic(tax_code)
        if result and tax_query:
            return result, tax_query
        else:
            return None, None
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return None, None

def test_with_sample_tax_codes(tax_query_instance, successful_captcha):
    """Test với 3 mã số thuế mẫu sử dụng session và captcha đã có sẵn"""
    print("\n🧪 TEST 2: 3 mã số thuế mẫu (sử dụng session và captcha có sẵn)")
    print("=" * 60)
    
    sample_tax_codes = ["0319151229", "0319153113", "2301359406"]
    results = []
    
    print(f"🔄 Sử dụng session, cookie và captcha đã giải mã thành công: {successful_captcha}")
    print("🔍 Không cần giải captcha mới - sử dụng lại captcha đã có")
    print("💡 Session/cookie vẫn được duy trì trong suốt quá trình")
    print()
    
    for i, tax_code in enumerate(sample_tax_codes, 1):
        print(f"\n📋 Test {i}/3: Mã số thuế {tax_code}")
        print("-" * 40)
        
        try:
            # Sử dụng session, cookie và captcha đã giải mã thành công
            result = tax_query_instance.query_with_existing_captcha(tax_code, successful_captcha)
            success = result is not None and tax_query_instance.is_captcha_success(result)
            results.append(success)
            
            if success:
                print(f"✅ Test {i} thành công!")
                # Lưu kết quả
                filename = tax_query_instance.save_result(result)
                if filename:
                    print(f"💾 Đã lưu vào: {filename}")
            else:
                print(f"❌ Test {i} thất bại!")
                if result:
                    print(f"   📄 Kết quả: {result.get('tinModel', 'null')}")
                
        except Exception as e:
            print(f"❌ Test {i} lỗi: {e}")
            results.append(False)
    
    # Tổng kết
    print(f"\n📊 TỔNG KẾT TEST 2:")
    print("=" * 60)
    success_count = sum(results)
    total_count = len(results)
    
    for i, (tax_code, success) in enumerate(zip(sample_tax_codes, results), 1):
        status = "✅" if success else "❌"
        print(f"Test {i}: {tax_code} - {status}")
    
    print(f"\nKết quả: {success_count}/{total_count} thành công")
    return success_count == total_count

def main():
    """Hàm main với logic mới theo đúng yêu cầu"""
    print("🚀 Script Truy vấn Thông tin Mã số Thuế - Logic Mới")
    print("=" * 60)
    print("🔄 Tesseract (3 lần) → Gemini (3 lần)")
    print("🎯 Kiểm tra tinModel để xác nhận thành công")
    print("🔍 Session được duy trì trong suốt 6 lần thử cho mỗi mã")
    print()
    
    try:
        # Bước 1: Test với mã số thuế mặc định để lấy captcha thành công
        print("📋 BƯỚC 1: Kiểm tra khả năng giải captcha với mã mặc định")
        print("=" * 60)
        
        result1, tax_query = test_with_default_tax_code()
        
        if result1 is None or tax_query is None:
            print("\n❌ THẤT BẠI!")
            print("🛑 Không thể giải captcha với mã mặc định")
            print("Dừng chương trình theo yêu cầu")
            return
        
        # Lấy captcha thành công từ kết quả
        successful_captcha = result1.get('metadata', {}).get('captcha_code')
        if not successful_captcha:
            # Nếu không có trong metadata, thử lấy từ kết quả gốc
            successful_captcha = result1.get('captcha_code')
        
        if not successful_captcha:
            print("\n❌ THẤT BẠI!")
            print("🛑 Không tìm thấy captcha thành công")
            return
        
        print(f"\n✅ BƯỚC 1 THÀNH CÔNG!")
        print(f"🎯 Captcha thành công: {successful_captcha}")
        print(f"📄 tinModel: {result1.get('tinModel', 'N/A')}")
        
        # Lưu kết quả bước 1 (sử dụng lại tax_query từ bước 1)
        filename1 = tax_query.save_result(result1)
        if filename1:
            print(f"💾 Đã lưu kết quả bước 1: {filename1}")
        
        # Giữ nguyên session từ bước 1 để sử dụng cho bước 2
        print(f"🔒 Giữ nguyên session và cookies từ bước 1")
        print(f"📊 Session cookies: {dict(tax_query.session.cookies)}")
        
        # Bước 2: Test tiếp với 3 mã số thuế sử dụng session đã giữ
        print(f"\n📋 BƯỚC 2: Test tiếp với 3 mã số thuế")
        print("=" * 60)
        print("🔍 Kiểm tra session/cookie có được lưu đúng không")
        print("🔄 Sử dụng session, cookie và captcha đã giải mã thành công")
        print("💡 Session/cookie vẫn được duy trì trong suốt quá trình")
        
        test2_success = test_with_sample_tax_codes(tax_query, successful_captcha)
        
        # Tổng kết cuối cùng
        print(f"\n🏁 TỔNG KẾT CUỐI CÙNG:")
        print("=" * 60)
        print(f"Bước 1 (Mã mặc định): ✅ Thành công - Captcha: {successful_captcha}")
        print(f"Bước 2 (3 mã mẫu): {'✅ Thành công' if test2_success else '❌ Thất bại'}")
        
        if test2_success:
            print("\n🎉 TẤT CẢ TEST THÀNH CÔNG!")
            print("✅ Đã thực hiện đúng logic theo yêu cầu:")
            print("   1. Giải captcha thành công với mã mặc định")
            print("   2. Sử dụng session, cookie và captcha đã giải mã thành công")
            print("   3. Test tiếp với 3 mã số thuế khác")
        else:
            print("\n⚠️  BƯỚC 2 CÓ VẤN ĐỀ!")
            print("✅ Bước 1 thành công nhưng bước 2 thất bại")
            print("💡 Lý do: Captcha chỉ sử dụng được 1 lần, cần captcha mới cho mỗi mã")
            
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
