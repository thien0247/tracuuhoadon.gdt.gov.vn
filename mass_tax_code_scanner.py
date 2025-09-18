#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mass Tax Code Scanner - Scan hàng loạt mã số thuế
Tối ưu hóa cho việc scan từ 4401120823 xuống 4400000000
"""

import requests
import time
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue
import os
from typing import Dict, Any, Optional, List, Tuple
from tax_code_validator import validate_10_digit_tin

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MassTaxCodeScanner:
    """
    Scanner hàng loạt mã số thuế với tối ưu hóa
    """
    
    def __init__(self, max_workers: int = 10, delay_between_requests: float = 0.1):
        """
        Khởi tạo scanner
        
        Args:
            max_workers: Số thread tối đa
            delay_between_requests: Delay giữa các request (giây)
        """
        self.max_workers = max_workers
        self.delay_between_requests = delay_between_requests
        
        # URLs
        self.captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
        self.query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
        
        # Kết quả
        self.results = []
        self.successful_codes = []
        self.failed_codes = []
        self.session_cookies = {}
        
        # Thống kê
        self.total_scanned = 0
        self.total_success = 0
        self.total_failed = 0
        self.start_time = None
        
        # Lock cho thread safety
        self.lock = threading.Lock()
        
        logger.info(f"🚀 Khởi tạo Mass Tax Code Scanner")
        logger.info(f"👥 Max workers: {max_workers}")
        logger.info(f"⏱️ Delay: {delay_between_requests}s")
    
    def generate_tax_codes(self, start_code: str, end_code: str) -> List[str]:
        """
        Tạo danh sách mã số thuế từ start_code xuống end_code
        
        Args:
            start_code: Mã số thuế bắt đầu
            end_code: Mã số thuế kết thúc
            
        Returns:
            Danh sách mã số thuế
        """
        start_num = int(start_code)
        end_num = int(end_code)
        
        tax_codes = []
        
        logger.info(f"🔄 Tạo danh sách mã số thuế từ {start_code} xuống {end_code}")
        logger.info(f"📊 Tổng số mã: {start_num - end_num + 1:,}")
        
        for num in range(start_num, end_num - 1, -1):
            tax_code = str(num).zfill(10)
            
            # Chỉ thêm mã hợp lệ về mặt format
            if validate_10_digit_tin(tax_code):
                tax_codes.append(tax_code)
        
        logger.info(f"✅ Đã tạo {len(tax_codes):,} mã số thuế hợp lệ")
        return tax_codes
    
    def get_captcha_and_session(self) -> Tuple[Optional[str], Optional[requests.Session]]:
        """
        Lấy captcha và session mới
        
        Returns:
            Tuple (captcha_code, session) hoặc (None, None) nếu thất bại
        """
        try:
            # Tạo session mới
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Tải captcha
            response = session.get(self.captcha_url, timeout=10)
            response.raise_for_status()
            
            # Lưu ảnh captcha
            timestamp = int(time.time())
            filename = f"captcha_{timestamp}.jpg"
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✅ Đã tải captcha: {filename}")
            
            # Hiển thị ảnh captcha
            try:
                from PIL import Image
                img = Image.open(filename)
                img.show()
                logger.info(f"🖼️ Đã mở ảnh captcha")
            except Exception as e:
                logger.warning(f"⚠️ Không thể mở ảnh: {e}")
            
            # Nhập captcha
            captcha = input(f"🔤 Nhập mã captcha cho {filename}: ").strip()
            
            if not captcha or len(captcha) < 4:
                logger.error("❌ Captcha không hợp lệ")
                return None, None
            
            logger.info(f"✅ Captcha: {captcha}")
            return captcha, session
            
        except Exception as e:
            logger.error(f"❌ Lỗi lấy captcha: {e}")
            return None, None
    
    def scan_single_tax_code(self, tax_code: str, captcha_code: str, session: requests.Session) -> Dict[str, Any]:
        """
        Scan một mã số thuế
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            session: Session HTTP
            
        Returns:
            Kết quả scan
        """
        try:
            # Tạo URL
            url = f"{self.query_url}?tin={tax_code}&captchaCode={captcha_code}"
            
            # Thêm delay
            time.sleep(self.delay_between_requests)
            
            # Gửi request
            response = session.get(url, timeout=30)
            
            result = {
                'tax_code': tax_code,
                'captcha_code': captcha_code,
                'status_code': response.status_code,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'url': url
            }
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    tin_model = data.get('tinModel')
                    
                    if tin_model is not None and tin_model != {}:
                        result['status'] = 'success'
                        result['data'] = data
                        logger.info(f"✅ {tax_code}: Thành công")
                    else:
                        result['status'] = 'failed'
                        result['data'] = data
                        logger.debug(f"❌ {tax_code}: tinModel null")
                        
                except json.JSONDecodeError:
                    result['status'] = 'error'
                    result['error'] = 'JSON decode error'
                    logger.warning(f"⚠️ {tax_code}: JSON decode error")
            else:
                result['status'] = 'error'
                result['error'] = f'HTTP {response.status_code}'
                logger.warning(f"⚠️ {tax_code}: HTTP {response.status_code}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ {tax_code}: Lỗi {e}")
            return {
                'tax_code': tax_code,
                'captcha_code': captcha_code,
                'status': 'error',
                'error': str(e),
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
            }
    
    def scan_batch(self, tax_codes: List[str], captcha_code: str, session: requests.Session) -> List[Dict[str, Any]]:
        """
        Scan một batch mã số thuế
        
        Args:
            tax_codes: Danh sách mã số thuế
            captcha_code: Mã captcha
            session: Session HTTP
            
        Returns:
            Danh sách kết quả
        """
        results = []
        
        for tax_code in tax_codes:
            result = self.scan_single_tax_code(tax_code, captcha_code, session)
            results.append(result)
            
            # Cập nhật thống kê
            with self.lock:
                self.total_scanned += 1
                if result['status'] == 'success':
                    self.total_success += 1
                    self.successful_codes.append(tax_code)
                else:
                    self.total_failed += 1
                    self.failed_codes.append(tax_code)
                
                # In progress
                if self.total_scanned % 100 == 0:
                    elapsed = time.time() - self.start_time
                    rate = self.total_scanned / elapsed if elapsed > 0 else 0
                    logger.info(f"📊 Progress: {self.total_scanned:,}/{len(tax_codes):,} "
                              f"({self.total_scanned/len(tax_codes)*100:.1f}%) "
                              f"Rate: {rate:.1f} codes/sec")
        
        return results
    
    def scan_mass_tax_codes(self, start_code: str, end_code: str, batch_size: int = 1000):
        """
        Scan hàng loạt mã số thuế
        
        Args:
            start_code: Mã số thuế bắt đầu
            end_code: Mã số thuế kết thúc
            batch_size: Kích thước batch
        """
        print("🚀 MASS TAX CODE SCANNER")
        print("="*60)
        print(f"🔢 Từ: {start_code}")
        print(f"🔢 Đến: {end_code}")
        print(f"📦 Batch size: {batch_size}")
        print(f"👥 Max workers: {self.max_workers}")
        print("="*60)
        
        # Tạo danh sách mã số thuế
        tax_codes = self.generate_tax_codes(start_code, end_code)
        
        if not tax_codes:
            logger.error("❌ Không có mã số thuế nào để scan")
            return
        
        # Chia thành batches
        batches = [tax_codes[i:i + batch_size] for i in range(0, len(tax_codes), batch_size)]
        
        logger.info(f"📦 Đã chia thành {len(batches)} batches")
        
        self.start_time = time.time()
        
        # Scan từng batch
        for batch_idx, batch in enumerate(batches, 1):
            logger.info(f"🔄 Batch {batch_idx}/{len(batches)}: {len(batch)} mã số thuế")
            
            # Lấy captcha mới cho mỗi batch
            captcha_code, session = self.get_captcha_and_session()
            
            if not captcha_code or not session:
                logger.error(f"❌ Không thể lấy captcha cho batch {batch_idx}")
                continue
            
            # Scan batch
            batch_results = self.scan_batch(batch, captcha_code, session)
            self.results.extend(batch_results)
            
            # Lưu kết quả batch
            self.save_batch_results(batch_idx, batch_results)
            
            # In thống kê
            self.print_progress()
            
            # Nghỉ giữa các batch
            if batch_idx < len(batches):
                logger.info("⏳ Nghỉ 5 giây trước batch tiếp theo...")
                time.sleep(5)
        
        # Lưu tổng kết
        self.save_final_summary()
        self.print_final_summary()
    
    def save_batch_results(self, batch_idx: int, results: List[Dict[str, Any]]):
        """
        Lưu kết quả batch
        
        Args:
            batch_idx: Số thứ tự batch
            results: Kết quả batch
        """
        timestamp = int(time.time())
        filename = f"batch_{batch_idx}_results_{timestamp}.json"
        
        batch_summary = {
            'batch_idx': batch_idx,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'total_codes': len(results),
            'success_count': len([r for r in results if r['status'] == 'success']),
            'failed_count': len([r for r in results if r['status'] == 'failed']),
            'error_count': len([r for r in results if r['status'] == 'error']),
            'results': results
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(batch_summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu batch {batch_idx}: {filename}")
    
    def save_final_summary(self):
        """
        Lưu tổng kết cuối cùng
        """
        timestamp = int(time.time())
        filename = f"mass_scan_summary_{timestamp}.json"
        
        summary = {
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'total_scanned': self.total_scanned,
            'total_success': self.total_success,
            'total_failed': self.total_failed,
            'success_rate': self.total_success / self.total_scanned * 100 if self.total_scanned > 0 else 0,
            'successful_codes': self.successful_codes,
            'failed_codes': self.failed_codes[:100],  # Chỉ lưu 100 mã đầu tiên
            'all_results': self.results
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu tổng kết: {filename}")
    
    def print_progress(self):
        """
        In tiến độ
        """
        elapsed = time.time() - self.start_time
        rate = self.total_scanned / elapsed if elapsed > 0 else 0
        
        print(f"\n📊 PROGRESS UPDATE:")
        print(f"✅ Thành công: {self.total_success:,}")
        print(f"❌ Thất bại: {self.total_failed:,}")
        print(f"📈 Tỷ lệ thành công: {self.total_success/self.total_scanned*100:.1f}%")
        print(f"⏱️ Tốc độ: {rate:.1f} codes/sec")
        print(f"🕐 Thời gian: {elapsed/60:.1f} phút")
    
    def print_final_summary(self):
        """
        In tổng kết cuối cùng
        """
        elapsed = time.time() - self.start_time
        
        print(f"\n🏁 TỔNG KẾT CUỐI CÙNG:")
        print("="*60)
        print(f"📊 Tổng số mã đã scan: {self.total_scanned:,}")
        print(f"✅ Thành công: {self.total_success:,}")
        print(f"❌ Thất bại: {self.total_failed:,}")
        print(f"📈 Tỷ lệ thành công: {self.total_success/self.total_scanned*100:.1f}%")
        print(f"⏱️ Tổng thời gian: {elapsed/60:.1f} phút")
        print(f"🚀 Tốc độ trung bình: {self.total_scanned/elapsed:.1f} codes/sec")
        
        if self.successful_codes:
            print(f"\n🎉 MÃ SỐ THUẾ THÀNH CÔNG:")
            for code in self.successful_codes[:10]:  # Hiển thị 10 mã đầu tiên
                print(f"  ✅ {code}")
            if len(self.successful_codes) > 10:
                print(f"  ... và {len(self.successful_codes) - 10} mã khác")
        
        print("="*60)


def main():
    """
    Hàm main
    """
    print("🚀 MASS TAX CODE SCANNER")
    print("="*60)
    print("📋 Mô tả:")
    print("- Scan hàng loạt mã số thuế")
    print("- Tối ưu hóa với batch processing")
    print("- Tự động lưu kết quả")
    print("="*60)
    
    # Cấu hình
    start_code = "4401120823"
    end_code = "4400000000"
    batch_size = 1000  # Mỗi batch 1000 mã
    max_workers = 5    # 5 thread
    delay = 0.1        # 0.1 giây delay
    
    print(f"🔢 Từ: {start_code}")
    print(f"🔢 Đến: {end_code}")
    print(f"📦 Batch size: {batch_size}")
    print(f"👥 Max workers: {max_workers}")
    print(f"⏱️ Delay: {delay}s")
    
    # Ước tính thời gian
    total_codes = int(start_code) - int(end_code) + 1
    estimated_time = total_codes * delay / 60  # phút
    
    print(f"📊 Ước tính:")
    print(f"  - Tổng số mã: {total_codes:,}")
    print(f"  - Thời gian ước tính: {estimated_time:.1f} phút")
    print(f"  - Số batch: {total_codes // batch_size + 1}")
    
    # Xác nhận
    try:
        confirm = input(f"\n✅ Bạn có muốn tiếp tục? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes', 'có']:
            print("⏹️ Đã hủy")
            return
    except KeyboardInterrupt:
        print("\n⏹️ Đã hủy bởi người dùng")
        return
    
    # Tạo scanner
    scanner = MassTaxCodeScanner(max_workers=max_workers, delay_between_requests=delay)
    
    # Bắt đầu scan
    try:
        scanner.scan_mass_tax_codes(start_code, end_code, batch_size)
    except KeyboardInterrupt:
        print("\n⏹️ Đã dừng bởi người dùng")
        scanner.save_final_summary()
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
