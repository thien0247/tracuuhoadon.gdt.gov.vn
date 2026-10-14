-- ====================================================================
-- Migration: 005_create_bocao_records.sql
-- Mô tả: Tạo bảng lưu trữ thông tin Bố Cáo Điện Tử (bocaodientu.dkkd.gov.vn)
-- ====================================================================

CREATE TABLE IF NOT EXISTS bocao_records (
    id BIGSERIAL PRIMARY KEY,
    tin VARCHAR(20) NOT NULL,
    company_name TEXT NOT NULL,
    province_name VARCHAR(100),
    announcement_type VARCHAR(100) NOT NULL,
    pub_time TIMESTAMPTZ NOT NULL,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    CONSTRAINT uq_bocao_tin_pub_type UNIQUE (tin, pub_time, announcement_type)
);

CREATE INDEX IF NOT EXISTS idx_bocao_tin ON bocao_records(tin);
CREATE INDEX IF NOT EXISTS idx_bocao_pub_time ON bocao_records(pub_time DESC);
CREATE INDEX IF NOT EXISTS idx_bocao_province ON bocao_records(province_name);
CREATE INDEX IF NOT EXISTS idx_bocao_type ON bocao_records(announcement_type);
