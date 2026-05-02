import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { thongBao, users } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

export default function TrangThongBao() {
  const { user } = useAuth();
  const location = useLocation();
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [hienModalTaiKhoan, setHienModalTaiKhoan] = useState(false);
  const [dangTaiTaiKhoan, setDangTaiTaiKhoan] = useState(false);
  const [loiTaiKhoan, setLoiTaiKhoan] = useState('');
  const [thongTinTaiKhoan, setThongTinTaiKhoan] = useState(null);

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

  const moThongTinTaiKhoan = async (thongBaoItem) => {
    if (!thongBaoItem?.referenceId) return;
    setHienModalTaiKhoan(true);
    setDangTaiTaiKhoan(true);
    setLoiTaiKhoan('');
    setThongTinTaiKhoan(null);
    await danhDauDoc(thongBaoItem.id);
    try {
      const data = await users.get(thongBaoItem.referenceId);
      setThongTinTaiKhoan(data);
    } catch (err) {
      setLoiTaiKhoan(err?.message || 'Không tải được thông tin tài khoản.');
    } finally {
      setDangTaiTaiKhoan(false);
    }
  };

  const dinhDangNgayGio = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('vi-VN');
  };

  const tenVaiTro = (role) => ({ CUSTOMER: 'Khách hàng', STAFF: 'Nhân viên', ADMIN: 'Quản trị viên' }[role] || role || '-');

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
              LOW_REWARD_STOCK: { to: '/quan-tri/phan-thuong', label: 'Xem phần thưởng' },
            };
            const link = t.referenceId || t.type === 'NEW_WASTE_TYPE' || t.type === 'NEW_REWARD' || t.type === 'NEW_COLLECTION_REQUEST' || t.type === 'LOW_REWARD_STOCK'
              ? (linkConfig[t.type] || null)
              : null;
            const icon = { REQUEST_ACCEPTED: '✅', REQUEST_COMPLETED: '🎉', NEW_WASTE_TYPE: '🆕', NEW_REWARD: '🎁', NEW_COLLECTION_REQUEST: '📦', NEW_USER_REGISTERED: '👤', LOW_REWARD_STOCK: '⚠️' }[t.type] || '🔔';
            const coTheXemThongTinTaiKhoan = t.type === 'NEW_USER_REGISTERED' && !!t.referenceId;
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
                  {coTheXemThongTinTaiKhoan && (
                    <button
                      type="button"
                      className="lien-ket"
                      style={{ marginLeft: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        moThongTinTaiKhoan(t);
                      }}
                    >
                      Xem thông tin tài khoản →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hienModalTaiKhoan && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '40rem' }}>
            <h2 className="modal__tieu-de">Thông tin tài khoản</h2>
            {dangTaiTaiKhoan && <p className="van-ban-phu">Đang tải...</p>}
            {!dangTaiTaiKhoan && loiTaiKhoan && <div className="thong-bao-loi">{loiTaiKhoan}</div>}
            {!dangTaiTaiKhoan && !loiTaiKhoan && thongTinTaiKhoan && (
              <div className="khung-chi-tiet" style={{ padding: '1rem' }}>
                <div className="danh-sach-thong-tin">
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Họ tên</span>
                    <strong>{thongTinTaiKhoan.fullName || '-'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Email</span>
                    <strong>{thongTinTaiKhoan.email || '-'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Số điện thoại</span>
                    <strong>{thongTinTaiKhoan.phone || '-'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Địa chỉ</span>
                    <strong>{thongTinTaiKhoan.address || '-'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Vai trò</span>
                    <strong>{tenVaiTro(thongTinTaiKhoan.role)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Trạng thái</span>
                    <strong>{thongTinTaiKhoan.isLocked ? 'Khóa' : 'Hoạt động'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Tạo tài khoản</span>
                    <strong>{dinhDangNgayGio(thongTinTaiKhoan.createdAt)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Hoạt động gần nhất</span>
                    <strong>{dinhDangNgayGio(thongTinTaiKhoan.lastActiveAt)}</strong>
                  </div>
                </div>
              </div>
            )}
            <div className="modal__nut">
              <button type="button" className="nut-phu" onClick={() => setHienModalTaiKhoan(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
