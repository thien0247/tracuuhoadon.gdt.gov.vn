"""
Ví dụ sử dụng module tax_query.py
"""

from tax_query import query_tax_info
import json

def example_basic_usage():
    """Ví dụ sử dụng cơ bản"""
    print("=== Ví dụ sử dụng cơ bản ===")
    
    # Yêu cầu người dùng nhập mã số thuế thực tế
    print("⚠️  Lưu ý: Cần nhập mã số thuế thực tế!")
    tax_code = input("Nhập mã số thuế cần truy vấn: ").strip()
    
    if not tax_code:
        print("❌ Không có mã số thuế, bỏ qua ví dụ này")
        return
    
    print(f"Truy vấn thông tin mã số thuế: {tax_code}")
    
    # Truy vấn thông tin
    result = query_tax_info(tax_code, save_file=True)
    
    if result:
        print("✅ Truy vấn thành công!")
        print(f"📄 Kết quả: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        if 'saved_file' in result:
            print(f"💾 Đã lưu vào: {result['saved_file']}")
    else:
        print("❌ Truy vấn thất bại")

def example_multiple_queries():
    """Ví dụ truy vấn nhiều mã số thuế"""
    print("\n=== Ví dụ truy vấn nhiều mã số thuế ===")
    
    # Yêu cầu người dùng nhập danh sách mã số thuế thực tế
    print("⚠️  Lưu ý: Cần nhập danh sách mã số thuế thực tế!")
    print("Nhập các mã số thuế, cách nhau bởi dấu phẩy:")
    tax_input = input("Mã số thuế: ").strip()
    
    if not tax_input:
        print("❌ Không có mã số thuế, bỏ qua ví dụ này")
        return
    
    # Tách danh sách mã số thuế
    tax_codes = [code.strip() for code in tax_input.split(',') if code.strip()]
    
    if not tax_codes:
        print("❌ Không có mã số thuế hợp lệ, bỏ qua ví dụ này")
        return
    
    results = []
    
    for i, tax_code in enumerate(tax_codes, 1):
        print(f"\n📋 Truy vấn {i}/{len(tax_codes)}: {tax_code}")
        
        result = query_tax_info(tax_code, save_file=True)
        
        if result:
            print(f"   ✅ Thành công")
            results.append(result)
        else:
            print(f"   ❌ Thất bại")
            results.append(None)
    
    # Tổng kết
    success_count = len([r for r in results if r])
    print(f"\n📊 Tổng kết: {success_count}/{len(tax_codes)} thành công")

def example_custom_usage():
    """Ví dụ sử dụng tùy chỉnh"""
    print("\n=== Ví dụ sử dụng tùy chỉnh ===")
    
    from tax_query import TaxQuery
    
    # Yêu cầu người dùng nhập mã số thuế thực tế
    print("⚠️  Lưu ý: Cần nhập mã số thuế thực tế!")
    tax_code = input("Nhập mã số thuế cần truy vấn: ").strip()
    
    if not tax_code:
        print("❌ Không có mã số thuế, bỏ qua ví dụ này")
        return
    
    # Tạo instance tùy chỉnh
    tax_query = TaxQuery()
    
    # Truy vấn với retry mechanism
    result = tax_query.query_with_retry(tax_code, max_retries=3)
    
    if result:
        print("✅ Truy vấn thành công!")
        
        # Lưu với tên file tùy chỉnh
        filename = tax_query.save_result(result, "custom_result.json")
        print(f"💾 Đã lưu vào: {filename}")
    else:
        print("❌ Truy vấn thất bại")

def main():
    """Hàm main"""
    print("🚀 Ví dụ sử dụng Tax Query Module")
    print("=" * 60)
    
    try:
        # Ví dụ cơ bản
        example_basic_usage()
        
        # Ví dụ nhiều truy vấn
        example_multiple_queries()
        
        # Ví dụ tùy chỉnh
        example_custom_usage()
        
        print("\n🎉 Hoàn thành tất cả ví dụ!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Đã dừng bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")

if __name__ == "__main__":
    main()
