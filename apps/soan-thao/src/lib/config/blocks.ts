import type { ProfileType } from './profiles';

export interface BlockItem {
  key: string;
  docType: string | null;
  title: string;
  desc: string;
  icon: string;
  profile?: ProfileType;
  category?: string;
}

const CORE_HEADER = `<table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;" contenteditable="false">
  <tbody>
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; text-transform: uppercase;">[CƠ QUAN CHỦ QUẢN]</div>
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">[TÊN CƠ QUAN]</div>
        <div style="margin: 2px auto; border-top: 1px solid black; width: 40%;"></div>
      </td>
      <td style="width: 60%; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-size: 14pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
      </td>
    </tr>
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top; padding-top: 5px;" contenteditable="true">
        <div style="font-size: 13pt;">Số: ....../[KÝ HIỆU]</div>
      </td>
      <td style="width: 60%; text-align: right; vertical-align: top; padding-top: 5px; padding-right: 20px;" contenteditable="true">
        <div style="font-size: 14pt; font-style: italic;">[Địa danh], ngày ... tháng ... năm ...</div>
      </td>
    </tr>
  </tbody>
</table><div style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 20px;" contenteditable="true">[TÊN LOẠI VĂN BẢN]</div><div style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px;" contenteditable="true">Về việc [Trích yếu nội dung]</div><p><br></p>`;

const CORE_HEADER_CONGVAN = `<table style="width: 606px; table-layout: fixed; border-collapse: collapse; border: none; margin-bottom: 20px;" contenteditable="false">
  <tbody>
    <tr>
      <td style="width: 240px; max-width: 240px; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; text-transform: uppercase;">[CƠ QUAN CHỦ QUẢN]</div>
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">[TÊN CƠ QUAN]</div>
        <div style="margin: 2px auto; border-top: 1px solid black; width: 40%;"></div>
      </td>
      <td style="width: 366px; max-width: 366px; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-size: 14pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
      </td>
    </tr>
    <tr>
      <td style="width: 240px; max-width: 240px; text-align: center; vertical-align: top; padding-top: 5px;" contenteditable="true">
        <div style="font-size: 13pt;">Số: ....../[KÝ HIỆU]</div>
        <div style="font-size: 13pt; margin-top: 5px;">V/v: [Trích yếu nội dung]</div>
      </td>
      <td style="width: 366px; max-width: 366px; text-align: center; vertical-align: top; padding-top: 5px;" contenteditable="true">
        <div style="font-size: 14pt; font-style: italic;">[Địa danh], ngày ... tháng ... năm ...</div>
      </td>
    </tr>
  </tbody>
</table><p><br></p>`;

