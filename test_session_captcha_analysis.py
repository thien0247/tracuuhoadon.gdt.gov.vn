"""
Test script để phân tích chi tiết session và captcha
"""

import sys
import os
import json
from tax_query import TaxQuery

def test_session_captcha_analysis():
    """Test chi tiết session và captcha"""
    print("🔍 Test Session & Captcha Analysis")
    print("=" * 60)
    
    tax_query = TaxQuery()
    
    # Test 1: Giải captcha thành công
    print("1. Giải captcha thành công với mã mặc định...")
    result1 = tax_query.query_with_retry("4401120823", max_tesseract_retries=3, max_gemini_retries=3)
    
    if not result1 or not tax_query.is_captcha_success(result1):
        print("❌ Không thể giải captcha thành công")
        return
    
    successful_captcha = result1.get('captcha_code') or result1.get('metadata', {}).get('captcha_code')
    print(f"✅ Captcha thành công: {successful_captcha}")
    print(f"📄 tinModel: {result1.get('tinModel', 'null')}")
    
    # Lưu kết quả bước 1
    filename1 = tax_query.save_result(result1)
    print(f"💾 Đã lưu kết quả bước 1: {filename1}")
    
    # Test 2: Kiểm tra session cookies
    print(f"\n2. Kiểm tra session cookies...")
    print(f"📊 Session cookies: {dict(tax_query.session.cookies)}")
    
    # Test 3: Thử truy vấn với captcha đã có cho từng mã
    print(f"\n3. Thử truy vấn với captcha '{successful_captcha}' cho từng mã...")
    
    test_codes = ["0319151229", "0319153113", "2301359406"]
    
    for i, tax_code in enumerate(test_codes, 1):
        print(f"\n📋 Test {i}/3: Mã số thuế {tax_code}")
        print("-" * 40)
        
        try:
            result = tax_query.query_with_existing_captcha(tax_code, successful_captcha)
            
            if result:
                print(f"✅ Truy vấn thành công!")
                print(f"📄 tinModel: {result.get('tinModel', 'null')}")
                print(f"📊 Session cookies sau truy vấn: {dict(tax_query.session.cookies)}")
                
                # Lưu kết quả
                filename = tax_query.save_result(result)
                if filename:
                    print(f"💾 Đã lưu: {filename}")
            else:
                print(f"❌ Truy vấn thất bại!")
                
        except Exception as e:
            print(f"❌ Lỗi: {e}")
    
    print(f"\n🏁 Kết thúc test session & captcha analysis")

if __name__ == "__main__":
    test_session_captcha_analysis()
