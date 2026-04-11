import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { thongBao } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

export default function TrangThongBao() {
  const { user } = useAuth();
  const location = useLocation();
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');

  const taiLai = useCallback(() => {
    if (!user || !['CUSTOMER', 'STAFF', 'ADMIN'].includes(user.role)) return;
    setDangTai(true);
    setLoi('');
    thongBao.list()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
        setDanhSach(list);
      })
      .catch((err) => {
        console.error('[ThongBao] Lỗi tải danh sách:', err, err?.url ? `URL: ${err.url}` : '');
        const msg = err?.message || 'Không tải được thông báo. Vui lòng thử lại.';
        setLoi(err?.status === 404
          ? 'Không tìm thấy API thông báo. Đảm bảo backend đang chạy (port 3001) và đã khởi động lại frontend.'
          : msg);
        setDanhSach([]);
      })
      .finally(() => setDangTai(false));
  }, [user?.role]);

  const coTheXemThongBao = user && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(user.role);

  useEffect(() => {
    if (coTheXemThongBao) {
      taiLai();
    } else {
      setDangTai(false);
    }
  }, [coTheXemThongBao, taiLai]);

  useEffect(() => {
    if (coTheXemThongBao && location.pathname === '/thong-bao') {
      taiLai();
    }
  }, [location.pathname, coTheXemThongBao, taiLai]);

  useEffect(() => {
    const onRefresh = () => { if (coTheXemThongBao) taiLai(); };
    window.addEventListener('focus', onRefresh);
    window.addEventListener('notifications-updated', onRefresh);
    return () => {
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('notifications-updated', onRefresh);
    };
  }, [coTheXemThongBao, taiLai]);

  const danhDauDoc = async (id) => {
    try {
      await thongBao.danhDauDoc(id);
      setDanhSach((list) => list.map((t) => (t.id === id ? { ...t, isRead: true } : t)));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) { /* ignore */ }
  };

  const danhDauTatCaDoc = async () => {
    try {
      await thongBao.danhDauTatCaDoc();
      setDanhSach((list) => list.map((t) => ({ ...t, isRead: true })));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) { /* ignore */ }
  };

  if (!coTheXemThongBao) {
    return (
      <div className="khung-form">
        <p className="van-ban-phu">Vui lòng đăng nhập để xem thông báo.</p>
      </div>
    );
  }

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div>
      <h1 className="tieu-de-trang">🔔 Thông báo</h1>

      {loi && <div className="thong-bao-loi" style={{ marginBottom: '1rem' }}>{loi}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={taiLai} disabled={dangTai} className="nut-phu">
          {dangTai ? 'Đang tải...' : '🔄 Làm mới'}
        </button>
        {danhSach.some((t) => !t.isRead) && (
          <button type="button" onClick={danhDauTatCaDoc} className="nut-phu">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {danhSach.length === 0 ? (
        <p className="van-ban-trong">Chưa có thông báo nào.</p>
      ) : (
        <div className="danh-sach-the" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {danhSach.map((t) => {
            const linkConfig = {
              REQUEST_ACCEPTED: { to: `/yeu-cau/${t.referenceId}`, label: 'Xem chi tiết yêu cầu' },
              REQUEST_COMPLETED: { to: `/yeu-cau/${t.referenceId}`, label: 'Xem chi tiết yêu cầu' },
              NEW_WASTE_TYPE: { to: '/tao-yeu-cau', label: 'Tạo yêu cầu thu gom' },
              NEW_REWARD: { to: '/doi-thuong', label: 'Xem phần thưởng' },
              NEW_COLLECTION_REQUEST: { to: `/yeu-cau/${t.referenceId}`, label: 'Xem và nhận yêu cầu' },
            };
            const link = t.referenceId || t.type === 'NEW_WASTE_TYPE' || t.type === 'NEW_REWARD' || t.type === 'NEW_COLLECTION_REQUEST'
              ? (linkConfig[t.type] || (t.referenceId ? { to: `/yeu-cau/${t.referenceId}`, label: 'Xem chi tiết' } : null))
              : null;
            const icon = { REQUEST_ACCEPTED: '✅', REQUEST_COMPLETED: '🎉', NEW_WASTE_TYPE: '🆕', NEW_REWARD: '🎁', NEW_COLLECTION_REQUEST: '📦' }[t.type] || '🔔';
            return (
              <div
                key={t.id}
                onClick={() => link && danhDauDoc(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && link && danhDauDoc(t.id)}
                style={{
                  padding: '1rem',
                  background: t.isRead ? 'var(--mau-nen-phu)' : 'rgba(34, 197, 94, 0.1)',
                  border: `1px solid ${t.isRead ? 'transparent' : 'rgba(34, 197, 94, 0.3)'}`,
                  borderRadius: '8px',
                  cursor: link ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{icon} {t.title}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--mau-phu)' }}>{t.message}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--mau-phu)', marginTop: '0.5rem' }}>
                  {new Date(t.createdAt).toLocaleString('vi-VN')}
                  {link && (
                    <Link to={link.to} className="lien-ket" style={{ marginLeft: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                      {link.label} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
