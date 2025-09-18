#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch Processor - Xử lý batch mã số thuế với logic giảm dần
Tạo batch, validate, loại bỏ tin đã tồn tại, crawl dữ liệu
"""

import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from tax_code_validator import validate_10_digit_tin
from database_models import CompanyInfoModel
from captcha_manager import CaptchaManager
from config import get_api_config
import requests
import json

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BatchProcessor:
    """
    Xử lý batch mã số thuế với logic giảm dần
    """
    
    def __init__(self, company_model: CompanyInfoModel, captcha_manager: CaptchaManager,
                 query_url: str = None):
        """
        Khởi tạo batch processor
        
        Args:
            company_model: Model để thao tác với bảng company_info
            captcha_manager: Manager để quản lý captcha
            query_url: URL để truy vấn thông tin mã số thuế (nếu None sẽ dùng config)
        """
        self.company_model = company_model
        self.captcha_manager = captcha_manager
        
        # Sử dụng config nếu không cung cấp query_url
        api_config = get_api_config()
        self.query_url = query_url or api_config['query_url']
        self.max_retries = api_config['max_retries']
        self.retry_delay = api_config['retry_delay']
        
        # Thống kê
        self.total_processed = 0
        self.total_success = 0
        self.total_failed = 0
        self.total_skipped = 0
        
        logger.info("🔄 Khởi tạo BatchProcessor")
    
    def generate_tax_codes_batch(self, start_tin: str, batch_size: int, end_tin: str = None) -> List[str]:
        """
        Tạo danh sách mã số thuế cho batch (giảm dần)
        
        Args:
            start_tin: Mã số thuế bắt đầu
            batch_size: Kích thước batch
            end_tin: Mã số thuế kết thúc (tùy chọn)
            
        Returns:
            Danh sách mã số thuế
        """
        start_num = int(start_tin)
        
        # Nếu có end_tin, sử dụng nó làm giới hạn dưới
        if end_tin:
            end_num = int(end_tin)
        else:
            # Nếu không có end_tin, tính từ start_num - batch_size
            end_num = start_num - batch_size + 1
        
        # Đảm bảo end_num không nhỏ hơn 0
        end_num = max(end_num, 0)
        
        # Đảm bảo start_num > end_num để có range giảm dần
        if start_num <= end_num:
            logger.warning(f"⚠️ Không thể tạo range giảm dần: start={start_num} <= end={end_num}")
            return []
        
        tax_codes = []
        
        logger.info(f"🔄 Tạo batch từ {start_tin} xuống {end_num}")
        
        for num in range(start_num, end_num - 1, -1):
            tax_code = str(num).zfill(10)
            
            # Chỉ thêm mã hợp lệ về mặt format
            if validate_10_digit_tin(tax_code):
                tax_codes.append(tax_code)
        
        logger.info(f"✅ Đã tạo {len(tax_codes)} mã số thuế hợp lệ")
        return tax_codes
    
    def filter_existing_tins(self, tax_codes: List[str]) -> List[str]:
        """
        Loại bỏ các TIN đã tồn tại trong database
        
        Args:
            tax_codes: Danh sách mã số thuế
            
        Returns:
            Danh sách mã số thuế chưa tồn tại
        """
        if not tax_codes:
            return []
        
        logger.info(f"🔍 Kiểm tra {len(tax_codes)} TIN đã tồn tại...")
        
        # Kiểm tra TIN đã tồn tại và lấy thông tin norm_name
        existing_tins_info = self.company_model.get_existing_tins_info(tax_codes)
        existing_tins = list(existing_tins_info.keys())
        
        # Loại bỏ TIN đã tồn tại
        new_tins = [tin for tin in tax_codes if tin not in existing_tins]
        
        # Hiển thị thông tin TIN đã tồn tại
        if existing_tins:
            logger.info(f"📊 Kết quả: {len(new_tins)} TIN mới, {len(existing_tins)} TIN đã tồn tại")
            for tin in existing_tins:  # Hiển thị tất cả TIN đã tồn tại
                norm_name = existing_tins_info.get(tin, 'N/A')
                logger.info(f"   📋 {tin}: {norm_name}")
        else:
            logger.info(f"📊 Kết quả: {len(new_tins)} TIN mới, {len(existing_tins)} TIN đã tồn tại")
        
        self.total_skipped += len(existing_tins)
        
        return new_tins
    
    def crawl_company_info(self, tin: str, captcha_code: str, session: requests.Session, max_retries: int = None) -> Optional[Dict[str, Any]]:
        """
        Crawl thông tin công ty từ API
        
        Args:
            tin: Mã số thuế
            captcha_code: Mã captcha
            session: Session HTTP
            max_retries: Số lần retry tối đa (nếu None sẽ dùng config)
            
        Returns:
            Thông tin công ty hoặc None nếu thất bại
        """
        if max_retries is None:
            max_retries = self.max_retries
            
        for attempt in range(max_retries + 1):
            try:
                # Tạo URL
                url = f"{self.query_url}?tin={tin}&captchaCode={captcha_code}"
                
                # Thêm delay nhỏ
                time.sleep(0.1)
                
                # Gửi request
                response = session.get(url, timeout=30)
                
                if response.status_code != 200:
                    logger.warning(f"⚠️ {tin}: HTTP {response.status_code}")
                    if attempt < max_retries:
                        logger.info(f"🔄 {tin}: Retry {attempt + 1}/{max_retries}")
                        time.sleep(self.retry_delay)  # Nghỉ theo config
                        continue
                    return None
                
                # Parse JSON
                try:
                    data = response.json()
                    tin_model = data.get('tinModel')
                    
                    if tin_model is not None and tin_model != {}:
                        # Kiểm tra thêm norm_name có giá trị
                        norm_name = tin_model.get('norm_name')
                        if norm_name and norm_name.strip():
                            logger.info(f"✅ {tin}: Tìm thấy dữ liệu - {norm_name}")
                            return tin_model
                        else:
                            logger.debug(f"❌ {tin}: tinModel có nhưng norm_name rỗng")
                            return None
                    else:
                        logger.debug(f"❌ {tin}: tinModel null")
                        return None
                        
                except json.JSONDecodeError as e:
                    # Log thêm thông tin về response
                    response_text = response.text[:200] if response.text else "Empty response"
                    logger.warning(f"⚠️ {tin}: JSON decode error - {e}")
                    logger.debug(f"   Response content: {response_text}")
                    logger.debug(f"   Response status: {response.status_code}")
                    logger.debug(f"   Response headers: {dict(response.headers)}")
                    
                    if attempt < max_retries:
                        logger.info(f"🔄 {tin}: Retry {attempt + 1}/{max_retries} (JSON decode error)")
                        time.sleep(self.retry_delay * 2)  # Nghỉ lâu hơn cho JSON error
                        continue
                    return None
                    
            except Exception as e:
                logger.error(f"❌ {tin}: Lỗi crawl - {e}")
                if attempt < max_retries:
                    logger.info(f"🔄 {tin}: Retry {attempt + 1}/{max_retries} (Exception)")
                    time.sleep(self.retry_delay)
                    continue
                return None
        
        return None
    
    def validate_company_data(self, company_data: Dict[str, Any]) -> bool:
        """
        Validate dữ liệu công ty trước khi lưu
        
        Args:
            company_data: Dữ liệu công ty
            
        Returns:
            True nếu dữ liệu hợp lệ
        """
        if not company_data:
            return False
        
        # Kiểm tra các trường bắt buộc
        required_fields = ['tin', 'norm_name']
        
        for field in required_fields:
            value = company_data.get(field)
            if not value or (isinstance(value, str) and not value.strip()):
                logger.debug(f"❌ Thiếu trường bắt buộc: {field}")
                return False
        
        # Kiểm tra norm_name không được quá ngắn
        norm_name = company_data.get('norm_name', '').strip()
        if len(norm_name) < 3:
            logger.debug(f"❌ norm_name quá ngắn: {norm_name}")
            return False
        
        return True
    
    def process_batch(self, start_tin: str, batch_size: int, end_tin: str = None, 
                     captcha_code: str = None, session: requests.Session = None) -> Dict[str, Any]:
        """
        Xử lý một batch mã số thuế
        
        Args:
            start_tin: Mã số thuế bắt đầu
            batch_size: Kích thước batch
            end_tin: Mã số thuế kết thúc
            captcha_code: Mã captcha đã giải (tùy chọn)
            session: Session HTTP đã có (tùy chọn)
            
        Returns:
            Kết quả xử lý batch
        """
        logger.info(f"🔄 Bắt đầu xử lý batch từ {start_tin}")
        
        # Bước 1: Tạo danh sách mã số thuế
        tax_codes = self.generate_tax_codes_batch(start_tin, batch_size, end_tin)
        
        if not tax_codes:
            logger.warning("⚠️ Không có mã số thuế nào trong batch")
            return {
                'total_codes': 0,
                'new_codes': 0,
                'valid_codes': 0,
                'success_count': 0,
                'failed_count': 0,
                'companies_added': 0
            }
        
        # Bước 2: Loại bỏ TIN đã tồn tại
        new_tins = self.filter_existing_tins(tax_codes)
        
        if not new_tins:
            logger.info("ℹ️ Tất cả TIN trong batch đã tồn tại")
            return {
                'total_codes': len(tax_codes),
                'new_codes': 0,
                'valid_codes': 0,
                'success_count': 0,
                'failed_count': 0,
                'companies_added': 0
            }
        
        # Bước 3: Lấy captcha (mới hoặc sử dụng lại)
        if not captcha_code or not session:
            logger.info("🔄 Lấy captcha mới...")
            captcha_code, session = self.captcha_manager.get_new_captcha()
            
            if not captcha_code or not session:
                logger.error("❌ Không thể lấy captcha mới")
                return {
                    'total_codes': len(tax_codes),
                    'new_codes': len(new_tins),
                'valid_codes': len(new_tins),
                'success_count': 0,
                'failed_count': 0,
                'companies_added': 0,
                'error': 'Cannot get captcha'
            }
        
        # Bước 4: Crawl dữ liệu từng TIN
        companies_data = []
        success_count = 0
        failed_count = 0
        
        logger.info(f"🔄 Bắt đầu crawl {len(new_tins)} TIN mới...")
        
        for i, tin in enumerate(new_tins, 1):
            logger.info(f"📋 Crawl {i}/{len(new_tins)}: {tin}")
            
            # Crawl thông tin
            company_data = self.crawl_company_info(tin, captcha_code, session)
            
            if company_data:
                # Validate dữ liệu trước khi lưu
                if self.validate_company_data(company_data):
                    # Chuẩn bị dữ liệu để lưu
                    company_record = {
                        'tin': tin,
                        'norm_name': company_data.get('norm_name'),
                        'econ_name': company_data.get('econ_name'),
                        'economy': company_data.get('economy'),
                        'regi_date': company_data.get('regi_date'),
                        'chan_date': company_data.get('chan_date'),
                        'tu_ngay': company_data.get('tu_ngay'),
                        'den_ngay': company_data.get('den_ngay'),
                        'status': company_data.get('status'),
                        'statusname': company_data.get('statusName'),
                        'search': company_data.get('search', False),
                        'tran_addr': company_data.get('tran_addr'),
                        'tran_dist': company_data.get('tran_dist'),
                        'tran_tel': company_data.get('tran_tel'),
                        'tran_fax': company_data.get('tran_fax'),
                        'link': company_data.get('link'),
                        'pay_taxo_id': company_data.get('pay_taxo_id'),
                        'pay_taxo_name': company_data.get('pay_taxo_name'),
                        'pay_taxo_name_blhd': company_data.get('pay_taxo_name_blhd'),
                        'pare_tin': company_data.get('pare_tin'),
                        'dvsd': company_data.get('dvsd'),
                        'json_data': json.dumps(company_data, ensure_ascii=False)
                    }
                    
                    companies_data.append(company_record)
                    success_count += 1
                    logger.info(f"✅ {tin}: Dữ liệu hợp lệ - {company_data.get('norm_name')}")
                else:
                    failed_count += 1
                    logger.warning(f"⚠️ {tin}: Dữ liệu không hợp lệ")
            else:
                failed_count += 1
        
        # Bước 5: Lưu dữ liệu vào database
        companies_added = 0
        if companies_data:
            logger.info(f"💾 Lưu {len(companies_data)} công ty vào database...")
            companies_added = self.company_model.insert_companies_batch(companies_data)
        
        # Cập nhật thống kê
        self.total_processed += len(new_tins)
        self.total_success += success_count
        self.total_failed += failed_count
        
        # Kết quả
        result = {
            'total_codes': len(tax_codes),
            'new_codes': len(new_tins),
            'valid_codes': len(new_tins),
            'success_count': success_count,
            'failed_count': failed_count,
            'companies_added': companies_added,
            'captcha_used': captcha_code,
            'session': session,  # Trả về session để sử dụng cho batch tiếp theo
            'captcha_code': captcha_code  # Trả về captcha để sử dụng cho batch tiếp theo
        }
        
        logger.info(f"✅ Hoàn thành batch: {success_count} thành công, {failed_count} thất bại, {companies_added} đã lưu")
        
        return result
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Lấy thống kê tổng quan
        
        Returns:
            Thống kê
        """
        return {
            'total_processed': self.total_processed,
            'total_success': self.total_success,
            'total_failed': self.total_failed,
            'total_skipped': self.total_skipped,
            'success_rate': self.total_success / self.total_processed * 100 if self.total_processed > 0 else 0
        }
    
    def reset_statistics(self):
        """
        Reset thống kê
        """
        self.total_processed = 0
        self.total_success = 0
        self.total_failed = 0
        self.total_skipped = 0
        logger.info("🔄 Đã reset thống kê")


