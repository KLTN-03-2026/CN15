import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wasteTypes, collections, ai } from '../goiAPI';

export default function TaoYeuCau() {
  const navigate = useNavigate();
  const [danhSachLoaiRac, setDanhSachLoaiRac] = useState([]);
  const [form, setForm] = useState({ wasteTypeId: '', quantity: '', address: '', phone: '', desiredCollectionDate: '', note: '' });
  const [fileAnh, setFileAnh] = useState(null);
  const [xemAnh, setXemAnh] = useState(null);
  const [dangGui, setDangGui] = useState(false);
  const [dangPhanTich, setDangPhanTich] = useState(false);
  const [loi, setLoi] = useState('');
  const [ketQuaAI, setKetQuaAI] = useState(null); // { suggestedWasteTypeId, suggestedWasteTypeName, suggestedQuantity, confidence, moTaChiTiet }

  const taiDanhSachLoaiRac = () => {
    wasteTypes.list().then(setDanhSachLoaiRac).catch(() => setDanhSachLoaiRac([]));
  };

  useEffect(() => {
    taiDanhSachLoaiRac();
    const capNhat = () => taiDanhSachLoaiRac();
    window.addEventListener('focus', capNhat);
    window.addEventListener('waste-types-updated', capNhat);
    return () => {
      window.removeEventListener('focus', capNhat);
      window.removeEventListener('waste-types-updated', capNhat);
    };
  }, []);

  const phanTichAI = async (file) => {
    const f = file ?? fileAnh;
    if (!f) {
      setLoi('Vui lòng chọn ảnh trước');
      return;
    }
    setDangPhanTich(true);
    setLoi('');
    setKetQuaAI(null);
    try {
      const r = await ai.analyzeWaste(f);
      if (r.suggestedWasteTypeId) {
        const conf = r.suggestions?.[0]?.confidence ?? 0.85;
        setKetQuaAI({
          suggestedWasteTypeId: r.suggestedWasteTypeId,
          suggestedWasteTypeName: r.suggestedWasteTypeName || '',
          suggestedQuantity: r.suggestedQuantity ?? 2.5,
          confidence: Math.round(conf * 100),
          moTaChiTiet: r.moTaChiTiet || '',
        });
      }
    } catch (ex) {
      setLoi(ex.message || 'AI phân tích lỗi');
    } finally {
      setDangPhanTich(false);
    }
  };

  const xacNhanKetQuaAI = () => {
    if (!ketQuaAI) return;
    setForm((prev) => ({
      ...prev,
      wasteTypeId: ketQuaAI.suggestedWasteTypeId,
      quantity: ketQuaAI.suggestedQuantity?.toString() || prev.quantity || '',
    }));
    setKetQuaAI(null); // Ẩn khung sau khi xác nhận
  };

  const xuLyFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileAnh(f);
    setXemAnh(URL.createObjectURL(f));
    setKetQuaAI(null);
    phanTichAI(f);
  };

  const xuLyGui = async (e) => {
    e.preventDefault();
    setLoi('');
    const ngay = form.desiredCollectionDate ? new Date(form.desiredCollectionDate + 'T00:00:00') : null;
    if (ngay && ngay < new Date(new Date().setHours(0, 0, 0, 0))) {
      setLoi('Ngày thu gom không được là ngày trong quá khứ');
      return;
    }
    setDangGui(true);
    try {
      const req = await collections.create(form, fileAnh);
      navigate(`/yeu-cau/${req.id}`);
    } catch (ex) {
      setLoi(ex.message || 'Tạo yêu cầu thất bại');
    } finally {
      setDangGui(false);
    }
  };

  const ngayHienTai = new Date().toISOString().split('T')[0];

  return (
    <div className="khung-form">
      <div className="khung-form__card">
        <h1 className="khung-form__tieu-de">
          <span className="khung-form__tieu-de-icon">📦</span>
          Tạo yêu cầu thu gom rác
        </h1>
        {loi && <div className="thong-bao-loi">{loi}</div>}

        <form onSubmit={xuLyGui} className="form-gap">
          <div className="form-group">
            <label className="form-group__nhan">Loại rác</label>
            <select
              value={form.wasteTypeId}
              onChange={(e) => setForm({ ...form, wasteTypeId: e.target.value })}
              className="form-group__input"
              required
            >
              <option value="">-- Chọn loại rác --</option>
              {danhSachLoaiRac.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.pointsPerKg} điểm/kg)</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Tải ảnh (tùy chọn – AI phân tích loại rác)</label>
            <div className="form-group__file-row">
              <input type="file" accept="image/*" onChange={xuLyFile} className="form-group__input" />
              {fileAnh && (
                <button type="button" onClick={() => phanTichAI()} disabled={dangPhanTich} className="nut-phu">
                  {dangPhanTich ? 'Đang phân tích...' : '🤖 Phân tích'}
                </button>
              )}
            </div>
            {xemAnh && <img src={xemAnh} alt="Xem trước" className="xem-truoc-anh" />}
            {ketQuaAI && (
              <div className="ai-ket-qua" style={{ marginTop: '0.75rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>
                  🤖 AI phân tích: <span style={{ color: '#15803d' }}>{ketQuaAI.suggestedWasteTypeName}</span> – <span style={{ color: '#0d9488' }}>{ketQuaAI.confidence}%</span>
                </div>
                {ketQuaAI.moTaChiTiet && (
                  <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.75rem' }}>
                    {ketQuaAI.moTaChiTiet}
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.75rem' }}>
                  Ước lượng: <strong>{ketQuaAI.suggestedQuantity} kg</strong>
                </div>
                <button type="button" onClick={xacNhanKetQuaAI} className="nut-chinh nut-chinh--day" style={{ marginRight: '0.5rem' }}>
                  ✓ Xác nhận và điền vào form
                </button>
                <button type="button" onClick={() => setKetQuaAI(null)} className="nut-phu">
                  Bỏ qua
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Số lượng (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="form-group__input"
              placeholder="VD: 2.5"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Địa chỉ thu gom</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="form-group__input"
              placeholder="Số nhà, đường, phường..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Số điện thoại liên hệ</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="form-group__input"
              placeholder="VD: 0912345678"
            />
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Ngày muốn tới thu gom</label>
            <input
              type="date"
              value={form.desiredCollectionDate}
              onChange={(e) => setForm({ ...form, desiredCollectionDate: e.target.value })}
              min={ngayHienTai}
              className="form-group__input"
            />
          </div>

          <div className="form-group">
            <label className="form-group__nhan">Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="form-group__input form-group__textarea"
              rows={2}
              placeholder="Thông tin thêm (tùy chọn)"
            />
          </div>

          <button type="submit" disabled={dangGui} className="nut-chinh nut-chinh--day">
            {dangGui ? 'Đang gửi...' : 'Xác nhận và gửi yêu cầu'}
          </button>
        </form>
      </div>
    </div>
  );
}
