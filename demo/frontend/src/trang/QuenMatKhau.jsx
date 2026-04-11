import { useState } from 'react';
import { Link } from 'react-router-dom';
import { xacThuc } from '../goiAPI';

export default function QuenMatKhau() {
  const [email, setEmail] = useState('');
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangGui, setDangGui] = useState(false);

  const xuLyGui = async (e) => {
    e.preventDefault();
    setLoi('');
    setThanhCong(false);
    setResetLink('');
    setThongBao('');
    setDangGui(true);
    try {
      const r = await xacThuc.quenMatKhau(email);
      setThanhCong(true);
      setThongBao(r.message || '');
      if (r.resetLink) setResetLink(r.resetLink);
    } catch (ex) {
      setLoi(ex.message || 'Có lỗi xảy ra. Kiểm tra kết nối hoặc thử lại sau.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="khung-dang-nhap">
      <div className="khung-dang-nhap__card">
        <div className="khung-dang-nhap__icon">🔑</div>
        <h1 className="khung-dang-nhap__tieu-de">Quên mật khẩu</h1>
        {thanhCong ? (
          <div className="form-gap">
            <div className="thong-bao-thanh-cong" style={{ padding: '1rem' }}>
              {resetLink ? 'Link đặt lại mật khẩu đã được tạo. Bấm vào link bên dưới:' : thongBao}
            </div>
            {resetLink && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#166534' }}>
                  Bấm vào link sau để đặt mật khẩu mới:
                </p>
                <a href={resetLink} className="lien-ket" style={{ wordBreak: 'break-all', display: 'block' }}>
                  {resetLink}
                </a>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#15803d' }}>
                  Link có hiệu lực 1 giờ.
                </p>
              </div>
            )}
            <Link to="/dang-nhap" className="nut-chinh nut-chinh--day" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <p className="van-ban-phu" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              Nhập email đăng ký để nhận link đặt lại mật khẩu.
            </p>
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
              <button type="submit" disabled={dangGui} className="nut-chinh nut-chinh--day">
                {dangGui ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
            </form>
            <p className="van-ban-phu" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link to="/dang-nhap" className="lien-ket">Quay lại đăng nhập</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