def test_batch_processor():
    """
    Test BatchProcessor
    """
    print("🧪 TEST BATCH PROCESSOR")
    print("="*60)
    
    try:
        # Tạo các dependencies
        from database_models import DatabaseConnection
        
        # Kết nối database
        db = DatabaseConnection()
        if not db.connect():
            print("❌ Không thể kết nối database")
            return False
        
        # Tạo models
        company_model = CompanyInfoModel(db)
        captcha_manager = CaptchaManager()
        
        # Tạo batch processor
        processor = BatchProcessor(company_model, captcha_manager)
        
        # Test tạo batch
        print("\n🔄 Test tạo batch:")
        test_tins = processor.generate_tax_codes_batch("4401120823", 10)
        print(f"✅ Tạo được {len(test_tins)} TIN: {test_tins[:5]}...")
        
        # Test filter existing
        print("\n🔍 Test filter existing:")
        new_tins = processor.filter_existing_tins(test_tins)
        print(f"✅ Còn lại {len(new_tins)} TIN mới: {new_tins[:5]}...")
        
        # Test thống kê
        print("\n📊 Test thống kê:")
        stats = processor.get_statistics()
        print(f"✅ Thống kê: {stats}")
        
        print("\n✅ Test thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'db' in locals():
            db.disconnect()


def main():
    """
    Hàm main
    """
    print("🔄 BATCH PROCESSOR")
    print("="*60)
    print("📋 Mô tả:")
    print("- Tạo batch mã số thuế giảm dần")
    print("- Loại bỏ TIN đã tồn tại")
    print("- Crawl dữ liệu từ API")
    print("- Lưu vào database")
    print("- Thống kê chi tiết")
    print("="*60)
    
    # Test batch processor
    test_batch_processor()


if __name__ == "__main__":
    main()
