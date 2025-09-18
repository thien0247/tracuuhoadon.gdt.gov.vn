"""
Test script để kiểm tra session persistence từ lần đầu tải captcha
"""

import sys
import os
import json
from tax_query import TaxQuery

def test_session_persistence():
    """Test chi tiết session persistence"""
    print("🔍 Test Session Persistence - Kiểm tra session từ lần đầu tải captcha")
    print("=" * 70)
    
    tax_query = TaxQuery()
    
    # Test 1: Lần đầu tải captcha
    print("1. Lần đầu tải captcha...")
    print(f"📊 Session cookies ban đầu: {dict(tax_query.session.cookies)}")
    
    captcha_path1 = tax_query.download_captcha()
    if captcha_path1:
        print(f"✅ Tải captcha lần 1 thành công: {captcha_path1}")
        print(f"📊 Session cookies sau lần 1: {dict(tax_query.session.cookies)}")
    else:
        print("❌ Tải captcha lần 1 thất bại")
        return
    
    # Test 2: Lần thứ 2 tải captcha
    print(f"\n2. Lần thứ 2 tải captcha...")
    captcha_path2 = tax_query.download_captcha()
    if captcha_path2:
        print(f"✅ Tải captcha lần 2 thành công: {captcha_path2}")
        print(f"📊 Session cookies sau lần 2: {dict(tax_query.session.cookies)}")
    else:
        print("❌ Tải captcha lần 2 thất bại")
        return
    
    # Test 3: Lần thứ 3 tải captcha
    print(f"\n3. Lần thứ 3 tải captcha...")
    captcha_path3 = tax_query.download_captcha()
    if captcha_path3:
        print(f"✅ Tải captcha lần 3 thành công: {captcha_path3}")
        print(f"📊 Session cookies sau lần 3: {dict(tax_query.session.cookies)}")
    else:
        print("❌ Tải captcha lần 3 thất bại")
        return
    
    # Test 4: So sánh session cookies
    print(f"\n4. So sánh session cookies...")
    cookies1 = dict(tax_query.session.cookies)
    
    # Tải thêm captcha để kiểm tra
    captcha_path4 = tax_query.download_captcha()
    if captcha_path4:
        print(f"✅ Tải captcha lần 4 thành công: {captcha_path4}")
        cookies2 = dict(tax_query.session.cookies)
        print(f"📊 Session cookies sau lần 4: {cookies2}")
        
        # So sánh
        if cookies1 == cookies2:
            print("✅ Session cookies KHÔNG THAY ĐỔI - Session được duy trì đúng!")
        else:
            print("❌ Session cookies THAY ĐỔI - Session không được duy trì!")
            print("🔍 Cookies khác biệt:")
            for key in set(cookies1.keys()) | set(cookies2.keys()):
                if cookies1.get(key) != cookies2.get(key):
                    print(f"   {key}: {cookies1.get(key)} → {cookies2.get(key)}")
    
    # Test 5: Kiểm tra session headers
    print(f"\n5. Kiểm tra session headers...")
    print(f"📊 Session headers: {dict(tax_query.session.headers)}")
    
    # Cleanup
    for path in [captcha_path1, captcha_path2, captcha_path3, captcha_path4]:
        if path and os.path.exists(path):
            os.remove(path)
    
    print(f"\n🏁 Kết thúc test session persistence")

if __name__ == "__main__":
    test_session_persistence()
