import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collections } from '../goiAPI';

const TRANG_THAI = { PENDING: 'Chờ xử lý', COLLECTING: 'Đang thu gom', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

export default function XuLyYeuCau() {
  const [danhSach, setDanhSach] = useState([]);
  const [boLoc, setBoLoc] = useState('');

  useEffect(() => {
    collections.list(boLoc || undefined).then(setDanhSach);
  }, [boLoc]);

  const layLopTrangThai = (status) => {
    if (status === 'COMPLETED') return 'nhan-trang-thai nhan-trang-thai--hoan-thanh';
    if (status === 'CANCELLED') return 'nhan-trang-thai nhan-trang-thai--huy';
    return 'nhan-trang-thai nhan-trang-thai--cho';
  };

  return (
    <div>
      <h1 className="tieu-de-trang">Danh sách yêu cầu thu gom</h1>
      <div className="bo-loc">
        <button
          onClick={() => setBoLoc('')}
          className={`nut-loc ${!boLoc ? 'nut-loc--dang-chon' : ''}`}
        >
          Tất cả
        </button>
        {['PENDING', 'COLLECTING', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setBoLoc(s)}
            className={`nut-loc ${boLoc === s ? 'nut-loc--dang-chon' : ''}`}
          >
            {TRANG_THAI[s]}
          </button>
        ))}
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
              <span className={layLopTrangThai(r.status)}>{TRANG_THAI[r.status]}</span>
            </div>
            <Link to={`/yeu-cau/${r.id}`} className="nut-chinh" style={{ fontSize: '0.875rem' }}>
              Chi tiết
            </Link>
          </div>
        ))}
      </div>
      {danhSach.length === 0 && <p className="van-ban-trong">Không có yêu cầu.</p>}
    </div>
  );
}
