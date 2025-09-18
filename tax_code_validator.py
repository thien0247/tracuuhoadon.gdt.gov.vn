#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tax Code Validator - Kiểm tra tính hợp lệ của mã số thuế
Chuyển đổi từ JavaScript sang Python
"""

import logging

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def to_number(char):
    """
    Chuyển đổi ký tự thành số
    
    Args:
        char: Ký tự cần chuyển đổi
        
    Returns:
        Số nguyên hoặc None nếu không hợp lệ
    """
    try:
        return int(char)
    except (ValueError, TypeError):
        return None


def validate_10_digit_tin(str_tin):
    """
    Kiểm tra tính hợp lệ của mã số thuế 10 chữ số
    
    Args:
        str_tin: Mã số thuế 10 chữ số
        
    Returns:
        True nếu hợp lệ, False nếu không hợp lệ
    """
    if len(str_tin) != 10:
        return False
    
    try:
        # Tính toán checksum
        n1 = int(str_tin[0]) * 31
        n2 = int(str_tin[1]) * 29
        n3 = int(str_tin[2]) * 23
        n4 = int(str_tin[3]) * 19
        n5 = int(str_tin[4]) * 17
        n6 = int(str_tin[5]) * 13
        n7 = int(str_tin[6]) * 7
        n8 = int(str_tin[7]) * 5
        n9 = int(str_tin[8]) * 3
        n10 = int(str_tin[9])
        
        # Tính số dư
        so_du = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 11
        hieu_so = 10 - so_du
        
        # Kiểm tra checksum
        return hieu_so == n10
        
    except (ValueError, IndexError):
        return False


def ktraCTrucTIN(tin_obj):
    """
    Kiểm tra tính hợp lệ của mã số thuế
    
    Args:
        tin_obj: Mã số thuế cần kiểm tra (string)
        
    Returns:
        True nếu hợp lệ, False nếu không hợp lệ
    """
    # Loại bỏ khoảng trắng
    str_tin = tin_obj.replace(' ', '')
    
    # Kiểm tra độ dài cơ bản
    if str_tin != '' and (len(str_tin) < 10 or len(str_tin) > 14):
        logger.warning(f"Mã số thuế không đúng, hãy nhập lại: {str_tin}")
        return False
    
    # Kiểm tra mã số thuế 10 chữ số
    if len(str_tin) == 10:
        if not validate_10_digit_tin(str_tin):
            logger.warning(f"Mã số thuế không đúng, hãy nhập lại: {str_tin}")
            return False
    
    # Kiểm tra mã số thuế 11-13 chữ số (không hợp lệ)
    if 10 < len(str_tin) < 14:
        logger.warning(f"Mã số thuế không đúng, hãy nhập lại: {str_tin}")
        return False
    
    # Kiểm tra mã số thuế 14 chữ số
    if len(str_tin) == 14:
        try:
            n11 = str_tin[10]
            n12 = to_number(str_tin[11])
            n13 = to_number(str_tin[12])
            n14 = to_number(str_tin[13])
            
            # Kiểm tra dấu gạch ngang ở vị trí 11
            if n11 != '-':
                logger.warning(f"Mã số thuế không đúng, hãy nhập lại: {str_tin}")
                return False
            else:
                # Kiểm tra các chữ số cuối
                if not (0 <= n12 <= 9) or not (0 <= n13 <= 9) or not (0 <= n14 <= 9):
                    logger.warning(f"Mã số thuế không đúng, hãy nhập lại: {str_tin}")
                    return False
                
                # Kiểm tra phần đầu 10 chữ số có hợp lệ không
                first_10_digits = str_tin[:10]
                if not validate_10_digit_tin(first_10_digits):
                    logger.warning(f"Phần đầu 10 chữ số không hợp lệ: {first_10_digits}")
                    return False
                    
        except (ValueError, IndexError) as e:
            logger.error(f"Lỗi xử lý mã số thuế 14 chữ số: {e}")
            return False
    
    return True


def validate_tax_codes(tax_codes):
    """
    Kiểm tra tính hợp lệ của nhiều mã số thuế
    
    Args:
        tax_codes: Danh sách mã số thuế
        
    Returns:
        Dictionary với kết quả kiểm tra
    """
    results = {}
    
    for tax_code in tax_codes:
        is_valid = ktraCTrucTIN(tax_code)
        results[tax_code] = {
            'valid': is_valid,
            'length': len(tax_code.replace(' ', '')),
            'type': '10_digits' if len(tax_code.replace(' ', '')) == 10 else 
                   '14_digits' if len(tax_code.replace(' ', '')) == 14 else 'invalid_length'
        }
    
    return results


def test_tax_code_validator():
    """
    Test hàm kiểm tra mã số thuế
    """
    print("🧪 TEST TAX CODE VALIDATOR")
    print("="*60)
    
    # Test cases
    test_cases = [
        "4401120823",  # Mã test từ workflow
        "0319151229",  # Mã bị failed
        "0319153113",  # Mã thành công
        "2301359406",  # Mã thành công
        "1234567890",  # Mã không hợp lệ
        "12345678901", # Mã 11 chữ số (không hợp lệ)
        "12345678901234", # Mã 14 chữ số
        "1234567890-123", # Mã 14 chữ số với dấu gạch ngang
        " 4401120823 ",  # Mã có khoảng trắng
    ]
    
    print("📋 Test cases:")
    for i, tax_code in enumerate(test_cases, 1):
        print(f"{i}. {tax_code}")
    
    print("\n📊 Kết quả:")
    print("-"*60)
    
    results = validate_tax_codes(test_cases)
    
    for tax_code, result in results.items():
        status = "✅ Hợp lệ" if result['valid'] else "❌ Không hợp lệ"
        print(f"{tax_code}: {status} ({result['type']}, {result['length']} chữ số)")
    
    print("="*60)
    
    # Thống kê
    valid_count = sum(1 for r in results.values() if r['valid'])
    total_count = len(results)
    
    print(f"📈 Thống kê:")
    print(f"✅ Hợp lệ: {valid_count}/{total_count}")
    print(f"❌ Không hợp lệ: {total_count - valid_count}/{total_count}")
    print(f"🎯 Tỷ lệ hợp lệ: {valid_count/total_count*100:.1f}%")


def main():
    """
    Hàm main
    """
    print("🔍 TAX CODE VALIDATOR")
    print("="*60)
    print("📋 Mô tả:")
    print("- Kiểm tra tính hợp lệ của mã số thuế")
    print("- Hỗ trợ mã 10 chữ số và 14 chữ số")
    print("- Kiểm tra checksum cho mã 10 chữ số")
    print("- Kiểm tra format cho mã 14 chữ số")
    print("="*60)
    
    # Test với các mã số thuế từ workflow
    workflow_tax_codes = ["4401120823", "0319151229", "0319153113", "2301359406"]
    
    print(f"🔢 Kiểm tra mã số thuế từ workflow:")
    for tax_code in workflow_tax_codes:
        is_valid = ktraCTrucTIN(tax_code)
        status = "✅ Hợp lệ" if is_valid else "❌ Không hợp lệ"
        print(f"  {tax_code}: {status}")
    
    print("\n" + "="*60)
    
    # Chạy test đầy đủ
    test_tax_code_validator()


if __name__ == "__main__":
    main()
