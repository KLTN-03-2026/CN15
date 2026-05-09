import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/NguoiDungContext';

/** Nội dung trang chủ theo vai trò — tránh hiển thị phần “khách hàng” cho nhân viên/admin */
function noiDungTheoVaiTro(user) {
  if (!user) {
    return {
      khoa: 'GUEST',
      icon: '♻️',
      tieuDe: 'Hệ thống Thu gom Rác Tái chế Thông minh',
      moTa:
        'Kết nối người dân có nhu cầu thu gom với đơn vị thu gom; hỗ trợ phân loại bằng AI và chương trình tích điểm đổi thưởng — gọn gàng, minh bạch, thân thiện môi trường.',
      tagline:
        'Đăng nhập theo vai trò để vào đúng khu vực: khách hàng tạo yêu cầu; nhân viên và quản trị vận hành thu gom trên hệ thống.',
      gioiThieuTieuDe: 'Giới thiệu',
      gioiThieu: [
        'Hệ thống hỗ trợ thu gom rác tái chế có tổ chức: khách hàng gửi loại rác, khối lượng ước tính và địa chỉ; đội thu gom nhận yêu cầu, điều phối và xác minh khi thu thực tế. Có thể đính kèm ảnh để AI gợi ý phân loại, giảm sai sót khi khai báo.',
        'Sau khi hoàn thành thu gom, điểm tích lũy được ghi nhận cho khách hàng và dùng trong chương trình đổi thưởng; dữ liệu được quản lý thống nhất.',
      ],
      gioiThieuKet:
        'Bạn có thể xem hướng dẫn phân loại công khai. Đăng ký hoặc đăng nhập tài khoản khách hàng để tạo yêu cầu thu gom và theo dõi trạng thái.',
    };
  }
  if (user.role === 'CUSTOMER') {
    return {
      khoa: 'CUSTOMER',
      icon: '♻️',
      tieuDe: 'Chào mừng bạn đến với trang khách hàng',
      moTa:
        'Bạn có thể tạo yêu cầu thu gom tại nhà, theo dõi tiến độ xử lý và tích điểm để đổi thưởng. Hệ thống cũng hỗ trợ gợi ý phân loại rác khi bạn gửi kèm ảnh.',
      tagline:
        'Mọi cập nhật về yêu cầu và điểm thưởng sẽ được hiển thị ngay trong tài khoản của bạn.',
      gioiThieuTieuDe: 'Dành cho khách hàng',
      gioiThieu: [
        'Bạn khai báo loại rác, khối lượng ước tính, địa chỉ và thời gian mong muốn; có thể đính kèm ảnh để được gợi ý phân loại. Sau khi nhân viên hoàn tất thu gom và xác minh, điểm tích lũy được cộng theo quy định.',
        'Điểm có thể quy đổi phần thưởng trong mục Đổi thưởng; lịch sử giao dịch và yêu cầu luôn xem được trong phần Theo dõi yêu cầu và Điểm.',
      ],
      gioiThieuKet: null,
    };
  }
  if (user.role === 'STAFF') {
    return {
      khoa: 'STAFF',
      icon: '🚛',
      tieuDe: 'Khu vực vận hành — Nhân viên thu gom',
      moTa:
        'Tiếp nhận yêu cầu, thực hiện thu gom và xác minh loại rác cùng khối lượng thực tế. Cập nhật trạng thái để khách hàng theo dõi và hệ thống ghi nhận điểm đúng quy định.',
      tagline:
        'Ưu tiên xử lý yêu cầu đang chờ; kiểm tra thông báo khi có yêu cầu mới hoặc thay đổi trạng thái.',
      gioiThieuTieuDe: 'Nhiệm vụ vận hành',
      gioiThieu: [
        'Từ danh sách yêu cầu, bạn nhận các ca phù hợp, cập nhật khi đang thu gom và hoàn tất với khối lượng cùng loại rác đã xác minh. Dữ liệu này là cơ sở để cộng điểm cho khách hàng.',
        'Thống kê giúp theo dõi khối lượng và tiến độ theo thời gian; thông báo trên hệ thống hỗ trợ không bỏ sót yêu cầu.',
      ],
      gioiThieuKet: null,
    };
  }
  /* ADMIN */
  return {
    khoa: 'ADMIN',
    icon: '⚙️',
    tieuDe: 'Khu vực quản trị hệ thống',
    moTa:
      'Cấu hình người dùng, loại rác, phần thưởng và theo dõi báo cáo tổng quan. Đảm bảo chính sách điểm, đổi thưởng và vận hành thống nhất trên toàn hệ thống.',
    tagline:
      'Bạn có quyền truy cập các màn hình quản trị và báo cáo tổng quan của hệ thống.',
    gioiThieuTieuDe: 'Trách nhiệm quản trị',
    gioiThieu: [
      'Quản lý tài khoản người dùng, khóa hoặc phân quyền khi cần; duy trì danh mục loại rác và phần thưởng để đồng bộ với chương trình tích điểm.',
        'Theo dõi thống kê tổng hợp để đánh giá hiệu quả thu gom và điều chỉnh chính sách vận hành phù hợp.',
    ],
    gioiThieuKet: null,
  };
}

