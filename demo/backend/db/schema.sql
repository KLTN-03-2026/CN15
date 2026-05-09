-- =============================================================================
-- Hệ thống thu gom rác tái chế — PostgreSQL
-- Khớp: backend/db/schema_dbdiagram.dbml (10 bảng)
-- Chạy: psql -U postgres -f schema.sql
-- Hoặc tạo DB trước: CREATE DATABASE smart_recycling_vi ENCODING 'UTF8';
--       \c smart_recycling_vi
--       rồi chạy nội dung file này.
-- =============================================================================

-- Bảng 2: Admin (tạo trước vì nguoi_dungs tham chiếu)
CREATE TABLE admins (
  id              VARCHAR(64) PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  mat_khau        VARCHAR(255) NOT NULL,
  ho_ten          VARCHAR(255) NOT NULL,
  ngay_tao        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ngay_cap_nhat   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Bảng 1: Khách hàng + Nhân viên
CREATE TABLE nguoi_dungs (
  id              VARCHAR(64) PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  mat_khau        VARCHAR(255) NOT NULL,
  ho_ten          VARCHAR(255) NOT NULL,
  so_dien_thoai   VARCHAR(32),
  dia_chi         VARCHAR(500),
  avatar          VARCHAR(500),
  vai_tro         VARCHAR(32)  NOT NULL DEFAULT 'CUSTOMER',
  diem            INTEGER      NOT NULL DEFAULT 0,
  bi_khoa         BOOLEAN      NOT NULL DEFAULT FALSE,
  id_admin_khoa   VARCHAR(64)  REFERENCES admins (id) ON DELETE SET NULL,
  ngay_tao        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ngay_cap_nhat   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nguoi_dungs_vai_tro ON nguoi_dungs (vai_tro);
CREATE INDEX idx_nguoi_dungs_bi_khoa ON nguoi_dungs (bi_khoa);

-- Bảng 3: Quên mật khẩu (UC11)
CREATE TABLE password_resets (
  id              VARCHAR(64) PRIMARY KEY,
  id_nguoi_dung   VARCHAR(64) NOT NULL REFERENCES nguoi_dungs (id) ON DELETE CASCADE,
  token           VARCHAR(255) NOT NULL UNIQUE,
  het_han         TIMESTAMPTZ NOT NULL,
  ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_id_nd ON password_resets (id_nguoi_dung);

-- Bảng 4: Loại rác
CREATE TABLE loai_racs (
  id_loai_rac     VARCHAR(64) PRIMARY KEY,
  ten_loai        VARCHAR(255) NOT NULL,
  mo_ta           TEXT,
  diem_tren_kg    DECIMAL(12, 4) NOT NULL DEFAULT 0,
  hoat_dong       BOOLEAN NOT NULL DEFAULT TRUE,
  ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ngay_cap_nhat   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng 5: Yêu cầu thu gom
CREATE TABLE yeu_cau_thu_goms (
  id_yeu_cau            VARCHAR(64) PRIMARY KEY,
  id_khach_hang         VARCHAR(64) NOT NULL REFERENCES nguoi_dungs (id) ON DELETE RESTRICT,
  id_loai_rac           VARCHAR(64) NOT NULL REFERENCES loai_racs (id_loai_rac) ON DELETE RESTRICT,
  id_loai_rac_xac_minh  VARCHAR(64) REFERENCES loai_racs (id_loai_rac) ON DELETE SET NULL,
  id_nhan_vien          VARCHAR(64) REFERENCES nguoi_dungs (id) ON DELETE SET NULL,
  so_luong              DECIMAL(12, 4) NOT NULL,
  so_luong_uoc_tinh     DECIMAL(12, 4),
  khoi_luong_xac_minh   DECIMAL(12, 4),
  dia_chi               VARCHAR(500) NOT NULL,
  so_dien_thoai         VARCHAR(32),
  ngay_muon_thu_gom     TIMESTAMPTZ,
  ghi_chu               TEXT,
  url_anh               VARCHAR(1000),
  trang_thai            VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  diem_tich_luy         INTEGER,
  ngay_tao              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ngay_cap_nhat         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ngay_hoan_thanh       TIMESTAMPTZ
);

CREATE INDEX idx_yc_id_kh ON yeu_cau_thu_goms (id_khach_hang);
CREATE INDEX idx_yc_id_nv ON yeu_cau_thu_goms (id_nhan_vien);
CREATE INDEX idx_yc_trang_thai ON yeu_cau_thu_goms (trang_thai);

-- Bảng 6: Lịch sử trạng thái yêu cầu
CREATE TABLE lich_su_trang_thais (
  id            VARCHAR(64) PRIMARY KEY,
  id_yeu_cau    VARCHAR(64) NOT NULL REFERENCES yeu_cau_thu_goms (id_yeu_cau) ON DELETE CASCADE,
  trang_thai    VARCHAR(32) NOT NULL,
  ghi_chu       TEXT,
  ngay_tao      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lst_id_yc ON lich_su_trang_thais (id_yeu_cau);

-- Bảng 7: Phần thưởng
CREATE TABLE phan_thuongs (
  id_phan_thuong   VARCHAR(64) PRIMARY KEY,
  ten_phan_thuong  VARCHAR(255) NOT NULL,
  mo_ta            TEXT,
  diem_doi         INTEGER NOT NULL,
  so_luong_con     INTEGER NOT NULL DEFAULT 0,
  url_anh          VARCHAR(1000),
  hoat_dong        BOOLEAN NOT NULL DEFAULT TRUE,
  ngay_tao         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ngay_cap_nhat    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng 8: Lịch sử đổi thưởng (cột ma_xac_nhan, ghi_chu_thuc_hien khớp Prisma)
CREATE TABLE lich_su_doi_thuongs (
  id                 VARCHAR(64) PRIMARY KEY,
  id_nguoi_dung      VARCHAR(64) NOT NULL REFERENCES nguoi_dungs (id) ON DELETE CASCADE,
  id_phan_thuong     VARCHAR(64) NOT NULL REFERENCES phan_thuongs (id_phan_thuong) ON DELETE RESTRICT,
  diem_su_dung       INTEGER NOT NULL,
  trang_thai         VARCHAR(32) NOT NULL DEFAULT 'completed',
  ma_xac_nhan        VARCHAR(255) NOT NULL DEFAULT '',
  ghi_chu_thuc_hien  TEXT,
  ngay_tao           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lsdt_nd ON lich_su_doi_thuongs (id_nguoi_dung);

-- Bảng 9: Giao dịch điểm
CREATE TABLE giao_dich_diems (
  id              VARCHAR(64) PRIMARY KEY,
  id_nguoi_dung   VARCHAR(64) NOT NULL REFERENCES nguoi_dungs (id) ON DELETE CASCADE,
  so_diem         INTEGER NOT NULL,
  loai            VARCHAR(32) NOT NULL,
  mo_ta           TEXT,
  id_tham_chieu   VARCHAR(64),
  ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gdd_nd ON giao_dich_diems (id_nguoi_dung);
CREATE INDEX idx_gdd_loai ON giao_dich_diems (loai);

-- Bảng 10: Thông báo
CREATE TABLE thong_baos (
  id              VARCHAR(64) PRIMARY KEY,
  id_nguoi_dung   VARCHAR(64) NOT NULL REFERENCES nguoi_dungs (id) ON DELETE CASCADE,
  loai            VARCHAR(64) NOT NULL,
  tieu_de         VARCHAR(255) NOT NULL,
  noi_dung        TEXT NOT NULL,
  id_tham_chieu   VARCHAR(64),
  da_doc          BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tb_nd ON thong_baos (id_nguoi_dung);
CREATE INDEX idx_tb_da_doc ON thong_baos (da_doc);
