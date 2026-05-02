import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { users } from '../goiAPI';

const VAI_TRO = { CUSTOMER: 'Khách hàng', STAFF: 'Nhân viên', ADMIN: 'Quản trị' };

export default function QuanTriNguoiDung() {
  const location = useLocation();
  const navigate = useNavigate();
  const [danhSach, setDanhSach] = useState([]);
  const [boLocVaiTro, setBoLocVaiTro] = useState('');
  const [sapXepTao, setSapXepTao] = useState('desc');
  const [chiTiet, setChiTiet] = useState(null);
  const [lichSuNguoiDung, setLichSuNguoiDung] = useState(null);
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '', role: 'CUSTOMER' });
  const [hienModal, setHienModal] = useState(false);
  const [hienModalLichSu, setHienModalLichSu] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [daMoTuThongBao, setDaMoTuThongBao] = useState(false);

  const taiLaiDanhSach = () => users.list().then(setDanhSach);

  useEffect(() => {
    taiLaiDanhSach();
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('xemTaiKhoan');
    if (!id || daMoTuThongBao || danhSach.length === 0) return;
    const u = danhSach.find((x) => x.id === id);
    if (!u) return;
    setDaMoTuThongBao(true);
    moLichSu(u);
    navigate('/quan-tri/nguoi-dung', { replace: true });
  }, [location.search, daMoTuThongBao, danhSach]);

  const moThem = () => {
    setForm({ email: '', password: '', fullName: '', phone: '', address: '', role: 'CUSTOMER' });
    setChiTiet(null);
    setHienModal(true);
  };

  const moSua = (u) => {
    setChiTiet(u);
    setForm({ email: u.email || '', fullName: u.fullName, phone: u.phone || '', address: u.address || '', role: u.role, isLocked: u.isLocked });
    setHienModal(true);
  };

  const luu = async (e) => {
    e.preventDefault();
    setThongBao('');
    try {
      if (chiTiet) {
        const capNhat = await users.update(chiTiet.id, {
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          role: form.role,
          isLocked: form.isLocked,
        });
        setDanhSach((prev) => prev.map((u) => (u.id === chiTiet.id ? { ...u, ...capNhat } : u)));
        alert('Cập nhật tài khoản thành công.');
      } else {
        await users.create(form);
        alert('Thêm tài khoản thành công.');
      }
      setHienModal(false);
      taiLaiDanhSach();
    } catch (ex) {
      setThongBao(ex.message);
    }
  };

  const xoa = async (id) => {
    if (!confirm('Xóa tài khoản?')) return;
    try {
      await users.delete(id);
      taiLaiDanhSach();
    } catch (ex) {
      alert(ex.message);
    }
  };

  const moLichSu = async (u) => {
    setHienModalLichSu(true);
    setDangTaiLichSu(true);
    setLichSuNguoiDung(null);
    try {
      const data = await users.get(u.id);
      setLichSuNguoiDung(data);
    } catch (ex) {
      setLichSuNguoiDung({ loi: ex.message || 'Không tải được lịch sử hoạt động' });
    } finally {
      setDangTaiLichSu(false);
    }
  };

  const dinhDangNgayGio = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('vi-VN');
  };

  const danhSachHienThi = useMemo(() => {
    const loc = boLocVaiTro ? danhSach.filter((u) => u.role === boLocVaiTro) : danhSach;
    return [...loc].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sapXepTao === 'asc' ? ta - tb : tb - ta;
    });
  }, [danhSach, boLocVaiTro, sapXepTao]);

  return (
    <div>
      <div className="dau-trang">
        <h1 className="tieu-de-trang">Quản lý người dùng</h1>
        <button onClick={moThem} className="nut-chinh">Thêm tài khoản</button>
      </div>
      <div className="khung-loc" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Lọc theo vai trò</label>
          <select
            value={boLocVaiTro}
            onChange={(e) => setBoLocVaiTro(e.target.value)}
            className="form-group__input"
          >
            <option value="">Tất cả vai trò</option>
            {Object.entries(VAI_TRO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Sắp xếp theo thời gian tạo</label>
          <select
            value={sapXepTao}
            onChange={(e) => setSapXepTao(e.target.value)}
            className="form-group__input"
          >
            <option value="desc">Mới nhất trước</option>
            <option value="asc">Cũ nhất trước</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="nut-phu"
            onClick={() => {
              setBoLocVaiTro('');
              setSapXepTao('desc');
            }}
          >
            Xóa lọc/sắp xếp
          </button>
        </div>
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
              <th>Thời gian hoạt động</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {danhSachHienThi.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.fullName}</td>
                <td>{VAI_TRO[u.role]}</td>
                <td>{u.points || 0}</td>
                <td>{u.isLocked ? <span style={{ color: 'var(--mau-do)' }}>Khóa</span> : 'Hoạt động'}</td>
                <td>{dinhDangNgayGio(u.updatedAt || u.createdAt)}</td>
                <td>
                  {(u.role === 'CUSTOMER' || u.role === 'STAFF') && (
                    <button onClick={() => moLichSu(u)} className="lien-ket" style={{ marginRight: '0.5rem' }}>Lịch sử</button>
                  )}
                  <button onClick={() => moSua(u)} className="lien-ket" style={{ marginRight: '0.5rem' }}>Sửa</button>
                  {u.role !== 'ADMIN' && <button onClick={() => xoa(u.id)} className="lien-ket" style={{ color: 'var(--mau-do)' }}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {danhSachHienThi.length === 0 && (
        <p className="van-ban-trong">Không có người dùng phù hợp bộ lọc.</p>
      )}

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
                    <label className="form-group__nhan">Email *</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="form-group__input"
                      type="email"
                      required
                      placeholder="vd: user@email.com"
                    />
                  </div>
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

      {hienModalLichSu && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '42rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <button type="button" className="nut-phu" onClick={() => setHienModalLichSu(false)}>Quay lại</button>
            </div>
            <h2 className="modal__tieu-de">Lịch sử & thời gian hoạt động</h2>
            {dangTaiLichSu && <p className="van-ban-phu">Đang tải...</p>}
            {!dangTaiLichSu && lichSuNguoiDung?.loi && <div className="thong-bao-loi">{lichSuNguoiDung.loi}</div>}
            {!dangTaiLichSu && lichSuNguoiDung && !lichSuNguoiDung.loi && (
              <>
                <div className="khung-chi-tiet" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                  <div className="danh-sach-thong-tin">
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                      <span>Họ tên</span>
                      <strong>{lichSuNguoiDung.fullName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                      <span>Email</span>
                      <strong>{lichSuNguoiDung.email}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                      <span>Vai trò</span>
                      <strong>{VAI_TRO[lichSuNguoiDung.role] || lichSuNguoiDung.role}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                      <span>Tạo tài khoản</span>
                      <strong>{dinhDangNgayGio(lichSuNguoiDung.createdAt)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                      <span>Hoạt động gần nhất</span>
                      <strong>{dinhDangNgayGio(lichSuNguoiDung.lastActiveAt)}</strong>
                    </div>
                  </div>
                </div>
                <div className="khung-chi-tiet" style={{ padding: '1rem' }}>
                  <h3 className="khung-luong__tieu-de" style={{ marginBottom: '0.75rem' }}>Lịch sử hoạt động gần đây</h3>
                  {(lichSuNguoiDung.recentActivities || []).length === 0 ? (
                    <p className="van-ban-phu">Chưa có hoạt động.</p>
                  ) : (
                    <ul className="lich-su-trang-thai">
                      {lichSuNguoiDung.recentActivities.map((a, idx) => (
                        <li key={`${a.kind}-${idx}`} className="lich-su-trang-thai__muc">
                          <span className="lich-su-trang-thai__thoi-gian">{dinhDangNgayGio(a.time)}</span>
                          <span className="lich-su-trang-thai__trang-thai">{a.title}</span>
                          {a.detail ? <span className="lich-su-trang-thai__ghi-chu">{a.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            <div className="modal__nut">
              <button type="button" className="nut-phu" onClick={() => setHienModalLichSu(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