export default function TrangChu() {
  const { user } = useAuth();
  const nd = noiDungTheoVaiTro(user);
  /** Cùng giao diện trang chủ công khai (hero + media) cho khách chưa đăng nhập và khách hàng đã đăng nhập */
  const hienTrangChuChinh = !user || user.role === 'CUSTOMER';
  const [moHoTro, setMoHoTro] = useState(false);
  const hinhAnhThucTe = [
    '/uploads/gd1.jpg',
    '/uploads/gd2.jpg',
    '/uploads/gd3.jpg',
  ];
  const hinhAnhHeroKhach = '/uploads/giaodien.png';

  return (
    <div className="trang-chu">
      {hienTrangChuChinh && (
        <section className="guest-home" aria-label="Trang chủ">
          <div className="guest-home__hero">
            <div className="guest-home__hero-noi-dung">
              <span className="guest-home__badge">Vì một môi trường xanh - sạch - đẹp</span>
              <h1 className="guest-home__tieu-de">
                HỆ THỐNG
                <br />
                THU GOM RÁC TÁI CHẾ THÔNG MINH
              </h1>
              <p className="guest-home__mo-ta">
                Kết nối người dân với đội thu gom, hỗ trợ phân loại rác bằng AI và tích điểm đổi thưởng.
              </p>
              <div className="guest-home__chi-so">
                <div><strong>10.000+</strong><span>Người dùng</span></div>
                <div><strong>25.000+</strong><span>Kg rác tái chế</span></div>
                <div><strong>5.000+</strong><span>Phần quà đổi</span></div>
              </div>
            </div>
            <div className="guest-home__hero-anh">
              <img src={encodeURI(hinhAnhHeroKhach)} alt="Thu gom rác thông minh" loading="lazy" />
            </div>
          </div>

          <div className="guest-home__tinh-nang">
            <Link
              to={user?.role === 'CUSTOMER' ? '/tao-yeu-cau' : '/dang-nhap'}
              className="guest-home__the"
            >
              <h3>Đặt lịch thu gom</h3>
              <p>Gửi yêu cầu thu gom nhanh chóng, tiện lợi theo thời gian phù hợp.</p>
            </Link>
            {user?.role === 'CUSTOMER' && (
              <Link to="/doi-thuong" className="guest-home__the">
                <h3>Đổi thưởng</h3>
                <p>Tích điểm xanh và đổi những phần quà hữu ích.</p>
              </Link>
            )}
          </div>

          <div className="guest-home__quy-trinh">
            <h2>Quy trình thu gom rác</h2>
            <div className="guest-home__buoc">
              <div><b>1</b><span>Tạo yêu cầu thu gom</span></div>
              <div><b>2</b><span>AI gợi ý loại rác</span></div>
              <div><b>3</b><span>Nhân viên nhận yêu cầu</span></div>
              <div><b>4</b><span>Thu gom và xác minh</span></div>
              <div><b>5</b><span>Cộng điểm và đổi thưởng</span></div>
            </div>
          </div>
        </section>
      )}

      {user && user.role !== 'CUSTOMER' ? (
      <section className="banner" aria-labelledby="trang-chu-tieu-de">
        <div className="banner__noi-dung">
          <span className="banner__icon" aria-hidden="true">
            {nd.icon}
          </span>
          <h1 id="trang-chu-tieu-de" className="banner__tieu-de">
            {nd.tieuDe}
          </h1>
          <p className="banner__mo-ta">{nd.moTa}</p>
          <p className="banner__tagline">{nd.tagline}</p>

          {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
            <div className="banner__cta banner__cta--mot-hang">
              {user?.role !== 'ADMIN' && (
                <>
                  <Link to="/nhan-vien/nhan-yeu-cau" className="banner__nut banner__nut--chinh">
                    Nhận yêu cầu
                  </Link>
                  <Link to="/nhan-vien/thu-gom-xac-minh" className="banner__nut banner__nut--phu">
                    Thu gom &amp; Xác minh
                  </Link>
                </>
              )}
              <Link to="/nhan-vien/thong-ke" className="banner__nut banner__nut--phu">
                Thống kê
              </Link>
              <Link to="/thong-bao" className="banner__nut banner__nut--ghost">
                Thông báo
              </Link>
            </div>
          )}
        </div>
      </section>
      ) : null}

      {hienTrangChuChinh && (
        <section className="trang-chu-guest-media" aria-label="Hình ảnh thực tế thu gom tái chế">
          <div className="trang-chu-guest-media__noi-dung">
            <div>
              <h2 className="trang-chu-guest-media__tieu-de">Hình ảnh thực tế từ hoạt động thu gom</h2>
              <p className="trang-chu-guest-media__mo-ta">
                Hệ thống hỗ trợ người dân gửi yêu cầu nhanh, đội ngũ thu gom tiếp nhận và xử lý minh bạch.
                Mỗi lần tái chế đúng cách đều góp phần giảm rác thải và tăng điểm thưởng xanh.
              </p>
            </div>
            <div className="trang-chu-guest-media__luoi">
              {hinhAnhThucTe.map((src, idx) => (
                <img
                  key={src}
                  src={encodeURI(src)}
                  alt={`Hình ảnh thu gom tái chế ${idx + 1}`}
                  className="trang-chu-guest-media__anh"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {user?.role === 'CUSTOMER' && (
        <section className="ghi-chu-cac ghi-chu-cac--khach-hang" aria-label="Lối tắt khách hàng">
          <Link to="/tao-yeu-cau" className="ghi-chu ghi-chu--nhan-biet">
            <div className="ghi-chu__icon" aria-hidden="true">
              📦
            </div>
            <h2 className="ghi-chu__tieu-de">Tạo yêu cầu thu gom</h2>
            <p className="ghi-chu__mo-ta">Đăng ký lịch thu gom tại địa chỉ của bạn</p>
          </Link>
          <Link to="/yeu-cau-cua-toi" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📋
            </div>
            <h2 className="ghi-chu__tieu-de">Theo dõi yêu cầu</h2>
            <p className="ghi-chu__mo-ta">Trạng thái, chi tiết và lịch sử cập nhật</p>
          </Link>
          <Link to="/doi-thuong" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              🎁
            </div>
            <h2 className="ghi-chu__tieu-de">Đổi thưởng</h2>
            <p className="ghi-chu__mo-ta">Dùng điểm tích lũy để đổi quà theo danh mục hiện có.</p>
          </Link>
          <Link to="/thong-ke" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📊
            </div>
            <h2 className="ghi-chu__tieu-de">Thống kê</h2>
            <p className="ghi-chu__mo-ta">Xem tổng quan số liệu thu gom và điểm tích lũy của bạn.</p>
          </Link>
        </section>
      )}

      {/* Nhân viên: lối tắt vận hành */}
      {user?.role === 'STAFF' && (
        <section className="ghi-chu-cac ghi-chu-cac--van-hanh" aria-label="Lối tắt nhân viên">
          <Link to="/nhan-vien/nhan-yeu-cau" className="ghi-chu ghi-chu--nhan-biet">
            <div className="ghi-chu__icon" aria-hidden="true">
              📥
            </div>
            <h2 className="ghi-chu__tieu-de">Nhận yêu cầu</h2>
            <p className="ghi-chu__mo-ta">Danh sách chờ, tiếp nhận xử lý thu gom</p>
          </Link>
          <Link to="/nhan-vien/thu-gom-xac-minh" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              ✅
            </div>
            <h2 className="ghi-chu__tieu-de">Thu gom &amp; Xác minh</h2>
            <p className="ghi-chu__mo-ta">Hoàn tất và xác nhận khối lượng thực tế</p>
          </Link>
          <Link to="/nhan-vien/thong-ke" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📊
            </div>
            <h2 className="ghi-chu__tieu-de">Thống kê</h2>
            <p className="ghi-chu__mo-ta">Báo cáo theo ngày, tuần, tháng</p>
          </Link>
          <Link to="/thong-bao" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              🔔
            </div>
            <h2 className="ghi-chu__tieu-de">Thông báo</h2>
            <p className="ghi-chu__mo-ta">Yêu cầu mới và cập nhật trạng thái</p>
          </Link>
        </section>
      )}

      {/* Admin: vận hành + quản trị */}
      {user?.role === 'ADMIN' && (
        <section className="ghi-chu-cac ghi-chu-cac--van-hanh" aria-label="Lối tắt quản trị">
          <Link to="/nhan-vien/thong-ke" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📊
            </div>
            <h2 className="ghi-chu__tieu-de">Thống kê</h2>
            <p className="ghi-chu__mo-ta">Báo cáo tổng hợp</p>
          </Link>
          <Link to="/quan-tri/nguoi-dung" className="ghi-chu ghi-chu--quan-tri">
            <div className="ghi-chu__icon" aria-hidden="true">
              👥
            </div>
            <h2 className="ghi-chu__tieu-de">Người dùng</h2>
            <p className="ghi-chu__mo-ta">Tài khoản và phân quyền</p>
          </Link>
          <Link to="/quan-tri/loai-rac" className="ghi-chu ghi-chu--quan-tri">
            <div className="ghi-chu__icon" aria-hidden="true">
              🏷️
            </div>
            <h2 className="ghi-chu__tieu-de">Loại rác</h2>
            <p className="ghi-chu__mo-ta">Danh mục và điểm quy đổi</p>
          </Link>
          <Link to="/quan-tri/phan-thuong" className="ghi-chu ghi-chu--quan-tri">
            <div className="ghi-chu__icon" aria-hidden="true">
              🎁
            </div>
            <h2 className="ghi-chu__tieu-de">Phần thưởng</h2>
            <p className="ghi-chu__mo-ta">Cấu hình đổi thưởng</p>
          </Link>
          <Link to="/thong-bao" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              🔔
            </div>
            <h2 className="ghi-chu__tieu-de">Thông báo</h2>
            <p className="ghi-chu__mo-ta">Thông báo hệ thống</p>
          </Link>
        </section>
      )}

      <section className="khung-gioi-thieu" aria-labelledby="gioi-thieu-tieu-de">
        <h2 id="gioi-thieu-tieu-de" className="khung-gioi-thieu__tieu-de">
          {nd.gioiThieuTieuDe}
        </h2>
        <div className="khung-gioi-thieu__van-ban">
          {nd.gioiThieu.map((doan, i) => (
            <p key={i}>{doan}</p>
          ))}
          {nd.gioiThieuKet && <p className="khung-gioi-thieu__ket">{nd.gioiThieuKet}</p>}
        </div>
      </section>

      <div className="ho-tro-noi" aria-live="polite">
        {moHoTro && (
          <div className="ho-tro-noi__hop">
            <h3 className="ho-tro-noi__tieu-de">Hỗ trợ khách hàng</h3>
            <p className="ho-tro-noi__mo-ta">Liên hệ nhanh khi cần trợ giúp tạo yêu cầu hoặc tra cứu trạng thái.</p>
            <a className="ho-tro-noi__lien-he" href="tel:19001234">Hotline: 1900 1234</a>
            <a className="ho-tro-noi__lien-he" href="mailto:hotro@thugomrac.vn">Email: hotro@thugomrac.vn</a>
            <p className="ho-tro-noi__gio">Thời gian hỗ trợ: 08:00 - 17:30 (Thứ 2 - Thứ 7)</p>
          </div>
        )}
        <button
          type="button"
          className="ho-tro-noi__nut"
          onClick={() => setMoHoTro((v) => !v)}
        >
          {moHoTro ? 'Đóng hỗ trợ' : 'Hỗ trợ khách hàng'}
        </button>
      </div>
    </div>
  );
}
