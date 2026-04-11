import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collections } from '../goiAPI';

const TRANG_THAI = { PENDING: 'Chờ xử lý', COLLECTING: 'Đang thu gom', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

const BO_LOC = [
  { key: '', label: 'Tất cả' },
  { key: 'PENDING', label: TRANG_THAI.PENDING },
  { key: 'COLLECTING', label: TRANG_THAI.COLLECTING },
  { key: 'COMPLETED', label: TRANG_THAI.COMPLETED },
  { key: 'CANCELLED', label: TRANG_THAI.CANCELLED },
];

export default function YeuCauCuaToi() {
  /** Toàn bộ yêu cầu (một lần gọi API); lọc trạng thái thực hiện trên client để luôn ổn định */
  const [tatCa, setTatCa] = useState([]);
  const [locTrangThai, setLocTrangThai] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      const data = await collections.my();
      setTatCa(Array.isArray(data) ? data : []);
    } catch (ex) {
      setLoi(ex.message || 'Không tải được danh sách');
      setTatCa([]);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    taiDuLieu();
  }, [taiDuLieu]);

  const danhSach = useMemo(() => {
    if (!locTrangThai) return tatCa;
    return tatCa.filter((r) => r.status === locTrangThai);
  }, [tatCa, locTrangThai]);

  const huy = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy?')) return;
    try {
      await collections.cancel(id);
      setTatCa((l) => l.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
    } catch (ex) {
      alert(ex.message);
    }
  };

  const layLopTrangThai = (status) => {
    if (status === 'COMPLETED') return 'nhan-trang-thai nhan-trang-thai--hoan-thanh';
    if (status === 'CANCELLED') return 'nhan-trang-thai nhan-trang-thai--huy';
    return 'nhan-trang-thai nhan-trang-thai--cho';
  };

  return (
    <div className="khung-form">
      <div className="dau-trang">
        <div>
          <h1 className="tieu-de-trang">Theo dõi yêu cầu thu gom</h1>
          <p className="van-ban-phu" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
            Xem danh sách, trạng thái và chi tiết từng yêu cầu; hủy khi còn ở trạng thái chờ xử lý.
          </p>
        </div>
        <Link to="/tao-yeu-cau" className="nut-chinh">+ Tạo yêu cầu mới</Link>
      </div>

      <div className="bo-loc-trang-thai" role="tablist" aria-label="Lọc theo trạng thái">
        {BO_LOC.map((b) => (
          <button
            key={b.key || 'all'}
            type="button"
            role="tab"
            aria-selected={locTrangThai === b.key}
            className={`bo-loc-trang-thai__nut ${locTrangThai === b.key ? 'bo-loc-trang-thai__nut--chon' : ''}`}
            onClick={() => setLocTrangThai(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loi && (
        <div className="khung-loi-tai" style={{ marginBottom: '1rem' }}>
          {loi}
          <button type="button" className="nut-phu" style={{ marginLeft: '0.75rem' }} onClick={() => taiDuLieu()}>
            Thử lại
          </button>
        </div>
      )}

      {dangTai && <div className="dang-tai">Đang tải danh sách...</div>}

      {!dangTai && !loi && (
      <div className="danh-sach-the">
        {danhSach.map((r) => (
          <div key={r.id} className="the">
            <div className="the__noi-dung">
              <h3 className="the__tieu-de">
                <Link to={`/yeu-cau/${r.id}`}>{r.wasteType?.name} – {r.quantity} kg</Link>
              </h3>
              <p className="the__mo-ta">{r.address}</p>
              <span className={layLopTrangThai(r.status)}>{TRANG_THAI[r.status]}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to={`/yeu-cau/${r.id}`} className="nut-phu">Xem chi tiết</Link>
              {r.status === 'PENDING' && (
                <button type="button" onClick={() => huy(r.id)} className="nut-nguy-hiem">Hủy</button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
      {!dangTai && !loi && danhSach.length === 0 && (
        <div className="khung-form__card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="van-ban-trong" style={{ marginBottom: '1rem' }}>
            {locTrangThai ? 'Không có yêu cầu nào với trạng thái đã chọn.' : 'Chưa có yêu cầu nào.'}
          </p>
          <Link to="/tao-yeu-cau" className="nut-chinh">Tạo yêu cầu đầu tiên</Link>
        </div>
      )}
    </div>
  );
}
