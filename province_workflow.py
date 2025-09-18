#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Province Workflow - Workflow chính theo yêu cầu
Quét và cập nhật mã số thuế từ tin_min của tỉnh
"""

import time
import logging
from typing import Dict, Any, Optional, List
from database_models import DatabaseConnection, ProvinceCodeModel, CompanyInfoModel
from captcha_manager import CaptchaManager
from batch_processor import BatchProcessor
from config import get_database_config, get_workflow_config
import json

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProvinceWorkflow:
    """
    Workflow chính để quét mã số thuế theo tỉnh
    """
    
    def __init__(self, db_host: str = None, db_port: int = None,
                 db_name: str = None, db_user: str = None, db_password: str = None):
        """
        Khởi tạo workflow
        
        Args:
            db_host: Host database (nếu None sẽ dùng config)
            db_port: Port database (nếu None sẽ dùng config)
            db_name: Tên database (nếu None sẽ dùng config)
            db_user: Username (nếu None sẽ dùng config)
            db_password: Password (nếu None sẽ dùng config)
        """
        # Kết nối database
        self.db = DatabaseConnection(db_host, db_port, db_name, db_user, db_password)
        
        # Models
        self.province_model = None
        self.company_model = None
        
        # Managers
        self.captcha_manager = CaptchaManager()
        self.batch_processor = None
        
        # Thông tin tỉnh
        self.province_info = None
        self.province_code = None
        
        # Biến điều khiển
        self.current_tin = None
        workflow_config = get_workflow_config()
        self.batch_size = workflow_config['batch_size']
        self.no_new_batch_count = 0
        self.max_no_new_batches = workflow_config['max_no_new_batches']
        
        # Session và captcha chung cho tất cả batch
        self.shared_session = None
        self.shared_captcha = None
        
        # Thống kê
        self.total_batches = 0
        self.total_companies_added = 0
        self.start_time = None
        
        logger.info("🚀 Khởi tạo ProvinceWorkflow")
    
    def initialize_database(self) -> bool:
        """
        Khởi tạo kết nối database và models
        
        Returns:
            True nếu thành công
        """
        try:
            if not self.db.connect():
                logger.error("❌ Không thể kết nối database")
                return False
            
            # Tạo models
            self.province_model = ProvinceCodeModel(self.db)
            self.company_model = CompanyInfoModel(self.db)
            
            # Tạo batch processor
            self.batch_processor = BatchProcessor(self.company_model, self.captcha_manager)
            
            logger.info("✅ Đã khởi tạo database và models")
            return True
            
        except Exception as e:
            logger.error(f"❌ Lỗi khởi tạo database: {e}")
            return False
    
    def get_province_code_from_user(self) -> Optional[str]:
        """
        Lấy mã tỉnh từ người dùng
        
        Returns:
            Mã tỉnh hoặc None nếu hủy
        """
        print("\n" + "="*60)
        print("🏛️ NHẬP MÃ TỈNH")
        print("="*60)
        
        # Lấy danh sách tỉnh
        provinces = self.province_model.get_all_provinces()
        
        if not provinces:
            print("❌ Không tìm thấy tỉnh nào trong database")
            return None
        
        print("📋 Danh sách tỉnh:")
        for i, province in enumerate(provinces[:20], 1):  # Hiển thị 20 tỉnh đầu
            print(f"  {i:2d}. {province['code']} - {province['name']}")
        
        if len(provinces) > 20:
            print(f"  ... và {len(provinces) - 20} tỉnh khác")
        
        print("-"*60)
        print("📋 Hướng dẫn:")
        print("1. Nhập mã tỉnh (2 chữ số)")
        print("2. Hoặc nhấn Enter để xem danh sách đầy đủ")
        print("3. Nhấn Ctrl+C để hủy")
        print("-"*60)
        
        try:
            user_input = input("🔢 Nhập mã tỉnh: ").strip()
            
            if not user_input:
                # Hiển thị danh sách đầy đủ
                print("\n📋 DANH SÁCH ĐẦY ĐỦ:")
                for province in provinces:
                    print(f"  {province['code']} - {province['name']}")
                return self.get_province_code_from_user()
            
            if len(user_input) != 2 or not user_input.isdigit():
                print("❌ Mã tỉnh phải có 2 chữ số!")
                return self.get_province_code_from_user()
            
            # Kiểm tra tỉnh có tồn tại không
            province = self.province_model.get_province_by_code(user_input)
            if not province:
                print(f"❌ Không tìm thấy tỉnh với mã: {user_input}")
                return self.get_province_code_from_user()
            
            print(f"✅ Đã chọn tỉnh: {province['name']} ({user_input})")
            return user_input
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã hủy bởi người dùng")
            return None
        except Exception as e:
            print(f"❌ Lỗi nhập mã tỉnh: {e}")
            return None
    
    def get_starting_tin_from_user(self) -> Optional[str]:
        """
        Lấy TIN bắt đầu từ người dùng (tin_min, tin_max, hoặc tùy chỉnh)
        Tất cả TIN đều sẽ giảm dần từ TIN bắt đầu xuống 0
        
        Returns:
            TIN bắt đầu hoặc None nếu hủy
        """
        print("\n" + "="*60)
        print("🔢 CHỌN TIN BẮT ĐẦU")
        print("="*60)
        
        tin_min = self.province_info.get('tin_min')
        tin_max = self.province_info.get('tin_max')
        
        print(f"📋 Thông tin tỉnh {self.province_info['name']}:")
        print(f"   tin_min: {tin_min}")
        print(f"   tin_max: {tin_max if tin_max else 'N/A'}")
        
        print("-"*60)
        print("📋 Ví dụ logic giảm dần:")
        if tin_min:
            print(f"   tin_min: {tin_min} → {tin_min} → {int(tin_min)-1000} → ... → 0")
        if tin_max:
            print(f"   tin_max: {tin_max} → {tin_max} → {int(tin_max)-1000} → ... → 0")
        print("   custom: TIN_nhập → TIN_nhập → TIN_nhập-1000 → ... → 0")
        print("-"*60)
        print("📋 Tùy chọn:")
        print("1. Bắt đầu từ tin_min (quét từ tin_min giảm xuống)")
        print("2. Bắt đầu từ tin_max (quét từ tin_max giảm xuống)")
        print("3. Nhập TIN tùy chỉnh (quét từ TIN này giảm xuống)")
        print("4. Nhấn Ctrl+C để hủy")
        print("-"*60)
        
        try:
            while True:
                choice = input("🔢 Chọn tùy chọn (1-3): ").strip()
                
                if choice == '1':
                    if tin_min:
                        print(f"✅ Chọn tin_min: {tin_min}")
                        return tin_min
                    else:
                        print("❌ Không có tin_min")
                        continue
                
                elif choice == '2':
                    if tin_max:
                        print(f"✅ Chọn tin_max: {tin_max}")
                        return tin_max
                    else:
                        print("❌ Không có tin_max")
                        continue
                
                elif choice == '3':
                    custom_tin = input("🔢 Nhập TIN tùy chỉnh (10 chữ số): ").strip()
                    
                    if len(custom_tin) != 10 or not custom_tin.isdigit():
                        print("❌ TIN phải có 10 chữ số!")
                        continue
                    
                    # Validate TIN
                    from tax_code_validator import validate_10_digit_tin
                    if not validate_10_digit_tin(custom_tin):
                        print("❌ TIN không hợp lệ!")
                        continue
                    
                    print(f"✅ Chọn TIN tùy chỉnh: {custom_tin}")
                    return custom_tin
                
                else:
                    print("❌ Vui lòng chọn 1, 2, hoặc 3")
                    continue
                    
        except KeyboardInterrupt:
            print("\n⏹️ Đã hủy bởi người dùng")
            return None
        except Exception as e:
            print(f"❌ Lỗi nhập TIN: {e}")
            return None
    
    def load_province_info(self, province_code: str) -> bool:
        """
        Tải thông tin tỉnh
        
        Args:
            province_code: Mã tỉnh
            
        Returns:
            True nếu thành công
        """
        try:
            self.province_info = self.province_model.get_province_by_code(province_code)
            
            if not self.province_info:
                logger.error(f"❌ Không tìm thấy tỉnh với mã: {province_code}")
                return False
            
            if not self.province_info.get('tin_min'):
                logger.error(f"❌ Tỉnh {province_code} không có tin_min")
                return False
            
            self.province_code = province_code
            
            # Hỏi người dùng muốn bắt đầu từ tin_min hay tin_max
            self.current_tin = self.get_starting_tin_from_user()
            if not self.current_tin:
                return False
            
            logger.info(f"✅ Đã tải thông tin tỉnh: {self.province_info['name']}")
            logger.info(f"   tin_min: {self.province_info['tin_min']}")
            logger.info(f"   tin_max: {self.province_info.get('tin_max', 'N/A')}")
            logger.info(f"   Starting TIN: {self.current_tin}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Lỗi tải thông tin tỉnh: {e}")
            return False
    
    def print_workflow_summary(self):
        """
        In tóm tắt workflow
        """
        print("\n" + "="*60)
        print("📋 TÓM TẮT WORKFLOW")
        print("="*60)
        print(f"🏛️ Tỉnh: {self.province_info['name']} ({self.province_code})")
        print(f"🔢 tin_min: {self.province_info['tin_min']}")
        print(f"🔢 tin_max: {self.province_info.get('tin_max', 'N/A')}")
        print(f"📦 Batch size: {self.batch_size}")
        print(f"🛑 Max no-new batches: {self.max_no_new_batches}")
        print("-"*60)
        print("📋 Quy trình:")
        print("1. Chọn TIN bắt đầu (tin_min, tin_max, hoặc tùy chỉnh)")
        print("2. Tạo batch 1000 TIN giảm dần từ TIN bắt đầu")
        print("3. Loại bỏ TIN đã tồn tại trong DB")
        print("4. Validate TIN hợp lệ")
        print("5. Lấy captcha mới (chỉ batch đầu tiên)")
        print("6. Crawl dữ liệu từ API (sử dụng chung session/captcha)")
        print("7. Lưu vào database")
        print("8. Lặp lại cho đến khi đủ 10 batch rỗng (không có TIN mới và không có TIN tồn tại)")
        print("   (Tất cả TIN đều giảm xuống: tin_min→0, tin_max→0, custom→0)")
        print("   (Chỉ tính 'No-new batches' khi batch rỗng: new_codes=0 VÀ existing_codes=0)")
        print("="*60)
    
    def run_workflow(self) -> bool:
        """
        Chạy workflow chính
        
        Returns:
            True nếu thành công
        """
        try:
            self.start_time = time.time()
            
            print("\n🚀 BẮT ĐẦU WORKFLOW")
            print("="*60)
            
            while True:
                self.total_batches += 1
                
                logger.info(f"🔄 Batch {self.total_batches}: Từ {self.current_tin}")
                
                # Log captcha status
                if self.shared_captcha and self.shared_session:
                    logger.info(f"🔄 Sử dụng lại captcha: {self.shared_captcha}")
                else:
                    logger.info("🔄 Lấy captcha mới cho batch đầu tiên")
                
                # Xử lý batch với session và captcha chung
                result = self.batch_processor.process_batch(
                    start_tin=self.current_tin,
                    batch_size=self.batch_size,
                    end_tin=None,  # Không giới hạn, để batch processor tự tính
                    captcha_code=self.shared_captcha,
                    session=self.shared_session
                )
                
                # Cập nhật session và captcha chung từ kết quả batch
                if result.get('session'):
                    self.shared_session = result['session']
                if result.get('captcha_code'):
                    self.shared_captcha = result['captcha_code']
                
                # Cập nhật thống kê
                self.total_companies_added += result.get('companies_added', 0)
                
                # Kiểm tra logic No-new batches
                companies_added = result.get('companies_added', 0)
                total_codes = result.get('total_codes', 0)
                new_codes = result.get('new_codes', 0)
                existing_codes = total_codes - new_codes
                
                if new_codes > 0:
                    # Có TIN mới → Reset counter
                    self.no_new_batch_count = 0
                    logger.info(f"✅ Batch {self.total_batches}: Có {new_codes} TIN mới → Reset counter")
                    logger.info(f"   📊 Chi tiết: {total_codes} TIN tổng, {new_codes} TIN mới, {existing_codes} TIN đã tồn tại, {companies_added} TIN được lưu")
                elif existing_codes > 0:
                    # Không có TIN mới nhưng có TIN đã tồn tại → KHÔNG tính vào No-new batches
                    logger.info(f"ℹ️ Batch {self.total_batches}: Không có TIN mới, có {existing_codes} TIN tồn tại")
                    logger.info(f"   📊 Chi tiết: {total_codes} TIN tổng, {new_codes} TIN mới, {existing_codes} TIN đã tồn tại, {companies_added} TIN được lưu")
                else:
                    # Không có TIN mới VÀ không có TIN đã tồn tại (batch rỗng) → Tăng counter
                    self.no_new_batch_count += 1
                    logger.info(f"⚠️ Batch {self.total_batches}: Không có TIN mới, không có TIN tồn tại (batch rỗng) → Tăng counter ({self.no_new_batch_count}/{self.max_no_new_batches})")
                    logger.info(f"   📊 Chi tiết: {total_codes} TIN tổng, {new_codes} TIN mới, {existing_codes} TIN đã tồn tại, {companies_added} TIN được lưu")
                
                # In progress
                self.print_progress()
                
                # Kiểm tra điều kiện dừng
                if self.no_new_batch_count >= self.max_no_new_batches:
                    logger.info(f"🛑 Đã đủ {self.max_no_new_batches} batch rỗng (không có TIN mới và không có TIN tồn tại), dừng workflow")
                    break
                
                # Cập nhật current_tin cho batch tiếp theo
                current_num = int(self.current_tin)
                next_num = current_num - self.batch_size
                
                if next_num < 0:
                    logger.info("🛑 Đã quét hết dải TIN, dừng workflow")
                    break
                
                self.current_tin = str(next_num).zfill(10)
                
                # Nghỉ giữa các batch
                logger.info("⏳ Nghỉ 5 giây trước batch tiếp theo...")
                time.sleep(5)
            
            # Lưu tổng kết
            self.save_final_summary()
            self.print_final_summary()
            
            return True
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã dừng bởi người dùng")
            self.save_final_summary()
            return False
        except Exception as e:
            logger.error(f"❌ Lỗi workflow: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def print_progress(self):
        """
        In tiến độ
        """
        elapsed = time.time() - self.start_time
        
        print(f"\n📊 PROGRESS UPDATE:")
        print(f"🔄 Batch: {self.total_batches}")
        print(f"✅ Tổng công ty đã thêm: {self.total_companies_added}")
        print(f"🔢 Current TIN: {self.current_tin}")
        print(f"📈 No-new batches: {self.no_new_batch_count}/{self.max_no_new_batches}")
        print(f"⏱️ Thời gian: {elapsed/60:.1f} phút")
    
    def save_final_summary(self):
        """
        Lưu tổng kết cuối cùng
        """
        timestamp = int(time.time())
        filename = f"province_workflow_summary_{self.province_code}_{timestamp}.json"
        
        summary = {
            'province_code': self.province_code,
            'province_name': self.province_info['name'],
            'tin_min': self.province_info['tin_min'],
            'tin_max': self.province_info.get('tin_max'),
            'total_batches': self.total_batches,
            'total_companies_added': self.total_companies_added,
            'no_new_batch_count': self.no_new_batch_count,
            'final_tin': self.current_tin,
            'start_time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(self.start_time)),
            'end_time': time.strftime("%Y-%m-%d %H:%M:%S"),
            'duration_minutes': (time.time() - self.start_time) / 60 if self.start_time else 0,
            'batch_processor_stats': self.batch_processor.get_statistics()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu tổng kết: {filename}")
    
    def print_final_summary(self):
        """
        In tổng kết cuối cùng
        """
        elapsed = time.time() - self.start_time
        
        print(f"\n🏁 TỔNG KẾT CUỐI CÙNG:")
        print("="*60)
        print(f"🏛️ Tỉnh: {self.province_info['name']} ({self.province_code})")
        print(f"📊 Tổng số batch: {self.total_batches}")
        print(f"✅ Tổng công ty đã thêm: {self.total_companies_added}")
        print(f"🔢 TIN cuối cùng: {self.current_tin}")
        print(f"⏱️ Tổng thời gian: {elapsed/60:.1f} phút")
        
        # Thống kê batch processor
        stats = self.batch_processor.get_statistics()
        print(f"\n📈 THỐNG KÊ CHI TIẾT:")
        print(f"📊 Tổng TIN đã xử lý: {stats['total_processed']:,}")
        print(f"✅ Thành công: {stats['total_success']:,}")
        print(f"❌ Thất bại: {stats['total_failed']:,}")
        print(f"⏭️ Đã tồn tại: {stats['total_skipped']:,}")
        print(f"🎯 Tỷ lệ thành công: {stats['success_rate']:.1f}%")
        
        print("="*60)
    
    def run(self) -> bool:
        """
        Chạy toàn bộ workflow
        
        Returns:
            True nếu thành công
        """
        try:
            print("🚀 PROVINCE WORKFLOW")
            print("="*60)
            print("📋 Mô tả:")
            print("- Quét mã số thuế từ TIN bắt đầu (tin_min, tin_max, hoặc tùy chỉnh)")
            print("- Tất cả TIN đều giảm dần theo batch (tin_min→0, tin_max→0, custom→0)")
            print("- Tự động dừng khi đủ 10 batch rỗng (không có TIN mới và không có TIN tồn tại)")
            print("="*60)
            
            # Bước 1: Khởi tạo database
            if not self.initialize_database():
                return False
            
            # Bước 2: Lấy mã tỉnh
            province_code = self.get_province_code_from_user()
            if not province_code:
                return False
            
            # Bước 3: Tải thông tin tỉnh
            if not self.load_province_info(province_code):
                return False
            
            # Bước 4: In tóm tắt
            self.print_workflow_summary()
            
            # Bước 5: Xác nhận
            try:
                confirm = input("\n✅ Bạn có muốn tiếp tục? (y/N): ").strip().lower()
                if confirm not in ['y', 'yes', 'có']:
                    print("⏹️ Đã hủy")
                    return False
            except KeyboardInterrupt:
                print("\n⏹️ Đã hủy bởi người dùng")
                return False
            
            # Bước 6: Chạy workflow
            return self.run_workflow()
            
        except Exception as e:
            logger.error(f"❌ Lỗi chạy workflow: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if self.db:
                self.db.disconnect()


def main():
    """
    Hàm main
    """
    workflow = ProvinceWorkflow()
    success = workflow.run()
    
    if success:
        print("\n🎉 WORKFLOW HOÀN THÀNH THÀNH CÔNG!")
    else:
        print("\n❌ WORKFLOW THẤT BẠI!")


if __name__ == "__main__":
    main()
