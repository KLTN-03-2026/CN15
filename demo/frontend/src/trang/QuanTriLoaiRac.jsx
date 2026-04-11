import { useState, useEffect } from 'react';
import { wasteTypes } from '../goiAPI';

export default function QuanTriLoaiRac() {
  const [danhSach, setDanhSach] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', pointsPerKg: '' });
  const [idSua, setIdSua] = useState(null);
  const [thongBao, setThongBao] = useState('');

  useEffect(() => {
    wasteTypes.list(true).then(setDanhSach);
  }, []);

  const luu = async (e) => {
    e.preventDefault();
    setThongBao('');
    try {
      if (idSua) {
        await wasteTypes.update(idSua, form);
      } else {
        await wasteTypes.create(form);
      }
      setIdSua(null);
      setForm({ name: '', description: '', pointsPerKg: '' });
      wasteTypes.list(true).then(setDanhSach);
    } catch (ex) {
      setThongBao(ex.message);
    }
  };

  const xoa = async (id) => {
    if (!confirm('Vô hiệu hóa loại rác?')) return;
    try {
      await wasteTypes.delete(id);
      wasteTypes.list(true).then(setDanhSach);
    } catch (ex) {
      alert(ex.message);
    }
  };

  const batDauSua = (w) => {
    setIdSua(w.id);
    setForm({ name: w.name, description: w.description || '', pointsPerKg: w.pointsPerKg.toString() });
  };

  return (
    <div>
      <h1 className="tieu-de-trang">Quản lý loại rác</h1>
      {thongBao && <div className="thong-bao-loi">{thongBao}</div>}

      <form onSubmit={luu} className="form-hang">
        <div className="form-group">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tên loại rác"
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
            step="0.1"
            value={form.pointsPerKg}
            onChange={(e) => setForm({ ...form, pointsPerKg: e.target.value })}
            placeholder="Điểm/kg"
            className="form-group__input"
          />
        </div>
        <button type="submit" className="nut-chinh">{idSua ? 'Cập nhật' : 'Thêm'}</button>
        {idSua && (
          <button type="button" onClick={() => { setIdSua(null); setForm({ name: '', description: '', pointsPerKg: '' }); }} className="nut-phu">
            Hủy
          </button>
        )}
      </form>

      <table className="bang">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Điểm/kg</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {danhSach.map((w) => (
            <tr key={w.id}>
              <td>{w.name}</td>
              <td>{w.description || '-'}</td>
              <td>{w.pointsPerKg}</td>
              <td>
                <button onClick={() => batDauSua(w)} className="lien-ket" style={{ marginRight: '0.5rem' }}>Sửa</button>
                <button onClick={() => xoa(w.id)} className="lien-ket" style={{ color: 'var(--mau-do)' }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
