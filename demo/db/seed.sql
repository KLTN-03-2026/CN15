-- ============================================================
-- DỮ LIỆU MẪU - Hệ thống thu gom rác tái chế thông minh
-- Chạy SAU khi đã chạy init.sql
-- ============================================================

-- Loại rác (Admin quản lý - 3.4.4)
INSERT INTO "WasteType" (id, name, description, "pointsPerKg", "isActive", "createdAt", "updatedAt") VALUES
    ('wt_nhua', 'Nhựa', 'Chai nhựa, túi nilon, hộp nhựa', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('wt_giay', 'Giấy', 'Sách báo, thùng carton', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('wt_kimloai', 'Kim loại', 'Sắt, nhôm, đồng', 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('wt_thuytinh', 'Thủy tinh', 'Chai lọ thủy tinh', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Phần thưởng (Admin quản lý - 3.4.5)
INSERT INTO "Reward" (id, name, description, "pointsCost", quantity, "isActive", "createdAt", "updatedAt") VALUES
    ('rw_v50k', 'Voucher 50.000đ', 'Giảm 50.000đ đơn hàng', 500, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rw_v100k', 'Voucher 100.000đ', 'Giảm 100.000đ đơn hàng', 900, 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rw_v200k', 'Voucher 200.000đ', 'Giảm 200.000đ đơn hàng', 1700, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rw_cay', 'Đồng hành trồng cây xanh', 'Góp phần trồng 1 cây tại khu vực xanh đô thị', 400, 200, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
