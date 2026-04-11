import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { rewards } from '../goiAPI';
import { useAuth } from '../context/NguoiDungContext';

/** Nhận diện mã voucher: định dạng 5 chữ + 6 số (vd: ABSJD123123) hoặc mã cũ ECO-VOUCHER-... */
function laMaVoucher(ma) {
  if (!ma) return false;
  if (ma.startsWith('ECO-VOUCHER')) return true;
  return /^[A-Z]{5}\d{6}$/.test(ma);
}

/** Hướng dẫn sử dụng vật phẩm sau khi đổi thưởng thành công (theo dạng mã). */
function buocSuDungTheoMa(ma) {
  if (!ma) return [];
  if (laMaVoucher(ma)) {
    return [
      'Mã phía trên là mã đổi thưởng / mã voucher — bạn cần mã này để được áp dụng ưu đãi, kể cả khi mua tại siêu thị hay online.',
      'Mua tại siêu thị / cửa hàng: mang mã (mở trên điện thoại hoặc chụp màn hình) đến quầy thanh toán; nhân viên sẽ nhập hoặc quét mã trước khi in hóa đơn.',
      'Mua trên website / app: ở bước thanh toán, nhập mã vào ô “Voucher” / “Mã giảm giá”.',
      'Kiểm tra số tiền được giảm trước khi trả tiền hoặc hoàn tất đơn. Lưu ý hạn dùng và sản phẩm được áp dụng (demo).',
    ];
  }
  if (ma.startsWith('ECO-TREE')) {
    return [
      'Mã trên là mã xác nhận tham gia đồng hành trồng cây — giữ lại để đối chiếu.',
      'Đội ngũ / đối tác sẽ cập nhật tiến độ (ví dụ qua email hoặc thông báo trong app) khi cây được ghi nhận (demo).',
      'Nếu cần tra cứu, liên hệ hỗ trợ và cung cấp mã xác nhận.',
    ];
  }
  return [
    'Giữ mã xác nhận để nhận quà hoặc đối chiếu khi đổi trả / khiếu nại.',
    'Làm theo hướng dẫn trên email / tin nhắn từ hệ thống (nếu có).',
    'Liên hệ bộ phận hỗ trợ nếu không nhận được quà đúng thời hạn (demo).',
  ];
}

/** Lấy mã từ nhiều dạng key (camelCase / snake_case) */
function layMaTuPhanHoi(data, r) {
  const xs = [
    data?.ma,
    data?.confirmationCode,
    data?.confirmation_code,
    r?.confirmationCode,
    r?.confirmation_code,
  ];
  for (const c of xs) {
    if (c != null && String(c).trim()) return String(c).trim();
  }
  return '';
}

/** Nếu POST /redeem không trả mã (cache proxy, JSON lỗi), lấy từ GET lịch sử — bản ghi mới nhất trùng rewardId */
async function layMaTuLichSuNeuThieu(idPhanThuong, redemptionId, maHienTai) {
  if (maHienTai) return { ma: maHienTai, ghiChuBoSung: '' };
  try {
    const list = await rewards.myRedemptions();
    if (!Array.isArray(list)) return { ma: '', ghiChuBoSung: '' };
    const row =
      (redemptionId && list.find((x) => x.id === redemptionId)) ||
      list.find((x) => x.rewardId === idPhanThuong);
    const ma =
      row?.confirmationCode != null && String(row.confirmationCode).trim()
        ? String(row.confirmationCode).trim()
        : row?.confirmation_code != null && String(row.confirmation_code).trim()
          ? String(row.confirmation_code).trim()
          : '';
    const gc =
      row?.fulfillmentNote ??
      row?.fulfillment_note ??
      '';
    return { ma, ghiChuBoSung: gc || '' };
  } catch {
    return { ma: '', ghiChuBoSung: '' };
  }
}

function KhungHuongDanSuDung({ ma }) {
  const buoc = buocSuDungTheoMa(ma);
  if (buoc.length === 0) return null;
  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #a7f3d0' }}>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#065f46' }}>Cách sử dụng phần thưởng</p>
      <ol style={{ margin: 0, paddingLeft: '1.35rem', fontSize: '0.95rem', lineHeight: 1.55, color: '#064e3b' }}>
        {buoc.map((dong, i) => (
          <li key={i} style={{ marginBottom: '0.45rem' }}>{dong}</li>
        ))}
      </ol>
    </div>
  );
}

