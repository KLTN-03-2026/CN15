import { useState, useEffect } from 'react';
import { users } from '../goiAPI';

const VAI_TRO = { CUSTOMER: 'Khách hàng', STAFF: 'Nhân viên', ADMIN: 'Quản trị' };

export default function QuanTriNguoiDung() {
  const [danhSach, setDanhSach] = useState([]);
  const [chiTiet, setChiTiet] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '', role: 'CUSTOMER' });
  const [hienModal, setHienModal] = useState(false);
  const [thongBao, setThongBao] = useState('');

  useEffect(() => {
    users.list().then(setDanhSach);
  }, []);

  const moThem = () => {
    setForm({ email: '', password: '', fullName: '', phone: '', address: '', role: 'CUSTOMER' });
    setChiTiet(null);
    setHienModal(true);
  };

  const moSua = (u) => {
    setChiTiet(u);
    setForm({ fullName: u.fullName, phone: u.phone || '', address: u.address || '', role: u.role, isLocked: u.isLocked });
    setHienModal(true);
  };

  const luu = async (e) => {
    e.preventDefault();
    setThongBao('');
    try {
      if (chiTiet) {
        await users.update(chiTiet.id, { fullName: form.fullName, phone: form.phone, address: form.address, role: form.role, isLocked: form.isLocked });
      } else {
        await users.create(form);
      }
      setHienModal(false);
      users.list().then(setDanhSach);
    } catch (ex) {
      setThongBao(ex.message);
    }
  };

  const xoa = async (id) => {
    if (!confirm('Xóa tài khoản?')) return;
    try {
      await users.delete(id);
      users.list().then(setDanhSach);
    } catch (ex) {
      alert(ex.message);
    }
  };

  return (
    <div>
      <div className="dau-trang">
        <h1 className="tieu-de-trang">Quản lý người dùng</h1>
        <button onClick={moThem} className="nut-chinh">Thêm tài khoản</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="bang">
          <thead>
            <tr>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {danhSach.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.fullName}</td>
                <td>{VAI_TRO[u.role]}</td>
                <td>{u.points || 0}</td>
                <td>{u.isLocked ? <span style={{ color: 'var(--mau-do)' }}>Khóa</span> : 'Hoạt động'}</td>
                <td>
                  <button onClick={() => moSua(u)} className="lien-ket" style={{ marginRight: '0.5rem' }}>Sửa</button>
                  {u.role !== 'ADMIN' && <button onClick={() => xoa(u.id)} className="lien-ket" style={{ color: 'var(--mau-do)' }}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hienModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal__tieu-de">{chiTiet ? 'Cập nhật' : 'Thêm tài khoản'}</h2>
            {thongBao && <div className="thong-bao-loi">{thongBao}</div>}
            <form onSubmit={luu} className="form-gap">
              {!chiTiet && (
                <>
                  <div className="form-group">
                    <label className="form-group__nhan">Email *</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-group__input" type="email" required placeholder="vd: user@email.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-group__nhan">Mật khẩu</label>
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-group__input" type="password" placeholder="Để trống = 123456" />
                  </div>
                  <div className="form-group">
                    <label className="form-group__nhan">Vai trò</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-group__input">
                      {Object.entries(VAI_TRO).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-group__nhan">Họ tên *</label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="form-group__input" required placeholder="Họ và tên" />
              </div>
              <div className="form-group">
                <label className="form-group__nhan">Số điện thoại</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-group__input" />
              </div>
              {chiTiet && (
                <>
                  <div className="form-group">
                    <label className="form-group__nhan">Địa chỉ</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-group__input" />
                  </div>
                  <div className="form-group">
                    <label className="form-group__nhan">Vai trò</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-group__input">
                      {Object.entries(VAI_TRO).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <label className="checkbox-wrapper">
                    <input type="checkbox" checked={form.isLocked} onChange={(e) => setForm({ ...form, isLocked: e.target.checked })} />
                    Khóa tài khoản
                  </label>
                </>
              )}
              <div className="modal__nut">
                <button type="submit" className="nut-chinh">Lưu</button>
                <button type="button" onClick={() => setHienModal(false)} className="nut-phu">Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
