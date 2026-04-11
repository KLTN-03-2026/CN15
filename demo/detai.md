# HỆ THỐNG THU GOM RÁC TÁI CHẾ THÔNG MINH TÍCH HỢP AI

## 1. Tổng quan

Hệ thống hỗ trợ người dùng tạo yêu cầu thu gom rác, 
nhân viên thực hiện thu gom và xác minh, 
kết hợp AI để hỗ trợ phân loại rác và cơ chế tích điểm đổi thưởng.

---

# 2. Actor trong hệ thống

- Khách vãng lai (Guest)
- Khách hàng (Customer)
- Nhân viên (Staff)
- Quản trị viên (Admin)

---

# 3. Chức năng chi tiết

## 3.1. Khách vãng lai (Guest)

- Xem thông tin hệ thống  
- Xem hướng dẫn phân loại rác  
- Đăng ký tài khoản  
- Đăng nhập  

---

## 3.2. Khách hàng (Customer)

### 3.2.1. Quản lý tài khoản cá nhân
- Xem thông tin cá nhân  
- Cập nhật thông tin  
- Đổi mật khẩu  

---
## 3.2.1.11. Chức năng quên mật khẩu
User nhập email
 Hệ thống gửi link (token)
User bấm link
Nhập mật khẩu mới
Cập nhật password

### 3.2.2. Tạo yêu cầu thu gom rác
- Nhập loại rác, số lượng  
- Nhập địa chỉ thu gom  
- Tải ảnh rác (tùy chọn)  
- AI hỗ trợ nhận diện (tùy chọn) ở chức năng này nếu up ảnh lên thì AI hỗ trợ phân tích loại rác rồi tự điền vào nhập loại rác. 
- Xác nhận và gửi yêu cầu  

---

### 3.2.3. Theo dõi yêu cầu
- Xem danh sách yêu cầu  
- Xem chi tiết yêu cầu  
- Xem trạng thái  
- Hủy yêu cầu (nếu chưa xử lý)  

---

### 3.2.4. Quản lý điểm
- Xem tổng điểm  
- Xem lịch sử tích điểm  
- Xem lịch sử sử dụng điểm  
- Xem bảng quy đổi điểm

---

### 3.2.5. Đổi thưởng
- Xem danh sách phần thưởng  
- Kiểm tra điểm  
- Thực hiện đổi thưởng  
- Xem lịch sử đổi thưởng  
  ### 3.2.6 Thống kê cá nhân
   - Tổng quan

Tổng số lần gửi yêu cầu

Tổng kg rác đã thu gom

Tổng điểm đã nhận

Tổng điểm đã dùng

- Theo loại rác

Nhựa: xx kg

Kim loại: xx kg

Giấy: xx kg

   - Theo thời gian

Theo ngày / tuần / tháng

Biểu đồ (chart)

---

## 3.3. Nhân viên (Staff)

### 3.3.1. Quản lý tài khoản
- Đăng nhập  
- Đăng xuất  

---

### 3.3.2. Xử lý yêu cầu thu gom
- Xem danh sách yêu cầu  
- Xem chi tiết yêu cầu  
- Nhận yêu cầu  
- Cập nhật trạng thái

---

### 3.3.3. Thu gom và xác minh
- Thu gom rác  
- Xác minh loại rác  
- Xác minh khoi lượng thực tế  

---

### 3.3.5. Thống kê và báo cáo

- Thống kê số lượng yêu cầu thu gom
- Xem hiệu xuất thu gom
- Thống kê khối lượng rác  
- Thống kê theo loại rác  
-  Báo cáo theo ngày / tuần / tháng  

---

## 3.4. Quản trị viên (Admin)

### 3.4.1. Quản lý tài khoản
- Đăng nhập  
- Đăng xuất  

---

### 3.4.2. Quản lý người dùng
- Xem danh sách  
- Xem chi tiết  
- Cập nhật thông tin  
- Khóa / mở khóa  
- Xóa tài khoản  
- thêm tài khoản

---

### 3.4.3. Quản lý phân quyền
- Gán vai trò (Customer / Staff / Admin)  
- Cập nhật quyền  
- Phân quyền truy cập chức năng
- Kiểm soát quyền theo vai trò

---

### 3.4.4. Quản lý loại rác
- xem danh sách loại rác
- Thêm loại rác  
- Sửa loại rác  
- Xóa loại rác  
- Cấu hình điểm  

---

### 3.4.5. Quản lý phần thưởng
- xem danh sách phần thưởng
- Thêm phần thưởng  
- Sửa phần thưởng  
- Xóa phần thưởng  
- Cấu hình điểm đổi  

---

# 4. Luồng hoạt động chính

User tạo yêu cầu →  
Nhân viên nhận →  
Thu gom và xác minh →  
Cập nhật hoàn thành →  
Hệ thống tính điểm →  
User đổi thưởng  

---

# 5. Ghi chú

- AI chỉ đóng vai trò hỗ trợ nhận diện rác  
- Người dùng có thể nhập thủ công loại rác  
- Điểm chỉ được cộng khi yêu cầu hoàn thành  