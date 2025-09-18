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

 Date: 16/09/2025 15:40:46
*/


-- ----------------------------
-- Table structure for gdt_prefix_province_codes
-- ----------------------------
DROP TABLE IF EXISTS "public"."gdt_prefix_province_codes";
CREATE TABLE "public"."gdt_prefix_province_codes" (
  "code" varchar(2) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) DEFAULT now(),
  "updated_at" timestamptz(6) DEFAULT now(),
  "tin_max" varchar(10) COLLATE "pg_catalog"."default",
  "tin_min" varchar(10) COLLATE "pg_catalog"."default",
  "total_tins" int4
)
;

-- ----------------------------
-- Primary Key structure for table gdt_prefix_province_codes
-- ----------------------------
ALTER TABLE "public"."gdt_prefix_province_codes" ADD CONSTRAINT "gdt_prefix_province_codes_pkey" PRIMARY KEY ("code");
