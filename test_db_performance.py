#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script để đo hiệu suất thực tế của database operations
"""

import time
import json
from datetime import datetime
from typing import List, Dict, Any
from database_models import DatabaseConnection, CompanyInfoModel

def create_test_data(count: int) -> List[Dict[str, Any]]:
    """
    Tạo dữ liệu test
    """
    test_data = []
    for i in range(count):
        test_data.append({
            'tin': f'TEST{i:06d}',
            'norm_name': f'CÔNG TY TNHH TEST {i:06d}',
            'econ_name': 'Tư nhân',
            'economy': '01',
            'regi_date': '2025-01-01T00:00:00',
            'chan_date': '2025-01-01T00:00:00',
            'status': '00',
            'statusname': 'Đang hoạt động',
            'search': False,
            'json_data': json.dumps({'test': True, 'id': i}, ensure_ascii=False)
        })
    return test_data

def test_single_insert_performance(company_model: CompanyInfoModel, test_data: List[Dict[str, Any]]) -> float:
    """
    Test hiệu suất single insert (cách cũ)
    """
    print("🔄 Testing Single Insert (cách cũ)...")
    start_time = time.time()
    
    success_count = 0
    for company_data in test_data:
        if company_model.insert_company(company_data):
            success_count += 1
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"   ✅ Single Insert: {success_count}/{len(test_data)} records trong {duration:.2f}s")
    return duration

def test_batch_insert_performance(company_model: CompanyInfoModel, test_data: List[Dict[str, Any]]) -> float:
    """
    Test hiệu suất batch insert (cách mới)
    """
    print("🔄 Testing Batch Insert (cách mới)...")
    start_time = time.time()
    
    success_count = company_model.insert_companies_batch(test_data)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"   ✅ Batch Insert: {success_count}/{len(test_data)} records trong {duration:.2f}s")
    return duration

def cleanup_test_data(company_model: CompanyInfoModel, test_data: List[Dict[str, Any]]):
    """
    Xóa dữ liệu test
    """
    print("🧹 Cleaning up test data...")
    for company_data in test_data:
        tin = company_data['tin']
        # Có thể thêm method delete nếu cần
        pass

def main():
    """
    Main function để test hiệu suất
    """
    print("📋 TEST HIỆU SUẤT DATABASE")
    print("="*60)
    
    # Khởi tạo database connection
    db_connection = DatabaseConnection()
    if not db_connection.connect():
        print("❌ Không thể kết nối database")
        return
    
    company_model = CompanyInfoModel(db_connection)
    
    # Test với các kích thước khác nhau
    test_sizes = [10, 50, 100]
    
    for size in test_sizes:
        print(f"\n📊 Test với {size} records:")
        print("-" * 40)
        
        # Tạo dữ liệu test
        test_data = create_test_data(size)
        
        # Test single insert
        single_time = test_single_insert_performance(company_model, test_data)
        
        # Test batch insert
        batch_time = test_batch_insert_performance(company_model, test_data)
        
        # Tính toán cải thiện
        if batch_time > 0:
            improvement = single_time / batch_time
            print(f"   🚀 Cải thiện: {improvement:.1f}x nhanh hơn")
        
        # Cleanup
        cleanup_test_data(company_model, test_data)
        
        print()
    
    print("🎉 Test hoàn thành!")
    print("="*60)

if __name__ == "__main__":
    main()
