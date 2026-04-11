import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rewards } from '../goiAPI';

export default function TrangDiem() {
  const [duLieu, setDuLieu] = useState(null);

  useEffect(() => {
    rewards.points().then(setDuLieu);
  }, []);

  if (!duLieu) return <div className="dang-tai">Đang tải...</div>;

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
      <div className="khung-form__card">
        <div className="danh-sach-the">
          {duLieu.transactions?.map((t) => (
            <div key={t.id} className="the">
              <span>{t.description || t.type}</span>
              <span style={{ color: t.amount >= 0 ? 'var(--mau-xanh-chu)' : 'var(--mau-do)', fontWeight: 600 }}>
                {t.amount >= 0 ? '+' : ''}{t.amount}
              </span>
            </div>
          ))}
        </div>
        {(!duLieu.transactions || duLieu.transactions.length === 0) && (
          <p className="van-ban-trong" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có giao dịch nào.</p>
        )}
      </div>
    </div>
  );
}
