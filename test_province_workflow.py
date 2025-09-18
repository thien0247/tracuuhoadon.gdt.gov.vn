#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Province Workflow - Script test và demo
Test các module và chạy demo workflow
"""

import sys
import time
import logging
from typing import Dict, Any, Optional

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_database_models():
    """
    Test database models
    """
    print("🧪 TEST DATABASE MODELS")
    print("="*60)
    
    try:
        from database_models import test_database_connection
        return test_database_connection()
    except Exception as e:
        print(f"❌ Lỗi test database models: {e}")
        return False


def test_captcha_manager():
    """
    Test captcha manager
    """
    print("🧪 TEST CAPTCHA MANAGER")
    print("="*60)
    
    try:
        from captcha_manager import test_captcha_manager
        test_captcha_manager()
        return True
    except Exception as e:
        print(f"❌ Lỗi test captcha manager: {e}")
        return False


def test_batch_processor():
    """
    Test batch processor
    """
    print("🧪 TEST BATCH PROCESSOR")
    print("="*60)
    
    try:
        from batch_processor import test_batch_processor
        return test_batch_processor()
    except Exception as e:
        print(f"❌ Lỗi test batch processor: {e}")
        return False


def test_tax_code_validator():
    """
    Test tax code validator
    """
    print("🧪 TEST TAX CODE VALIDATOR")
    print("="*60)
    
    try:
        from tax_code_validator import test_tax_code_validator
        test_tax_code_validator()
        return True
    except Exception as e:
        print(f"❌ Lỗi test tax code validator: {e}")
        return False


def demo_workflow():
    """
    Demo workflow với dữ liệu mẫu
    """
    print("🎬 DEMO WORKFLOW")
    print("="*60)
    
    try:
        from province_workflow import ProvinceWorkflow
        
        # Tạo workflow
        workflow = ProvinceWorkflow()
        
        # Khởi tạo database
        if not workflow.initialize_database():
            print("❌ Không thể khởi tạo database")
            return False
        
        # Lấy danh sách tỉnh
        provinces = workflow.province_model.get_all_provinces()
        
        if not provinces:
            print("❌ Không có tỉnh nào trong database")
            return False
        
        print(f"📊 Tìm thấy {len(provinces)} tỉnh:")
        for i, province in enumerate(provinces[:10], 1):
            print(f"  {i:2d}. {province['code']} - {province['name']}")
            print(f"      tin_min: {province.get('tin_min', 'N/A')}")
            print(f"      tin_max: {province.get('tin_max', 'N/A')}")
        
        if len(provinces) > 10:
            print(f"  ... và {len(provinces) - 10} tỉnh khác")
        
        print("\n✅ Demo hoàn thành!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi demo: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'workflow' in locals() and workflow.db:
            workflow.db.disconnect()


def run_full_workflow():
    """
    Chạy workflow đầy đủ
    """
    print("🚀 RUN FULL WORKFLOW")
    print("="*60)
    
    try:
        from province_workflow import ProvinceWorkflow
        
        workflow = ProvinceWorkflow()
        success = workflow.run()
        
        return success
        
    except Exception as e:
        print(f"❌ Lỗi chạy workflow: {e}")
        import traceback
        traceback.print_exc()
        return False


def show_menu():
    """
    Hiển thị menu
    """
    print("\n" + "="*60)
    print("📋 MENU")
    print("="*60)
    print("1. Test Database Models")
    print("2. Test Captcha Manager")
    print("3. Test Batch Processor")
    print("4. Test Tax Code Validator")
    print("5. Demo Workflow")
    print("6. Run Full Workflow")
    print("7. Test All Modules")
    print("0. Exit")
    print("-"*60)


def test_all_modules():
    """
    Test tất cả modules
    """
    print("🧪 TEST ALL MODULES")
    print("="*60)
    
    tests = [
        ("Database Models", test_database_models),
        ("Captcha Manager", test_captcha_manager),
        ("Batch Processor", test_batch_processor),
        ("Tax Code Validator", test_tax_code_validator),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🔄 Testing {test_name}...")
        try:
            result = test_func()
            results[test_name] = result
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        except Exception as e:
            results[test_name] = False
            print(f"❌ FAIL {test_name}: {e}")
    
    # Tổng kết
    print(f"\n📊 TỔNG KẾT:")
    print("="*60)
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Kết quả: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 Tất cả tests đều PASS!")
    else:
        print("⚠️ Một số tests FAIL, kiểm tra lại!")
    
    return passed == total


def main():
    """
    Hàm main
    """
    print("🧪 TEST PROVINCE WORKFLOW")
    print("="*60)
    print("📋 Mô tả:")
    print("- Test các module riêng lẻ")
    print("- Demo workflow")
    print("- Chạy workflow đầy đủ")
    print("="*60)
    
    while True:
        show_menu()
        
        try:
            choice = input("🔢 Chọn option (0-7): ").strip()
            
            if choice == "0":
                print("👋 Goodbye!")
                break
            elif choice == "1":
                test_database_models()
            elif choice == "2":
                test_captcha_manager()
            elif choice == "3":
                test_batch_processor()
            elif choice == "4":
                test_tax_code_validator()
            elif choice == "5":
                demo_workflow()
            elif choice == "6":
                run_full_workflow()
            elif choice == "7":
                test_all_modules()
            else:
                print("❌ Lựa chọn không hợp lệ!")
            
            input("\n⏸️ Nhấn Enter để tiếp tục...")
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Lỗi: {e}")
            input("\n⏸️ Nhấn Enter để tiếp tục...")


if __name__ == "__main__":
    main()
