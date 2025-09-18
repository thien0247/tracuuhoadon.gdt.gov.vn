"""
Test debug session để kiểm tra vấn đề session và captcha
"""

import sys
import os
from tax_query import TaxQuery

def test_session_debug():
    """Test debug session"""
    print("🔍 Test Session Debug")
    print("=" * 50)
    
    tax_query = TaxQuery()
    
    # Test 1: Tải captcha và kiểm tra session
    print("1. Tải captcha...")
    captcha_path = tax_query.download_captcha()
    if captcha_path:
        print(f"   ✅ Tải captcha thành công: {captcha_path}")
        print(f"   📊 Session cookies: {dict(tax_query.session.cookies)}")
    else:
        print("   ❌ Tải captcha thất bại")
        return
    
    # Test 2: Giải captcha với Tesseract
    print("\n2. Giải captcha với Tesseract...")
    captcha_code = tax_query.solve_captcha(captcha_path)
    if captcha_code:
        print(f"   ✅ Giải captcha thành công: {captcha_code}")
    else:
        print("   ❌ Giải captcha thất bại")
        return
    
    # Test 3: Truy vấn với captcha
    print(f"\n3. Truy vấn với captcha '{captcha_code}'...")
    result = tax_query.query_tax_info("4401120823", captcha_code)
    
    if result:
        print("   ✅ Truy vấn thành công!")
        print(f"   📄 tinModel: {result.get('tinModel', 'null')}")
        print(f"   📊 Session cookies sau truy vấn: {dict(tax_query.session.cookies)}")
        
        # Test 4: Thử truy vấn với captcha khác
        print(f"\n4. Thử truy vấn với captcha khác '{captcha_code}'...")
        result2 = tax_query.query_tax_info("0319151229", captcha_code)
        
        if result2:
            print("   ✅ Truy vấn thứ 2 thành công!")
            print(f"   📄 tinModel: {result2.get('tinModel', 'null')}")
        else:
            print("   ❌ Truy vấn thứ 2 thất bại")
    else:
        print("   ❌ Truy vấn thất bại")
    
    # Cleanup
    if os.path.exists(captcha_path):
        os.remove(captcha_path)

if __name__ == "__main__":
    test_session_debug()
