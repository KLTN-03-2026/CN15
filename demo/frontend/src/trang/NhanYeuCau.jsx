import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collections, wasteTypes } from '../goiAPI';

function layUrlAnhYeuCau(url) {
  if (!url) return '';
  if (String(url).startsWith('http://') || String(url).startsWith('https://')) return url;
  return String(url).startsWith('/') ? url : `/${url}`;
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

function minYmd(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}

/** Ngày cuối cùng được phép chọn ở "Đến ngày" khi đã có Từ ngày (Từ + đúng 6 tháng lịch, cuối ngày). */
function cuoiNgayToiDaSauThangTu(fromStart) {
  const d = new Date(fromStart.getTime());
  d.setMonth(d.getMonth() + 6);
  return cuoiNgayLocal(d);
}

function khoangVuotQuaSauThang(fromStart, toEnd) {
  return toEnd.getTime() > cuoiNgayToiDaSauThangTu(fromStart).getTime();
}

function duoiYmdToiDaTu(fromYmd) {
  const f = parseYmdLocal(fromYmd);
  if (!f) return null;
  return formatYmdLocal(cuoiNgayToiDaSauThangTu(dauNgayLocal(f)));
}

function parseYmdLocal(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(y, mo - 1, day);
  if (
    Number.isNaN(dt.getTime())
    || dt.getFullYear() !== y
    || dt.getMonth() !== mo - 1
    || dt.getDate() !== day
  ) {
    return null;
  }
  return dt;
}

/**
 * Hôm nay / Tuần / Tháng theo múi giờ trình duyệt (không dùng period trên server — tránh lệch TZ).
 * Trùng logic backend: tuần = từ 00:00 (hôm nay − 7 ngày) đến cuối hôm nay; tháng = từ cùng kỳ tháng trước đến cuối hôm nay.
 */
function tinhKhoangPresetLocal(period) {
  const now = new Date();
  const end = cuoiNgayLocal(now);
  const start = dauNgayLocal(now);
  if (period === 'week') start.setDate(start.getDate() - 7);
  else if (period === 'month') start.setMonth(start.getMonth() - 1);
  return { from: start, to: end };
}

/** Khoảng thời gian gửi yêu cầu (createdAt) theo lựa chọn thực tế trên máy người dùng */
function tinhKhoangTheoBoLoc(boLoc) {
  const { timeMode, rangeFrom, rangeTo } = boLoc;
  if (timeMode === 'all') return null;
  if (timeMode === 'day' || timeMode === 'week' || timeMode === 'month') {
    return tinhKhoangPresetLocal(timeMode);
  }
  if (timeMode === 'range' && rangeFrom && rangeTo) {
    const from = parseYmdLocal(rangeFrom);
    const to = parseYmdLocal(rangeTo);
    if (!from || !to) return null;
    const fromStart = dauNgayLocal(from);
    const toEnd = cuoiNgayLocal(to);
    const today0 = dauNgayLocal(new Date());
    if (fromStart >= today0) return null;
    if (dauNgayLocal(to) > today0) return null;
    if (fromStart > toEnd) return null;
    if (khoangVuotQuaSauThang(fromStart, toEnd)) return null;
    return { from: fromStart, to: toEnd };
  }
  return null;
}

/** Ghép địa chỉ, loại rác + lọc ngày gửi (createdAt) cho API — luôn gửi createdFrom/createdTo (ISO từ local) */
function buildLocQuery(boLoc) {
  const loc = {};
  if (boLoc.address?.trim()) loc.address = boLoc.address.trim();
  if (boLoc.wasteTypeId) loc.wasteTypeId = boLoc.wasteTypeId;

  const khoang = tinhKhoangTheoBoLoc(boLoc);
  if (khoang) {
    loc.createdFrom = khoang.from.toISOString();
    loc.createdTo = khoang.to.toISOString();
  }

  return loc;
}

function locTheoKhoangClient(rawList, khoang) {
  if (!khoang || !Array.isArray(rawList)) return Array.isArray(rawList) ? rawList : [];
  const a = khoang.from.getTime();
  const b = khoang.to.getTime();
  return rawList.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= a && t <= b;
  });
}

/**
 * Chức năng Nhân viên: Xem và Nhận yêu cầu (detai.md 3.3.2)
 * - Lọc theo trạng thái, địa chỉ, loại rác, ngày gửi
 * - Xem chi tiết
 * - Nhận yêu cầu (PENDING → COLLECTING)
 */
