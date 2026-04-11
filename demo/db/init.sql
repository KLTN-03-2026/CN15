-- ============================================================
-- HỆ THỐNG THU GOM RÁC TÁI CHẾ THÔNG MINH TÍCH HỢP AI
-- Script tạo database theo detai.md
-- Chạy trong DBeaver hoặc psql: \i init.sql
-- ============================================================

-- Tạo database (chạy khi kết nối với postgres)
-- CREATE DATABASE smart_recycling;
-- \c smart_recycling;

-- ============================================================
-- 1. BẢNG USER (Actor: Guest, Customer, Staff, Admin)
-- Chức năng: Đăng ký, đăng nhập, quản lý tài khoản, phân quyền
-- ============================================================
CREATE TABLE IF NOT EXISTS "User" (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    "fullName"  TEXT NOT NULL,
    phone       TEXT,
    address     TEXT,
    avatar      TEXT,
    role        TEXT NOT NULL DEFAULT 'CUSTOMER',  -- CUSTOMER | STAFF | ADMIN
    "isLocked"  BOOLEAN NOT NULL DEFAULT false,
    points      INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. BẢNG PASSWORD_RESET
-- Chức năng: Quên mật khẩu, đặt lại mật khẩu
-- ============================================================
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    id          TEXT PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PasswordReset_token_idx" ON "PasswordReset"(token);
CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- ============================================================
-- 3. BẢNG WASTE_TYPE (Loại rác)
-- Chức năng: Admin quản lý loại rác, cấu hình điểm/kg
-- ============================================================
CREATE TABLE IF NOT EXISTS "WasteType" (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    "pointsPerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. BẢNG COLLECTION_REQUEST (Yêu cầu thu gom)
-- Chức năng: Customer tạo yêu cầu, Staff xử lý, thu gom, xác minh
-- Trạng thái: PENDING | COLLECTING | COMPLETED | CANCELLED
-- ============================================================
CREATE TABLE IF NOT EXISTS "CollectionRequest" (
    id                      TEXT PRIMARY KEY,
    "customerId"             TEXT NOT NULL,
    "wasteTypeId"            TEXT NOT NULL,
    quantity                 DOUBLE PRECISION NOT NULL,
    "estimatedQuantity"      DOUBLE PRECISION,
    address                  TEXT NOT NULL,
    phone                    TEXT,
    "desiredCollectionDate"  TIMESTAMP(3),
    note                     TEXT,
    "imageUrl"          TEXT,
    status              TEXT NOT NULL DEFAULT 'PENDING',
    "staffId"           TEXT,
    "verifiedWeight"    DOUBLE PRECISION,
    "verifiedTypeId"    TEXT,
    "pointsEarned"      INTEGER,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"       TIMESTAMP(3),
    FOREIGN KEY ("customerId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"(id),
    FOREIGN KEY ("staffId") REFERENCES "User"(id)
);

-- ============================================================
-- 5. BẢNG STATUS_HISTORY (Lịch sử trạng thái)
-- Chức năng: Staff cập nhật trạng thái, lưu lịch sử
-- ============================================================
CREATE TABLE IF NOT EXISTS "StatusHistory" (
    id          TEXT PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    status      TEXT NOT NULL,
    note        TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("requestId") REFERENCES "CollectionRequest"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "StatusHistory_requestId_idx" ON "StatusHistory"("requestId");

-- ============================================================
-- 5b. BẢNG NOTIFICATION (Thông báo cho khách hàng)
-- Chức năng: Thông báo khi yêu cầu được duyệt, hoàn thành
-- ============================================================
CREATE TABLE IF NOT EXISTS "Notification" (
    id          TEXT PRIMARY KEY,
    "userId"     TEXT NOT NULL,
    type         TEXT NOT NULL,
    title        TEXT NOT NULL,
    message      TEXT NOT NULL,
    "referenceId" TEXT,
    "isRead"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- ============================================================
-- 6. BẢNG REWARD (Phần thưởng đổi điểm)
-- Chức năng: Admin quản lý phần thưởng, cấu hình điểm đổi
-- ============================================================
CREATE TABLE IF NOT EXISTS "Reward" (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    "pointsCost" INTEGER NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 0,
    "imageUrl"  TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. BẢNG REWARD_REDEMPTION (Lịch sử đổi thưởng)
-- Chức năng: Customer đổi thưởng, xem lịch sử
-- ============================================================
CREATE TABLE IF NOT EXISTS "RewardRedemption" (
    id                 TEXT PRIMARY KEY,
    "userId"           TEXT NOT NULL,
    "rewardId"         TEXT NOT NULL,
    "pointsSpent"      INTEGER NOT NULL,
    status             TEXT NOT NULL DEFAULT 'completed',
    "confirmationCode" TEXT NOT NULL DEFAULT '',
    "fulfillmentNote"  TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("rewardId") REFERENCES "Reward"(id)
);
CREATE INDEX IF NOT EXISTS "RewardRedemption_userId_idx" ON "RewardRedemption"("userId");

-- ============================================================
-- 8. BẢNG POINT_TRANSACTION (Giao dịch điểm)
-- Chức năng: Tích điểm khi hoàn thành, trừ điểm khi đổi thưởng
-- type: earn | redeem | admin_adjust
-- ============================================================
CREATE TABLE IF NOT EXISTS "PointTransaction" (
    id            TEXT PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    amount        INTEGER NOT NULL,
    type          TEXT NOT NULL,
    description   TEXT,
    "referenceId" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PointTransaction_userId_idx" ON "PointTransaction"("userId");

-- ============================================================
-- DỮ LIỆU MẪU (Tùy chọn - bỏ comment để chạy)
-- ============================================================

/*
-- Loại rác mẫu
INSERT INTO "WasteType" (id, name, description, "pointsPerKg", "isActive") VALUES
    ('wt_nhua', 'Nhựa', 'Chai nhựa, túi nilon, hộp nhựa', 50, true),
    ('wt_giay', 'Giấy', 'Sách báo, thùng carton', 30, true),
    ('wt_kimloai', 'Kim loại', 'Sắt, nhôm, đồng', 80, true),
    ('wt_thuytinh', 'Thủy tinh', 'Chai lọ thủy tinh', 20, true);

-- Phần thưởng mẫu
INSERT INTO "Reward" (id, name, description, "pointsCost", quantity, "isActive") VALUES
    ('rw_1', 'Voucher 50k', 'Giảm 50.000đ đơn hàng', 500, 100, true),
    ('rw_2', 'Voucher 100k', 'Giảm 100.000đ đơn hàng', 900, 50, true);
*/
