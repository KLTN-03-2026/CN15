import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/NguoiDungContext';
import { thongBao } from '../goiAPI';

export default function BoCuc() {
  const { user, logout } = useAuth();
  const [soThongBaoChuaDoc, setSoThongBaoChuaDoc] = useState(0);

  useEffect(() => {
    if (!user || !['CUSTOMER', 'STAFF', 'ADMIN'].includes(user.role)) return;
    const capNhat = () => thongBao.soChuaDoc().then((d) => setSoThongBaoChuaDoc(d.count ?? 0)).catch(() => {});
    capNhat();
    window.addEventListener('notifications-updated', capNhat);
    return () => window.removeEventListener('notifications-updated', capNhat);
  }, [user?.role]);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const hash = location.hash;

  const xuLyDangXuat = () => {
    logout();
    navigate('/');
  };

  // Chức năng phụ - hiện khi đang ở trang khách hàng tương ứng
  const hienThanhPhu = user?.role === 'CUSTOMER' && (
    path.startsWith('/yeu-cau') ||
    path.startsWith('/tao-yeu-cau') ||
    path.startsWith('/diem') ||
    path.startsWith('/doi-thuong') ||
    path.startsWith('/tai-khoan')
  ) && !path.startsWith('/thong-bao');

  const trongYeuCau = path.startsWith('/yeu-cau') || path.startsWith('/tao-yeu-cau');
  const trongDiem = path.startsWith('/diem');
  const trongDoiThuong = path.startsWith('/doi-thuong');
  const trongTaiKhoan = path.startsWith('/tai-khoan');

  const lopTheoVaiTro = (() => {
    if (!user) return { boTrang: 'bo-trang bo-trang--cong-khai', nav: 'thanh-nav thanh-nav--cong-khai' };
    if (user.role === 'CUSTOMER') return { boTrang: 'bo-trang bo-trang--khach-hang', nav: 'thanh-nav thanh-nav--khach-hang' };
    if (user.role === 'ADMIN') return { boTrang: 'bo-trang bo-trang--quan-tri', nav: 'thanh-nav thanh-nav--quan-tri' };
    return { boTrang: 'bo-trang bo-trang--nhan-vien', nav: 'thanh-nav thanh-nav--nhan-vien' };
  })();

  const nhanVaiTro = user?.role === 'CUSTOMER'
    ? 'Khách hàng'
    : user?.role === 'ADMIN'
      ? 'Quản trị viên'
      : user?.role === 'STAFF'
        ? 'Nhân viên'
        : '';

  return (
    <div className={lopTheoVaiTro.boTrang} data-vai-tro={user?.role || 'guest'}>
      <nav className={lopTheoVaiTro.nav} aria-label="Điều hướng chính">
        <div className="thanh-nav__noi-dung">
          <div className="thanh-nav__logo-hop">
            <Link to="/" className="thanh-nav__logo">♻️ Thu gom Rác Tái chế</Link>
            {nhanVaiTro && (
              <span className="thanh-nav__bang-vai" title="Vai trò tài khoản">{nhanVaiTro}</span>
            )}
          </div>
          <div className="thanh-nav__menu">
            <Link to="/" className="thanh-nav__link">Trang chủ</Link>
            <Link to="/huong-dan" className="thanh-nav__link">Hướng dẫn</Link>

            {user ? (
              <>
                <span className="thanh-nav__ten">{user.fullName}</span>
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link to="/tao-yeu-cau" className="thanh-nav__link">Tạo yêu cầu</Link>
                    <Link to="/yeu-cau-cua-toi" className="thanh-nav__link">Theo dõi yêu cầu</Link>
                    <Link to="/diem" className="thanh-nav__link">Điểm</Link>
                    <Link to="/doi-thuong" className="thanh-nav__link">Đổi thưởng</Link>
                    <Link to="/thong-ke" className="thanh-nav__link">Thống kê</Link>
                    <Link to="/thong-bao" className="thanh-nav__link" style={{ position: 'relative' }}>
                      Thông báo
                      {soThongBaoChuaDoc > 0 && (
                        <span className="thanh-nav__badge" style={{ position: 'absolute', top: '-4px', right: '-8px', fontSize: '0.7rem', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                          {soThongBaoChuaDoc > 99 ? '99+' : soThongBaoChuaDoc}
                        </span>
                      )}
                    </Link>
                    <Link to="/tai-khoan" className="thanh-nav__link">Tài khoản</Link>
                  </>
                )}
                {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                  <>
                    <Link to="/nhan-vien/nhan-yeu-cau" className="thanh-nav__link">Nhận yêu cầu</Link>
                    <Link to="/nhan-vien/thu-gom-xac-minh" className="thanh-nav__link">Thu gom & Xác minh</Link>
                    <Link to="/thong-bao" className="thanh-nav__link" style={{ position: 'relative' }}>
                      Thông báo
                      {soThongBaoChuaDoc > 0 && (
                        <span className="thanh-nav__badge" style={{ position: 'absolute', top: '-4px', right: '-8px', fontSize: '0.7rem', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                          {soThongBaoChuaDoc > 99 ? '99+' : soThongBaoChuaDoc}
                        </span>
                      )}
                    </Link>
                    <Link to="/nhan-vien/thong-ke" className="thanh-nav__link">Thống kê</Link>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <Link to="/quan-tri/nguoi-dung" className="thanh-nav__link">Người dùng</Link>
                    <Link to="/quan-tri/loai-rac" className="thanh-nav__link">Loại rác</Link>
                    <Link to="/quan-tri/phan-thuong" className="thanh-nav__link">Phần thưởng</Link>
                  </>
                )}
                <button onClick={xuLyDangXuat} className="thanh-nav__nut">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/doi-thuong" className="thanh-nav__link">Đổi thưởng</Link>
                <Link to="/dang-nhap" className="thanh-nav__nut">Đăng nhập</Link>
                <Link to="/dang-ky" className="thanh-nav__nut">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Chức năng phụ - chỉ hiện khi đã click vào chức năng chính */}
      {hienThanhPhu && (
        <div className="thanh-phu thanh-phu--khach-hang">
          <div className="thanh-phu__noi-dung">
            {trongYeuCau && (
              <>
                <Link to="/yeu-cau-cua-toi" className={`thanh-phu__link ${path === '/yeu-cau-cua-toi' || /^\/yeu-cau\/[^/]+$/.test(path) ? 'thanh-phu__link--dang-chon' : ''}`}>
                  Theo dõi yêu cầu
                </Link>
                <Link to="/tao-yeu-cau" className={`thanh-phu__link ${path === '/tao-yeu-cau' ? 'thanh-phu__link--dang-chon' : ''}`}>
                  Tạo yêu cầu mới
                </Link>
              </>
            )}
            {trongDiem && (
              <>
                <a href="#tong-diem" className="thanh-phu__link thanh-phu__link--dang-chon">Tổng điểm</a>
                <a href="#lich-su" className="thanh-phu__link">Lịch sử giao dịch</a>
              </>
            )}
            {trongDoiThuong && (
              <>
                <a href="#phan-thuong" className="thanh-phu__link thanh-phu__link--dang-chon">Danh sách phần thưởng</a>
                <a href="#lich-su-doi" className="thanh-phu__link">Lịch sử đổi thưởng</a>
              </>
            )}
            {trongTaiKhoan && (
              <>
                <a href="#thong-tin" className={`thanh-phu__link ${path === '/tai-khoan' && !hash ? 'thanh-phu__link--dang-chon' : ''}`}>Thông tin cá nhân</a>
                <a href="#doi-mat-khau" className={`thanh-phu__link ${hash === '#doi-mat-khau' ? 'thanh-phu__link--dang-chon' : ''}`}>Đổi mật khẩu</a>
              </>
            )}
          </div>
        </div>
      )}

      <main className="noi-dung-chinh">
        <Outlet />
      </main>
    </div>
  );
}