export default function NhanYeuCau() {
  const [danhSach, setDanhSach] = useState([]);
  const [loaiRac, setLoaiRac] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState({
    status: 'PENDING',
    address: '',
    wasteTypeId: '',
    timeMode: 'all',
    /** Nháp trong ô Từ/Đến (chỉ áp dụng API sau khi bấm Xác nhận) */
    draftFrom: '',
    draftTo: '',
    /** Khoảng đã xác nhận */
    rangeFrom: '',
    rangeTo: '',
  });

  useEffect(() => {
    wasteTypes.list(true).then(setLoaiRac);
  }, []);

  useEffect(() => {
    setDangTai(true);
    const snap = boLoc;
    const loc = buildLocQuery(snap);
    const locQuery = Object.keys(loc).length ? loc : undefined;
    const khoangLoc = tinhKhoangTheoBoLoc(snap);
    collections
      .list(snap.status, locQuery)
      .then((raw) => {
        const list = locTheoKhoangClient(Array.isArray(raw) ? raw : [], khoangLoc);
        setDanhSach(list);
      })
      .catch(() => setDanhSach([]))
      .finally(() => setDangTai(false));
  }, [
    boLoc.status,
    boLoc.address,
    boLoc.wasteTypeId,
    boLoc.timeMode,
    boLoc.rangeFrom,
    boLoc.rangeTo,
  ]);

  const NHAN_TRANG_THAI = {
    PENDING: 'Chờ xử lý',
    COLLECTING: 'Đang thu gom',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  const layLopTrangThai = (status) => {
    if (status === 'COMPLETED') return 'nhan-trang-thai nhan-trang-thai--hoan-thanh';
    if (status === 'CANCELLED') return 'nhan-trang-thai nhan-trang-thai--huy';
    return 'nhan-trang-thai nhan-trang-thai--cho';
  };

  const nhanYeuCau = async (id) => {
    if (!confirm('Bạn có chắc muốn nhận yêu cầu này?')) return;
    try {
      await collections.accept(id);
      setDanhSach((list) => list.filter((r) => r.id !== id));
    } catch (ex) {
      alert(ex.message);
    }
  };

  const datTimePreset = (mode) => {
    setBoLoc((p) => ({
      ...p,
      timeMode: mode,
      draftFrom: '',
      draftTo: '',
      rangeFrom: '',
      rangeTo: '',
    }));
  };

  const doiFromDate = (e) => {
    const v = e.target.value;
    const hn = formatYmdLocal(new Date());
    setBoLoc((p) => {
      const next = { ...p, timeMode: 'range', draftFrom: v };
      if (p.draftTo && v && p.draftTo < v) next.draftTo = '';
      const cap = v ? duoiYmdToiDaTu(v) : null;
      const maxTo = v ? minYmd(cap, hn) : hn;
      if (p.draftTo && v && maxTo && p.draftTo > maxTo) next.draftTo = '';
      return next;
    });
  };

  const doiToDate = (e) => {
    const val = e.target.value;
    const homNay = formatYmdLocal(new Date());
    if (val && val > homNay) {
      alert('Đến ngày không được sau hôm nay.');
      return;
    }
    setBoLoc((p) => ({ ...p, timeMode: 'range', draftTo: val }));
  };

  const xacNhanKhoangNgay = () => {
    const { draftFrom, draftTo } = boLoc;
    if (!draftFrom || !draftTo) {
      alert('Vui lòng chọn đủ Từ ngày và Đến ngày.');
      return;
    }
    const from = parseYmdLocal(draftFrom);
    const to = parseYmdLocal(draftTo);
    if (!from || !to) {
      alert('Ngày không hợp lệ.');
      return;
    }
    const fromStart = dauNgayLocal(from);
    const toEnd = cuoiNgayLocal(to);
    const today0 = dauNgayLocal(new Date());
    if (fromStart >= today0) {
      alert('Từ ngày không được là hôm nay hoặc sau hôm nay.');
      return;
    }
    if (dauNgayLocal(to) > today0) {
      alert('Đến ngày không được sau hôm nay.');
      return;
    }
    if (fromStart > toEnd) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
      return;
    }
    if (khoangVuotQuaSauThang(fromStart, toEnd)) {
      alert('Khoảng Từ ngày đến Đến ngày không được vượt quá 6 tháng.');
      return;
    }
    setBoLoc((p) => ({
      ...p,
      timeMode: 'range',
      rangeFrom: draftFrom,
      rangeTo: draftTo,
    }));
  };

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;

  const homQua = new Date();
  homQua.setDate(homQua.getDate() - 1);
  const homQuaYmd = formatYmdLocal(homQua);
  const homNayYmd = formatYmdLocal(new Date());

  const coLocDiaChiLoai = Boolean(boLoc.address?.trim() || boLoc.wasteTypeId);
  const coLocThoiGian = boLoc.timeMode !== 'all'
    && (boLoc.timeMode !== 'range' || (boLoc.rangeFrom && boLoc.rangeTo));
  const coBoLocPhu = coLocDiaChiLoai || coLocThoiGian;

  return (
    <div>
      <h1 className="tieu-de-trang">Xem và Nhận yêu cầu</h1>

      <div className="khung-loc" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--mau-nen-phu)', borderRadius: '8px' }}>
        <div className="bo-loc" style={{ marginBottom: 0, width: '100%' }}>
          {[
            { key: 'PENDING', label: 'Chờ xử lý' },
            { key: 'COLLECTING', label: 'Đang thu gom' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setBoLoc((prev) => ({ ...prev, status: key }))}
              className={`nut-loc ${boLoc.status === key ? 'nut-loc--dang-chon' : ''}`}
            >
              {label}
            </button>
          ))}
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
            onClick={() => setBoLoc({
              status: 'PENDING',
              address: '',
              wasteTypeId: '',
              timeMode: 'all',
              draftFrom: '',
              draftTo: '',
              rangeFrom: '',
              rangeTo: '',
            })}
            className="nut-phu"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div
          style={{
            width: '100%',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            paddingTop: '1rem',
            marginTop: '0.25rem',
          }}
        >
          <p className="form-group__nhan" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Lọc theo ngày gửi yêu cầu
          </p>
          <div className="bo-loc" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
            <button
              type="button"
              onClick={() => datTimePreset('all')}
              className={`nut-loc ${boLoc.timeMode === 'all' ? 'nut-loc--dang-chon' : ''}`}
            >
              Tất cả yêu cầu
            </button>
            <button
              type="button"
              onClick={() => datTimePreset('day')}
              className={`nut-loc ${boLoc.timeMode === 'day' ? 'nut-loc--dang-chon' : ''}`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => datTimePreset('week')}
              className={`nut-loc ${boLoc.timeMode === 'week' ? 'nut-loc--dang-chon' : ''}`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => datTimePreset('month')}
              className={`nut-loc ${boLoc.timeMode === 'month' ? 'nut-loc--dang-chon' : ''}`}
            >
              Tháng
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Từ ngày</label>
              <input
                type="date"
                value={boLoc.draftFrom}
                max={homQuaYmd}
                onChange={doiFromDate}
                className="form-group__input"
                title="Không chọn được hôm nay và ngày mai"
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
              <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Đến ngày</label>
              <input
                type="date"
                value={boLoc.draftTo}
                min={boLoc.draftFrom || undefined}
                max={boLoc.draftFrom ? minYmd(duoiYmdToiDaTu(boLoc.draftFrom), homNayYmd) : homNayYmd}
                onChange={doiToDate}
                className="form-group__input"
                title="Tối đa đến hôm nay; không sau hôm nay; tối đa 6 tháng sau Từ ngày"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" className="nut-chinh" onClick={xacNhanKhoangNgay}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="danh-sach-the">
        {danhSach.map((r) => (
          <div key={r.id} className="the">
            <div className="the__noi-dung" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {r.imageUrl ? (
                <img
                  src={layUrlAnhYeuCau(r.imageUrl)}
                  alt={`Ảnh yêu cầu ${r.wasteType?.name || ''}`}
                  style={{ width: '112px', height: '112px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--mau-bien)', flexShrink: 0 }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: '112px',
                    height: '112px',
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
                <h3 className="the__tieu-de">
                  <Link to={`/yeu-cau/${r.id}`}>{r.wasteType?.name} - {r.quantity}kg</Link>
                </h3>
                <p className="the__mo-ta">{r.address}</p>
                <p className="the__phu">Khách: {r.customer?.fullName}</p>
                <p className="the__phu">🕒 Ngày gửi: <strong>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</strong></p>
                {r.desiredCollectionDate && (
                  <p className="the__phu" style={{ marginTop: '0.25rem' }}>
                    📅 Ngày thu gom: <strong>{new Date(r.desiredCollectionDate).toLocaleDateString('vi-VN')}</strong>
                  </p>
                )}
                <span className={layLopTrangThai(r.status)}>{NHAN_TRANG_THAI[r.status] || r.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to={`/yeu-cau/${r.id}`} className="nut-phu">
                Xem chi tiết
              </Link>
              {r.status === 'PENDING' && (
                <button onClick={() => nhanYeuCau(r.id)} className="nut-chinh">
                  Nhận yêu cầu
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {danhSach.length === 0 && (
        <p className="van-ban-trong">
          {coBoLocPhu
            ? ''
            : boLoc.status === 'PENDING'
              ? <>Không có yêu cầu nào đang chờ. Yêu cầu đã nhận nằm ở mục <Link to="/nhan-vien/thu-gom-xac-minh">Thu gom và Xác minh</Link> hoặc chọn trạng thái khác.</>
              : 'Không có yêu cầu nào trong trạng thái này.'}
        </p>
      )}
    </div>
  );
}
