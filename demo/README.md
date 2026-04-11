# Hệ thống Thu gom Rác Tái chế Thông minh - Tích hợp AI

Ứng dụng web hỗ trợ thu gom rác tái chế với AI nhận diện loại rác và cơ chế tích điểm đổi thưởng.

## Công nghệ

- **Backend**: Node.js, Express, Prisma, SQLite
- **Frontend**: React, Vite, Tailwind CSS

## Cài đặt

```bash
# Cài dependencies
npm install

# Thiết lập database và seed
cd backend && npm install && npx prisma generate && npx prisma db push && node prisma/seed.js

# Chạy
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@recycling.vn | admin123 |
| Nhân viên | staff@recycling.vn | staff123 |

## Chức năng theo vai trò

### Khách vãng lai (Guest)
- Xem thông tin hệ thống, hướng dẫn phân loại rác
- Đăng ký, đăng nhập

### Khách hàng (Customer)
- Quản lý tài khoản (xem, cập nhật, đổi mật khẩu)
- Tạo yêu cầu thu gom (loại rác, số lượng, địa chỉ, ảnh - AI nhận diện tùy chọn)
- Theo dõi và hủy yêu cầu
- Xem điểm, lịch sử tích/sử dụng điểm
- Đổi thưởng

### Nhân viên (Staff)
- Xem danh sách yêu cầu, nhận yêu cầu
- Thu gom và xác minh (loại, khối lượng)
- Cập nhật trạng thái: Pending → Collecting → Completed
- Thống kê theo ngày/tuần/tháng

### Quản trị viên (Admin)
- Quản lý người dùng (CRUD, khóa, phân quyền)
- Quản lý loại rác (CRUD, cấu hình điểm)
- Quản lý phần thưởng (CRUD, điểm đổi)
"# demo" 
