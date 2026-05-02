import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rewards } from '../goiAPI';

export default function TrangDiem() {
  const [duLieu, setDuLieu] = useState(null);
  const [boLocDiem, setBoLocDiem] = useState('ALL');

  useEffect(() => {
    rewards.points().then(setDuLieu);
  }, []);

  if (!duLieu) return <div className="dang-tai">Đang tải...</div>;

  const giaoDichDaLoc = (duLieu.transactions || []).filter((t) => {
    if (boLocDiem === 'PLUS') return (t.amount || 0) > 0;
    if (boLocDiem === 'MINUS') return (t.amount || 0) < 0;
    return true;
  });

  const hienThiTongTheoLoai = boLocDiem !== 'MINUS';

  return (
    <div className="khung-form">
      <h1 className="tieu-de-trang">Quản lý điểm</h1>
      <div id="tong-diem" className="khung-diem">
        <p className="khung-diem__nhan">Tổng điểm hiện có</p>
        <p className="khung-diem__gia-tri">{duLieu.points}</p>
        <Link to="/doi-thuong" className="nut-chinh" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Đổi thưởng ngay
        </Link>
      </div>
      <h2 id="lich-su" className="khung-luong__tieu-de">Lịch sử giao dịch</h2>
      <div className="bo-loc" style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setBoLocDiem('ALL')}
          className={`nut-loc ${boLocDiem === 'ALL' ? 'nut-loc--dang-chon' : ''}`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setBoLocDiem('PLUS')}
          className={`nut-loc ${boLocDiem === 'PLUS' ? 'nut-loc--dang-chon' : ''}`}
        >
          Điểm đã nhận
        </button>
        <button
          type="button"
          onClick={() => setBoLocDiem('MINUS')}
          className={`nut-loc ${boLocDiem === 'MINUS' ? 'nut-loc--dang-chon' : ''}`}
        >
          Điểm đã sử dụng
        </button>
      </div>
      <div className="khung-form__card">
        <div className="danh-sach-the">
          {giaoDichDaLoc.map((t) => (
            <div key={t.id} className="the">
              <span>
                {t.description || t.type}
                {t.type === 'earn' && t.wasteTypeName ? ` (${t.wasteTypeName})` : ''}
              </span>
              <span style={{ color: t.amount >= 0 ? 'var(--mau-xanh-chu)' : 'var(--mau-do)', fontWeight: 600 }}>
                {t.amount >= 0 ? '+' : ''}{t.amount}
              </span>
            </div>
          ))}
        </div>
        {giaoDichDaLoc.length === 0 && (
          <p className="van-ban-trong" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có giao dịch nào.</p>
        )}
      </div>

      <h2 className="khung-luong__tieu-de" style={{ marginTop: '1rem' }}>Lịch sử nhận điểm theo từng loại rác</h2>
      <div className="khung-form__card">
        {hienThiTongTheoLoai && (
          <p className="van-ban-phu" style={{ marginBottom: '0.75rem' }}>
            Tổng điểm nhận được cộng dồn theo từng loại rác.
          </p>
        )}
        {hienThiTongTheoLoai && (
          <div className="danh-sach-the">
            {(duLieu.earnByWasteType || []).map((muc) => (
              <div key={muc.wasteTypeName} className="the">
                <span>{muc.wasteTypeName}</span>
                <span style={{ color: 'var(--mau-xanh-chu)', fontWeight: 600 }}>+{muc.points}</span>
              </div>
            ))}
          </div>
        )}
        {(hienThiTongTheoLoai && (!duLieu.earnByWasteType || duLieu.earnByWasteType.length === 0)) && (
          <p className="van-ban-trong" style={{ textAlign: 'center', padding: '1.5rem 2rem' }}>
            Chưa có dữ liệu nhận điểm theo loại rác.
          </p>
        )}
      </div>
    </div>
  );
}