export const BLOCK_TEMPLATES: Record<string, string> = {
  header_quyetdinh: CORE_HEADER,
  header_thongbao: CORE_HEADER,
  header_totrinh: CORE_HEADER,
  header_congvan: CORE_HEADER_CONGVAN,
  cancu: `<p style="font-style: italic;">Căn cứ [Văn bản pháp luật];</p><p><br></p>`,
  dieukhoan: `<p><b contenteditable="false">Điều ...</b> [Nội dung điều khoản]</p><p><br></p>`,
  kinhgui: `<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" contenteditable="false"><tbody><tr><td style="vertical-align: top; padding: 0; width: 90px;" contenteditable="false"><div style="font-size: 14pt;">Kính gửi:</div></td><td style="vertical-align: top; padding: 0;" contenteditable="true"><div style="font-size: 14pt;">- [Cơ quan, tổ chức 1];<br>- [Cơ quan, tổ chức 2].</div></td></tr></tbody></table><p><br></p>`,
  noinhan: `<table style="width: 606px; table-layout: fixed; border-collapse: collapse; margin-top: 30px;" contenteditable="false"><tbody><tr><td style="width: 303px; max-width: 303px; vertical-align: top; padding: 0;" contenteditable="true"><div style="font-size: 12pt; font-weight: bold; font-style: italic;">Nơi nhận:</div><div style="font-size: 11pt;">- Như Điều ...;</div><div style="font-size: 11pt;">- Lưu: VT, ...</div><div style="font-size: 10pt; font-style: italic; margin-top: 5px;">[Người soạn thảo]</div></td><td style="width: 303px; max-width: 303px; text-align: center; vertical-align: top; padding: 0;" contenteditable="true">[QUYỀN HẠN KÝ]<div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">[CHỨC VỤ NGƯỜI KÝ]</div><div style="height: 90px; margin: 10px auto; width: 160px; border: 2px dashed #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10pt;" contenteditable="false">Ký bởi: [Họ và tên]</div><div style="font-size: 14pt; font-weight: bold;">[Họ và tên]</div></td></tr></tbody></table><p><br></p>`,
  hoatoc: `<div style="font-size: 14pt; font-weight: bold; color: red; border: 2px solid red; display: inline-block; padding: 2px 10px; margin-bottom: 10px;">HỎA TỐC</div><p><br></p>`,
  trichyeu: `<div style="font-size: 13pt; margin-top: 5px;">V/v: [Trích yếu nội dung]</div><p><br></p>`,
  phuluc: `<div style="text-align: right; font-size: 14pt; font-weight: bold; margin-bottom: 20px;">PHỤ LỤC I</div><p><br></p>`,
  thanhphan_thamdu: `<p><b>1. Thành phần tham dự:</b></p><p>- Chủ trì: [Họ và tên] - [Chức vụ]</p><p>- Thư ký: [Họ và tên] - [Chức vụ]</p><p>- Đại biểu: [Họ và tên] - [Chức vụ]</p><p><b>2. Nội dung:</b></p><p><br></p>`,
  bangbieu_baocao: `<table style="width: 100%; border-collapse: collapse; border: 1px solid black;" border="1" contenteditable="true"><tbody><tr><td style="padding: 8px; font-weight: bold; text-align: center;">STT</td><td style="padding: 8px; font-weight: bold; text-align: center;">Nội dung công việc</td><td style="padding: 8px; font-weight: bold; text-align: center;">Tiến độ</td><td style="padding: 8px; font-weight: bold; text-align: center;">Ghi chú</td></tr><tr><td style="padding: 8px; text-align: center;">1</td><td style="padding: 8px;">[Nội dung]</td><td style="padding: 8px; text-align: center;">[Tiến độ]</td><td style="padding: 8px;"></td></tr></tbody></table><p><br></p>`,
  contract_parties: `<p><b contenteditable="false">BÊN A:</b> [Tên Công ty/Cá nhân]</p><p>Đại diện: [Người đại diện]</p><p>Địa chỉ: [Địa chỉ]</p><p>Mã số thuế: [MST]</p><p><br></p><p><b contenteditable="false">BÊN B:</b> [Tên Công ty/Cá nhân]</p><p>Đại diện: [Người đại diện]</p><p>Địa chỉ: [Địa chỉ]</p><p>Mã số thuế: [MST]</p><p><br></p>`,
  chuky_2ben: `<table style="width: 100%; border-collapse: collapse; margin-top: 30px;" contenteditable="false"><tbody><tr><td style="width: 50%; text-align: center; vertical-align: top;" contenteditable="true"><div style="font-size: 13pt; font-weight: bold;">ĐẠI DIỆN BÊN A</div><div style="font-size: 11pt; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</div><div style="height: 100px;"></div><div style="font-size: 13pt; font-weight: bold;">[Họ và tên]</div></td><td style="width: 50%; text-align: center; vertical-align: top;" contenteditable="true"><div style="font-size: 13pt; font-weight: bold;">ĐẠI DIỆN BÊN B</div><div style="font-size: 11pt; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</div><div style="height: 100px;"></div><div style="font-size: 13pt; font-weight: bold;">[Họ và tên]</div></td></tr></tbody></table><p><br></p>`,
  bang_baogia: `<table style="width: 100%; border-collapse: collapse; border: 1px solid black;" border="1" contenteditable="true"><tbody><tr><td style="padding: 8px; font-weight: bold; text-align: center; width: 10%;">STT</td><td style="padding: 8px; font-weight: bold; text-align: center; width: 40%;">Tên Hàng hóa / Dịch vụ</td><td style="padding: 8px; font-weight: bold; text-align: center; width: 15%;">Số lượng</td><td style="padding: 8px; font-weight: bold; text-align: center; width: 15%;">Đơn giá</td><td style="padding: 8px; font-weight: bold; text-align: center; width: 20%;">Thành tiền</td></tr><tr><td style="padding: 8px; text-align: center;">1</td><td style="padding: 8px;">[Sản phẩm 1]</td><td style="padding: 8px; text-align: center;">1</td><td style="padding: 8px; text-align: right;">0</td><td style="padding: 8px; text-align: right;">0</td></tr><tr><td colspan="4" style="padding: 8px; font-weight: bold; text-align: right;">TỔNG CỘNG</td><td style="padding: 8px; font-weight: bold; text-align: right;">0</td></tr></tbody></table><p><br></p>`,
  edu_quiz: `<p><b>Câu [X]:</b> [Nội dung câu hỏi]</p><table style="width: 100%; margin-bottom: 15px;" contenteditable="true"><tbody><tr><td style="width: 50%;">A. [Đáp án A]</td><td style="width: 50%;">B. [Đáp án B]</td></tr><tr><td style="width: 50%;">C. [Đáp án C]</td><td style="width: 50%;">D. [Đáp án D]</td></tr></tbody></table><p><br></p>`,
  matran_dethi: `<table style="width: 100%; border-collapse: collapse; border: 1px solid black;" border="1" contenteditable="true"><tbody><tr><td rowspan="2" style="padding: 8px; font-weight: bold; text-align: center;">Chủ đề</td><td colspan="4" style="padding: 8px; font-weight: bold; text-align: center;">Mức độ nhận thức</td><td rowspan="2" style="padding: 8px; font-weight: bold; text-align: center;">Tổng</td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Nhận biết</td><td style="padding: 8px; font-weight: bold; text-align: center;">Thông hiểu</td><td style="padding: 8px; font-weight: bold; text-align: center;">Vận dụng</td><td style="padding: 8px; font-weight: bold; text-align: center;">VD cao</td></tr><tr><td style="padding: 8px;">[Chủ đề 1]</td><td style="padding: 8px; text-align: center;">[Số câu]</td><td style="padding: 8px; text-align: center;">[Số câu]</td><td style="padding: 8px; text-align: center;">[Số câu]</td><td style="padding: 8px; text-align: center;">[Số câu]</td><td style="padding: 8px; text-align: center;">[Tổng]</td></tr></tbody></table><p><br></p>`,
  trangbia_tieuluan: `<div style="border: 4px double #333; padding: 40px; text-align: center; margin-bottom: 30px; min-height: 800px; display: flex; flex-direction: column; justify-content: space-between;" contenteditable="true"><div><h2 style="font-size: 16pt; text-transform: uppercase;">TRƯỜNG [TÊN TRƯỜNG ĐẠI HỌC/CẤP 3]</h2><h3 style="font-size: 14pt; margin-top: 10px;">Khoa / Lớp: [Tên Khoa/Lớp]</h3></div><div style="margin: auto 0;"><h1 style="font-size: 24pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">BÁO CÁO THỰC HÀNH / TIỂU LUẬN</h1><h2 style="font-size: 18pt;">Đề tài: [Tên đề tài tiểu luận của bạn]</h2></div><div style="text-align: left; width: 60%; margin: 0 auto; font-size: 14pt;"><p><b>Sinh viên/Học sinh thực hiện:</b> [Họ và tên]</p><p><b>Mã số:</b> [MSSV]</p><p><b>Giáo viên hướng dẫn:</b> [Họ và tên]</p></div><div style="margin-top: 50px;"><p style="font-size: 14pt; font-style: italic;">[Địa phương], Tháng ... Năm ...</p></div></div><div style="page-break-before: always;"></div><p><br></p>`,
  stickynote: `<div style="background-color: #fef08a; padding: 15px; border-radius: 8px; border-left: 5px solid #eab308; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); margin-bottom: 15px; font-family: 'Comic Sans MS', cursive, sans-serif;" contenteditable="true"><b>📌 Ghi chú:</b><br>Nhập nội dung ghi chú nhanh vào đây...</div><p><br></p>`,
  poem_stanza: `<p>Dòng thơ 1</p><p>Dòng thơ 2</p><p>Dòng thơ 3</p><p>Dòng thơ 4</p><p><br></p>`,
  music_chord: `<div style="position: relative; margin-top: 1.5rem;"><span style="position: absolute; top: -1.2rem; font-weight: bold; color: #2563eb; font-size: 12px;" contenteditable="true">[C]</span><span contenteditable="true">Lời bài hát ở đây...</span></div><p><br></p>`,
  novel_divider: `<p style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; color: #999; margin: 2rem 0;" contenteditable="false">***</p><p><br></p>`,
  novel_chapter: `<h2 class="novel-chapter" style="font-size: 24pt; font-weight: bold; text-align: center; margin-top: 40px; margin-bottom: 20px;" contenteditable="true">CHƯƠNG [X]: [TÊN CHƯƠNG]</h2><p><br></p>`,
  // GIÁO DỤC
  giaoan_header: `<div style="text-align: center; margin-bottom: 20px;" contenteditable="false"><h2 style="font-size: 16pt; text-transform: uppercase;">TRƯỜNG [TÊN TRƯỜNG]</h2><h2 style="font-size: 16pt; text-transform: uppercase;">TỔ [TÊN TỔ CHUYÊN MÔN]</h2><br><h1 style="font-size: 20pt; font-weight: bold; text-transform: uppercase;">KẾ HOẠCH BÀI DẠY</h1></div><table style="width: 100%; border: none; margin-bottom: 15px;" contenteditable="true"><tbody><tr><td style="width: 50%; font-size: 14pt;"><b>Môn học/Hoạt động:</b> [Tên môn học]</td><td style="width: 50%; font-size: 14pt;"><b>Lớp:</b> [Lớp]</td></tr><tr><td style="width: 50%; font-size: 14pt;"><b>Tên bài học:</b> [Tên bài học]</td><td style="width: 50%; font-size: 14pt;"><b>Số tiết:</b> [Số tiết]</td></tr></tbody></table><p><b>I. MỤC TIÊU BÀI HỌC</b></p><p><b>1. Kiến thức:</b></p><p>- [Mục tiêu kiến thức]</p><p><b>2. Năng lực:</b></p><p>- [Mục tiêu năng lực]</p><p><b>3. Phẩm chất:</b></p><p>- [Mục tiêu phẩm chất]</p><p><br></p>`,
  giaoan_hoatdong: `<table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px;" border="1" contenteditable="true"><tbody><tr><td colspan="2" style="padding: 8px; font-weight: bold; background-color: #f3f4f6;">HOẠT ĐỘNG [X]: [TÊN HOẠT ĐỘNG] (Thời gian: ... phút)</td></tr><tr><td style="padding: 8px; font-weight: bold; width: 25%; vertical-align: top;">a) Mục tiêu:</td><td style="padding: 8px;">[Mục tiêu của hoạt động]</td></tr><tr><td style="padding: 8px; font-weight: bold; width: 25%; vertical-align: top;">b) Nội dung:</td><td style="padding: 8px;">[Nội dung cần thực hiện]</td></tr><tr><td style="padding: 8px; font-weight: bold; width: 25%; vertical-align: top;">c) Sản phẩm:</td><td style="padding: 8px;">[Kết quả mong đợi]</td></tr><tr><td style="padding: 8px; font-weight: bold; width: 25%; vertical-align: top;">d) Tổ chức thực hiện:</td><td style="padding: 8px;">- Giao nhiệm vụ:<br>- Thực hiện:<br>- Báo cáo thảo luận:<br>- Kết luận, nhận định:</td></tr></tbody></table><p><br></p>`,
  edu_math_formula: `<div style="text-align: center; padding: 10px; border: 1px dashed #ccc; margin: 10px 0; font-family: 'Times New Roman', serif; font-size: 1.2rem; background: #fafafa;" contenteditable="true">\\( \\int_{0}^{\\pi} \\sin(x) dx = 2 \\)</div><p><br></p>`,
  edu_physics_formula: `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px; margin: 10px 0;" contenteditable="true"><div style="font-weight: bold; margin-bottom: 5px; color: #166534;">Công thức Vật lý:</div><div style="text-align: center; font-family: 'Times New Roman', serif; font-size: 1.2rem;">\\( F = G \\frac{m_1 m_2}{r^2} \\)</div></div><p><br></p>`,
  edu_chemistry_equation: `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0;" contenteditable="true"><div style="font-weight: bold; margin-bottom: 5px; color: #1e3a8a;">Phương trình Hóa học:</div><div style="text-align: center; font-family: 'Times New Roman', serif; font-size: 1.2rem;">\\( 2H_2 + O_2 \\xrightarrow{t^\\circ} 2H_2O \\)</div></div><p><br></p>`,
  edu_2d_geometry: `<div style="text-align: center; margin: 15px 0;" contenteditable="false"><svg width="200" height="200" viewBox="0 0 200 200" style="display: block; margin: 0 auto;"><polygon points="100,20 180,180 20,180" fill="#f8fafc" stroke="#334155" stroke-width="2"/><text x="95" y="15" font-size="16" fill="#0f172a">A</text><text x="5" y="190" font-size="16" fill="#0f172a">B</text><text x="185" y="190" font-size="16" fill="#0f172a">C</text></svg></div><p style="text-align: center; font-style: italic;">Hình 1: Tam giác ABC</p><p><br></p>`,
  edu_3d_geometry: `<div style="text-align: center; margin: 15px 0;" contenteditable="false"><svg width="200" height="200" viewBox="0 0 200 200" style="display: block; margin: 0 auto;"><polygon points="100,20 160,140 100,180 40,140" fill="#f8fafc" stroke="#334155" stroke-width="2"/><line x1="100" y1="20" x2="100" y2="180" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"/><line x1="40" y1="140" x2="160" y2="140" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4"/><text x="95" y="15" font-size="16" fill="#0f172a">S</text><text x="25" y="145" font-size="16" fill="#0f172a">A</text><text x="95" y="195" font-size="16" fill="#0f172a">B</text><text x="165" y="145" font-size="16" fill="#0f172a">C</text></svg></div><p style="text-align: center; font-style: italic;">Hình 2: Hình chóp S.ABC</p><p><br></p>`,
  poem_lucbat: `<div style="text-align: center; margin-bottom: 20px;" contenteditable="true"><p style="margin-left: -40px;">Dòng lục (6 chữ) ở đây,</p><p style="margin-left: 40px;">Dòng bát (8 chữ) đi kèm phía sau.</p></div><p><br></p>`,
  poem_duongluat: `<div style="text-align: center; margin-bottom: 20px;" contenteditable="true"><p>Câu thứ nhất (Phá đề)</p><p>Câu thứ hai (Thừa đề)</p><p>Câu thứ ba (Thực)</p><p>Câu thứ tư (Thực)</p><p>Câu thứ năm (Luận)</p><p>Câu thứ sáu (Luận)</p><p>Câu thứ bảy (Kết)</p><p>Câu thứ tám (Kết)</p></div><p><br></p>`,
  music_khuongnhac: `<div style="font-family: monospace; font-size: 14pt; margin-bottom: 15px; background: #fafafa; padding: 10px; border: 1px solid #eee;" contenteditable="true">e |--------------------------------|<br>B |--------------------------------|<br>G |--------------------------------|<br>D |--------------------------------|<br>A |--------------------------------|<br>E |--------------------------------|</div><p><br></p>`,
  music_structure: `<p><b style="color: #2563eb;" contenteditable="false">[VERSE 1]</b></p><p>Nhập lời verse 1...</p><p><br></p><p><b style="color: #ea580c;" contenteditable="false">[CHORUS]</b></p><p>Nhập lời đoạn điệp khúc...</p><p><br></p><p><b style="color: #2563eb;" contenteditable="false">[VERSE 2]</b></p><p>Nhập lời verse 2...</p><p><br></p>`
};

