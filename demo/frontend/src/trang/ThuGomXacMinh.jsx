import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collections, wasteTypes } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

function layUrlAnhYeuCau(url) {
  if (!url) return '';
  if (String(url).startsWith('http://') || String(url).startsWith('https://')) return url;
  return String(url).startsWith('/') ? url : `/${url}`;
}

function cungNgay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function khopChuKyThoiGian(dateLike, chuKy) {
  if (!dateLike || chuKy === 'all') return true;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (chuKy === 'day') return cungNgay(d, now);
  if (chuKy === 'month') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return d.getTime() >= start.getTime() && d.getTime() <= now.getTime();
  }
  return true;
}

function dauNgayLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function cuoiNgayLocal(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatYmdLocal(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(y, mo - 1, day);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function quaSauThang(fromStart, toEnd) {
  const max = new Date(fromStart);
  max.setMonth(max.getMonth() + 6);
  max.setHours(23, 59, 59, 999);
  return toEnd.getTime() > max.getTime();
}

function tinhKhoangTheoBoLocThoiGian(boLocThoiGian) {
  const now = new Date();
  if (boLocThoiGian.mode === 'all') return null;
  if (boLocThoiGian.mode === 'day') return { from: dauNgayLocal(now), to: cuoiNgayLocal(now) };
  if (boLocThoiGian.mode === 'week') {
    const from = dauNgayLocal(now);
    from.setDate(from.getDate() - 7);
    return { from, to: cuoiNgayLocal(now) };
  }
  if (boLocThoiGian.mode === 'month') {
    const from = dauNgayLocal(now);
    from.setDate(from.getDate() - 30);
    return { from, to: cuoiNgayLocal(now) };
  }
  if (boLocThoiGian.mode === 'range' && boLocThoiGian.fromDate && boLocThoiGian.toDate) {
    const f = parseYmdLocal(boLocThoiGian.fromDate);
    const t = parseYmdLocal(boLocThoiGian.toDate);
    if (!f || !t) return null;
    const from = dauNgayLocal(f);
    const to = cuoiNgayLocal(t);
    if (from > to) return null;
    if (quaSauThang(from, to)) return null;
    return { from, to };
  }
  return null;
}

function locTheoKhoangThoiGian(list, layNgay, khoang) {
  if (!khoang) return list;
  const a = khoang.from.getTime();
  const b = khoang.to.getTime();
  return list.filter((r) => {
    const x = new Date(layNgay(r));
    if (Number.isNaN(x.getTime())) return false;
    const t = x.getTime();
    return t >= a && t <= b;
  });
}

/**
 * Chức năng Nhân viên: Thu gom và Xác minh (detai.md 3.3.3)
 * - Danh sách yêu cầu đã nhận (COLLECTING, staffId = tôi)
 * - Xác minh loại rác, khối lượng thực tế
 * - Hoàn thành
 */
export default function ThuGomXacMinh() {
  const { user } = useAuth();
  const [danhSach, setDanhSach] = useState([]);
  const [lichSuDaThuGom, setLichSuDaThuGom] = useState([]);
  const [cheDoXem, setCheDoXem] = useState('ALL');
  const [boLocThoiGian, setBoLocThoiGian] = useState({
    mode: 'all',
    draftFromDate: '',
    draftToDate: '',
    fromDate: '',
    toDate: '',
  });
  const [loaiRac, setLoaiRac] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXuLy, setDangXuLy] = useState(null);
  const [formTheoId, setFormTheoId] = useState({});
  const [boLoc, setBoLoc] = useState({ wasteTypeId: '', quantityMin: '', quantityMax: '', address: '', customerName: '' });

  useEffect(() => {
    setDangTai(true);
    Promise.all([
      collections.list('COLLECTING'),
      collections.list('COMPLETED'),
      wasteTypes.list(true),
    ]).then(([dangThuGom, daHoanThanh, dsLoaiRac]) => {
      const cuaToi = (Array.isArray(dangThuGom) ? dangThuGom : []).filter((r) => r.staffId === user?.id);
      const lichSu = (Array.isArray(daHoanThanh) ? daHoanThanh : [])
        .filter((r) => r.staffId === user?.id)
        .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime());
      setDanhSach(cuaToi);
      setLichSuDaThuGom(lichSu);
      setFormTheoId(Object.fromEntries(cuaToi.map((r) => [r.id, { verifiedWeight: String(r.quantity || ''), verifiedTypeId: r.wasteTypeId || '' }])));
      setLoaiRac(Array.isArray(dsLoaiRac) ? dsLoaiRac : []);
    }).finally(() => setDangTai(false));
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
      const daCapNhat = await collections.complete(id, {
        verifiedWeight: parseFloat(f.verifiedWeight) || undefined,
        verifiedTypeId: f.verifiedTypeId || undefined,
      });
      setDanhSach((list) => list.filter((x) => x.id !== id));
      if (daCapNhat && typeof daCapNhat === 'object') {
        setLichSuDaThuGom((prev) => [daCapNhat, ...prev.filter((x) => x.id !== daCapNhat.id)]);
      }
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
    if (boLoc.customerName?.trim()) {
      const ten = (r.customer?.fullName || '').toLowerCase();
      if (!ten.includes(boLoc.customerName.trim().toLowerCase())) return false;
    }
    return true;
  });
  const khoangThoiGian = tinhKhoangTheoBoLocThoiGian(boLocThoiGian);
  const dangThuGomLocTheoThoiGian = locTheoKhoangThoiGian(danhSachHienThi, (r) => r.createdAt, khoangThoiGian);
  const lichSuLocTheoThoiGian = locTheoKhoangThoiGian(lichSuDaThuGom, (r) => r.completedAt || r.updatedAt, khoangThoiGian)
    .filter((r) => {
      if (!boLoc.customerName?.trim()) return true;
      const ten = (r.customer?.fullName || '').toLowerCase();
      return ten.includes(boLoc.customerName.trim().toLowerCase());
    });

  const chonChuKyThoiGian = (mode) => {
    setBoLocThoiGian({
      mode,
      draftFromDate: '',
      draftToDate: '',
      fromDate: '',
      toDate: '',
    });
  };

  const xacNhanKhoangThoiGian = () => {
    const f = parseYmdLocal(boLocThoiGian.draftFromDate);
    const t = parseYmdLocal(boLocThoiGian.draftToDate);
    if (!f || !t) {
      alert('Vui lòng chọn đủ Từ ngày và Đến ngày.');
      return;
    }
    const from = dauNgayLocal(f);
    const to = cuoiNgayLocal(t);
    const todayStart = dauNgayLocal(new Date());
    if (from > to) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
      return;
    }
    if (from.getTime() >= todayStart.getTime()) {
      alert('Từ ngày không được là hôm nay hoặc sau hôm nay.');
      return;
    }
    if (dauNgayLocal(t).getTime() > todayStart.getTime()) {
      alert('Đến ngày không được sau hôm nay.');
      return;
    }
    if (quaSauThang(from, to)) {
      alert('Khoảng thời gian lọc tối đa 6 tháng.');
      return;
    }
    setBoLocThoiGian((p) => ({
      ...p,
      mode: 'range',
      fromDate: p.draftFromDate,
      toDate: p.draftToDate,
    }));
  };

  const huyKhoangThoiGian = () => {
    setBoLocThoiGian((p) => ({
      ...p,
      mode: 'all',
      draftFromDate: '',
      draftToDate: '',
      fromDate: '',
      toDate: '',
    }));
  };

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;
  const homNayYmd = formatYmdLocal(new Date());
  const homQua = new Date();
  homQua.setDate(homQua.getDate() - 1);
  const homQuaYmd = formatYmdLocal(homQua);

  return (
    <div>
      <h1 className="tieu-de-trang">Thu gom và Xác minh</h1>
      <div className="bo-loc" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`nut-loc ${cheDoXem === 'ALL' ? 'nut-loc--dang-chon' : ''}`}
          onClick={() => setCheDoXem('ALL')}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={`nut-loc ${cheDoXem === 'COLLECTING' ? 'nut-loc--dang-chon' : ''}`}
          onClick={() => setCheDoXem('COLLECTING')}
        >
          Đang thu gom
        </button>
        <button
          type="button"
          className={`nut-loc ${cheDoXem === 'COMPLETED' ? 'nut-loc--dang-chon' : ''}`}
          onClick={() => setCheDoXem('COMPLETED')}
        >
          Hoàn thành
        </button>
      </div>
      <div className="bo-loc" style={{ marginBottom: '1rem' }}>
        {[
          { key: 'day', label: 'Ngày' },
          { key: 'week', label: 'Tuần' },
          { key: 'month', label: 'Tháng' },
        ].map((x) => (
          <button
            key={x.key}
            type="button"
            className={`nut-loc ${boLocThoiGian.mode === x.key ? 'nut-loc--dang-chon' : ''}`}
            onClick={() => chonChuKyThoiGian(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="bo-loc" style={{ marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '170px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Từ ngày</label>
          <input
            type="date"
            value={boLocThoiGian.draftFromDate}
            max={homQuaYmd}
            onChange={(e) => setBoLocThoiGian((p) => ({ ...p, mode: 'range', draftFromDate: e.target.value }))}
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '170px' }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Đến ngày</label>
          <input
            type="date"
            value={boLocThoiGian.draftToDate}
            max={homNayYmd}
            onChange={(e) => setBoLocThoiGian((p) => ({ ...p, mode: 'range', draftToDate: e.target.value }))}
            className="form-group__input"
          />
        </div>
        <button type="button" className="nut-chinh" onClick={xacNhanKhoangThoiGian}>
          Xác nhận
        </button>
        <button type="button" className="nut-phu" onClick={huyKhoangThoiGian}>
          Hủy
        </button>
      </div>

      {(cheDoXem === 'ALL' || cheDoXem === 'COLLECTING') && (
        <>
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
        <div className="form-group" style={{ margin: 0, minWidth: '180px', flex: 1 }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Tên khách hàng</label>
          <input
            type="text"
            value={boLoc.customerName}
            onChange={(e) => setBoLoc((p) => ({ ...p, customerName: e.target.value }))}
            placeholder="Tìm theo tên khách..."
            className="form-group__input"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setBoLoc({ wasteTypeId: '', quantityMin: '', quantityMax: '', address: '', customerName: '' })}
            className="nut-phu"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
      {cheDoXem === 'ALL' && (
        <h2 className="tieu-de-trang" style={{ fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
          Đang thu gom
        </h2>
      )}

      <div className="danh-sach-the">
        {dangThuGomLocTheoThoiGian.map((r) => (
          <div key={r.id} className="the" style={{ maxWidth: '100%' }}>
            <div className="the__noi-dung" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {r.imageUrl ? (
                <img
                  src={layUrlAnhYeuCau(r.imageUrl)}
                  alt={`Ảnh yêu cầu ${r.wasteType?.name || ''}`}
                  style={{ width: '128px', height: '128px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--mau-bien)', flexShrink: 0 }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: '128px',
                    height: '128px',
                    borderRadius: '0.5rem',
                    border: '1px dashed var(--mau-bien)',
                    background: '#f8fafc',
                    color: 'var(--mau-chu-nhat)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    padding: '0.5rem',
                    flexShrink: 0,
                  }}
                >
                  Không có ảnh
                </div>
              )}
              <div>
                <h3 className="the__tieu-de">{r.wasteType?.name} - {r.quantity}kg</h3>
                <p className="the__mo-ta">{r.address}</p>
                <p className="the__phu">Khách: {r.customer?.fullName}</p>
                <span className="nhan-trang-thai nhan-trang-thai--cho">Đang thu gom</span>
              </div>
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
      {dangThuGomLocTheoThoiGian.length === 0 && (
        <p className="van-ban-trong">
          {boLoc.wasteTypeId || boLoc.quantityMin || boLoc.quantityMax || boLoc.address?.trim() || boLoc.customerName?.trim() || boLocThoiGian.mode !== 'all'
            ? ''
            : <>Bạn chưa nhận yêu cầu nào. Vào <Link to="/nhan-vien/nhan-yeu-cau">Xem và Nhận yêu cầu</Link> để nhận.</>}
        </p>
      )}
        </>
      )}

      {(cheDoXem === 'ALL' || cheDoXem === 'COMPLETED') && (
        <>
      <h2 className="tieu-de-trang" style={{ fontSize: '1.25rem', marginTop: cheDoXem === 'ALL' ? '2rem' : '0.25rem' }}>
        Lịch sử đã thu gom
      </h2>
      <div className="danh-sach-the">
        {lichSuLocTheoThoiGian.map((r) => (
          <div key={r.id} className="the" style={{ maxWidth: '100%' }}>
            <div className="the__noi-dung" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {r.imageUrl ? (
                <img
                  src={layUrlAnhYeuCau(r.imageUrl)}
                  alt={`Ảnh yêu cầu ${r.wasteType?.name || ''}`}
                  style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--mau-bien)', flexShrink: 0 }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '0.5rem',
                    border: '1px dashed var(--mau-bien)',
                    background: '#f8fafc',
                    color: 'var(--mau-chu-nhat)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    padding: '0.5rem',
                    flexShrink: 0,
                  }}
                >
                  Không có ảnh
                </div>
              )}
              <div>
                <h3 className="the__tieu-de">{r.wasteType?.name} - {r.quantity}kg</h3>
                <p className="the__mo-ta">{r.address}</p>
                <p className="the__phu">Khách: {r.customer?.fullName}</p>
                <p className="the__phu">Khối lượng xác minh: {r.verifiedWeight ?? '-'} kg</p>
                <p className="the__phu">Điểm nhận: {r.pointsEarned ?? 0}</p>
                <p className="the__phu">
                  Hoàn thành: <strong>{new Date(r.completedAt || r.updatedAt).toLocaleString('vi-VN')}</strong>
                </p>
                <span className="nhan-trang-thai nhan-trang-thai--hoan-thanh">Hoàn thành</span>
              </div>
            </div>
            <Link to={`/yeu-cau/${r.id}`} className="lien-ket" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
              Xem chi tiết
            </Link>
          </div>
        ))}
      </div>
      {lichSuLocTheoThoiGian.length === 0 && (
        <p className="van-ban-trong">Không có lịch sử phù hợp bộ lọc thời gian.</p>
      )}
        </>
      )}
    </div>
  );
}
