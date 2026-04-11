import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/NguoiDungContext';

export default function DangNhap() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const xuLyGui = async (e) => {
    e.preventDefault();
    setLoi('');
    try {
      await login(email, matKhau);
      navigate('/');
    } catch (ex) {
      if (ex.status === 403 || ex.code === 'ACCOUNT_LOCKED') {
        setLoi('Tài khoản đã bị khóa. Vui lòng liên hệ nhân viên để được hỗ trợ.');
        return;
      }
      const msg = ex.message || 'Đăng nhập thất bại';
      if (msg.includes('fetch') || msg.includes('Failed')) {
        setLoi('Không kết nối được server. Kiểm tra backend đã chạy (port 3001).');
        return;
      }
      setLoi(msg);
    }
  };

  return (
    <div className="khung-dang-nhap">
      <div className="khung-dang-nhap__card">
        <div className="khung-dang-nhap__icon">🔐</div>
        <h1 className="khung-dang-nhap__tieu-de">Đăng nhập</h1>
        <form onSubmit={xuLyGui} className="form-gap">
          {loi && <div className="thong-bao-loi">{loi}</div>}
          <div className="form-group">
            <label className="form-group__nhan">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-group__input"
              placeholder="Nhập email của bạn"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Mật khẩu</label>
            <input
              type="password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className="form-group__input"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button type="submit" className="nut-chinh nut-chinh--day">
            Đăng nhập
          </button>
        </form>
        <p className="van-ban-phu" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/khoi-phuc-mat-khau" className="lien-ket">Quên mật khẩu?</Link>
        </p>
        <p className="van-ban-phu" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          Chưa có tài khoản? <Link to="/dang-ky" className="lien-ket">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
