#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuration file - Cấu hình cho Province Workflow
"""

import os
from typing import Dict, Any

# Database Configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', '192.168.168.222'),
    'port': int(os.getenv('DB_PORT', '5433')),
    'database': os.getenv('DB_NAME', 'masothue'),
    'user': os.getenv('DB_USER', 'zzsadmin'),
    'password': os.getenv('DB_PASSWORD', 'Zzs23123456789'),  # Thay đổi password ở đây
}

# API Configuration
API_CONFIG = {
    'captcha_url': 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg',
    'query_url': 'https://tracuuhoadon.gdt.gov.vn/gettin.html',
    'timeout': 30,
    'delay_between_requests': 0.1,
    'max_retries': 2,
    'retry_delay': 1,
}

# Workflow Configuration
WORKFLOW_CONFIG = {
    'batch_size': 1000,
    'max_no_new_batches': 10,
    'delay_between_batches': 5,
    'max_retries': 3,
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(levelname)s - %(message)s',
    'file': 'province_workflow.log',
}

# File Configuration
FILE_CONFIG = {
    'captcha_prefix': 'captcha_',
    'result_prefix': 'province_workflow_result_',
    'summary_prefix': 'province_workflow_summary_',
    'keep_captcha_files': 5,
}

def get_database_config() -> Dict[str, Any]:
    """
    Lấy cấu hình database
    
    Returns:
        Dictionary chứa cấu hình database
    """
    return DATABASE_CONFIG.copy()

def get_api_config() -> Dict[str, Any]:
    """
    Lấy cấu hình API
    
    Returns:
        Dictionary chứa cấu hình API
    """
    return API_CONFIG.copy()

def get_workflow_config() -> Dict[str, Any]:
    """
    Lấy cấu hình workflow
    
    Returns:
        Dictionary chứa cấu hình workflow
    """
    return WORKFLOW_CONFIG.copy()

def get_logging_config() -> Dict[str, Any]:
    """
    Lấy cấu hình logging
    
    Returns:
        Dictionary chứa cấu hình logging
    """
    return LOGGING_CONFIG.copy()

def get_file_config() -> Dict[str, Any]:
    """
    Lấy cấu hình file
    
    Returns:
        Dictionary chứa cấu hình file
    """
    return FILE_CONFIG.copy()

def print_config():
    """
    In tất cả cấu hình
    """
    print("⚙️ CONFIGURATION")
    print("="*60)
    
    print("🗄️ Database Config:")
    for key, value in DATABASE_CONFIG.items():
        if key == 'password':
            value = '*' * len(str(value)) if value else 'None'
        print(f"  {key}: {value}")
    
    print("\n🌐 API Config:")
    for key, value in API_CONFIG.items():
        print(f"  {key}: {value}")
    
    print("\n🔄 Workflow Config:")
    for key, value in WORKFLOW_CONFIG.items():
        print(f"  {key}: {value}")
    
    print("\n📝 Logging Config:")
    for key, value in LOGGING_CONFIG.items():
        print(f"  {key}: {value}")
    
    print("\n📁 File Config:")
    for key, value in FILE_CONFIG.items():
        print(f"  {key}: {value}")
    
    print("="*60)

def update_database_password(password: str):
    """
    Cập nhật password database
    
    Args:
        password: Password mới
    """
    DATABASE_CONFIG['password'] = password
    print(f"✅ Đã cập nhật database password")

def validate_config() -> bool:
    """
    Validate cấu hình
    
    Returns:
        True nếu cấu hình hợp lệ
    """
    errors = []
    
    # Kiểm tra database config
    if not DATABASE_CONFIG['host']:
        errors.append("Database host không được để trống")
    
    if not DATABASE_CONFIG['database']:
        errors.append("Database name không được để trống")
    
    if not DATABASE_CONFIG['user']:
        errors.append("Database user không được để trống")
    
    # Kiểm tra API config
    if not API_CONFIG['captcha_url']:
        errors.append("Captcha URL không được để trống")
    
    if not API_CONFIG['query_url']:
        errors.append("Query URL không được để trống")
    
    # Kiểm tra workflow config
    if WORKFLOW_CONFIG['batch_size'] <= 0:
        errors.append("Batch size phải lớn hơn 0")
    
    if WORKFLOW_CONFIG['max_no_new_batches'] <= 0:
        errors.append("Max no new batches phải lớn hơn 0")
    
    if errors:
        print("❌ Cấu hình không hợp lệ:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    print("✅ Cấu hình hợp lệ")
    return True

def main():
    """
    Hàm main
    """
    print("⚙️ CONFIGURATION MANAGER")
    print("="*60)
    
    # In cấu hình hiện tại
    print_config()
    
    # Validate cấu hình
    print("\n🔍 Validating configuration...")
    is_valid = validate_config()
    
    if not is_valid:
        print("\n💡 Hướng dẫn sửa lỗi:")
        print("1. Sửa trực tiếp trong file config.py")
        print("2. Hoặc sử dụng environment variables")
        print("3. Hoặc gọi update_database_password()")
    
    return is_valid

if __name__ == "__main__":
    main()