export const BLOCK_ITEMS: BlockItem[] = [
  // HÀNH CHÍNH
  { key: 'header_quyetdinh', docType: 'quyetDinh', title: 'Đầu trang Quyết định', desc: 'Auto Ngày & Số QĐ', icon: '🏛️', profile: 'administrative' },
  { key: 'header_thongbao', docType: 'thongBao', title: 'Đầu trang Thông báo', desc: 'Auto Ngày & Số TB', icon: '📢', profile: 'administrative' },
  { key: 'header_congvan', docType: 'congVan', title: 'Đầu trang Công văn', desc: 'Auto Ngày & Số CV', icon: '✉️', profile: 'administrative' },
  { key: 'header_totrinh', docType: 'toTrinh', title: 'Đầu trang Tờ trình', desc: 'Auto Ngày & Số TTr', icon: '📝', profile: 'administrative' },
  { key: 'hoatoc', docType: null, title: 'Dấu Hỏa Tốc', desc: 'Dấu độ khẩn (chữ đỏ có viền)', icon: '🔥', profile: 'administrative' },
  { key: 'phuluc', docType: null, title: 'Phụ lục', desc: 'Gắn mác phụ lục góc phải', icon: '📎', profile: 'administrative' },
  { key: 'trichyeu', docType: null, title: 'Trích yếu nội dung', desc: 'Dòng V/v (áp dụng cho công văn)', icon: '💬', profile: 'administrative' },
  { key: 'cancu', docType: null, title: 'Căn cứ pháp lý', desc: 'Đoạn in nghiêng, lùi lề 1.27cm', icon: '⚖️', profile: 'administrative' },
  { key: 'dieukhoan', docType: null, title: 'Điều khoản', desc: 'Khối Điều 1, Điều 2...', icon: '📌', profile: 'administrative' },
  { key: 'kinhgui', docType: null, title: 'Kính gửi', desc: 'Phần đầu Công văn', icon: '✉️', profile: 'administrative' },
  { key: 'noinhan', docType: null, title: 'Chữ ký & Nơi nhận', desc: 'Bảng Footer (Tích hợp Ký nháy)', icon: '✍️', profile: 'administrative' },
  { key: 'thanhphan_thamdu', docType: null, title: 'Thành phần tham dự', desc: 'Danh sách đại biểu cuộc họp', icon: '👥', profile: 'administrative' },
  { key: 'bangbieu_baocao', docType: null, title: 'Bảng biểu báo cáo', desc: 'Bảng STT, Nội dung, Tiến độ', icon: '📊', profile: 'administrative' },
  
  // DOANH NGHIỆP
  { key: 'contract_parties', docType: null, title: 'Thông tin Các Bên', desc: 'Bên A / Bên B (Hợp đồng)', icon: '🤝', profile: 'business' },
  { key: 'chuky_2ben', docType: null, title: 'Chữ ký 2 bên', desc: 'Đại diện Bên A / Bên B', icon: '✍️', profile: 'business' },
  { key: 'bang_baogia', docType: null, title: 'Bảng Báo Giá', desc: 'Bảng sản phẩm, Đơn giá, Thành tiền', icon: '💰', profile: 'business' },

  // GIÁO VIÊN
  { key: 'edu_quiz', docType: null, title: 'Câu hỏi trắc nghiệm', desc: 'Khối A, B, C, D (Giáo dục)', icon: '📝', profile: 'teacher', category: 'Kiểm tra - Đánh giá' },
  { key: 'matran_dethi', docType: null, title: 'Ma trận đề thi', desc: 'Bảng nhận thức Nhận biết/Thông hiểu', icon: '🧮', profile: 'teacher', category: 'Kiểm tra - Đánh giá' },
  { key: 'giaoan_header', docType: null, title: 'Mục tiêu Kế hoạch Bài dạy', desc: 'Phần Đầu của Giáo án', icon: '🏫', profile: 'teacher', category: 'Giáo án' },
  { key: 'giaoan_hoatdong', docType: null, title: 'Hoạt động Dạy học', desc: 'Mục tiêu, Nội dung, Sản phẩm', icon: '🎯', profile: 'teacher', category: 'Giáo án' },
  { key: 'edu_math_formula', docType: null, title: 'Công thức Toán học', desc: 'Chèn khối LaTeX Toán', icon: '∑', profile: 'teacher', category: 'Công cụ Khoa học' },
  { key: 'edu_physics_formula', docType: null, title: 'Công thức Vật lý', desc: 'Định dạng chuẩn Vật lý', icon: '⚛️', profile: 'teacher', category: 'Công cụ Khoa học' },
  { key: 'edu_chemistry_equation', docType: null, title: 'Phương trình Hóa học', desc: 'Định dạng chuẩn Hóa học', icon: '🧪', profile: 'teacher', category: 'Công cụ Khoa học' },
  { key: 'edu_2d_geometry', docType: null, title: 'Mô hình 2D (Tam giác)', desc: 'Ảnh SVG Hình học phẳng', icon: '📐', profile: 'teacher', category: 'Công cụ Khoa học' },
  { key: 'edu_3d_geometry', docType: null, title: 'Mô hình 3D (Hình chóp)', desc: 'Ảnh SVG Không gian', icon: '🧊', profile: 'teacher', category: 'Công cụ Khoa học' },

  // HỌC SINH
  { key: 'trangbia_tieuluan', docType: null, title: 'Trang bìa Tiểu luận', desc: 'Trang bìa có viền, font chữ chuẩn', icon: '📔', profile: 'student' },
  { key: 'stickynote', docType: null, title: 'Ghi chú nhanh (Sticky Note)', desc: 'Khung màu vàng để Note', icon: '📌', profile: 'student' },

  // SÁNG TÁC
  { key: 'poem_stanza', docType: null, title: 'Khổ thơ 4 câu', desc: 'Định dạng căn giữa (Thơ)', icon: '🎭', profile: 'poem' },
  { key: 'poem_lucbat', docType: null, title: 'Thơ Lục bát', desc: 'Căn lề chuẩn 6-8', icon: '🌿', profile: 'poem' },
  { key: 'poem_duongluat', docType: null, title: 'Thơ Đường luật', desc: 'Cấu trúc Thất ngôn bát cú', icon: '📜', profile: 'poem' },
  { key: 'music_chord', docType: null, title: 'Hợp âm & Lời', desc: 'Hợp âm nằm trên lời (Nhạc)', icon: '🎸', profile: 'music' },
  { key: 'music_khuongnhac', docType: null, title: 'Tabs Guitar', desc: 'Dải hợp âm 6 dây', icon: '🎼', profile: 'music' },
  { key: 'music_structure', docType: null, title: 'Cấu trúc Bài hát', desc: 'Verse, Chorus, Verse 2', icon: '🎹', profile: 'music' },
  { key: 'novel_chapter', docType: null, title: 'Chương truyện', desc: 'Heading cấu trúc chương', icon: '🔖', profile: 'novel', category: 'Cấu trúc' },
  { key: 'novel_divider', docType: null, title: 'Phân cách đoạn', desc: 'Dấu ba sao ***', icon: '✂️', profile: 'novel', category: 'Cấu trúc' }
];

