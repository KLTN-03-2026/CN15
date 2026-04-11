export default function HuongDan() {
  const mucLuc = [
    { icon: '🥤', tieuDe: 'Nhựa PET', moTa: 'Chai nước, chai soda - rửa sạch, bỏ nắp' },
    { icon: '📦', tieuDe: 'Giấy/Carton', moTa: 'Hộp carton, báo, giấy vụn - gấp phẳng' },
    { icon: '🥫', tieuDe: 'Kim loại', moTa: 'Nhôm, sắt, hộp thiếc - làm sạch' },
    { icon: '🍶', tieuDe: 'Thủy tinh', moTa: 'Chai lọ - rửa sạch, cẩn thận khi vận chuyển' },
    { icon: '🧴', tieuDe: 'Nhựa HDPE', moTa: 'Hộp sữa, chai nhựa cứng - rửa sạch' },
  ];

  return (
    <div>
      <h1 className="tieu-de-trang">Hướng dẫn phân loại rác tái chế</h1>
      <div className="danh-sach-huong-dan">
        {mucLuc.map((m) => (
          <div key={m.tieuDe} className="the-huong-dan">
            <span className="the-huong-dan__icon">{m.icon}</span>
            <div>
              <h3 className="the-huong-dan__tieu-de">{m.tieuDe}</h3>
              <p className="the-huong-dan__mo-ta">{m.moTa}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
