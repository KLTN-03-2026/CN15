import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collections, wasteTypes } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

/**
 * Chức năng Nhân viên: Thu gom và Xác minh (detai.md 3.3.3)
 * - Danh sách yêu cầu đã nhận (COLLECTING, staffId = tôi)
 * - Xác minh loại rác, khối lượng thực tế
 * - Hoàn thành
 */
export default function ThuGomXacMinh() {
  const { user } = useAuth();
  const [danhSach, setDanhSach] = useState([]);
  const [loaiRac, setLoaiRac] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXuLy, setDangXuLy] = useState(null);
  const [formTheoId, setFormTheoId] = useState({});
  const [boLoc, setBoLoc] = useState({ wasteTypeId: '', quantityMin: '', quantityMax: '', address: '' });

  useEffect(() => {
    collections.list('COLLECTING').then((list) => {
      const cuaToi = list.filter((r) => r.staffId === user?.id);
      setDanhSach(cuaToi);
      setFormTheoId(Object.fromEntries(cuaToi.map((r) => [r.id, { verifiedWeight: String(r.quantity || ''), verifiedTypeId: r.wasteTypeId || '' }])));
    }).finally(() => setDangTai(false));
    wasteTypes.list(true).then(setLoaiRac);
  }, [user?.id]);

  const capNhatForm = (id, field, value) => {
    setFormTheoId((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const hoanThanh = async (e, r) => {
    e.preventDefault();
    const id = r.id;
    const f = formTheoId[id] || {};
    setDangXuLy(id);
    try {
      await collections.complete(id, {
        verifiedWeight: parseFloat(f.verifiedWeight) || undefined,
        verifiedTypeId: f.verifiedTypeId || undefined,
      });
      setDanhSach((list) => list.filter((x) => x.id !== id));
      setFormTheoId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (ex) {
      alert(ex.message);
    } finally {
      setDangXuLy(null);
    }
  };

  const danhSachHienThi = danhSach.filter((r) => {
    if (boLoc.wasteTypeId && r.wasteTypeId !== boLoc.wasteTypeId) return false;
    const q = parseFloat(r.quantity) || 0;
    if (boLoc.quantityMin) {
      const min = parseFloat(boLoc.quantityMin);
      if (!Number.isNaN(min) && q < min) return false;
    }
    if (boLoc.quantityMax) {
      const max = parseFloat(boLoc.quantityMax);
      if (!Number.isNaN(max) && q > max) return false;
    }
    if (boLoc.address?.trim()) {
      const addr = (r.address || '').toLowerCase();
      if (!addr.includes(boLoc.address.trim().toLowerCase())) return false;
    }
    return true;
  });

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div>
      <h1 className="tieu-de-trang">Thu gom và Xác minh</h1>
      <p className="van-ban-phu" style={{ marginBottom: '1rem' }}>
        Các yêu cầu bạn đã nhận. Sau khi thu gom xong, nhập khối lượng thực tế và loại rác xác minh rồi bấm Hoàn thành.
      </p>

      <div className="khung-loc" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--mau-nen-phu)', borderRadius: '8px' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Loại rác</label>
          <select
            value={boLoc.wasteTypeId}
            onChange={(e) => setBoLoc((p) => ({ ...p, wasteTypeId: e.target.value }))}
            className="form-group__input"
          >
            <option value="">Tất cả loại rác</option>
            {loaiRac.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Khối lượng từ (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={boLoc.quantityMin}
            onChange={(e) => setBoLoc((p) => ({ ...p, quantityMin: e.target.value }))}
            placeholder="Min"
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>đến (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={boLoc.quantityMax}
            onChange={(e) => setBoLoc((p) => ({ ...p, quantityMax: e.target.value }))}
            placeholder="Max"
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '180px', flex: 1 }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Địa chỉ</label>
          <input
            type="text"
            value={boLoc.address}
            onChange={(e) => setBoLoc((p) => ({ ...p, address: e.target.value }))}
            placeholder="Tìm theo địa chỉ..."
            className="form-group__input"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setBoLoc({ wasteTypeId: '', quantityMin: '', quantityMax: '', address: '' })}
            className="nut-phu"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="danh-sach-the">
        {danhSachHienThi.map((r) => (
          <div key={r.id} className="the" style={{ maxWidth: '100%' }}>
            <div className="the__noi-dung">
              <h3 className="the__tieu-de">{r.wasteType?.name} - {r.quantity}kg</h3>
              <p className="the__mo-ta">{r.address}</p>
              <p className="the__phu">Khách: {r.customer?.fullName}</p>
              <span className="nhan-trang-thai nhan-trang-thai--cho">Đang thu gom</span>
            </div>
            <form onSubmit={(e) => hoanThanh(e, r)} className="khung-xac-minh" style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Xác minh và hoàn thành</h4>
              <div className="form-group">
                <label className="form-group__nhan">Khối lượng thực tế (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={(formTheoId[r.id] || {}).verifiedWeight ?? r.quantity}
                  onChange={(e) => capNhatForm(r.id, 'verifiedWeight', e.target.value)}
                  placeholder={r.quantity}
                  className="form-group__input"
                />
              </div>
              <div className="form-group">
                <label className="form-group__nhan">Loại rác xác minh</label>
                <select
                  value={(formTheoId[r.id] || {}).verifiedTypeId || r.wasteTypeId}
                  onChange={(e) => capNhatForm(r.id, 'verifiedTypeId', e.target.value)}
                  className="form-group__input"
                >
                  {loaiRac.map((wt) => (
                    <option key={wt.id} value={wt.id}>{wt.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={dangXuLy === r.id} className="nut-chinh">
                {dangXuLy === r.id ? 'Đang xử lý...' : 'Hoàn thành'}
              </button>
            </form>
            <Link to={`/yeu-cau/${r.id}`} className="lien-ket" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
              Xem chi tiết
            </Link>
          </div>
        ))}
      </div>
      {danhSachHienThi.length === 0 && (
        <p className="van-ban-trong">
          {boLoc.wasteTypeId || boLoc.quantityMin || boLoc.quantityMax || boLoc.address?.trim()
            ? 'Không có yêu cầu nào phù hợp bộ lọc. Thử đổi điều kiện hoặc xóa bộ lọc.'
            : <>Bạn chưa nhận yêu cầu nào. Vào <Link to="/nhan-vien/nhan-yeu-cau">Xem và Nhận yêu cầu</Link> để nhận.</>}
        </p>
      )}
    </div>
  );
}
