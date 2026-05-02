import { useState, useEffect } from 'react';
import { users } from '../goiAPI';

export default function TrangCaNhan() {
  const [profile, setProfile] = useState(null);
  const [sua, setSua] = useState({ email: '', fullName: '', phone: '', address: '' });
  const [matKhau, setMatKhau] = useState({ current: '', new: '' });
  const [thongBaoMsg, setThongBaoMsg] = useState('');

  useEffect(() => {
    users.getProfile().then(setProfile).catch(console.error);
  }, []);

  useEffect(() => {
    if (profile) {
      setSua({
        email: profile.email || '',
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const luuThongTin = async (e) => {
    e.preventDefault();
    try {
      await users.updateProfile(sua);
      setProfile({ ...profile, ...sua });
      setThongBaoMsg('Đã cập nhật');
    } catch (ex) {
      setThongBaoMsg(ex.message);
    }
  };

  const doiMatKhau = async (e) => {
    e.preventDefault();
    try {
      await users.changePassword(matKhau.current, matKhau.new);
      setThongBaoMsg('Đã đổi mật khẩu thành công');
      setMatKhau({ current: '', new: '' });
    } catch (ex) {
      setThongBaoMsg(ex.message);
    }
  };

  if (!profile) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div className="khung-form">
      <div className="khung-form__card">
        <h1 id="thong-tin" className="khung-form__tieu-de">
          <span className="khung-form__tieu-de-icon">👤</span>
          Thông tin tài khoản
        </h1>
        {thongBaoMsg && (
          <div className={thongBaoMsg.includes('Đã') ? 'thong-bao-thanh-cong' : 'thong-bao-loi'}>{thongBaoMsg}</div>
        )}

        <form onSubmit={luuThongTin} className="form-gap" style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label className="form-group__nhan">Email</label>
            <input
              value={sua.email}
              onChange={(e) => setSua({ ...sua, email: e.target.value })}
              className="form-group__input"
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Họ tên</label>
            <input
              value={sua.fullName}
              onChange={(e) => setSua({ ...sua, fullName: e.target.value })}
              className="form-group__input"
              placeholder="Họ và tên"
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Số điện thoại</label>
            <input
              value={sua.phone}
              onChange={(e) => setSua({ ...sua, phone: e.target.value })}
              className="form-group__input"
              placeholder="Số điện thoại"
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Địa chỉ</label>
            <input
              value={sua.address}
              onChange={(e) => setSua({ ...sua, address: e.target.value })}
              className="form-group__input"
              placeholder="Địa chỉ"
            />
          </div>
          <button type="submit" className="nut-chinh">Cập nhật thông tin</button>
        </form>

        <h2 id="doi-mat-khau" className="khung-luong__tieu-de" style={{ marginBottom: '1rem' }}>Đổi mật khẩu</h2>
        <form onSubmit={doiMatKhau} className="form-gap">
          <div className="form-group">
            <label className="form-group__nhan">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={matKhau.current}
              onChange={(e) => setMatKhau({ ...matKhau, current: e.target.value })}
              className="form-group__input"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div className="form-group">
            <label className="form-group__nhan">Mật khẩu mới</label>
            <input
              type="password"
              value={matKhau.new}
              onChange={(e) => setMatKhau({ ...matKhau, new: e.target.value })}
              className="form-group__input"
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <button type="submit" className="nut-chinh">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}
