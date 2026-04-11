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
        'Bạn có thể xem hướng dẫn phân loại và danh mục đổi thưởng công khai. Đăng ký hoặc đăng nhập tài khoản khách hàng để tạo yêu cầu thu gom và theo dõi trạng thái.',
    };
  }
  if (user.role === 'CUSTOMER') {
    return {
      khoa: 'CUSTOMER',
      icon: '♻️',
      tieuDe: 'Chào mừng đến với khu vực khách hàng',
      moTa:
        'Tạo yêu cầu thu gom tại nhà, theo dõi trạng thái và tích điểm đổi thưởng. Hệ thống hỗ trợ gợi ý phân loại nhờ AI khi bạn gửi kèm ảnh.',
      tagline:
        'Mọi cập nhật về yêu cầu và điểm thưởng được thông báo trong tài khoản của bạn.',
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
      'Bạn có toàn quyền truy cập chức năng nhân viên (nhận yêu cầu, thu gom, thống kê) cùng các màn hình quản trị riêng.',
    gioiThieuTieuDe: 'Trách nhiệm quản trị',
    gioiThieu: [
      'Quản lý tài khoản người dùng, khóa hoặc phân quyền khi cần; duy trì danh mục loại rác và phần thưởng để đồng bộ với chương trình tích điểm.',
      'Theo dõi thống kê tổng hợp để đánh giá hiệu quả thu gom; can thiệp vận hành qua cùng luồng nhân viên khi cần hỗ trợ xử lý yêu cầu.',
    ],
    gioiThieuKet: null,
  };
}

export default function TrangChu() {
  const { user } = useAuth();
  const nd = noiDungTheoVaiTro(user);

  return (
    <div className="trang-chu">
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

          {!user && (
            <div className="banner__cta">
              <Link to="/dang-nhap" className="banner__nut banner__nut--chinh">
                Đăng nhập
              </Link>
              <Link to="/dang-ky" className="banner__nut banner__nut--phu">
                Đăng ký khách hàng
              </Link>
              <Link to="/huong-dan" className="banner__nut banner__nut--ghost">
                Hướng dẫn phân loại
              </Link>
            </div>
          )}

          {user?.role === 'CUSTOMER' && (
            <div className="banner__cta banner__cta--mot-hang">
              <Link to="/tao-yeu-cau" className="banner__nut banner__nut--chinh">
                Tạo yêu cầu thu gom
              </Link>
              <Link to="/yeu-cau-cua-toi" className="banner__nut banner__nut--phu">
                Theo dõi yêu cầu
              </Link>
              <Link to="/huong-dan" className="banner__nut banner__nut--ghost">
                Hướng dẫn phân loại
              </Link>
            </div>
          )}

          {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
            <div className="banner__cta banner__cta--mot-hang">
              <Link to="/nhan-vien/nhan-yeu-cau" className="banner__nut banner__nut--chinh">
                Nhận yêu cầu
              </Link>
              <Link to="/nhan-vien/thu-gom-xac-minh" className="banner__nut banner__nut--phu">
                Thu gom &amp; Xác minh
              </Link>
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

      {/* Lối tắt: khách vãng lai + khách hàng */}
      {!user && (
        <section className="ghi-chu-cac" aria-label="Lối tắt">
          <Link to="/huong-dan" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📖
            </div>
            <h2 className="ghi-chu__tieu-de">Hướng dẫn phân loại rác</h2>
            <p className="ghi-chu__mo-ta">Cách phân loại rác tái chế đúng quy định</p>
          </Link>
          <Link to="/doi-thuong" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              🎁
            </div>
            <h2 className="ghi-chu__tieu-de">Đổi thưởng</h2>
            <p className="ghi-chu__mo-ta">Quy đổi điểm tích lũy thành phần thưởng</p>
          </Link>
        </section>
      )}

      {user?.role === 'CUSTOMER' && (
        <section className="ghi-chu-cac" aria-label="Lối tắt khách hàng">
          <Link to="/huong-dan" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              📖
            </div>
            <h2 className="ghi-chu__tieu-de">Hướng dẫn phân loại rác</h2>
            <p className="ghi-chu__mo-ta">Cách phân loại rác tái chế đúng quy định</p>
          </Link>
          <Link to="/doi-thuong" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              🎁
            </div>
            <h2 className="ghi-chu__tieu-de">Đổi thưởng</h2>
            <p className="ghi-chu__mo-ta">Quy đổi điểm tích lũy thành phần thưởng</p>
          </Link>
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
          <Link to="/nhan-vien/nhan-yeu-cau" className="ghi-chu ghi-chu--nhan-biet">
            <div className="ghi-chu__icon" aria-hidden="true">
              📥
            </div>
            <h2 className="ghi-chu__tieu-de">Nhận yêu cầu</h2>
            <p className="ghi-chu__mo-ta">Tiếp nhận và điều phối thu gom</p>
          </Link>
          <Link to="/nhan-vien/thu-gom-xac-minh" className="ghi-chu">
            <div className="ghi-chu__icon" aria-hidden="true">
              ✅
            </div>
            <h2 className="ghi-chu__tieu-de">Thu gom &amp; Xác minh</h2>
            <p className="ghi-chu__mo-ta">Xác nhận khối lượng và loại rác</p>
          </Link>
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
    </div>
  );
}
