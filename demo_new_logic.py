#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo script để minh họa logic No-new batches mới
"""

def demo_new_logic():
    """
    Demo logic No-new batches mới
    """
    print("📋 DEMO LOGIC NO-NEW BATCHES MỚI")
    print("="*60)
    
    print("🎯 Logic: Chỉ tính 'No-new batches' khi batch rỗng (new_codes=0 VÀ existing_codes=0)")
    print()
    
    # Ví dụ các trường hợp
    examples = [
        {
            'batch': 1,
            'total_codes': 1000,
            'new_codes': 100,
            'companies_added': 50,
            'description': 'Có TIN mới (100 TIN mới, 900 TIN đã tồn tại)'
        },
        {
            'batch': 2,
            'total_codes': 1000,
            'new_codes': 0,
            'companies_added': 0,
            'description': 'Không có TIN mới nhưng có TIN đã tồn tại (1000 TIN đã tồn tại)'
        },
        {
            'batch': 3,
            'total_codes': 1000,
            'new_codes': 0,
            'companies_added': 0,
            'description': 'Không có TIN mới nhưng có TIN đã tồn tại (1000 TIN đã tồn tại)'
        },
        {
            'batch': 4,
            'total_codes': 0,
            'new_codes': 0,
            'companies_added': 0,
            'description': 'Batch rỗng (không có TIN mới và không có TIN tồn tại)'
        },
        {
            'batch': 5,
            'total_codes': 0,
            'new_codes': 0,
            'companies_added': 0,
            'description': 'Batch rỗng (không có TIN mới và không có TIN tồn tại)'
        }
    ]
    
    no_new_batch_count = 0
    
    for example in examples:
        existing_codes = example['total_codes'] - example['new_codes']
        print(f"🔄 Batch {example['batch']}:")
        print(f"   📊 Tổng TIN: {example['total_codes']}")
        print(f"   📊 TIN mới: {example['new_codes']}")
        print(f"   📊 TIN đã tồn tại: {existing_codes}")
        print(f"   📊 TIN được lưu: {example['companies_added']}")
        print(f"   📝 Mô tả: {example['description']}")
        
        if example['new_codes'] > 0:
            no_new_batch_count = 0
            print(f"   ✅ Reset no_new_batch_count = 0 (có {example['new_codes']} TIN mới)")
        elif existing_codes > 0:
            print(f"   ℹ️ Không tính vào No-new batches (có {existing_codes} TIN tồn tại)")
        else:
            no_new_batch_count += 1
            print(f"   ⚠️ Tăng no_new_batch_count = {no_new_batch_count} (batch rỗng)")
        
        print()
    
    print("📋 Kết luận:")
    print("- Batch 1: Có 100 TIN mới → Reset counter")
    print("- Batch 2: Không có TIN mới, có 1000 TIN tồn tại → KHÔNG tính")
    print("- Batch 3: Không có TIN mới, có 1000 TIN tồn tại → KHÔNG tính")
    print("- Batch 4: Batch rỗng → Tăng counter (1)")
    print("- Batch 5: Batch rỗng → Tăng counter (2)")
    print()
    print("✅ Logic mới: Chỉ tính 'No-new batches' khi batch rỗng")
    print("   (Tức là khi new_codes=0 VÀ existing_codes=0)")
    print("="*60)

if __name__ == "__main__":
    demo_new_logic()
