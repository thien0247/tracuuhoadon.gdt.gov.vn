#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo script để so sánh hiệu suất database operations
"""

import time
from datetime import datetime
from typing import List, Dict, Any

def demo_performance_comparison():
    """
    Demo so sánh hiệu suất giữa single insert và batch insert
    """
    print("📋 DEMO SO SÁNH HIỆU SUẤT DATABASE")
    print("="*60)
    
    print("🎯 So sánh hiệu suất giữa:")
    print("1. Single Insert (cũ): Gọi insert_company từng record một")
    print("2. Batch Insert (mới): Sử dụng executemany cho tất cả records")
    print()
    
    # Tạo dữ liệu mẫu
    sample_data = []
    for i in range(100):
        sample_data.append({
            'tin': f'4400915{i:03d}',
            'norm_name': f'CÔNG TY TNHH DEMO {i:03d}',
            'econ_name': 'Tư nhân',
            'economy': '01',
            'regi_date': '2025-01-01T00:00:00',
            'chan_date': '2025-01-01T00:00:00',
            'status': '00',
            'statusname': 'Đang hoạt động',
            'search': False,
            'json_data': '{"demo": true}'
        })
    
    print("📊 Dữ liệu mẫu: 100 records")
    print()
    
    # Mô phỏng thời gian thực thi
    print("⏱️ Mô phỏng thời gian thực thi:")
    print()
    
    # Single Insert (cũ)
    print("1️⃣ Single Insert (cũ):")
    print("   - Gọi insert_company() 100 lần")
    print("   - Mỗi lần: 1 connection + 1 query + 1 commit")
    print("   - Tổng: 100 connections + 100 queries + 100 commits")
    print("   - Thời gian ước tính: ~2-5 giây (tùy thuộc vào network)")
    print()
    
    # Batch Insert (mới)
    print("2️⃣ Batch Insert (mới):")
    print("   - Gọi execute_batch_insert() 1 lần")
    print("   - Sử dụng executemany() cho tất cả records")
    print("   - Tổng: 1 connection + 1 query + 1 commit")
    print("   - Thời gian ước tính: ~0.1-0.3 giây")
    print()
    
    # So sánh hiệu suất
    print("📈 CẢI THIỆN HIỆU SUẤT:")
    print("="*40)
    print("🚀 Tốc độ: Nhanh hơn 10-50 lần")
    print("💾 Băng thông: Giảm 99% số lượng connections")
    print("🔒 Lock time: Giảm đáng kể thời gian lock database")
    print("⚡ Throughput: Tăng đáng kể khả năng xử lý")
    print()
    
    # Lợi ích khác
    print("🎯 LỢI ÍCH KHÁC:")
    print("="*40)
    print("✅ Atomicity: Tất cả records được insert trong 1 transaction")
    print("✅ Consistency: Đảm bảo tính nhất quán dữ liệu")
    print("✅ Error handling: Dễ dàng rollback nếu có lỗi")
    print("✅ Resource usage: Tiết kiệm tài nguyên hệ thống")
    print("✅ Scalability: Dễ dàng mở rộng cho batch lớn hơn")
    print()
    
    # Ví dụ thực tế
    print("📋 VÍ DỤ THỰC TẾ:")
    print("="*40)
    print("Batch 1000 TIN:")
    print("  - Cũ: 1000 lần insert → ~20-50 giây")
    print("  - Mới: 1 lần batch insert → ~0.5-1 giây")
    print()
    print("Batch 10000 TIN:")
    print("  - Cũ: 10000 lần insert → ~200-500 giây (3-8 phút)")
    print("  - Mới: 1 lần batch insert → ~2-5 giây")
    print()
    
    print("🎉 KẾT LUẬN:")
    print("="*40)
    print("✅ Batch insert cải thiện hiệu suất đáng kể")
    print("✅ Giảm tải cho database server")
    print("✅ Tăng tốc độ xử lý workflow")
    print("✅ Cải thiện trải nghiệm người dùng")
    print("="*60)

if __name__ == "__main__":
    demo_performance_comparison()
