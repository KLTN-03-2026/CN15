import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collections, wasteTypes } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

/**
 * Chức năng Nhân viên: Xem và Nhận yêu cầu (detai.md 3.3.2)
 * - Xem danh sách yêu cầu PENDING
 * - Lọc theo ngày, địa chỉ, loại rác
 * - Xem chi tiết
 * - Nhận yêu cầu (PENDING → COLLECTING)
 */
export default function NhanYeuCau() {
  const { user } = useAuth();
  const [danhSach, setDanhSach] = useState([]);
  const [loaiRac, setLoaiRac] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({ date: '', address: '', wasteTypeId: '' });

  useEffect(() => {
    wasteTypes.list(true).then(setLoaiRac);
  }, []);

  useEffect(() => {
    setDangTai(true);
    const loc = {};
    if (boLoc.date) loc.date = boLoc.date;
    if (boLoc.address?.trim()) loc.address = boLoc.address.trim();
    if (boLoc.wasteTypeId) loc.wasteTypeId = boLoc.wasteTypeId;
    collections.list('PENDING', Object.keys(loc).length ? loc : undefined).then(setDanhSach).finally(() => setDangTai(false));
  }, [boLoc.date, boLoc.address, boLoc.wasteTypeId]);

  const nhanYeuCau = async (id) => {
    if (!confirm('Bạn có chắc muốn nhận yêu cầu này?')) return;
    try {
      await collections.accept(id);
      setDanhSach((list) => list.filter((r) => r.id !== id));
    } catch (ex) {
      alert(ex.message);
    }
  };

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div>
      <h1 className="tieu-de-trang">Xem và Nhận yêu cầu</h1>
      <p className="van-ban-phu" style={{ marginBottom: '1rem' }}>
        Danh sách yêu cầu đang chờ. Nhấn <strong>Nhận yêu cầu</strong> để bắt đầu thu gom.
      </p>

      <div className="khung-loc" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--mau-nen-phu)', borderRadius: '8px' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Lọc theo ngày thu gom</label>
          <input
            type="date"
            value={boLoc.date}
            onChange={(e) => setBoLoc((p) => ({ ...p, date: e.target.value }))}
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '180px', flex: 1 }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Lọc theo địa chỉ</label>
          <input
            type="text"
            value={boLoc.address}
            onChange={(e) => setBoLoc((p) => ({ ...p, address: e.target.value }))}
            placeholder="Tìm theo địa chỉ..."
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Lọc theo loại rác</label>
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
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setBoLoc({ date: '', address: '', wasteTypeId: '' })}
            className="nut-phu"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="danh-sach-the">
        {danhSach.map((r) => (
          <div key={r.id} className="the">
            <div className="the__noi-dung">
              <h3 className="the__tieu-de">
                <Link to={`/yeu-cau/${r.id}`}>{r.wasteType?.name} - {r.quantity}kg</Link>
              </h3>
              <p className="the__mo-ta">{r.address}</p>
              <p className="the__phu">Khách: {r.customer?.fullName}</p>
              {r.desiredCollectionDate && (
                <p className="the__phu" style={{ marginTop: '0.25rem' }}>
                  📅 Ngày thu gom: <strong>{new Date(r.desiredCollectionDate).toLocaleDateString('vi-VN')}</strong>
                </p>
              )}
              <span className="nhan-trang-thai nhan-trang-thai--cho">Chờ xử lý</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to={`/yeu-cau/${r.id}`} className="nut-phu">
                Xem chi tiết
              </Link>
              <button onClick={() => nhanYeuCau(r.id)} className="nut-chinh">
                Nhận yêu cầu
              </button>
            </div>
          </div>
        ))}
      </div>
      {danhSach.length === 0 && (
        <p className="van-ban-trong">
          {boLoc.date || boLoc.address?.trim() || boLoc.wasteTypeId
            ? 'Không có yêu cầu nào phù hợp bộ lọc. Thử đổi điều kiện hoặc xóa bộ lọc.'
            : <>Không có yêu cầu nào đang chờ. Yêu cầu đã nhận nằm ở mục <Link to="/nhan-vien/thu-gom-xac-minh">Thu gom và Xác minh</Link>.</>}
        </p>
      )}
    </div>
  );
}
