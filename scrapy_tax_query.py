#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module Scrapy Tax Query - Truy vấn thông tin mã số thuế sử dụng Scrapy
Hỗ trợ captcha nhập tay và xử lý bất đồng bộ
"""

import scrapy
import json
import time
import logging
from typing import Dict, Any, Optional, List
from scrapy.http import Request, Response
from scrapy.spiders import Spider
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TaxQuerySpider(Spider):
    """
    Spider Scrapy để truy vấn thông tin mã số thuế
    Hỗ trợ captcha nhập tay và xử lý bất đồng bộ
    """
    
    name = 'tax_query_spider'
    
    # Cấu hình Scrapy
    custom_settings = {
        'DOWNLOAD_DELAY': 2,  # Delay 2 giây giữa các request
        'RANDOMIZE_DOWNLOAD_DELAY': 0.5,  # Random delay 0.5-2.5 giây
        'RETRY_TIMES': 3,  # Retry tối đa 3 lần
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
        'CONCURRENT_REQUESTS': 1,  # Chỉ 1 request tại 1 thời điểm (để tránh spam)
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'AUTOTHROTTLE_ENABLED': True,  # Tự động điều chỉnh tốc độ
        'AUTOTHROTTLE_START_DELAY': 1,
        'AUTOTHROTTLE_MAX_DELAY': 10,
        'AUTOTHROTTLE_TARGET_CONCURRENCY': 1.0,
        'COOKIES_ENABLED': True,  # Bật cookies để duy trì session
        'COOKIES_DEBUG': True,  # Debug cookies
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    def __init__(self, tax_codes: List[str] = None, captcha_code: str = None, *args, **kwargs):
        """
        Khởi tạo spider
        
        Args:
            tax_codes: Danh sách mã số thuế cần truy vấn
            captcha_code: Mã captcha đã nhập tay
        """
        super().__init__(*args, **kwargs)
        
        # URLs
        self.captcha_url = 'https://tracuuhoadon.gdt.gov.vn/Captcha.jpg'
        self.query_url = 'https://tracuuhoadon.gdt.gov.vn/gettin.html'
        
        # Dữ liệu đầu vào
        self.tax_codes = tax_codes or ['0319151229', '0319153113', '2301359406']
        self.captcha_code = captcha_code
        
        # Kết quả
        self.results = []
        self.session_cookies = {}
        
        logger.info(f"🚀 Khởi tạo TaxQuerySpider")
        logger.info(f"📋 Mã số thuế: {self.tax_codes}")
        logger.info(f"🔐 Captcha: {self.captcha_code}")
    
    def start_requests(self):
        """
        Bắt đầu các request đầu tiên
        """
        logger.info("🔄 Bắt đầu truy vấn thông tin mã số thuế")
        
        if not self.captcha_code:
            logger.error("❌ Chưa có mã captcha! Vui lòng nhập captcha trước.")
            return
        
        # Tạo request cho từng mã số thuế
        for i, tax_code in enumerate(self.tax_codes, 1):
            logger.info(f"📋 Tạo request {i}/{len(self.tax_codes)}: {tax_code}")
            
            # Tạo URL với tham số
            url = f"{self.query_url}?tin={tax_code}&captchaCode={self.captcha_code}"
            
            # Tạo request với callback
            yield Request(
                url=url,
                callback=self.parse_tax_info,
                meta={
                    'tax_code': tax_code,
                    'captcha_code': self.captcha_code,
                    'request_index': i,
                    'total_requests': len(self.tax_codes)
                },
                dont_filter=True  # Cho phép duplicate URL
            )
    
    def parse_tax_info(self, response: Response):
        """
        Xử lý response từ API truy vấn mã số thuế
        
        Args:
            response: Response từ server
        """
        # Lấy thông tin từ meta
        tax_code = response.meta.get('tax_code')
        captcha_code = response.meta.get('captcha_code')
        request_index = response.meta.get('request_index')
        total_requests = response.meta.get('total_requests')
        
        logger.info(f"📥 Nhận response {request_index}/{total_requests}: {tax_code}")
        logger.info(f"🔗 URL: {response.url}")
        logger.info(f"📊 Status: {response.status}")
        logger.info(f"🍪 Cookies: {dict(response.request.cookies)}")
        
        # Lưu session cookies
        if response.request.cookies:
            self.session_cookies.update(dict(response.request.cookies))
        
        try:
            # Kiểm tra status code
            if response.status != 200:
                logger.error(f"❌ HTTP Error {response.status} cho {tax_code}")
                self._save_error_result(tax_code, captcha_code, f"HTTP {response.status}")
                return
            
            # Kiểm tra content type
            content_type = response.headers.get('Content-Type', b'').decode('utf-8')
            logger.info(f"📄 Content-Type: {content_type}")
            
            # Thử parse JSON
            if 'application/json' in content_type:
                try:
                    data = response.json()
                    logger.info(f"✅ Nhận được JSON cho {tax_code}")
                    
                    # Kiểm tra kết quả
                    if self._is_successful_query(data):
                        logger.info(f"🎉 Truy vấn thành công: {tax_code}")
                        self._save_success_result(tax_code, captcha_code, data, response)
                    else:
                        logger.warning(f"⚠️ Truy vấn thất bại: {tax_code} - tinModel null")
                        self._save_error_result(tax_code, captcha_code, "tinModel null")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Lỗi parse JSON cho {tax_code}: {e}")
                    self._save_error_result(tax_code, captcha_code, f"JSON Error: {e}")
            else:
                # Nếu không phải JSON, lưu text
                logger.info(f"📝 Nhận được text cho {tax_code}")
                text_content = response.text
                self._save_text_result(tax_code, captcha_code, text_content, response)
                
        except Exception as e:
            logger.error(f"❌ Lỗi xử lý response cho {tax_code}: {e}")
            self._save_error_result(tax_code, captcha_code, f"Processing Error: {e}")
    
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
    
    def _save_success_result(self, tax_code: str, captcha_code: str, data: Dict[str, Any], response: Response):
        """
        Lưu kết quả thành công
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            data: Dữ liệu JSON
            response: Response object
        """
        result = {
            'tax_code': tax_code,
            'captcha_code': captcha_code,
            'status': 'success',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'url': response.url,
            'status_code': response.status,
            'content_type': response.headers.get('Content-Type', b'').decode('utf-8'),
            'session_cookies': dict(response.request.cookies),
            'data': data
        }
        
        self.results.append(result)
        
        # Lưu vào file
        filename = f"scrapy_tax_result_{tax_code}_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu kết quả thành công: {filename}")
    
    def _save_error_result(self, tax_code: str, captcha_code: str, error_msg: str):
        """
        Lưu kết quả lỗi
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            error_msg: Thông báo lỗi
        """
        result = {
            'tax_code': tax_code,
            'captcha_code': captcha_code,
            'status': 'error',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'error': error_msg
        }
        
        self.results.append(result)
        logger.error(f"❌ Lưu kết quả lỗi: {tax_code} - {error_msg}")
    
    def _save_text_result(self, tax_code: str, captcha_code: str, text_content: str, response: Response):
        """
        Lưu kết quả text (không phải JSON)
        
        Args:
            tax_code: Mã số thuế
            captcha_code: Mã captcha
            text_content: Nội dung text
            response: Response object
        """
        result = {
            'tax_code': tax_code,
            'captcha_code': captcha_code,
            'status': 'text_response',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'url': response.url,
            'status_code': response.status,
            'content_type': response.headers.get('Content-Type', b'').decode('utf-8'),
            'content': text_content
        }
        
        self.results.append(result)
        
        # Lưu vào file
        filename = f"scrapy_tax_text_{tax_code}_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📝 Đã lưu kết quả text: {filename}")
    
    def closed(self, reason):
        """
        Được gọi khi spider kết thúc
        
        Args:
            reason: Lý do kết thúc
        """
        logger.info(f"🏁 Spider kết thúc: {reason}")
        
        # Tổng kết kết quả
        self._print_summary()
        
        # Lưu tổng kết
        self._save_summary()
    
    def _print_summary(self):
        """
        In tổng kết kết quả
        """
        print("\n" + "="*60)
        print("📊 TỔNG KẾT SCRAPY TAX QUERY")
        print("="*60)
        
        total = len(self.results)
        success = len([r for r in self.results if r['status'] == 'success'])
        error = len([r for r in self.results if r['status'] == 'error'])
        text = len([r for r in self.results if r['status'] == 'text_response'])
        
        print(f"📋 Tổng số request: {total}")
        print(f"✅ Thành công: {success}")
        print(f"❌ Lỗi: {error}")
        print(f"📝 Text response: {text}")
        print(f"🎯 Tỷ lệ thành công: {success/total*100:.1f}%" if total > 0 else "0%")
        
        print(f"\n📋 CHI TIẾT:")
        for i, result in enumerate(self.results, 1):
            status_icon = "✅" if result['status'] == 'success' else "❌" if result['status'] == 'error' else "📝"
            print(f"{i}. {result['tax_code']} - {status_icon} {result['status']}")
            if result['status'] == 'error':
                print(f"   Lỗi: {result['error']}")
        
        print("="*60)
    
    def _save_summary(self):
        """
        Lưu tổng kết vào file
        """
        summary = {
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'spider_name': self.name,
            'tax_codes': self.tax_codes,
            'captcha_code': self.captcha_code,
            'total_requests': len(self.results),
            'success_count': len([r for r in self.results if r['status'] == 'success']),
            'error_count': len([r for r in self.results if r['status'] == 'error']),
            'text_count': len([r for r in self.results if r['status'] == 'text_response']),
            'results': self.results,
            'session_cookies': self.session_cookies
        }
        
        filename = f"scrapy_tax_summary_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Đã lưu tổng kết: {filename}")


def run_scrapy_tax_query(tax_codes: List[str] = None, captcha_code: str = None):
    """
    Chạy Scrapy Tax Query
    
    Args:
        tax_codes: Danh sách mã số thuế
        captcha_code: Mã captcha đã nhập tay
        
    Returns:
        Kết quả từ spider
    """
    if not captcha_code:
        logger.error("❌ Chưa có mã captcha!")
        return None
    
    # Cấu hình Scrapy
    settings = get_project_settings()
    settings.update({
        'LOG_LEVEL': 'INFO',
        'LOG_ENABLED': True,
        'FEEDS': {
            f'scrapy_tax_output_{int(time.time())}.json': {
                'format': 'json',
                'encoding': 'utf8',
                'store_empty': False,
                'indent': 2,
            },
        },
    })
    
    # Tạo process
    process = CrawlerProcess(settings)
    
    # Thêm spider
    process.crawl(
        TaxQuerySpider,
        tax_codes=tax_codes,
        captcha_code=captcha_code
    )
    
    # Chạy
    logger.info("🚀 Bắt đầu chạy Scrapy Tax Query...")
    process.start()


if __name__ == "__main__":
    # Test với 3 mã số thuế mặc định
    test_tax_codes = ['0319151229', '0319153113', '2301359406']
    
    # Nhập captcha thủ công
    print("🔐 Vui lòng nhập mã captcha:")
    captcha = input("Captcha: ").strip()
    
    if captcha:
        run_scrapy_tax_query(test_tax_codes, captcha)
    else:
        print("❌ Chưa nhập captcha!")
