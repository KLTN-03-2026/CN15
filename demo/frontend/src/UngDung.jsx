import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { NguoiDungProvider, useAuth } from './context/NguoiDungContext';
import BoCuc from './components/BoCuc';

import TrangChu from './trang/TrangChu';
import HuongDan from './trang/HuongDan';
import DangNhap from './trang/DangNhap';
import DangKy from './trang/DangKy';
import QuenMatKhau from './trang/QuenMatKhau';
import DatLaiMatKhau from './trang/DatLaiMatKhau';

import TrangCaNhan from './trang/TrangCaNhan';
import TrangThongBao from './trang/TrangThongBao';
import TaoYeuCau from './trang/TaoYeuCau';
import YeuCauCuaToi from './trang/YeuCauCuaToi';
import ChiTietYeuCau from './trang/ChiTietYeuCau';
import TrangDiem from './trang/TrangDiem';
import DoiThuong from './trang/DoiThuong';

import XuLyYeuCau from './trang/XuLyYeuCau';
import NhanYeuCau from './trang/NhanYeuCau';
import ThuGomXacMinh from './trang/ThuGomXacMinh';
import ThongKe from './trang/ThongKe';

import QuanTriNguoiDung from './trang/QuanTriNguoiDung';
import QuanTriLoaiRac from './trang/QuanTriLoaiRac';
import QuanTriPhanThuong from './trang/QuanTriPhanThuong';

function LayoutAuth({ children }) {
  return (
    <div className="bo-trang">
      <nav className="thanh-nav">
        <div className="thanh-nav__noi-dung">
          <Link to="/" className="thanh-nav__logo">♻️ Thu gom Rác Tái chế</Link>
          <div className="thanh-nav__menu">
            <Link to="/" className="thanh-nav__link">Trang chủ</Link>
            <Link to="/dang-nhap" className="thanh-nav__nut">Đăng nhập</Link>
          </div>
        </div>
      </nav>
      <main className="noi-dung-chinh">{children}</main>
    </div>
  );
}

function TuyenRieng({ children, vaiTro }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="dang-tai">Đang tải...</div>;
  if (!user) return <Navigate to="/dang-nhap" />;
  if (vaiTro && !vaiTro.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function CacTuyen() {
  return (
    <Routes>
      <Route path="/khoi-phuc-mat-khau" element={<LayoutAuth><QuenMatKhau /></LayoutAuth>} />
      <Route path="/dat-lai-mat-khau" element={<LayoutAuth><DatLaiMatKhau /></LayoutAuth>} />
      <Route path="/" element={<BoCuc />}>
        <Route path="dang-nhap" element={<DangNhap />} />
        <Route path="dang-ky" element={<DangKy />} />
        <Route path="huong-dan" element={<HuongDan />} />
        <Route index element={<TrangChu />} />

        <Route path="tai-khoan" element={<TuyenRieng vaiTro={['CUSTOMER', 'ADMIN']}><TrangCaNhan /></TuyenRieng>} />
        <Route path="thong-bao" element={<TuyenRieng vaiTro={['CUSTOMER', 'STAFF', 'ADMIN']}><TrangThongBao /></TuyenRieng>} />
        <Route path="tao-yeu-cau" element={<TuyenRieng vaiTro={['CUSTOMER']}><TaoYeuCau /></TuyenRieng>} />
        <Route path="yeu-cau-cua-toi" element={<TuyenRieng vaiTro={['CUSTOMER']}><YeuCauCuaToi /></TuyenRieng>} />
        <Route path="theo-doi-yeu-cau" element={<Navigate to="/yeu-cau-cua-toi" replace />} />
        <Route path="yeu-cau/:id" element={<TuyenRieng><ChiTietYeuCau /></TuyenRieng>} />
        <Route path="diem" element={<TuyenRieng vaiTro={['CUSTOMER']}><TrangDiem /></TuyenRieng>} />
        <Route path="thong-ke" element={<TuyenRieng vaiTro={['CUSTOMER']}><ThongKe variant="customer" /></TuyenRieng>} />
        <Route path="doi-thuong" element={<DoiThuong />} />

        <Route path="nhan-vien/xu-ly" element={<TuyenRieng vaiTro={['STAFF', 'ADMIN']}><XuLyYeuCau /></TuyenRieng>} />
        <Route path="nhan-vien/nhan-yeu-cau" element={<TuyenRieng vaiTro={['STAFF', 'ADMIN']}><NhanYeuCau /></TuyenRieng>} />
        <Route path="nhan-vien/thu-gom-xac-minh" element={<TuyenRieng vaiTro={['STAFF', 'ADMIN']}><ThuGomXacMinh /></TuyenRieng>} />
        <Route path="nhan-vien/thong-ke" element={<TuyenRieng vaiTro={['STAFF', 'ADMIN']}><ThongKe /></TuyenRieng>} />

        <Route path="quan-tri/nguoi-dung" element={<TuyenRieng vaiTro={['ADMIN']}><QuanTriNguoiDung /></TuyenRieng>} />
        <Route path="quan-tri/loai-rac" element={<TuyenRieng vaiTro={['ADMIN']}><QuanTriLoaiRac /></TuyenRieng>} />
        <Route path="quan-tri/phan-thuong" element={<TuyenRieng vaiTro={['ADMIN']}><QuanTriPhanThuong /></TuyenRieng>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function UngDung() {
  return (
    <NguoiDungProvider>
      <CacTuyen />
    </NguoiDungProvider>
  );
}
