import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collections } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

const TRANG_THAI = { PENDING: 'Chờ xử lý', COLLECTING: 'Đang thu gom', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

function sapXepLichSu(list) {
  if (!list?.length) return [];
  return [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export default function ChiTietYeuCau() {
  const { id } = useParams();
  const { user } = useAuth();
  const [yeuCau, setYeuCau] = useState();

  useEffect(() => {
    setYeuCau(undefined);
    collections.get(id).then(setYeuCau).catch(() => setYeuCau(null));
  }, [id]);

  const huy = async () => {
    if (!confirm('Bạn có chắc muốn hủy?')) return;
    try {
      await collections.cancel(id);
      const moi = await collections.get(id);
      setYeuCau(moi);
    } catch (ex) {
      alert(ex.message);
    }
  };

  const nhanYeuCau = async () => {
    try {
      await collections.accept(id);
      const moi = await collections.get(id);
      setYeuCau(moi);
    } catch (ex) {
      alert(ex.message);
    }
  };

  const [formHoanThanh, setFormHoanThanh] = useState({ verifiedWeight: '', verifiedTypeId: '' });
  const [dangXuLy, setDangXuLy] = useState(false);

  const hoanThanh = async (e) => {
    e.preventDefault();
    setDangXuLy(true);
    try {
      await collections.complete(id, {
        verifiedWeight: parseFloat(formHoanThanh.verifiedWeight) || undefined,
        verifiedTypeId: formHoanThanh.verifiedTypeId || undefined,
      });
      collections.get(id).then(setYeuCau);
    } catch (ex) {
      alert(ex.message);
    } finally {
      setDangXuLy(false);
    }
  };

  if (yeuCau === undefined) return <div className="dang-tai">Đang tải...</div>;
  if (yeuCau === null) {
    const ve = user?.role === 'CUSTOMER' ? '/yeu-cau-cua-toi' : '/nhan-vien/nhan-yeu-cau';
    return (
      <div className="khung-form">
        <p className="van-ban-trong">Không tìm thấy yêu cầu hoặc bạn không có quyền xem.</p>
        <Link to={ve} className="lien-ket">← Quay lại</Link>
      </div>
    );
  }

  const lichSuTrangThai = sapXepLichSu(yeuCau.statusHistory);

  const laNhanVien = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const laYeuCauCuaToi = yeuCau.staffId === user?.id;
  const coTheNhan = laNhanVien && yeuCau.status === 'PENDING';
  const coTheHoanThanh = laNhanVien && yeuCau.status === 'COLLECTING' && laYeuCauCuaToi;

  const duongQuayLai = user?.role === 'CUSTOMER'
    ? '/yeu-cau-cua-toi'
    : (yeuCau.status === 'PENDING' ? '/nhan-vien/nhan-yeu-cau' : '/nhan-vien/thu-gom-xac-minh');

  const layLopTrangThai = (status) => {
    if (status === 'COMPLETED') return 'nhan-trang-thai nhan-trang-thai--hoan-thanh';
    if (status === 'CANCELLED') return 'nhan-trang-thai nhan-trang-thai--huy';
    return 'nhan-trang-thai nhan-trang-thai--cho';
  };

  return (
    <div className="khung-form">
      <Link to={duongQuayLai} className="lien-ket quay-lai">← Quay lại</Link>
      <div className="khung-chi-tiet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="khung-chi-tiet__tieu-de">Chi tiết yêu cầu</h1>
          <span className={layLopTrangThai(yeuCau.status)} style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem' }}>{TRANG_THAI[yeuCau.status]}</span>
        </div>
        <dl className="danh-sach-thong-tin">
          <dt>Loại rác</dt>
          <dd>{yeuCau.wasteType?.name}</dd>
          <dt>Số lượng</dt>
          <dd>{yeuCau.quantity} kg</dd>
          <dt>Địa chỉ</dt>
          <dd>{yeuCau.address}</dd>
          {(yeuCau.phone || yeuCau.customer?.phone) && (
            <>
              <dt>Số điện thoại</dt>
              <dd>{yeuCau.phone || yeuCau.customer?.phone}</dd>
            </>
          )}
          {yeuCau.desiredCollectionDate && (
            <>
              <dt>Ngày muốn thu gom</dt>
              <dd>{new Date(yeuCau.desiredCollectionDate).toLocaleDateString('vi-VN')}</dd>
            </>
          )}
          {yeuCau.pointsEarned != null && (
            <>
              <dt>Điểm tích lũy</dt>
              <dd style={{ color: 'var(--mau-xanh-chu)', fontWeight: 600 }}>+{yeuCau.pointsEarned}</dd>
            </>
          )}
          {yeuCau.verifiedWeight != null && (
            <>
              <dt>Khối lượng xác minh</dt>
              <dd>{yeuCau.verifiedWeight} kg</dd>
            </>
          )}
          {yeuCau.note && (
            <>
              <dt>Ghi chú của bạn</dt>
              <dd>{yeuCau.note}</dd>
            </>
          )}
          {yeuCau.staff?.fullName && (
            <>
              <dt>Nhân viên phụ trách</dt>
              <dd>{yeuCau.staff.fullName}{yeuCau.staff.phone ? ` — ${yeuCau.staff.phone}` : ''}</dd>
            </>
          )}
        </dl>
        {yeuCau.imageUrl && <img src={yeuCau.imageUrl} alt="Rác" className="anh-xem-thu" />}

        {lichSuTrangThai.length > 0 && (
          <div className="khung-lich-su-trang-thai">
            <h2 className="khung-lich-su-trang-thai__tieu-de">Lịch sử cập nhật trạng thái</h2>
            <ol className="lich-su-trang-thai">
              {lichSuTrangThai.map((h) => (
                <li key={h.id} className="lich-su-trang-thai__muc">
                  <time className="lich-su-trang-thai__thoi-gian" dateTime={h.createdAt}>
                    {new Date(h.createdAt).toLocaleString('vi-VN')}
                  </time>
                  <span className="lich-su-trang-thai__trang-thai">{TRANG_THAI[h.status] || h.status}</span>
                  {h.note && <span className="lich-su-trang-thai__ghi-chu">{h.note}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="nut-hanh-dong">
          {user?.role === 'CUSTOMER' && yeuCau.status === 'PENDING' && (
            <button onClick={huy} className="nut-nguy-hiem">Hủy yêu cầu</button>
          )}
          {coTheNhan && (
            <button onClick={nhanYeuCau} className="nut-chinh">Nhận yêu cầu</button>
          )}
        </div>

        {coTheHoanThanh && (
          <form onSubmit={hoanThanh} className="khung-xac-minh">
            <h3 className="khung-xac-minh__tieu-de">Xác minh và hoàn thành</h3>
            <div className="form-group">
              <label className="form-group__nhan">Khối lượng thực tế (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formHoanThanh.verifiedWeight}
                onChange={(e) => setFormHoanThanh({ ...formHoanThanh, verifiedWeight: e.target.value })}
                placeholder={yeuCau.quantity}
                className="form-group__input"
              />
            </div>
            <button type="submit" disabled={dangXuLy} className="nut-chinh">
              {dangXuLy ? 'Đang xử lý...' : 'Hoàn thành'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
