#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Models - Models cho database PostgreSQL
Kết nối và thao tác với bảng gdt_prefix_province_codes và company_info
"""

import psycopg2
import psycopg2.extras
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import json
from config import get_database_config

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseConnection:
    """
    Quản lý kết nối database PostgreSQL
    """
    
    def __init__(self, host: str = None, port: int = None, 
                 database: str = None, user: str = None, password: str = None):
        """
        Khởi tạo kết nối database
        
        Args:
            host: Host database (nếu None sẽ dùng config)
            port: Port database (nếu None sẽ dùng config)
            database: Tên database (nếu None sẽ dùng config)
            user: Username (nếu None sẽ dùng config)
            password: Password (nếu None sẽ dùng config)
        """
        # Sử dụng config mặc định nếu không cung cấp
        config = get_database_config()
        
        self.host = host or config['host']
        self.port = port or config['port']
        self.database = database or config['database']
        self.user = user or config['user']
        self.password = password or config['password']
        self.connection = None
        
        logger.info(f"🔗 Khởi tạo kết nối database: {self.host}:{self.port}/{self.database}")
    
    def connect(self) -> bool:
        """
        Kết nối đến database
        
        Returns:
            True nếu thành công, False nếu thất bại
        """
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            logger.info("✅ Kết nối database thành công")
            return True
        except Exception as e:
            logger.error(f"❌ Lỗi kết nối database: {e}")
            return False
    
    def disconnect(self):
        """
        Đóng kết nối database
        """
        if self.connection:
            self.connection.close()
            logger.info("🔌 Đã đóng kết nối database")
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Thực thi query SELECT
        
        Args:
            query: SQL query
            params: Parameters cho query
            
        Returns:
            Danh sách kết quả
        """
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"❌ Lỗi thực thi query: {e}")
            return []
    
    def execute_insert(self, query: str, params: tuple = None) -> bool:
        """
        Thực thi query INSERT/UPDATE/DELETE
        
        Args:
            query: SQL query
            params: Parameters cho query
            
        Returns:
            True nếu thành công, False nếu thất bại
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                self.connection.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Lỗi thực thi insert: {e}")
            self.connection.rollback()
            return False
    
    def execute_batch_insert(self, query: str, params_list: List[tuple]) -> int:
        """
        Thực thi batch insert (tối ưu hiệu suất)
        
        Args:
            query: SQL query
            params_list: Danh sách parameters cho query
            
        Returns:
            Số records đã insert thành công
        """
        if not params_list:
            return 0
        
        try:
            with self.connection.cursor() as cursor:
                # Sử dụng executemany để insert nhiều records cùng lúc
                cursor.executemany(query, params_list)
                self.connection.commit()
                success_count = cursor.rowcount
                logger.debug(f"✅ Batch insert thành công: {success_count} records")
                return success_count
        except Exception as e:
            logger.error(f"❌ Lỗi thực thi batch insert: {e}")
            self.connection.rollback()
            return 0


class ProvinceCodeModel:
    """
    Model cho bảng gdt_prefix_province_codes
    """
    
    def __init__(self, db_connection: DatabaseConnection):
        """
        Khởi tạo model
        
        Args:
            db_connection: Kết nối database
        """
        self.db = db_connection
    
    def get_province_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin tỉnh theo code
        
        Args:
            code: Mã tỉnh (2 chữ số)
            
        Returns:
            Thông tin tỉnh hoặc None nếu không tìm thấy
        """
        query = """
        SELECT code, name, tin_min, tin_max, total_tins, created_at, updated_at
        FROM gdt_prefix_province_codes 
        WHERE code = %s
        """
        
        results = self.db.execute_query(query, (code,))
        
        if results:
            logger.info(f"✅ Tìm thấy tỉnh: {results[0]['name']} (code: {code})")
            return results[0]
        else:
            logger.warning(f"⚠️ Không tìm thấy tỉnh với code: {code}")
            return None
    
    def get_all_provinces(self) -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả tỉnh
        
        Returns:
            Danh sách tỉnh
        """
        query = """
        SELECT code, name, tin_min, tin_max, total_tins, created_at, updated_at
        FROM gdt_prefix_province_codes 
        ORDER BY code
        """
        
        results = self.db.execute_query(query)
        logger.info(f"📊 Tìm thấy {len(results)} tỉnh")
        return results
    
    def update_province_stats(self, code: str, tin_min: str = None, tin_max: str = None, total_tins: int = None) -> bool:
        """
        Cập nhật thống kê tỉnh
        
        Args:
            code: Mã tỉnh
            tin_min: Mã số thuế nhỏ nhất
            tin_max: Mã số thuế lớn nhất
            total_tins: Tổng số mã số thuế
            
        Returns:
            True nếu thành công
        """
        update_fields = []
        params = []
        
        if tin_min is not None:
            update_fields.append("tin_min = %s")
            params.append(tin_min)
        
        if tin_max is not None:
            update_fields.append("tin_max = %s")
            params.append(tin_max)
        
        if total_tins is not None:
            update_fields.append("total_tins = %s")
            params.append(total_tins)
        
        if not update_fields:
            return True
        
        update_fields.append("updated_at = %s")
        params.append(datetime.now())
        params.append(code)
        
        query = f"""
        UPDATE gdt_prefix_province_codes 
        SET {', '.join(update_fields)}
        WHERE code = %s
        """
        
        success = self.db.execute_insert(query, tuple(params))
        if success:
            logger.info(f"✅ Đã cập nhật thống kê tỉnh {code}")
        else:
            logger.error(f"❌ Lỗi cập nhật thống kê tỉnh {code}")
        
        return success


class CompanyInfoModel:
    """
    Model cho bảng company_info
    """
    
    def __init__(self, db_connection: DatabaseConnection):
        """
        Khởi tạo model
        
        Args:
            db_connection: Kết nối database
        """
        self.db = db_connection
    
    def get_company_by_tin(self, tin: str) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin công ty theo TIN
        
        Args:
            tin: Mã số thuế
            
        Returns:
            Thông tin công ty hoặc None nếu không tìm thấy
        """
        query = """
        SELECT tin, norm_name, econ_name, economy, regi_date, chan_date, 
               tu_ngay, den_ngay, status, statusname, search, tran_addr, 
               tran_dist, tran_tel, tran_fax, link, pay_taxo_id, pay_taxo_name, 
               pay_taxo_name_blhd, pare_tin, dvsd, json_data, created_at, updated_at
        FROM company_info 
        WHERE tin = %s
        """
        
        results = self.db.execute_query(query, (tin,))
        
        if results:
            logger.debug(f"✅ Tìm thấy công ty: {results[0]['norm_name']} (TIN: {tin})")
            return results[0]
        else:
            logger.debug(f"⚠️ Không tìm thấy công ty với TIN: {tin}")
            return None
    
    def check_tins_exist(self, tins: List[str]) -> List[str]:
        """
        Kiểm tra danh sách TIN nào đã tồn tại
        
        Args:
            tins: Danh sách mã số thuế
            
        Returns:
            Danh sách TIN đã tồn tại
        """
        if not tins:
            return []
        
        # Tạo placeholder cho IN clause
        placeholders = ','.join(['%s'] * len(tins))
        query = f"""
        SELECT tin 
        FROM company_info 
        WHERE tin IN ({placeholders})
        """
        
        results = self.db.execute_query(query, tuple(tins))
        existing_tins = [row['tin'] for row in results]
        
        logger.info(f"📊 Kiểm tra {len(tins)} TIN, {len(existing_tins)} đã tồn tại")
        return existing_tins
    
    def get_existing_tins_info(self, tins: List[str]) -> Dict[str, str]:
        """
        Lấy thông tin norm_name của các TIN đã tồn tại
        
        Args:
            tins: Danh sách mã số thuế
            
        Returns:
            Dictionary {tin: norm_name} của các TIN đã tồn tại
        """
        if not tins:
            return {}
        
        # Tạo placeholder cho IN clause
        placeholders = ','.join(['%s'] * len(tins))
        query = f"""
        SELECT tin, norm_name 
        FROM company_info 
        WHERE tin IN ({placeholders})
        """
        
        results = self.db.execute_query(query, tuple(tins))
        existing_tins_info = {row['tin']: row['norm_name'] for row in results}
        
        return existing_tins_info
    
    def insert_company(self, company_data: Dict[str, Any]) -> bool:
        """
        Thêm thông tin công ty mới
        
        Args:
            company_data: Dữ liệu công ty
            
        Returns:
            True nếu thành công
        """
        # Chuẩn bị dữ liệu
        fields = [
            'tin', 'norm_name', 'econ_name', 'economy', 'regi_date', 'chan_date',
            'tu_ngay', 'den_ngay', 'status', 'statusname', 'search', 'tran_addr',
            'tran_dist', 'tran_tel', 'tran_fax', 'link', 'pay_taxo_id', 'pay_taxo_name',
            'pay_taxo_name_blhd', 'pare_tin', 'dvsd', 'json_data'
        ]
        
        values = []
        placeholders = []
        
        for field in fields:
            if field in company_data:
                values.append(company_data[field])
                placeholders.append('%s')
            else:
                values.append(None)
                placeholders.append('%s')
        
        # Thêm created_at và updated_at
        values.extend([datetime.now(), datetime.now()])
        placeholders.extend(['%s', '%s'])
        
        query = f"""
        INSERT INTO company_info ({', '.join(fields)}, created_at, updated_at)
        VALUES ({', '.join(placeholders)})
        ON CONFLICT (tin) DO UPDATE SET
            norm_name = EXCLUDED.norm_name,
            econ_name = EXCLUDED.econ_name,
            economy = EXCLUDED.economy,
            regi_date = EXCLUDED.regi_date,
            chan_date = EXCLUDED.chan_date,
            tu_ngay = EXCLUDED.tu_ngay,
            den_ngay = EXCLUDED.den_ngay,
            status = EXCLUDED.status,
            statusname = EXCLUDED.statusname,
            search = EXCLUDED.search,
            tran_addr = EXCLUDED.tran_addr,
            tran_dist = EXCLUDED.tran_dist,
            tran_tel = EXCLUDED.tran_tel,
            tran_fax = EXCLUDED.tran_fax,
            link = EXCLUDED.link,
            pay_taxo_id = EXCLUDED.pay_taxo_id,
            pay_taxo_name = EXCLUDED.pay_taxo_name,
            pay_taxo_name_blhd = EXCLUDED.pay_taxo_name_blhd,
            pare_tin = EXCLUDED.pare_tin,
            dvsd = EXCLUDED.dvsd,
            json_data = EXCLUDED.json_data,
            updated_at = EXCLUDED.updated_at
        """
        
        success = self.db.execute_insert(query, tuple(values))
        if success:
            logger.info(f"✅ Đã thêm/cập nhật công ty: {company_data.get('tin')}")
        else:
            logger.error(f"❌ Lỗi thêm/cập nhật công ty: {company_data.get('tin')}")
        
        return success
    
    def insert_companies_batch(self, companies_data: List[Dict[str, Any]]) -> int:
        """
        Thêm nhiều công ty cùng lúc (tối ưu hiệu suất)
        
        Args:
            companies_data: Danh sách dữ liệu công ty
            
        Returns:
            Số công ty đã thêm thành công
        """
        if not companies_data:
            return 0
        
        # Chuẩn bị dữ liệu cho batch insert
        fields = [
            'tin', 'norm_name', 'econ_name', 'economy', 'regi_date', 'chan_date',
            'tu_ngay', 'den_ngay', 'status', 'statusname', 'search', 'tran_addr',
            'tran_dist', 'tran_tel', 'tran_fax', 'link', 'pay_taxo_id', 'pay_taxo_name',
            'pay_taxo_name_blhd', 'pare_tin', 'dvsd', 'json_data'
        ]
        
        # Tạo danh sách values cho tất cả records
        all_values = []
        current_time = datetime.now()
        
        for company_data in companies_data:
            values = []
            for field in fields:
                if field in company_data:
                    values.append(company_data[field])
                else:
                    values.append(None)
            
            # Thêm created_at và updated_at
            values.extend([current_time, current_time])
            all_values.append(tuple(values))
        
        # Tạo query cho batch insert
        placeholders = ', '.join(['%s'] * (len(fields) + 2))  # +2 cho created_at, updated_at
        query = f"""
        INSERT INTO company_info ({', '.join(fields)}, created_at, updated_at)
        VALUES ({placeholders})
        ON CONFLICT (tin) DO UPDATE SET
            norm_name = EXCLUDED.norm_name,
            econ_name = EXCLUDED.econ_name,
            economy = EXCLUDED.economy,
            regi_date = EXCLUDED.regi_date,
            chan_date = EXCLUDED.chan_date,
            tu_ngay = EXCLUDED.tu_ngay,
            den_ngay = EXCLUDED.den_ngay,
            status = EXCLUDED.status,
            statusname = EXCLUDED.statusname,
            search = EXCLUDED.search,
            tran_addr = EXCLUDED.tran_addr,
            tran_dist = EXCLUDED.tran_dist,
            tran_tel = EXCLUDED.tran_tel,
            tran_fax = EXCLUDED.tran_fax,
            link = EXCLUDED.link,
            pay_taxo_id = EXCLUDED.pay_taxo_id,
            pay_taxo_name = EXCLUDED.pay_taxo_name,
            pay_taxo_name_blhd = EXCLUDED.pay_taxo_name_blhd,
            pare_tin = EXCLUDED.pare_tin,
            dvsd = EXCLUDED.dvsd,
            json_data = EXCLUDED.json_data,
            updated_at = EXCLUDED.updated_at
        """
        
        # Thực hiện batch insert
        success_count = self.db.execute_batch_insert(query, all_values)
        
        logger.info(f"📊 Batch insert: {success_count}/{len(companies_data)} thành công")
        return success_count
    
    def get_companies_by_prefix(self, prefix: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Lấy danh sách công ty theo prefix
        
        Args:
            prefix: Prefix mã số thuế
            limit: Giới hạn số lượng
            
        Returns:
            Danh sách công ty
        """
        query = """
        SELECT tin, norm_name, econ_name, status, statusname, created_at
        FROM company_info 
        WHERE tin LIKE %s
        ORDER BY tin DESC
        LIMIT %s
        """
        
        results = self.db.execute_query(query, (f"{prefix}%", limit))
        logger.info(f"📊 Tìm thấy {len(results)} công ty với prefix {prefix}")
        return results


def test_database_connection():
    """
    Test kết nối database
    """
    print("🧪 TEST DATABASE CONNECTION")
    print("="*60)
    
    # Tạo kết nối
    db = DatabaseConnection()
    
    if not db.connect():
        print("❌ Không thể kết nối database")
        return False
    
    try:
        # Test ProvinceCodeModel
        print("\n📋 Test ProvinceCodeModel:")
        province_model = ProvinceCodeModel(db)
        
        # Lấy tất cả tỉnh
        provinces = province_model.get_all_provinces()
        print(f"✅ Tìm thấy {len(provinces)} tỉnh")
        
        # Test với code cụ thể
        if provinces:
            test_code = provinces[0]['code']
            province = province_model.get_province_by_code(test_code)
            if province:
                print(f"✅ Test tỉnh {test_code}: {province['name']}")
                print(f"   tin_min: {province.get('tin_min', 'N/A')}")
                print(f"   tin_max: {province.get('tin_max', 'N/A')}")
        
        # Test CompanyInfoModel
        print("\n📋 Test CompanyInfoModel:")
        company_model = CompanyInfoModel(db)
        
        # Test check_tins_exist
        test_tins = ['4401120823', '0319151229', '9999999999']
        existing_tins = company_model.check_tins_exist(test_tins)
        print(f"✅ Kiểm tra {len(test_tins)} TIN, {len(existing_tins)} đã tồn tại")
        
        # Test get_companies_by_prefix
        companies = company_model.get_companies_by_prefix('44', 10)
        print(f"✅ Tìm thấy {len(companies)} công ty với prefix 44")
        
        print("\n✅ Tất cả test thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test: {e}")
        return False
    finally:
        db.disconnect()


def main():
    """
    Hàm main
    """
    print("🗄️ DATABASE MODELS")
    print("="*60)
    print("📋 Mô tả:")
    print("- Kết nối PostgreSQL database")
    print("- Models cho gdt_prefix_province_codes")
    print("- Models cho company_info")
    print("- CRUD operations")
    print("="*60)
    
    # Test database connection
    test_database_connection()


if __name__ == "__main__":
    main()
