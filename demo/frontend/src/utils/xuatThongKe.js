import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

const NHAN_TRANG_THAI = {
  PENDING: 'Chờ xử lý',
  COLLECTING: 'Đang thu gom',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

function tenFile(coDinh) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${coDinh}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function hangBang(cacGiaTri, inDam) {
  return new TableRow({
    children: cacGiaTri.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(text), bold: !!inDam })],
            }),
          ],
        }),
    ),
  });
}

/** Xuất file Excel (.xlsx) từ dữ liệu thống kê API */
export function xuatExcel(duLieu, nhanChuKy) {
  const wb = XLSX.utils.book_new();

  const tongHop = [
    ['Báo cáo thống kê — Hệ thống thu gom rác tái chế'],
    [],
    ['Chu kỳ', nhanChuKy],
    ['Từ thời điểm', new Date(duLieu.startDate).toLocaleString('vi-VN')],
    [],
    ['Chỉ số', 'Giá trị'],
    ['Tổng yêu cầu', duLieu.totalRequests],
    ['Đã hoàn thành', duLieu.completedRequests],
    ['Tổng khối lượng (kg)', duLieu.totalWeight ?? 0],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(tongHop);
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng hợp');

  const theoTT = [['Trạng thái (mã)', 'Tên hiển thị', 'Số lượng']];
  Object.entries(duLieu.byStatus || {}).forEach(([k, v]) => {
    theoTT.push([k, NHAN_TRANG_THAI[k] || k, v]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(theoTT);
  XLSX.utils.book_append_sheet(wb, ws2, 'Theo trạng thái');

  if (duLieu.byWasteType?.length) {
    const sheetLoai = duLieu.byWasteType.map((b) => ({
      'Loại rác': b.wasteType,
      'Số yêu cầu': b.count,
      'Khối lượng (kg)': b.totalWeight,
    }));
    const ws3 = XLSX.utils.json_to_sheet(sheetLoai);
    XLSX.utils.book_append_sheet(wb, ws3, 'Theo loại rác');
  }

  XLSX.writeFile(wb, `${tenFile('thong-ke')}.xlsx`);
}

/** Xuất file Word (.docx) */
export async function xuatWord(duLieu, nhanChuKy) {
  const tongHopRows = [
    hangBang(['Chỉ số', 'Giá trị'], true),
    hangBang(['Tổng yêu cầu', duLieu.totalRequests], false),
    hangBang(['Đã hoàn thành', duLieu.completedRequests], false),
    hangBang(['Tổng khối lượng (kg)', duLieu.totalWeight ?? 0], false),
  ];

  const ttRows = [
    hangBang(['Trạng thái', 'Số lượng'], true),
    ...Object.entries(duLieu.byStatus || {}).map(([k, v]) =>
      hangBang([NHAN_TRANG_THAI[k] || k, v], false),
    ),
  ];

  const loaiRows =
    duLieu.byWasteType?.length > 0
      ? [
          hangBang(['Loại rác', 'Số yêu cầu', 'Khối lượng (kg)'], true),
          ...duLieu.byWasteType.map((b) => hangBang([b.wasteType, b.count, b.totalWeight], false)),
        ]
      : [];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Báo cáo thống kê',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Chu kỳ: ', bold: true }),
              new TextRun(nhanChuKy),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Từ thời điểm: ', bold: true }),
              new TextRun(new Date(duLieu.startDate).toLocaleString('vi-VN')),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Tổng hợp', bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tongHopRows,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Theo trạng thái', bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: ttRows,
          }),
          ...(loaiRows.length
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({ children: [new TextRun({ text: 'Theo loại rác', bold: true })] }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: loaiRows,
                }),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${tenFile('bao-cao-thong-ke')}.docx`);
}
