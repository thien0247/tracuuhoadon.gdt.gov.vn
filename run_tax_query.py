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

def run_tax_query_with_retry(tax_code, max_retries=5):
    """
    Chạy truy vấn thông tin mã số thuế với retry logic
    
    Args:
        tax_code: Mã số thuế
        max_retries: Số lần thử lại tối đa
        
    Returns:
        Kết quả cuối cùng hoặc None nếu thất bại
    """
    print(f"🚀 Bắt đầu truy vấn thông tin mã số thuế: {tax_code}")
    print(f"🔄 Số lần thử lại tối đa: {max_retries}")
    print("=" * 60)
    
    tax_query = TaxQuery()
    
    for attempt in range(max_retries):
        print(f"\n📋 Lần thử {attempt + 1}/{max_retries}")
        print("-" * 40)
        
        try:
            # Tải captcha
            print("1. Tải captcha...")
            captcha_path = tax_query.download_captcha()
            if not captcha_path:
                print("   ❌ Không thể tải captcha")
                continue
            
            print(f"   ✅ Đã tải captcha: {captcha_path}")
            
            # Giải mã captcha
            print("2. Giải mã captcha...")
            captcha_code = tax_query.solve_captcha(captcha_path)
            if not captcha_code:
                print("   ❌ Không thể giải mã captcha")
                # Xóa file captcha tạm
                if os.path.exists(captcha_path):
                    os.remove(captcha_path)
                continue
            
            print(f"   ✅ Giải mã captcha: {captcha_code}")
            
            # Truy vấn thông tin
            print("3. Truy vấn thông tin...")
            result = tax_query.query_tax_info(tax_code, captcha_code)
            
            # Xóa file captcha tạm
            if os.path.exists(captcha_path):
                os.remove(captcha_path)
            
            if not result:
                print("   ❌ Truy vấn thất bại")
                continue
            
            print("   ✅ Truy vấn thành công!")
            print(f"   📄 Kết quả: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            # Kiểm tra captcha có đúng không
            print("4. Kiểm tra captcha...")
            print(f"   🔍 Captcha code đã sử dụng: {captcha_code}")
            
            # Debug: Hiển thị các trường quan trọng
            if isinstance(result, dict):
                print(f"   🔍 Các trường trong kết quả: {list(result.keys())}")
                if 'strMess' in result:
                    print(f"   🔍 strMess: {result['strMess']}")
                if 'tin' in result:
                    print(f"   🔍 tin: {result['tin']}")
            
            if check_captcha_success(result):
                print("   ✅ Captcha đúng! Truy vấn thành công!")
                
                # Lưu kết quả
                filename = tax_query.save_result(result)
                if filename:
                    print(f"   💾 Đã lưu vào: {filename}")
                
                return result
            else:
                print("   ❌ Captcha sai (tinModel: null), thử lại...")
                
                # Nếu không phải lần thử cuối, nghỉ 2 giây
                if attempt < max_retries - 1:
                    print("   ⏳ Nghỉ 2 giây trước khi thử lại...")
                    time.sleep(2)
                
        except Exception as e:
            print(f"   ❌ Lỗi trong lần thử {attempt + 1}: {e}")
            
            # Nếu không phải lần thử cuối, nghỉ 2 giây
            if attempt < max_retries - 1:
                print("   ⏳ Nghỉ 2 giây trước khi thử lại...")
                time.sleep(2)
    
    print(f"\n❌ Thất bại sau {max_retries} lần thử")
    return None

def main():
    """Hàm main"""
    print("🚀 Script Truy vấn Thông tin Mã số Thuế")
    print("=" * 60)
    
    # Mã số thuế cố định
    tax_code = "4401120823"
    max_retries = 5
    
    print(f"📋 Mã số thuế: {tax_code}")
    print(f"🔄 Số lần thử lại: {max_retries}")
    print(f"🎯 Mục tiêu: Lấy thông tin với captcha đúng (tinModel không null)")
    print()
    
    try:
        result = run_tax_query_with_retry(tax_code, max_retries)
        
        if result:
            print("\n🎉 HOÀN THÀNH!")
            print("=" * 60)
            print("✅ Truy vấn thành công với captcha đúng!")
            print(f"📄 Kết quả cuối cùng:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            if 'saved_file' in result:
                print(f"💾 File đã lưu: {result['saved_file']}")
        else:
            print("\n❌ THẤT BẠI!")
            print("=" * 60)
            print("Không thể truy vấn thành công sau tất cả các lần thử")
            
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