export default function DoiThuong() {
  const { user } = useAuth();
  const [danhSach, setDanhSach] = useState([]);
  const [lichSu, setLichSu] = useState([]);
  const [thongBao, setThongBao] = useState('');
  const [ketQuaDoi, setKetQuaDoi] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const refKetQuaDoi = useRef(null);

  useEffect(() => {
    setDangTai(true);
    setLoi('');
    rewards.list()
      .then((data) => setDanhSach(Array.isArray(data) ? data : []))
      .catch((ex) => {
        setLoi(ex.message || 'Không tải được danh sách phần thưởng');
        setDanhSach([]);
      })
      .finally(() => setDangTai(false));
    if (user) {
      rewards.myRedemptions()
        .then((data) => setLichSu(Array.isArray(data) ? data : []))
        .catch(() => setLichSu([]));
    }
  }, [user]);

  useEffect(() => {
    if (ketQuaDoi && refKetQuaDoi.current) {
      refKetQuaDoi.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [ketQuaDoi]);

  const doi = async (id, tenTrenThe) => {
    if (!user) {
      setThongBao('Vui lòng đăng nhập để đổi thưởng');
      return;
    }
    setThongBao('');
    setKetQuaDoi(null);
    try {
      const data = await rewards.redeem(id);
      const r = data?.redemption;
      setThongBao(data?.message || 'Chúc mừng bạn đổi thưởng thành công!');
      const ten =
        r?.reward?.name ?? data?.rewardName ?? tenTrenThe ?? 'Phần thưởng';
      let ma = layMaTuPhanHoi(data, r);
      let ghiChu = r?.fulfillmentNote ?? data?.fulfillmentNote ?? r?.fulfillment_note ?? data?.fulfillment_note ?? '';
      if (!ma) {
        const boSung = await layMaTuLichSuNeuThieu(id, r?.id, '');
        ma = boSung.ma;
        if (!ghiChu && boSung.ghiChuBoSung) ghiChu = boSung.ghiChuBoSung;
      }
      const msgStr = String(data?.message || '');
      const backendCu =
        !ma &&
        data?.redeemApiVersion !== 2 &&
        (msgStr === 'Đổi thưởng thành công' || msgStr.includes('Đổi thưởng thành công'));
      if (r) {
        setKetQuaDoi({
          ten,
          ma,
          ghiChu,
          diem: r.pointsSpent ?? 0,
          canhBaoBackendCu: Boolean(backendCu),
        });
      }
      rewards.list().then(setDanhSach);
      rewards.myRedemptions().then(setLichSu);
    } catch (ex) {
      setThongBao(ex.message || 'Đổi thưởng thất bại');
    }
  };

  if (dangTai) return <div className="dang-tai">Đang tải...</div>;

  return (
    <div className="khung-form">
      <h1 className="tieu-de-trang">Đổi thưởng</h1>
      {loi && <div className="thong-bao-loi">{loi}</div>}
      {user && (
        <div className="khung-diem" style={{ marginBottom: '1.5rem' }}>
          <p className="khung-diem__nhan">Điểm của bạn</p>
          <p className="khung-diem__gia-tri">{user.points || 0}</p>
        </div>
      )}
      {!user && (
        <div className="khung-form__card" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#fffbeb', borderColor: '#fcd34d' }}>
          <p style={{ margin: 0 }}>
            <Link to="/dang-nhap" className="lien-ket">Đăng nhập</Link> để xem điểm và đổi thưởng.
          </p>
        </div>
      )}
      {thongBao && (
        <div className={thongBao.includes('thành công') || thongBao.includes('Chúc mừng') ? 'thong-bao-thanh-cong' : 'thong-bao-loi'}>
          {thongBao}
        </div>
      )}
      {ketQuaDoi && (
        <div
          ref={refKetQuaDoi}
          className="khung-form__card"
          style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderColor: '#6ee7b7' }}
        >
          <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#065f46' }}>Chi tiết nhận thưởng</p>
          <p style={{ margin: '0 0 0.5rem' }}><strong>Phần thưởng:</strong> {ketQuaDoi.ten}</p>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.9rem', color: '#047857' }}>
            {laMaVoucher(ketQuaDoi.ma)
              ? 'Mã đổi thưởng / voucher — cần khi thanh toán tại siêu thị hoặc online (lưu hoặc chụp màn hình):'
              : ketQuaDoi.ma?.startsWith('ECO-TREE')
                ? 'Mã xác nhận trồng cây (lưu lại hoặc chụp màn hình):'
                : 'Mã xác nhận (lưu lại hoặc chụp màn hình):'}
          </p>
          {ketQuaDoi.ma ? (
            <code style={{ display: 'block', padding: '0.65rem 0.85rem', background: '#fff', borderRadius: 6, fontSize: '1rem', letterSpacing: '0.03em', border: '1px solid #a7f3d0', marginBottom: '0.75rem', wordBreak: 'break-all' }}>{ketQuaDoi.ma}</code>
          ) : (
            <div style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#b45309' }}>
              {ketQuaDoi.canhBaoBackendCu ? (
                <p style={{ margin: 0 }}>
                  <strong>Backend đang chạy bản cũ</strong> (không trả mã đổi thưởng). Hãy tắt hết cửa sổ terminal đang chạy Node, rồi từ thư mục gốc project chạy lại <code style={{ fontSize: '0.85rem' }}>npm run dev</code> (hoặc trong <code style={{ fontSize: '0.85rem' }}>backend</code>: <code style={{ fontSize: '0.85rem' }}>npm run dev</code>). Phản hồi mới phải có trường <code style={{ fontSize: '0.85rem' }}>redeemApiVersion: 2</code>.
                </p>
              ) : (
                <p style={{ margin: 0 }}>Chưa nhận được mã — tải lại trang hoặc xem Lịch sử đổi thưởng. Nếu vẫn trống: trong thư mục backend chạy npx prisma db push, npx prisma generate, rồi khởi động lại server.</p>
              )}
            </div>
          )}
          {ketQuaDoi.ghiChu && <p style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', lineHeight: 1.5, color: '#064e3b' }}>{ketQuaDoi.ghiChu}</p>}
          <KhungHuongDanSuDung ma={ketQuaDoi.ma} />
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Đã trừ {ketQuaDoi.diem} điểm từ tài khoản của bạn.</p>
        </div>
      )}

      <h2 id="phan-thuong" className="khung-luong__tieu-de">Danh sách phần thưởng</h2>
      <div className="luoi-phan-thuong">
        {danhSach.map((r) => (
          <div key={r.id} className="the-phan-thuong">
            <h3 className="the-phan-thuong__tieu-de">{r.name}</h3>
            <p className="the-phan-thuong__mo-ta">{r.description}</p>
            <p className="the-phan-thuong__diem">{r.pointsCost} điểm</p>
            <p className="the-phan-thuong__so-luong">Còn: {r.quantity}</p>
            {user ? (
              <button
                onClick={() => doi(r.id, r.name)}
                disabled={user.points < r.pointsCost || r.quantity < 1}
                className="nut-chinh nut-chinh--day"
              >
                Đổi ngay
              </button>
            ) : (
              <Link to="/dang-nhap" className="nut-phu nut-chinh--day" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Đăng nhập để đổi
              </Link>
            )}
          </div>
        ))}
      </div>

      {user && lichSu?.length > 0 && (
        <>
          <h2 id="lich-su-doi" className="khung-luong__tieu-de" style={{ marginTop: '2rem' }}>Lịch sử đổi thưởng</h2>
          <div className="khung-form__card">
            <div className="danh-sach-the">
              {lichSu.map((h) => (
                <div key={h.id} className="the" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                    <span>{h.reward?.name}</span>
                    {h.confirmationCode ? (
                      <code style={{ fontSize: '0.8rem', color: '#047857', wordBreak: 'break-all' }}>
                        {laMaVoucher(h.confirmationCode) ? 'Mã đổi thưởng (voucher): ' : 'Mã: '}
                        {h.confirmationCode}
                      </code>
                    ) : null}
                    {h.confirmationCode && buocSuDungTheoMa(h.confirmationCode).length > 0 ? (
                      <details style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.25rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#047857', fontWeight: 500 }}>Cách sử dụng phần thưởng</summary>
                        <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                          {buocSuDungTheoMa(h.confirmationCode).map((dong, i) => (
                            <li key={i} style={{ marginBottom: '0.35rem' }}>{dong}</li>
                          ))}
                        </ol>
                      </details>
                    ) : null}
                  </div>
                  <span className="van-ban-trong">-{h.pointsSpent} điểm</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
