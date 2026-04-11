import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { xacThuc } from '../goiAPI';

export default function DatLaiMatKhau() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState(false);
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const xuLyGui = async (e) => {
    e.preventDefault();
    setLoi('');
    if (matKhauMoi !== xacNhanMatKhau) {
      setLoi('Mật khẩu xác nhận không khớp');
      return;
    }
    if (matKhauMoi.length < 6) {
      setLoi('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (!token) {
      setLoi('Link không hợp lệ. Vui lòng gửi yêu cầu quên mật khẩu mới.');
      return;
    }
    setDangGui(true);
    try {
      await xacThuc.datLaiMatKhau(token, matKhauMoi);
      setThanhCong(true);
    } catch (ex) {
      setLoi(ex.message || 'Đặt mật khẩu thất bại');
    } finally {
      setDangGui(false);
    }
  };

  if (thanhCong) {
    return (
      <div className="khung-dang-nhap">
        <div className="khung-dang-nhap__card">
          <div className="khung-dang-nhap__icon">✓</div>
          <h1 className="khung-dang-nhap__tieu-de">Đặt mật khẩu thành công</h1>
          <div className="thong-bao-thanh-cong" style={{ padding: '1rem', marginBottom: '1rem' }}>
            Bạn có thể đăng nhập với mật khẩu mới.
          </div>
          <Link to="/dang-nhap" className="nut-chinh nut-chinh--day" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="khung-dang-nhap">
      <div className="khung-dang-nhap__card">
        <div className="khung-dang-nhap__icon">🔒</div>
        <h1 className="khung-dang-nhap__tieu-de">Đặt mật khẩu mới</h1>
        <form onSubmit={xuLyGui} className="form-gap">
          {loi && <div className="thong-bao-loi">{loi}</div>}
          {!tokenFromUrl && (
            <div className="form-group">
              <label className="form-group__nhan">Mã token (từ link email)</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="form-group__input"
                placeholder="Dán token từ link đặt lại mật khẩu"
                required={!tokenFromUrl}
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-group__nhan">Mật khẩu mới</label>
            <input
              type="password"
              value={matKhauMoi}
              onChange={(e) => setMatKhauMoi(e.target.value)}
              className="form-group__input"
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={xacNhanMatKhau}
              onChange={(e) => setXacNhanMatKhau(e.target.value)}
              className="form-group__input"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>
          <button type="submit" disabled={dangGui} className="nut-chinh nut-chinh--day">
            {dangGui ? 'Đang xử lý...' : 'Đặt mật khẩu'}
          </button>
        </form>
        <p className="van-ban-phu" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/khoi-phuc-mat-khau" className="lien-ket">Gửi lại link</Link>
          {' | '}
          <Link to="/dang-nhap" className="lien-ket">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
