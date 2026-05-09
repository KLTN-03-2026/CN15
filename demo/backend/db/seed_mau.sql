-- ============================================================
-- DỮ LIỆU MẪU - Thiết kế theo mẫu ERD
-- Chạy SAU khi đã chạy init_mau.sql
-- ============================================================

-- Authority (ROLE_CUSTOMER, ROLE_STAFF, ROLE_ADMIN)
INSERT INTO authority (name) VALUES
    ('ROLE_CUSTOMER'),
    ('ROLE_STAFF'),
    ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Loại rác (chạy 1 lần - nếu chạy lại sẽ thêm bản ghi trùng)
INSERT INTO waste_type (name, description, points_per_kg, is_active) VALUES
    ('Nhựa', 'Chai nhựa, túi nilon, hộp nhựa', 50, true),
    ('Giấy', 'Sách báo, thùng carton', 30, true),
    ('Kim loại', 'Sắt, nhôm, đồng', 80, true),
    ('Thủy tinh', 'Chai lọ thủy tinh', 20, true);

-- Phần thưởng
INSERT INTO reward (name, description, points_cost, quantity, is_active) VALUES
    ('Voucher 50.000đ', 'Giảm 50.000đ đơn hàng', 500, 100, true),
    ('Voucher 100.000đ', 'Giảm 100.000đ đơn hàng', 900, 50, true),
    ('Voucher 200.000đ', 'Giảm 200.000đ đơn hàng', 1700, 20, true);
