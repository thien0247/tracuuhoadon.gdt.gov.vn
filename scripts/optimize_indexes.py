"""
scripts/optimize_indexes.py
Thực thi tối ưu hóa chỉ mục PostgreSQL cho CSDL taxdb:
1. Kích hoạt extension pg_trgm
2. Tạo Partial Indexes cho bocao_records
3. Tạo GIN Trigram Index cho tax_records.norm_name
4. Tạo B-Tree index cho tax_records.regi_date
5. Tạo bảng crawler_jobs lưu trạng thái hàng đợi cuốn chiếu
"""
import time
from server_app.core.database import get_db_connection

def run_optimizations():
    print("=== BẮT ĐẦU TỐI ƯU HÓA CSDL POSTGRESQL ===")
    
    commands = [
        ("Kích hoạt extension pg_trgm", 
         "CREATE EXTENSION IF NOT EXISTS pg_trgm;"),
        
        ("Tạo Partial Index cho Bố Cáo chưa đồng bộ", 
         "CREATE INDEX IF NOT EXISTS idx_bocao_records_unmatched ON bocao_records (tin) WHERE sync_status != 'synced' OR sync_status IS NULL;"),
        
        ("Tạo Partial Index cho Bố Cáo chờ GDT sync (retry_later)", 
         "CREATE INDEX IF NOT EXISTS idx_bocao_records_retry_later ON bocao_records (tin) WHERE sync_status = 'retry_later';"),
        
        ("Tạo B-Tree Index cho ngày đăng ký (regi_date)", 
         "CREATE INDEX IF NOT EXISTS idx_tax_records_regi_date ON tax_records (regi_date DESC NULLS LAST);"),
        
        ("Tạo bảng crawler_jobs cho hàng đợi bền bỉ", 
         """
         CREATE TABLE IF NOT EXISTS crawler_jobs (
             id SERIAL PRIMARY KEY,
             province_key VARCHAR(50) NOT NULL,
             scan_mode VARCHAR(20) NOT NULL,
             seed_tin VARCHAR(14),
             last_tin VARCHAR(14),
             status VARCHAR(20) DEFAULT 'queued',
             total_queried INT DEFAULT 0,
             total_found INT DEFAULT 0,
             error_msg TEXT,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );
         CREATE INDEX IF NOT EXISTS idx_crawler_jobs_status ON crawler_jobs (status, province_key);
         """),
        
        ("Tạo GIN Trigram Index cho tìm kiếm tên doanh nghiệp (norm_name)", 
         "CREATE INDEX IF NOT EXISTS idx_tax_records_norm_name_trgm ON tax_records USING gin (norm_name gin_trgm_ops);"),
    ]

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for desc, sql in commands:
                t0 = time.time()
                print(f"-> {desc}...", end=" ", flush=True)
                try:
                    cur.execute(sql)
                    conn.commit()
                    elapsed = time.time() - t0
                    print(f"Xong! ({elapsed:.2f}s)")
                except Exception as e:
                    conn.rollback()
                    print(f"Lỗi: {e}")

    print("=== TẤT CẢ CHỈ MỤC & BẢNG ĐÃ ĐƯỢC TỐI ƯU HÓA HOÀN TẤT ===")

if __name__ == "__main__":
    run_optimizations()
