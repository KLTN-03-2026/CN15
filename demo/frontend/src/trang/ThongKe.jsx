import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { stats } from '../goiAPI';
import { xuatExcel, xuatWord } from '../utils/xuatThongKe';

const NHAN_TRANG_THAI = {
  PENDING: 'Chờ xử lý',
  COLLECTING: 'Đang thu gom',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
const DANH_SACH_TRANG_THAI = ['PENDING', 'COLLECTING', 'COMPLETED', 'CANCELLED'];

const MAU_BIEU_DO = ['#16a34a', '#2563eb', '#ca8a04', '#64748b', '#9333ea', '#ea580c'];

/** @param {{ variant?: 'staff' | 'customer' }} props */
export default function ThongKe({ variant = 'staff' }) {
  const [duLieu, setDuLieu] = useState(null);
  const [loi, setLoi] = useState(null);
  const [boLocTam, setBoLocTam] = useState({ period: 'all', fromDate: '', toDate: '' });
  const [boLocApDung, setBoLocApDung] = useState({ period: 'all', fromDate: '', toDate: '' });
  const [dangXuat, setDangXuat] = useState(false);

  useEffect(() => {
    setLoi(null);
    const hamLayThongKe = variant === 'customer' ? (stats.getMine || stats.layCuaToi) : stats.get;
    const boLoc = boLocApDung.fromDate && boLocApDung.toDate
      ? { fromDate: boLocApDung.fromDate, toDate: boLocApDung.toDate }
      : { period: boLocApDung.period };
    hamLayThongKe(boLoc)
      .then(setDuLieu)
      .catch((e) => {
        setDuLieu(null);
        setLoi(e.message || 'Không tải được thống kê');
      });
  }, [boLocApDung, variant]);

  const nhanChuKy = { all: 'Tất cả', day: 'Trong ngày', week: '7 ngày gần đây', month: '30 ngày gần đây' };

  const duLieuTrangThai = useMemo(() => {
    const byStatus = duLieu?.byStatus || {};
    return DANH_SACH_TRANG_THAI.map((k) => ({
      ten: NHAN_TRANG_THAI[k] || k,
      soLuong: Number(byStatus[k]) || 0,
    }));
  }, [duLieu]);

  const duLieuLoaiRac = useMemo(() => {
    const list = (duLieu?.byWasteType || []).map((b) => ({
      ten: b.wasteType,
      'Số yêu cầu': b.count,
      'Khối lượng (kg)': Number(b.totalWeight) || 0,
    }));
    if (list.length > 0) return list;
    return [{ ten: 'Không có dữ liệu', 'Số yêu cầu': 0, 'Khối lượng (kg)': 0 }];
  }, [duLieu]);

  const duLieuPhanThuong = useMemo(() => {
    const list = (duLieu?.byRewardType || []).map((b) => ({
      ten: b.rewardName,
      'Lượt đổi': Number(b.redemptionCount) || 0,
      'Điểm đã dùng': Number(b.totalPointsSpent) || 0,
      'Khách hàng đổi': Number(b.customerCount) || 0,
    }));
    if (list.length > 0) return list;
    return [{ ten: 'Không có dữ liệu', 'Lượt đổi': 0, 'Điểm đã dùng': 0, 'Khách hàng đổi': 0 }];
  }, [duLieu]);

  const xuatWordNhanh = async () => {
    if (!duLieu) return;
    setDangXuat(true);
    try {
      const nhanHienTai = boLocApDung.fromDate && boLocApDung.toDate
        ? `Tùy chọn (${boLocApDung.fromDate} - ${boLocApDung.toDate})`
        : nhanChuKy[boLocApDung.period];
      await xuatWord(duLieu, nhanHienTai);
    } catch (e) {
      alert(e.message || 'Không xuất được file Word');
    } finally {
      setDangXuat(false);
    }
  };

  const xuatExcelNhanh = () => {
    if (!duLieu) return;
    try {
      const nhanHienTai = boLocApDung.fromDate && boLocApDung.toDate
        ? `Tùy chọn (${boLocApDung.fromDate} - ${boLocApDung.toDate})`
        : nhanChuKy[boLocApDung.period];
      xuatExcel(duLieu, nhanHienTai);
    } catch (e) {
      alert(e.message || 'Không xuất được file Excel');
    }
  };

  const laKhach = variant === 'customer';
  const tieuDe = laKhach ? 'Thống kê rác của tôi' : 'Thống kê và báo cáo';
  const homNay = new Date().toISOString().slice(0, 10);
  const homQuaObj = new Date();
  homQuaObj.setDate(homQuaObj.getDate() - 1);
  const homQua = homQuaObj.toISOString().slice(0, 10);
  const dangNhapKhoangNgay = !!(boLocTam.fromDate || boLocTam.toDate);
  const xacNhanLoc = () => {
    if ((boLocTam.fromDate && !boLocTam.toDate) || (!boLocTam.fromDate && boLocTam.toDate)) {
      alert('Vui lòng chọn đầy đủ cả Từ ngày và Đến ngày.');
      return;
    }
    if (boLocTam.fromDate && boLocTam.toDate && boLocTam.fromDate > boLocTam.toDate) {
      alert('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.');
      return;
    }
    if (!boLocTam.fromDate && !boLocTam.toDate) {
      return;
    }
    setBoLocApDung({ ...boLocTam });
  };

  if (loi) {
    return (
      <div className="khung-form">
        <h1 className="tieu-de-trang">{tieuDe}</h1>
        <p className="khung-loi-tai" style={{ display: 'block' }}>{loi}</p>
      </div>
    );
  }

  if (!duLieu) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div>
      <div className="dau-trang" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="tieu-de-trang" style={{ margin: 0 }}>{tieuDe}</h1>
        {laKhach ? (
          <div className="thong-ke-hanh-dong-khach" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/tao-yeu-cau" className="nut-chinh">Tạo yêu cầu thu gom</Link>
            <Link to="/yeu-cau-cua-toi" className="nut-phu">Theo dõi yêu cầu</Link>
          </div>
        ) : (
          <div className="thong-ke-xuat">
            <button
              type="button"
              className="nut-phu"
              disabled={dangXuat}
              onClick={xuatExcelNhanh}
            >
              Xuất Excel (.xlsx)
            </button>
            <button
              type="button"
              className="nut-phu"
              disabled={dangXuat}
              onClick={xuatWordNhanh}
            >
              {dangXuat ? 'Đang xuất…' : 'Xuất Word (.docx)'}
            </button>
          </div>
        )}
      </div>

      <div className="bo-loc">
        {['all', 'day', 'week', 'month'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              const boLocMoi = { period: p, fromDate: '', toDate: '' };
              setBoLocTam(boLocMoi);
              setBoLocApDung(boLocMoi);
            }}
            className={`nut-loc ${!dangNhapKhoangNgay && boLocTam.period === p ? 'nut-loc--dang-chon' : ''}`}
          >
            {p === 'all' ? 'Tất cả' : p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>
      <div className="khung-loc" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Từ ngày</label>
          <input
            type="date"
            value={boLocTam.fromDate}
            onChange={(e) => setBoLocTam((p) => ({ ...p, fromDate: e.target.value }))}
            max={homQua}
            className="form-group__input"
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-group__nhan" style={{ fontSize: '0.85rem' }}>Đến ngày</label>
          <input
            type="date"
            value={boLocTam.toDate}
            onChange={(e) => setBoLocTam((p) => ({ ...p, toDate: e.target.value }))}
            max={homNay}
            className="form-group__input"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="nut-chinh"
            onClick={xacNhanLoc}
            style={{ marginRight: '0.5rem' }}
          >
            Xác nhận 
          </button>
          <button
            type="button"
            className="nut-phu"
            onClick={() => {
              setBoLocTam((p) => ({ ...p, fromDate: '', toDate: '' }));
            }}
          >
            Bỏ chọn khoảng ngày
          </button>
        </div>
      </div>
      <div className="luoi-thong-ke">
        <div className="the-thong-ke">
          <p className="the-thong-ke__nhan">{laKhach ? 'Yêu cầu của bạn' : 'Tổng yêu cầu'}</p>
          <p className="the-thong-ke__gia-tri">{duLieu.totalRequests}</p>
        </div>
        <div className="the-thong-ke">
          <p className="the-thong-ke__nhan">{laKhach ? 'Khối lượng rác của bạn (kg)' : 'Tổng khối lượng (kg)'}</p>
          <p className="the-thong-ke__gia-tri">{duLieu.totalWeight || 0}</p>
        </div>
        <div className="the-thong-ke">
          <p className="the-thong-ke__nhan">{laKhach ? 'Tổng điểm nhận' : 'Tổng điểm đã cấp'}</p>
          <p className="the-thong-ke__gia-tri the-thong-ke__gia-tri--xanh">{duLieu.totalPointsEarned || 0}</p>
        </div>
        <div className="the-thong-ke">
          <p className="the-thong-ke__nhan">{laKhach ? 'Tổng điểm đã dùng' : 'Tổng điểm đã đổi thưởng'}</p>
          <p className="the-thong-ke__gia-tri">{duLieu.totalPointsUsed || 0}</p>
        </div>
        {!laKhach && (
          <div className="the-thong-ke">
            <p className="the-thong-ke__nhan">Tổng lượt đổi phần thưởng</p>
            <p className="the-thong-ke__gia-tri">
              {(duLieu.byRewardType || []).reduce((tong, item) => tong + (Number(item.redemptionCount) || 0), 0)}
            </p>
          </div>
        )}
      </div>

      <div className="luoi-bieu-do">
        <div className="khung-chi-tiet khung-bieu-do">
          <h2 className="khung-luong__tieu-de">{laKhach ? 'Yêu cầu của bạn theo trạng thái' : 'Biểu đồ theo trạng thái'}</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={duLieuTrangThai}
                dataKey="soLuong"
                nameKey="ten"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ ten, soLuong }) => (soLuong > 0 ? `${ten}: ${soLuong}` : '')}
              >
                {duLieuTrangThai.map((_, i) => (
                  <Cell key={i} fill={MAU_BIEU_DO[i % MAU_BIEU_DO.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Số lượng']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="khung-chi-tiet khung-bieu-do">
          <h2 className="khung-luong__tieu-de">{laKhach ? 'Rác của bạn theo loại (đã hoàn thành)' : 'Biểu đồ theo loại rác (đã hoàn thành)'}</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={duLieuLoaiRac} margin={{ top: 8, right: 12, left: 8, bottom: 64 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ten" angle={-35} textAnchor="end" height={72} interval={0} fontSize={12} />
              <YAxis yAxisId="left" allowDecimals={false} label={{ value: 'Số yêu cầu', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" allowDecimals label={{ value: 'kg', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Số yêu cầu" fill="#16a34a" name="Số yêu cầu" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Khối lượng (kg)" fill="#2563eb" name="Khối lượng (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!laKhach && (
          <div className="khung-chi-tiet khung-bieu-do">
            <h2 className="khung-luong__tieu-de">Phần thưởng đã đổi theo loại phần thưởng</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={duLieuPhanThuong} margin={{ top: 8, right: 12, left: 8, bottom: 64 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ten" angle={-35} textAnchor="end" height={72} interval={0} fontSize={12} />
                <YAxis yAxisId="left" allowDecimals={false} label={{ value: 'Lượt đổi', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} label={{ value: 'Điểm', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Lượt đổi" fill="#ea580c" name="Lượt đổi" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Điểm đã dùng" fill="#9333ea" name="Điểm đã dùng" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Khách hàng đổi" fill="#0ea5e9" name="Khách hàng đổi" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="khung-chi-tiet">
        <h2 className="khung-luong__tieu-de">{laKhach ? 'Trạng thái yêu cầu của bạn' : 'Bảng theo trạng thái'}</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(duLieu.byStatus || {}).map(([k, v]) => (
            <span key={k} className="nhan-trang-thai">
              {NHAN_TRANG_THAI[k] || k}: {v}
            </span>
          ))}
        </div>
      </div>
      {duLieu.byWasteType?.length > 0 && (
        <div className="khung-chi-tiet" style={{ marginTop: '1rem' }}>
          <h2 className="khung-luong__tieu-de">{laKhach ? 'Chi tiết theo loại rác của bạn' : 'Theo loại rác'}</h2>
          <div className="danh-sach-thong-tin">
            {duLieu.byWasteType.map((b) => (
              <div key={b.wasteType} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span>{b.wasteType}</span>
                <span>{b.count} yêu cầu, {b.totalWeight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!laKhach && duLieu.byRewardType?.length > 0 && (
        <div className="khung-chi-tiet" style={{ marginTop: '1rem' }}>
          <h2 className="khung-luong__tieu-de">Chi tiết phần thưởng đã đổi</h2>
          <div className="danh-sach-thong-tin">
            {duLieu.byRewardType.map((b) => (
              <div key={b.rewardId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span>{b.rewardName}</span>
                <span>{b.redemptionCount} lượt đổi, {b.customerCount || 0} khách hàng, {b.totalPointsSpent} điểm</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
