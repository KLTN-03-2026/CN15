-- ============================================================
-- HỆ THỐNG THU GOM RÁC TÁI CHẾ THÔNG MINH TÍCH HỢP AI
-- Thiết kế CSDL theo mẫu ERD (audit fields, authority, snake_case)
-- Chạy trong DBeaver: kết nối smart_recycling → Execute Script
-- ============================================================

-- ============================================================
-- 1. BẢNG authority (Phân quyền: CUSTOMER, STAFF, ADMIN)
-- ============================================================
CREATE TABLE IF NOT EXISTS authority (
    name VARCHAR(50) PRIMARY KEY
);

-- ============================================================
-- 2. BẢNG user (Actor: Guest, Customer, Staff, Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
    id                  BIGSERIAL PRIMARY KEY,
    login               VARCHAR(50) NOT NULL UNIQUE,
    password_hash       VARCHAR(60) NOT NULL,
    first_name         VARCHAR(50),
    last_name          VARCHAR(50),
    email               VARCHAR(100) NOT NULL UNIQUE,
    phone               VARCHAR(20),
    address             VARCHAR(255),
    image_url           VARCHAR(256),
    activated           BOOLEAN NOT NULL DEFAULT true,
    is_locked           BOOLEAN NOT NULL DEFAULT false,
    lang_key            VARCHAR(5) DEFAULT 'vi',
    points              INTEGER NOT NULL DEFAULT 0,
    created_by          VARCHAR(50),
    created_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by    VARCHAR(50),
    last_modified_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_login ON "user"(login);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- ============================================================
-- 3. BẢNG user_authority (Junction: User - Authority)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_authority (
    user_id          BIGINT NOT NULL,
    authority_name   VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, authority_name),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (authority_name) REFERENCES authority(name)
);

-- ============================================================
-- 4. BẢNG password_reset (Quên mật khẩu)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    reset_key      VARCHAR(50) NOT NULL UNIQUE,
    reset_date     TIMESTAMP,
    expires_at     TIMESTAMP NOT NULL,
    created_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_password_reset_key ON password_reset(reset_key);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset(user_id);

-- ============================================================
-- 5. BẢNG persistent_token (Phiên đăng nhập - tùy chọn)
-- ============================================================
CREATE TABLE IF NOT EXISTS persistent_token (
    series       VARCHAR(20) PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    token_value  VARCHAR(20) NOT NULL,
    token_date   DATE NOT NULL,
    ip_address   VARCHAR(39),
    user_agent   VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. BẢNG waste_type (Loại rác)
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_type (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(255),
    points_per_kg       DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_by          VARCHAR(50),
    created_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by    VARCHAR(50),
    last_modified_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. BẢNG collection_request (Yêu cầu thu gom)
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_request (
    id                  BIGSERIAL PRIMARY KEY,
    customer_id         BIGINT NOT NULL,
    waste_type_id       BIGINT NOT NULL,
    quantity            DOUBLE PRECISION NOT NULL,
    estimated_quantity  DOUBLE PRECISION,
    address             VARCHAR(255) NOT NULL,
    note                TEXT,
    image_url           VARCHAR(256),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    staff_id            BIGINT,
    verified_weight     DOUBLE PRECISION,
    verified_type_id    BIGINT,
    points_earned       INTEGER,
    completed_at        TIMESTAMP,
    created_by          VARCHAR(50),
    created_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by    VARCHAR(50),
    last_modified_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (waste_type_id) REFERENCES waste_type(id),
    FOREIGN KEY (staff_id) REFERENCES "user"(id),
    FOREIGN KEY (verified_type_id) REFERENCES waste_type(id)
);
CREATE INDEX IF NOT EXISTS idx_collection_request_customer ON collection_request(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_request_staff ON collection_request(staff_id);
CREATE INDEX IF NOT EXISTS idx_collection_request_status ON collection_request(status);

-- ============================================================
-- 8. BẢNG status_history (Lịch sử trạng thái)
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
    id             BIGSERIAL PRIMARY KEY,
    request_id     BIGINT NOT NULL,
    status         VARCHAR(20) NOT NULL,
    note           TEXT,
    created_by     VARCHAR(50),
    created_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES collection_request(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_status_history_request ON status_history(request_id);

-- ============================================================
-- 9. BẢNG reward (Phần thưởng đổi điểm)
-- ============================================================
CREATE TABLE IF NOT EXISTS reward (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(255),
    points_cost         INTEGER NOT NULL,
    quantity            INTEGER NOT NULL DEFAULT 0,
    image_url           VARCHAR(256),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_by          VARCHAR(50),
    created_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by    VARCHAR(50),
    last_modified_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. BẢNG reward_redemption (Lịch sử đổi thưởng)
-- ============================================================
CREATE TABLE IF NOT EXISTS reward_redemption (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    reward_id      BIGINT NOT NULL,
    points_spent   INTEGER NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES reward(id)
);
CREATE INDEX IF NOT EXISTS idx_reward_redemption_user ON reward_redemption(user_id);

-- ============================================================
-- 11. BẢNG point_transaction (Giao dịch điểm)
-- ============================================================
CREATE TABLE IF NOT EXISTS point_transaction (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    amount         INTEGER NOT NULL,
    type           VARCHAR(20) NOT NULL,
    description    VARCHAR(255),
    reference_id   BIGINT,
    created_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_point_transaction_user ON point_transaction(user_id);
