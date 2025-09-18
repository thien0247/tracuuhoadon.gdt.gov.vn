/*
 Navicat Premium Dump SQL

 Source Server         : 192.168.168.222
 Source Server Type    : PostgreSQL
 Source Server Version : 150008 (150008)
 Source Host           : 192.168.168.222:5433
 Source Catalog        : masothue
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 150008 (150008)
 File Encoding         : 65001

 Date: 16/09/2025 15:41:03
*/


-- ----------------------------
-- Table structure for company_info
-- ----------------------------
DROP TABLE IF EXISTS "public"."company_info";
CREATE TABLE "public"."company_info" (
  "tin" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "norm_name" varchar(255) COLLATE "pg_catalog"."default",
  "econ_name" varchar(100) COLLATE "pg_catalog"."default",
  "economy" varchar(10) COLLATE "pg_catalog"."default",
  "regi_date" timestamptz(6),
  "chan_date" timestamptz(6),
  "tu_ngay" timestamptz(6),
  "den_ngay" timestamptz(6),
  "status" varchar(10) COLLATE "pg_catalog"."default",
  "statusname" varchar(255) COLLATE "pg_catalog"."default",
  "search" bool DEFAULT false,
  "tran_addr" text COLLATE "pg_catalog"."default",
  "tran_dist" varchar(10) COLLATE "pg_catalog"."default",
  "tran_tel" varchar(50) COLLATE "pg_catalog"."default",
  "tran_fax" varchar(50) COLLATE "pg_catalog"."default",
  "link" text COLLATE "pg_catalog"."default",
  "pay_taxo_id" varchar(20) COLLATE "pg_catalog"."default",
  "pay_taxo_name" varchar(255) COLLATE "pg_catalog"."default",
  "pay_taxo_name_blhd" varchar(255) COLLATE "pg_catalog"."default",
  "pare_tin" varchar(20) COLLATE "pg_catalog"."default",
  "dvsd" varchar(50) COLLATE "pg_catalog"."default",
  "json_data" jsonb,
  "created_at" timestamptz(6) DEFAULT now(),
  "updated_at" timestamptz(6) DEFAULT now()
)
;

-- ----------------------------
-- Indexes structure for table company_info
-- ----------------------------
CREATE INDEX "idx_company_info_norm_name" ON "public"."company_info" USING btree (
  "norm_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_company_info_status" ON "public"."company_info" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table company_info
-- ----------------------------
ALTER TABLE "public"."company_info" ADD CONSTRAINT "company_info_pkey" PRIMARY KEY ("tin");
