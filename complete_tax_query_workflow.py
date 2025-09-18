#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Tax Query Workflow - Quy trình hoàn chỉnh truy vấn mã số thuế
1. Truy cập link captcha, tải ảnh, giải mã
2. Giữ session nếu đúng
3. Test với mã số thuế cho trước, kiểm tra dữ liệu trả về
4. Nếu đúng, thử với các mã số thuế còn lại
"""

import requests
import time
import json
import logging
from typing import Dict, Any, Optional, List
from PIL import Image
import webbrowser
import os

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CompleteTaxQueryWorkflow:
    """
    Quy trình hoàn chỉnh truy vấn mã số thuế
    """
    
    def __init__(self):
        """
        Khởi tạo workflow
        """
        # URLs
        self.captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
        self.query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
        
        # Session để duy trì cookies
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Kết quả
        self.results = []
        self.successful_captcha = None
        self.test_tax_code = '4401120823'  # Mã số thuế test
        self.other_tax_codes = ['0319151229', '0319153113', '2301359406']  # Các mã khác
        
        logger.info("🚀 Khởi tạo Complete Tax Query Workflow")
    
    def step1_download_captcha(self) -> Optional[str]:
        """
        Bước 1: Tải ảnh captcha
        
        Returns:
            Đường dẫn file ảnh captcha hoặc None nếu thất bại
        """
        print("\n" + "="*60)
        print("📋 BƯỚC 1: TẢI ẢNH CAPTCHA")
        print("="*60)
        
        try:
            logger.info("🔄 Đang tải ảnh captcha...")
            logger.info(f"🔗 URL: {self.captcha_url}")
            
            # Tải captcha
            response = self.session.get(self.captcha_url, timeout=10)
            response.raise_for_status()
            
            # Lưu ảnh
            timestamp = int(time.time())
            filename = f"captcha_{timestamp}.jpg"
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✅ Đã tải captcha: {filename}")
            logger.info(f"📊 Kích thước: {len(response.content)} bytes")
            logger.info(f"🍪 Session cookies: {dict(self.session.cookies)}")
            
            # Hiển thị ảnh
            self._display_captcha(filename)
            
            return filename
            
        except Exception as e:
            logger.error(f"❌ Lỗi tải captcha: {e}")
            return None
    
    def _display_captcha(self, filename: str):
        """
        Hiển thị ảnh captcha
        
        Args:
            filename: Đường dẫn file ảnh
        """
        try:
            # Mở ảnh bằng PIL
            img = Image.open(filename)
            img.show()
            
            logger.info(f"🖼️ Đã mở ảnh captcha: {filename}")
            
        except Exception as e:
            logger.error(f"❌ Lỗi hiển thị ảnh: {e}")
            
            # Fallback: mở trong trình duyệt
            try:
                webbrowser.open(self.captcha_url)
                logger.info("🌐 Đã mở captcha trong trình duyệt")
            except Exception as e2:
                logger.error(f"❌ Lỗi mở trình duyệt: {e2}")
    
    def step2_get_captcha_from_user(self) -> Optional[str]:
        """
        Bước 2: Lấy captcha từ người dùng
        
        Returns:
            Mã captcha hoặc None nếu hủy
        """
        print("\n" + "="*60)
        print("📋 BƯỚC 2: NHẬP MÃ CAPTCHA")
        print("="*60)
        print("📋 Hướng dẫn:")
        print("1. Nhìn vào ảnh captcha đã mở")
        print("2. Nhập mã captcha vào đây")
        print("3. Nhấn Enter để tiếp tục")
        print("4. Nhấn Ctrl+C để hủy")
        print("-"*60)
        
        try:
            captcha = input("🔤 Nhập mã captcha: ").strip()
            
            if not captcha:
                print("❌ Chưa nhập mã captcha!")
                return None
            
            if len(captcha) < 4:
                print("⚠️ Mã captcha quá ngắn! Thử lại.")
                return None
            
            print(f"✅ Đã nhận mã captcha: {captcha}")
            return captcha
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã hủy bởi người dùng")
            return None
        except Exception as e:
            print(f"❌ Lỗi nhập captcha: {e}")
            return None
    
    def step3_test_with_test_tax_code(self, captcha_code: str) -> bool:
        """
        Bước 3: Test với mã số thuế test
        
        Args:
            captcha_code: Mã captcha đã nhập
            
        Returns:
            True nếu test thành công
        """
        print("\n" + "="*60)
        print("📋 BƯỚC 3: TEST VỚI MÃ SỐ THUẾ TEST")
        print("="*60)
        print(f"🔢 Mã số thuế test: {self.test_tax_code}")
        print(f"🔐 Captcha: {captcha_code}")
        print("-"*60)
        
        try:
            # Tạo URL
            url = f"{self.query_url}?tin={self.test_tax_code}&captchaCode={captcha_code}"
            logger.info(f"🔗 URL: {url}")
            
            # Thêm delay
            logger.info("⏳ Đợi 3 giây để server xử lý...")
            time.sleep(3)
            
            # Gửi request
            response = self.session.get(url, timeout=30)
            logger.info(f"📊 Status: {response.status_code}")
            logger.info(f"🍪 Cookies: {dict(self.session.cookies)}")
            
            if response.status_code != 200:
                logger.error(f"❌ HTTP Error: {response.status_code}")
                return False
            
            # Parse JSON
            try:
                data = response.json()
                logger.info("✅ Nhận được dữ liệu JSON")
                logger.info(f"📄 Dữ liệu đầy đủ: {json.dumps(data, ensure_ascii=False, indent=2)}")
                
                # Kiểm tra kết quả
                if self._is_successful_query(data):
                    logger.info("🎉 Test thành công! Dữ liệu trả về đúng")
                    self.successful_captcha = captcha_code
                    
                    # Lưu kết quả test
                    self._save_test_result(self.test_tax_code, captcha_code, data, response)
                    
                    return True
                else:
                    logger.warning("⚠️ Test thất bại! Dữ liệu trả về không đúng")
                    logger.warning(f"📄 tinModel: {data.get('tinModel', 'null')}")
                    logger.warning(f"📄 Toàn bộ response: {json.dumps(data, ensure_ascii=False, indent=2)}")
                    return False
                    
            except json.JSONDecodeError as e:
                logger.error(f"❌ Lỗi parse JSON: {e}")
                logger.error(f"📄 Response text: {response.text[:200]}...")
                return False
                
        except Exception as e:
            logger.error(f"❌ Lỗi test: {e}")
            return False
    
    def _is_successful_query(self, data: Dict[str, Any]) -> bool:
        """
        Kiểm tra xem truy vấn có thành công không
        
        Args:
            data: Dữ liệu JSON từ server
            
        Returns:
            True nếu thành công (tinModel không null)
        """
        if not isinstance(data, dict):
            return False
        
        tin_model = data.get('tinModel')
        return tin_model is not None and tin_model != {}
    
    def _save_test_result(self, tax_code: str, captcha_code: str, data: Dict[str, Any], response: requests.Response):
        """
        Lưu kết quả test
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            data: Dữ liệu JSON
            response: Response object
        """
        result = {
            'tax_code': tax_code,
            'captcha_code': captcha_code,
            'status': 'test_success',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'url': response.url,
            'status_code': response.status_code,
            'content_type': response.headers.get('Content-Type', ''),
            'session_cookies': dict(self.session.cookies),
            'data': data
        }
        
        self.results.append(result)
        
        # Lưu vào file
        filename = f"test_result_{tax_code}_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu kết quả test: {filename}")
    
    def step4_test_with_other_tax_codes(self) -> bool:
        """
        Bước 4: Test với các mã số thuế còn lại
        
        Returns:
            True nếu ít nhất 1 mã thành công
        """
        if not self.successful_captcha:
            logger.error("❌ Chưa có captcha thành công!")
            return False
        
        print("\n" + "="*60)
        print("📋 BƯỚC 4: TEST VỚI CÁC MÃ SỐ THUẾ CÒN LẠI")
        print("="*60)
        print(f"🔐 Sử dụng captcha thành công: {self.successful_captcha}")
        print(f"🔢 Các mã số thuế: {self.other_tax_codes}")
        print("🔒 Session được duy trì trong suốt quá trình")
        print("-"*60)
        
        success_count = 0
        
        for i, tax_code in enumerate(self.other_tax_codes, 1):
            print(f"\n📋 Test {i}/{len(self.other_tax_codes)}: {tax_code}")
            print("-" * 40)
            
            try:
                # Tạo URL
                url = f"{self.query_url}?tin={tax_code}&captchaCode={self.successful_captcha}"
                logger.info(f"🔗 URL: {url}")
                
                # Thêm delay
                logger.info("⏳ Đợi 2 giây...")
                time.sleep(2)
                
                # Gửi request
                response = self.session.get(url, timeout=30)
                logger.info(f"📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        
                        if self._is_successful_query(data):
                            print(f"✅ Test {i} thành công!")
                            success_count += 1
                            
                            # Lưu kết quả
                            self._save_other_result(tax_code, self.successful_captcha, data, response, True)
                        else:
                            print(f"❌ Test {i} thất bại! tinModel null")
                            self._save_other_result(tax_code, self.successful_captcha, data, response, False)
                            
                    except json.JSONDecodeError as e:
                        print(f"❌ Test {i} lỗi JSON: {e}")
                        self._save_other_result(tax_code, self.successful_captcha, None, response, False)
                else:
                    print(f"❌ Test {i} HTTP Error: {response.status_code}")
                    self._save_other_result(tax_code, self.successful_captcha, None, response, False)
                    
            except Exception as e:
                print(f"❌ Test {i} lỗi: {e}")
                self._save_other_result(tax_code, self.successful_captcha, None, None, False)
        
        # Tổng kết
        print(f"\n📊 TỔNG KẾT BƯỚC 4:")
        print("="*60)
        print(f"✅ Thành công: {success_count}/{len(self.other_tax_codes)}")
        print(f"🎯 Tỷ lệ thành công: {success_count/len(self.other_tax_codes)*100:.1f}%")
        
        return success_count > 0
    
    def _save_other_result(self, tax_code: str, captcha_code: str, data: Optional[Dict[str, Any]], response: Optional[requests.Response], success: bool):
        """
        Lưu kết quả từ các mã số thuế khác
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            data: Dữ liệu JSON
            response: Response object
            success: Có thành công không
        """
        result = {
            'tax_code': tax_code,
            'captcha_code': captcha_code,
            'status': 'success' if success else 'failed',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'url': response.url if response else None,
            'status_code': response.status_code if response else None,
            'content_type': response.headers.get('Content-Type', '') if response else None,
            'session_cookies': dict(self.session.cookies),
            'data': data
        }
        
        self.results.append(result)
        
        # Lưu vào file
        status = "success" if success else "failed"
        filename = f"other_result_{tax_code}_{status}_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu kết quả: {filename}")
    
    def step5_save_summary(self):
        """
        Bước 5: Lưu tổng kết
        """
        print("\n" + "="*60)
        print("📋 BƯỚC 5: LƯU TỔNG KẾT")
        print("="*60)
        
        summary = {
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'workflow': 'Complete Tax Query Workflow',
            'test_tax_code': self.test_tax_code,
            'other_tax_codes': self.other_tax_codes,
            'successful_captcha': self.successful_captcha,
            'total_results': len(self.results),
            'test_success': any(r['status'] == 'test_success' for r in self.results),
            'other_success_count': len([r for r in self.results if r['status'] == 'success' and r['tax_code'] != self.test_tax_code]),
            'results': self.results,
            'final_session_cookies': dict(self.session.cookies)
        }
        
        filename = f"complete_workflow_summary_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu tổng kết: {filename}")
        
        # In tổng kết
        self._print_final_summary()
    
    def _print_final_summary(self):
        """
        In tổng kết cuối cùng
        """
        print("\n" + "="*60)
        print("🏁 TỔNG KẾT CUỐI CÙNG")
        print("="*60)
        
        test_success = any(r['status'] == 'test_success' for r in self.results)
        other_success = len([r for r in self.results if r['status'] == 'success' and r['tax_code'] != self.test_tax_code])
        other_total = len(self.other_tax_codes)
        
        print(f"🔢 Mã số thuế test: {self.test_tax_code} - {'✅ Thành công' if test_success else '❌ Thất bại'}")
        print(f"🔐 Captcha thành công: {self.successful_captcha}")
        print(f"📊 Các mã khác: {other_success}/{other_total} thành công")
        print(f"🎯 Tỷ lệ thành công tổng: {(other_success + (1 if test_success else 0))/(other_total + 1)*100:.1f}%")
        
        print(f"\n📋 CHI TIẾT:")
        for result in self.results:
            status_icon = "✅" if result['status'] in ['success', 'test_success'] else "❌"
            print(f"- {result['tax_code']}: {status_icon} {result['status']}")
        
        print("="*60)
    
    def run_complete_workflow(self):
        """
        Chạy toàn bộ workflow
        """
        print("🚀 COMPLETE TAX QUERY WORKFLOW")
        print("="*60)
        print("📋 Quy trình:")
        print("1. Tải ảnh captcha")
        print("2. Nhập mã captcha")
        print("3. Test với mã số thuế test")
        print("4. Nếu đúng, test với các mã khác")
        print("5. Lưu tổng kết")
        print("="*60)
        
        try:
            # Bước 1: Tải captcha
            captcha_file = self.step1_download_captcha()
            if not captcha_file:
                print("❌ Không thể tải captcha!")
                return False
            
            # Bước 2: Nhập captcha
            captcha_code = self.step2_get_captcha_from_user()
            if not captcha_code:
                print("❌ Chưa nhập captcha!")
                return False
            
            # Bước 3: Test với mã test
            test_success = self.step3_test_with_test_tax_code(captcha_code)
            if not test_success:
                print("❌ Test với mã số thuế test thất bại!")
                print("💡 Có thể captcha đã hết hạn hoặc không đúng")
                print("🔄 Bạn có muốn thử lại với captcha mới không?")
                
                try:
                    retry = input("🔄 Thử lại? (y/N): ").strip().lower()
                    if retry in ['y', 'yes', 'có']:
                        # Thử lại với captcha mới
                        print("\n🔄 Thử lại với captcha mới...")
                        captcha_file = self.step1_download_captcha()
                        if captcha_file:
                            captcha_code = self.step2_get_captcha_from_user()
                            if captcha_code:
                                test_success = self.step3_test_with_test_tax_code(captcha_code)
                                if not test_success:
                                    print("❌ Thử lại vẫn thất bại!")
                                    print("🛑 Dừng workflow")
                                    return False
                            else:
                                print("❌ Chưa nhập captcha mới!")
                                return False
                        else:
                            print("❌ Không thể tải captcha mới!")
                            return False
                    else:
                        print("🛑 Dừng workflow")
                        return False
                except KeyboardInterrupt:
                    print("\n⏹️ Đã hủy bởi người dùng")
                    return False
            
            # Bước 4: Test với các mã khác
            other_success = self.step4_test_with_other_tax_codes()
            
            # Bước 5: Lưu tổng kết
            self.step5_save_summary()
            
            return True
            
        except KeyboardInterrupt:
            print("\n⏹️ Đã dừng bởi người dùng")
            return False
        except Exception as e:
            print(f"\n❌ Lỗi workflow: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """
    Hàm main
    """
    workflow = CompleteTaxQueryWorkflow()
    success = workflow.run_complete_workflow()
    
    if success:
        print("\n🎉 WORKFLOW HOÀN THÀNH THÀNH CÔNG!")
    else:
        print("\n❌ WORKFLOW THẤT BẠI!")


if __name__ == "__main__":
    main()
