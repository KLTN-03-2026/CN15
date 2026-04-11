import { useState, useEffect } from 'react';
import { rewards } from '../goiAPI';

export default function QuanTriPhanThuong() {
  const [danhSach, setDanhSach] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', pointsCost: '', quantity: '' });
  const [idSua, setIdSua] = useState(null);
  const [thongBao, setThongBao] = useState('');

  useEffect(() => {
    rewards.list(true).then(setDanhSach);
  }, []);

  const luu = async (e) => {
    e.preventDefault();
    setThongBao('');
    try {
      if (idSua) {
        await rewards.update(idSua, { ...form, pointsCost: parseInt(form.pointsCost), quantity: parseInt(form.quantity) });
      } else {
        await rewards.create({ ...form, pointsCost: parseInt(form.pointsCost) || 0, quantity: parseInt(form.quantity) || 0 });
      }
      setIdSua(null);
      setForm({ name: '', description: '', pointsCost: '', quantity: '' });
      rewards.list(true).then(setDanhSach);
    } catch (ex) {
      setThongBao(ex.message);
    }
  };

  const xoa = async (id) => {
    if (!confirm('Vô hiệu hóa phần thưởng?')) return;
    try {
      await rewards.delete(id);
      rewards.list(true).then(setDanhSach);
    } catch (ex) {
      alert(ex.message);
    }
  };

  const batDauSua = (r) => {
    setIdSua(r.id);
    setForm({ name: r.name, description: r.description || '', pointsCost: r.pointsCost.toString(), quantity: r.quantity.toString() });
  };

  return (
    <div>
      <h1 className="tieu-de-trang">Quản lý phần thưởng</h1>
      {thongBao && <div className="thong-bao-loi">{thongBao}</div>}

      <form onSubmit={luu} className="form-hang">
        <div className="form-group">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tên phần thưởng"
            className="form-group__input"
            required
          />
        </div>
        <div className="form-group">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả"
            className="form-group__input"
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            value={form.pointsCost}
            onChange={(e) => setForm({ ...form, pointsCost: e.target.value })}
            placeholder="Điểm đổi"
            className="form-group__input"
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Số lượng"
            className="form-group__input"
          />
        </div>
        <button type="submit" className="nut-chinh">{idSua ? 'Cập nhật' : 'Thêm'}</button>
        {idSua && (
          <button type="button" onClick={() => { setIdSua(null); setForm({ name: '', description: '', pointsCost: '', quantity: '' }); }} className="nut-phu">
            Hủy
          </button>
        )}
      </form>

      <table className="bang">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Điểm đổi</th>
            <th>Số lượng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {danhSach.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.pointsCost}</td>
              <td>{r.quantity}</td>
              <td>
                <button onClick={() => batDauSua(r)} className="lien-ket" style={{ marginRight: '0.5rem' }}>Sửa</button>
                <button onClick={() => xoa(r.id)} className="lien-ket" style={{ color: 'var(--mau-do)' }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
