import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/NguoiDungContext';

const NHAN_PHAN = { fullName: 'Họ tên', email: 'Email', phone: 'Số điện thoại', address: 'Địa chỉ', password: 'Mật khẩu' };

export default function DangKy() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '' });
  const [loi, setLoi] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const xuLyGui = async (e) => {
    e.preventDefault();
    setLoi('');
    try {
      await register(form);
      navigate('/');
    } catch (ex) {
      const msg = ex.message || 'Đăng ký thất bại';
      setLoi(msg.includes('fetch') || msg.includes('Failed') ? 'Không kết nối được server. Kiểm tra backend đã chạy (port 3001).' : msg);
    }
  };

  return (
    <div className="khung-dang-nhap">
      <div className="khung-dang-nhap__card">
        <div className="khung-dang-nhap__icon">📝</div>
        <h1 className="khung-dang-nhap__tieu-de">Đăng ký tài khoản</h1>
        <form onSubmit={xuLyGui} className="form-gap">
          {loi && <div className="thong-bao-loi">{loi}</div>}
          {Object.keys(NHAN_PHAN).map((key) => (
            <div key={key} className="form-group">
              <label className="form-group__nhan">{NHAN_PHAN[key]}</label>
              <input
                type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="form-group__input"
                placeholder={`Nhập ${NHAN_PHAN[key].toLowerCase()}`}
                required={['fullName', 'email', 'password'].includes(key)}
              />
            </div>
          ))}
          <button type="submit" className="nut-chinh nut-chinh--day">Đăng ký</button>
        </form>
        <p className="van-ban-phu" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          Đã có tài khoản? <Link to="/dang-nhap" className="lien-ket">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
