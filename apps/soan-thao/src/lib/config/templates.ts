import type { ProfileType } from './profiles';

export interface TemplateItem {
  key: string;
  docType: string | null;
  name: string;
  desc: string;
  icon: string;
  profile: ProfileType;
  category?: string;
  html: string;
}

const CORE_HEADER = `<table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;" contenteditable="false">
  <tbody>
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; text-transform: uppercase;">[CƠ QUAN CHỦ QUẢN]</div>
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">[TÊN CƠ QUAN BAN HÀNH]</div>
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
</table>`;

const CORE_HEADER_CONGVAN = `<table style="width: 606px; table-layout: fixed; border-collapse: collapse; border: none; margin-bottom: 20px;" contenteditable="false">
  <tbody>
    <tr>
      <td style="width: 240px; max-width: 240px; text-align: center; vertical-align: top;" contenteditable="true">
        <div style="font-size: 13pt; text-transform: uppercase;">[CƠ QUAN CHỦ QUẢN]</div>
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">[TÊN CƠ QUAN BAN HÀNH]</div>
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
</table>`;

export const TEMPLATES: TemplateItem[] = [
  // HÀNH CHÍNH
  { 
    key: 'thongbao', docType: 'thongBao', name: 'Thông báo', desc: 'Kèm Quốc hiệu, Tiêu ngữ và tự động nhảy số.', icon: '📢', profile: 'administrative', category: 'Văn bản phổ biến',
    html: `${CORE_HEADER}<div style="text-align: center; margin-top: 20px;"><div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">THÔNG BÁO</div><div style="display: inline-block;"><div style="font-size: 14pt; font-weight: bold;">Về việc [Nhập trích yếu nội dung]</div><hr style="border: none; border-top: 1px solid black; width: 40%; margin: 5px auto 20px auto;" contenteditable="false"></div></div><p>[Nội dung thông báo...]</p><p><br></p>`
  },
  { 
    key: 'quyetdinh', docType: 'quyetDinh', name: 'Quyết định', desc: 'Cấu trúc Điều 1, 2 và tự động nhảy số.', icon: '⚖️', profile: 'administrative', category: 'Văn bản phổ biến',
    html: `${CORE_HEADER}<div style="text-align: center; margin-top: 20px;"><div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">QUYẾT ĐỊNH</div><div style="display: inline-block;"><div style="font-size: 14pt; font-weight: bold;">Về việc [Nhập trích yếu nội dung]</div><hr style="border: none; border-top: 1px solid black; width: 40%; margin: 5px auto 20px auto;" contenteditable="false"></div><div style="margin-top: 10px;">[QUYỀN HẠN KÝ]<div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">[CHỨC VỤ NGƯỜI KÝ]</div></div></div><p style="font-style: italic;">Căn cứ [Văn bản quy phạm pháp luật];</p><p style="font-style: italic;">Theo đề nghị của [Chức danh];</p><div style="text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; margin-top: 10px;">QUYẾT ĐỊNH:</div><p><b contenteditable="false">Điều 1.</b> [Nội dung điều 1]</p><p><b contenteditable="false">Điều 2.</b> Quyết định này có hiệu lực thi hành kể từ ngày ký.</p><p><br></p>`
  },
  { 
    key: 'congvan', docType: 'congVan', name: 'Công văn', desc: 'Không có tên loại văn bản, tự động nhảy số.', icon: '✉️', profile: 'administrative', category: 'Văn bản phổ biến',
    html: `${CORE_HEADER_CONGVAN}<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" contenteditable="false"><tbody><tr><td style="vertical-align: top; padding: 0; width: 90px;" contenteditable="false"><div style="font-size: 14pt;">Kính gửi:</div></td><td style="vertical-align: top; padding: 0;" contenteditable="true"><div style="font-size: 14pt;">- [Cơ quan, tổ chức 1];<br>- [Cơ quan, tổ chức 2].</div></td></tr></tbody></table><p>[Nội dung công văn...]</p><p><br></p>`
  },
  { 
    key: 'totrinh', docType: 'toTrinh', name: 'Tờ trình', desc: 'Mẫu Tờ trình theo chuẩn, tự động nhảy số.', icon: '📝', profile: 'administrative', category: 'Văn bản phổ biến',
    html: `${CORE_HEADER}<div style="text-align: center; margin-top: 20px;"><div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">TỜ TRÌNH</div><div style="display: inline-block;"><div style="font-size: 14pt; font-weight: bold;">Về việc [Nhập trích yếu nội dung]</div><hr style="border: none; border-top: 1px solid black; width: 40%; margin: 5px auto 20px auto;" contenteditable="false"></div></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-top: 15px;" contenteditable="false"><tbody><tr><td style="vertical-align: top; padding: 0; width: 90px;" contenteditable="false"><div style="font-size: 14pt;">Kính gửi:</div></td><td style="vertical-align: top; padding: 0;" contenteditable="true"><div style="font-size: 14pt;">- [Cơ quan, tổ chức 1];<br>- [Cơ quan, tổ chức 2].</div></td></tr></tbody></table><p>Căn cứ... [Nhập căn cứ pháp lý]</p><p>[Tên cơ quan, tổ chức] kính trình...</p><p><br></p>`
  },
  {
    key: 'baocao_congtac', docType: null, name: 'Báo cáo công tác tuần/tháng', desc: 'Kèm bảng biểu đánh giá tiến độ.', icon: '📊', profile: 'administrative', category: 'Báo cáo & Biên bản',
    html: `${CORE_HEADER}<div style="text-align: center; margin-top: 20px;"><div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">BÁO CÁO</div><div style="display: inline-block;"><div style="font-size: 14pt; font-weight: bold;">Kết quả công tác [tuần/tháng] và phương hướng nhiệm vụ thời gian tới</div><hr style="border: none; border-top: 1px solid black; width: 40%; margin: 5px auto 20px auto;" contenteditable="false"></div></div><p><b>I. KẾT QUẢ THỰC HIỆN NHIỆM VỤ:</b></p><p>[Nội dung báo cáo...]</p><p><b>II. TỒN TẠI, HẠN CHẾ VÀ NGUYÊN NHÂN:</b></p><p>[Nội dung...]</p><p><b>III. PHƯƠNG HƯỚNG, NHIỆM VỤ THỜI GIAN TỚI:</b></p><p>[Nội dung...]</p><p><br></p>`
  },
  {
    key: 'bienban_hop', docType: null, name: 'Biên bản cuộc họp', desc: 'Mẫu biên bản có thành phần, nội dung.', icon: '📑', profile: 'administrative', category: 'Báo cáo & Biên bản',
    html: `${CORE_HEADER}<div style="text-align: center; margin-top: 20px;"><div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">BIÊN BẢN</div><div style="display: inline-block;"><div style="font-size: 14pt; font-weight: bold;">Họp về việc [Nội dung cuộc họp]</div><hr style="border: none; border-top: 1px solid black; width: 40%; margin: 5px auto 20px auto;" contenteditable="false"></div></div><p>Thời gian bắt đầu: ... giờ ... phút, ngày ... tháng ... năm ...</p><p>Địa điểm: ..................................................................................</p><p><b>I. THÀNH PHẦN THAM DỰ:</b></p><p>1. Đồng chí [Họ tên] - [Chức vụ] - Chủ trì</p><p>2. Đồng chí [Họ tên] - [Chức vụ] - Thư ký</p><p>3. Các đại biểu khác: ..............................................................</p><p><b>II. NỘI DUNG CUỘC HỌP:</b></p><p>[Nội dung diễn biến cuộc họp...]</p><p><b>III. KẾT LUẬN:</b></p><p>[Kết luận của người chủ trì...]</p><p>Cuộc họp kết thúc vào lúc ... giờ ... phút cùng ngày. Biên bản đã được đọc lại cho mọi người cùng nghe và thống nhất ký tên.</p><br><table style="width: 100%; text-align: center; font-weight: bold;"><tbody><tr><td style="width: 50%;">THƯ KÝ</td><td style="width: 50%;">CHỦ TRÌ</td></tr></tbody></table><p><br></p>`
  },
  
  // DOANH NGHIỆP
  { 
    key: 'hopdong_laodong', docType: null, name: 'Hợp đồng Lao động', desc: 'Mẫu chuẩn cho nhân sự mới.', icon: '💼', profile: 'business', category: 'Hợp đồng',
    html: `<h2 style="text-align: center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</h2><h1 style="text-align: center; margin-top: 30px;">HỢP ĐỒNG LAO ĐỘNG</h1><p style="text-align: center;">Số: ....../HĐLĐ</p><p>Hôm nay, ngày ... tháng ... năm ..., tại ..............................................................</p><p>Chúng tôi gồm có:</p><p><b contenteditable="false">BÊN A (Người sử dụng lao động):</b> ........................................................</p><p>Đại diện: ..................................................... Chức vụ: ........................................</p><p>Địa chỉ: ................................................................................................................</p><p>Mã số thuế: ........................................................................................................</p><p><b contenteditable="false">BÊN B (Người lao động):</b> ..........................................................................</p><p>Ngày sinh: .................................................. Giới tính: .......................................</p><p>CMND/CCCD: .......................................... Ngày cấp: .......................................</p><p>Địa chỉ thường trú: ..............................................................................................</p><p>Cùng thỏa thuận ký kết hợp đồng lao động và cam kết làm đúng những điều khoản sau đây:</p><p><b>Điều 1: Thời hạn và công việc hợp đồng</b></p><p>- Loại hợp đồng lao động: .................................................................................</p><p>- Từ ngày .../.../...... đến ngày .../.../......</p><p>- Chức danh chuyên môn: .................................................................................</p><p><br></p>`
  },
  { 
    key: 'hopdong_muaban', docType: null, name: 'Hợp đồng Mua bán', desc: 'Giao dịch hàng hóa/dịch vụ.', icon: '🛒', profile: 'business', category: 'Hợp đồng',
    html: `<h2 style="text-align: center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</h2><h1 style="text-align: center; margin-top: 30px;">HỢP ĐỒNG MUA BÁN HÀNG HÓA</h1><p style="text-align: center;">Số: ....../HĐMB</p><p>Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p><p>Căn cứ nhu cầu và khả năng của hai bên.</p><p>Hôm nay, ngày ... tháng ... năm ..., chúng tôi gồm:</p><p><b contenteditable="false">BÊN BÁN (BÊN A):</b> .................................................................................</p><p>Đại diện: ..................................................... Chức vụ: ........................................</p><p>Mã số thuế: ........................................................................................................</p><p><b contenteditable="false">BÊN MUA (BÊN B):</b> .................................................................................</p><p>Đại diện: ..................................................... Chức vụ: ........................................</p><p>Mã số thuế: ........................................................................................................</p><p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p><p><b>Điều 1: Hàng hóa và Giá cả</b></p><p>1.1. Bên A đồng ý bán, Bên B đồng ý mua các hàng hóa sau:</p><p>[Chi tiết hàng hóa...]</p><p><br></p>`
  },
  {
    key: 'quyetdinh_bonhiem', docType: null, name: 'Quyết định Bổ nhiệm', desc: 'Bổ nhiệm chức vụ nhân sự nội bộ.', icon: '📜', profile: 'business', category: 'Nhân sự',
    html: `<h2 style="text-align: center; text-transform: uppercase;">CÔNG TY [TÊN CÔNG TY]</h2><h3 style="text-align: center;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</h3><hr style="width: 30%; margin: 10px auto;"><p style="text-align: center;">Số: ....../QĐ-BN</p><p style="text-align: right; font-style: italic;">[Địa danh], ngày ... tháng ... năm ...</p><h1 style="text-align: center; margin-top: 30px;">QUYẾT ĐỊNH</h1><h2 style="text-align: center; font-size: 14pt;">V/v Bổ nhiệm cán bộ</h2><p style="font-style: italic;">- Căn cứ Điều lệ Công ty...</p><p style="font-style: italic;">- Căn cứ năng lực và phẩm chất của cán bộ...</p><h2 style="text-align: center;">GIÁM ĐỐC CÔNG TY<br>QUYẾT ĐỊNH:</h2><p><b>Điều 1:</b> Bổ nhiệm Ông/Bà <b>[Họ và tên]</b></p><p>- Giữ chức vụ: [Chức vụ bổ nhiệm]</p><p>- Kể từ ngày: .../.../......</p><p><b>Điều 2:</b> Ông/Bà [Họ và tên] có trách nhiệm thực hiện các công việc theo sự phân công của Ban Giám đốc và được hưởng lương, phụ cấp theo quy định.</p><p><b>Điều 3:</b> Các Phòng Ban và Ông/Bà [Họ và tên] chịu trách nhiệm thi hành Quyết định này.</p><p><br></p>`
  },
  {
    key: 'baocao_doanhthu', docType: null, name: 'Báo cáo kinh doanh', desc: 'Báo cáo doanh thu có bảng biểu tính tổng.', icon: '📈', profile: 'business', category: 'Tài chính',
    html: `<h2 style="text-align: center; text-transform: uppercase;">CÔNG TY [TÊN CÔNG TY]</h2><h1 style="text-align: center; margin-top: 30px;">BÁO CÁO KẾT QUẢ KINH DOANH</h1><p style="text-align: center; font-style: italic;">(Tháng ... Năm ...)</p><p><b>1. Đánh giá chung:</b></p><p>[Đánh giá tình hình kinh doanh tháng qua]</p><p><b>2. Bảng kê doanh thu:</b></p><table style="width: 100%; border-collapse: collapse; border: 1px solid black;" border="1" contenteditable="true"><tbody><tr><td style="padding: 8px; font-weight: bold; text-align: center;">STT</td><td style="padding: 8px; font-weight: bold; text-align: center;">Khoản mục</td><td style="padding: 8px; font-weight: bold; text-align: center;">Doanh thu (VNĐ)</td><td style="padding: 8px; font-weight: bold; text-align: center;">Ghi chú</td></tr><tr><td style="padding: 8px; text-align: center;">1</td><td style="padding: 8px;">[Sản phẩm/Dịch vụ A]</td><td style="padding: 8px; text-align: right;">0</td><td style="padding: 8px;"></td></tr><tr><td colspan="2" style="padding: 8px; font-weight: bold; text-align: right;">TỔNG CỘNG</td><td style="padding: 8px; font-weight: bold; text-align: right;">0</td><td style="padding: 8px;"></td></tr></tbody></table><p><b>3. Đề xuất & Phương hướng:</b></p><p>[Nội dung đề xuất...]</p><p><br></p>`
  },
  
  // GIÁO VIÊN
  { 
    key: 'dekiemtra_15p', docType: null, name: 'Đề kiểm tra trắc nghiệm', desc: 'Form đề kiểm tra có khung điểm.', icon: '⏳', profile: 'teacher', category: 'Kiểm tra - Đánh giá',
    html: `<table style="width: 100%; border: none;"><tbody><tr><td style="width: 40%; text-align: center;"><b>TRƯỜNG ........................<br>TỔ ................................</b></td><td style="width: 60%; text-align: center;"><b>ĐỀ KIỂM TRA<br>Môn: ........................ - Lớp: ........</b></td></tr></tbody></table><hr style="margin: 20px 0;"><p><b>Họ và tên học sinh:</b> ................................................................. <b>Lớp:</b> ................</p><p><b>ĐIỂM:</b></p><br><p><b>Phần 1: Trắc nghiệm khách quan</b></p><p><b>Câu 1:</b> [Nội dung câu hỏi]</p><table style="width: 100%; margin-bottom: 15px;" contenteditable="true"><tbody><tr><td style="width: 50%;">A. [Đáp án A]</td><td style="width: 50%;">B. [Đáp án B]</td></tr><tr><td style="width: 50%;">C. [Đáp án C]</td><td style="width: 50%;">D. [Đáp án D]</td></tr></tbody></table><p><b>Câu 2:</b> [Nội dung câu hỏi]</p><table style="width: 100%; margin-bottom: 15px;" contenteditable="true"><tbody><tr><td style="width: 50%;">A. [Đáp án A]</td><td style="width: 50%;">B. [Đáp án B]</td></tr><tr><td style="width: 50%;">C. [Đáp án C]</td><td style="width: 50%;">D. [Đáp án D]</td></tr></tbody></table><p><br></p>`
  },
  { 
    key: 'giaoan', docType: null, name: 'Giáo án (Kế hoạch bài dạy)', desc: 'Mẫu công văn 5512 thu gọn.', icon: '📋', profile: 'teacher', category: 'Hồ sơ Giáo viên',
    html: `<h1 style="text-align: center;">KẾ HOẠCH BÀI DẠY</h1><h2 style="text-align: center;">Tên bài: ......................................................</h2><p><b>I. MỤC TIÊU BÀI HỌC</b></p><p><b>1. Kiến thức:</b></p><p>- Học sinh hiểu được...</p><p><b>2. Kỹ năng:</b></p><p>- Thực hiện được thao tác...</p><p><b>3. Thái độ:</b></p><p>- Nghiêm túc, tích cực trong giờ học...</p><p><b>II. CHUẨN BỊ</b></p><p><b>1. Giáo viên:</b></p><p>- SGK, SGV, máy chiếu...</p><p><b>2. Học sinh:</b></p><p>- Vở ghi, đồ dùng học tập...</p><p><b>III. TIẾN TRÌNH DẠY HỌC</b></p><p><b>1. Hoạt động khởi động (5 phút)</b></p><p>- Mục tiêu:</p><p>- Phương thức thực hiện:</p><p><b>2. Hoạt động hình thành kiến thức (30 phút)</b></p><p>- Nội dung:</p><p><br></p>`
  },
  {
    key: 'so_chunhiem', docType: null, name: 'Sổ Sinh hoạt Chủ nhiệm', desc: 'Biên bản giờ sinh hoạt lớp hàng tuần.', icon: '📒', profile: 'teacher', category: 'Hồ sơ Giáo viên',
    html: `<h2 style="text-align: center; text-transform: uppercase;">BIÊN BẢN SINH HOẠT LỚP TUẦN ...</h2><p>Thời gian: ... giờ ... phút, ngày ... tháng ... năm ...</p><p>Lớp: ........... Sĩ số: ....... Có mặt: ....... Vắng: .......</p><p>Giáo viên chủ nhiệm: ........................................................</p><p><b>I. ĐÁNH GIÁ TÌNH HÌNH TUẦN QUA:</b></p><p>1. Nề nếp, kỷ luật:</p><p>[Đánh giá...]</p><p>2. Học tập:</p><p>[Đánh giá...]</p><p>3. Các hoạt động khác:</p><p>[Đánh giá...]</p><p><b>II. KẾ HOẠCH TUẦN TỚI:</b></p><p>[Các công việc cần làm...]</p><p><b>III. Ý KIẾN HỌC SINH:</b></p><p>[Ghi nhận ý kiến...]</p><br><table style="width: 100%; text-align: center; font-weight: bold;"><tbody><tr><td style="width: 50%;">LỚP TRƯỞNG</td><td style="width: 50%;">GIÁO VIÊN CHỦ NHIỆM</td></tr></tbody></table><p><br></p>`
  },
  { 
    key: 'baitap_toan', docType: null, name: 'Bài tập Toán học', desc: 'Mẫu đề bài tập môn Toán.', icon: '📐', profile: 'teacher', category: 'Toán học',
    html: `<h2 style="text-align: center;">BÀI TẬP TOÁN</h2><p><b>Bài 1:</b> Giải phương trình sau:</p><p style="margin-left: 20px;">a) x² - 5x + 6 = 0</p><p style="margin-left: 20px;">b) ...</p><p><b>Bài 2:</b> ...</p><p><br></p>`
  },
  { 
    key: 'baitap_hoa', docType: null, name: 'Bài tập Hóa học', desc: 'Mẫu đề bài tập môn Hóa.', icon: '🧪', profile: 'teacher', category: 'Khoa học Tự nhiên',
    html: `<h2 style="text-align: center;">BÀI TẬP HÓA HỌC</h2><p><b>Bài 1:</b> Viết phương trình phản ứng hóa học sau:</p><p style="margin-left: 20px;">a) H₂ + O₂ → H₂O</p><p style="margin-left: 20px;">b) ...</p><p><b>Bài 2:</b> ...</p><p><br></p>`
  },

  // HỌC SINH
  {
    key: 'baocao_thuchanh', docType: null, name: 'Báo cáo Thực hành / Bài tập nhóm', desc: 'Form báo cáo sinh viên/học sinh.', icon: '📝', profile: 'student', category: 'Học tập',
    html: `<div style="border: 4px double #333; padding: 40px; text-align: center; margin-bottom: 30px; min-height: 800px; display: flex; flex-direction: column; justify-content: space-between;" contenteditable="true"><div><h2 style="font-size: 16pt; text-transform: uppercase;">TRƯỜNG [TÊN TRƯỜNG ĐẠI HỌC/CẤP 3]</h2><h3 style="font-size: 14pt; margin-top: 10px;">Khoa / Lớp: [Tên Khoa/Lớp]</h3></div><div style="margin: auto 0;"><h1 style="font-size: 24pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">BÁO CÁO THỰC HÀNH / BÀI TẬP LỚN</h1><h2 style="font-size: 18pt;">Đề tài: [Tên đề tài của bạn]</h2></div><div style="text-align: left; width: 60%; margin: 0 auto; font-size: 14pt;"><p><b>Sinh viên/Học sinh thực hiện:</b> [Họ và tên]</p><p><b>Mã số:</b> [MSSV]</p><p><b>Giáo viên hướng dẫn:</b> [Họ và tên]</p></div><div style="margin-top: 50px;"><p style="font-size: 14pt; font-style: italic;">[Địa phương], Tháng ... Năm ...</p></div></div><div style="page-break-before: always;"></div><h2 style="text-align: center;">MỤC LỤC</h2><p>1. Mở đầu .............................................................. Trang 1</p><p>2. Nội dung ............................................................ Trang 2</p><p>3. Kết luận ............................................................. Trang 10</p><div style="page-break-before: always;"></div><h1 style="text-align: center;">PHẦN 1: MỞ ĐẦU</h1><p><b>1. Lý do chọn đề tài:</b></p><p>[Nhập lý do...]</p><p><b>2. Mục tiêu nghiên cứu:</b></p><p>[Nhập mục tiêu...]</p><p><br></p>`
  },
  {
    key: 'kehoach_hoctap', docType: null, name: 'Kế hoạch học tập tuần', desc: 'Bảng thời gian biểu cá nhân.', icon: '📅', profile: 'student', category: 'Kế hoạch',
    html: `<h1 style="text-align: center;">KẾ HOẠCH HỌC TẬP CÁ NHÂN</h1><p style="text-align: center; font-style: italic;">Tuần từ .../... đến .../...</p><table style="width: 100%; border-collapse: collapse; border: 1px solid black;" border="1" contenteditable="true"><tbody><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ</td><td style="padding: 8px; font-weight: bold; text-align: center;">Sáng</td><td style="padding: 8px; font-weight: bold; text-align: center;">Chiều</td><td style="padding: 8px; font-weight: bold; text-align: center;">Tối</td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 2</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 3</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 4</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 5</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 6</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">Thứ 7</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr><tr><td style="padding: 8px; font-weight: bold; text-align: center;">CN</td><td style="padding: 8px;"></td><td style="padding: 8px;"></td><td style="padding: 8px;"></td></tr></tbody></table><p><b>Mục tiêu trọng tâm trong tuần:</b></p><p>- [Mục tiêu 1]</p><p>- [Mục tiêu 2]</p><p><br></p>`
  },
  {
    key: 'mindmap_text', docType: null, name: 'Dàn ý bài văn (Mindmap)', desc: 'Cấu trúc cây thư mục text để dàn ý.', icon: '🌳', profile: 'student', category: 'Học tập',
    html: `<h2>DÀN Ý CHI TIẾT: [Tên Đề tài/Bài văn]</h2><p><b>I. MỞ BÀI</b></p><p style="margin-left: 20px;">1. Dẫn dắt vấn đề:</p><p style="margin-left: 40px;">- Ý phụ 1</p><p style="margin-left: 40px;">- Ý phụ 2</p><p style="margin-left: 20px;">2. Nêu vấn đề chính (Luận đề):</p><p><b>II. THÂN BÀI</b></p><p style="margin-left: 20px;">1. Luận điểm 1: Giải thích</p><p style="margin-left: 40px;">- Khái niệm...</p><p style="margin-left: 20px;">2. Luận điểm 2: Phân tích / Chứng minh</p><p style="margin-left: 40px;">- Dẫn chứng 1...</p><p style="margin-left: 40px;">- Dẫn chứng 2...</p><p style="margin-left: 20px;">3. Luận điểm 3: Bàn luận / Mở rộng</p><p style="margin-left: 40px;">- Lật lại vấn đề...</p><p><b>III. KẾT BÀI</b></p><p style="margin-left: 20px;">1. Khẳng định lại vấn đề:</p><p style="margin-left: 20px;">2. Bài học nhận thức và hành động:</p><p><br></p>`
  },
  
  // TIỂU THUYẾT
  { 
    key: 'kichban_3hoi', docType: null, name: 'Kịch bản 3 Hồi', desc: 'Cấu trúc Mở đầu, Thắt nút, Mở nút.', icon: '🎬', profile: 'novel', category: 'Viết lách',
    html: `<h1>ĐỀ CƯƠNG TIỂU THUYẾT</h1><h2>THÔNG TIN CHUNG</h2><p><b>Tên truyện (dự kiến):</b> ........................................</p><p><b>Thể loại:</b> ........................................</p><p><b>Logline (Tóm tắt 1 câu):</b> [Nhân vật chính] phải [Làm gì đó] để [Mục tiêu] nếu không sẽ [Hậu quả].</p><h2>HỒI I: MỞ ĐẦU (Thiết lập)</h2><p>- <b>Thế giới bình thường:</b> Cuộc sống của nhân vật trước khi biến cố xảy ra.</p><p>- <b>Biến cố kích hoạt (Inciting Incident):</b> Sự kiện đảo lộn cuộc sống, buộc nhân vật phải hành động.</p><h2>HỒI II: PHÁT TRIỂN (Thử thách)</h2><p>- <b>Hành trình:</b> Nhân vật bước vào thế giới mới, gặp gỡ đồng minh và kẻ thù.</p><p>- <b>Đỉnh điểm giữa (Midpoint):</b> Một ngã rẽ quan trọng, nhân vật không thể quay đầu.</p><h2>HỒI III: KẾT THÚC (Giải quyết)</h2><p>- <b>Đêm đen linh hồn (All is lost):</b> Tình huống tồi tệ nhất, tưởng chừng như thất bại.</p><p>- <b>Cao trào (Climax):</b> Trận chiến cuối cùng, đối mặt với phản diện/nỗi sợ lớn nhất.</p><p>- <b>Sự trả lại trật tự:</b> Kết cục và thông điệp truyện.</p><p><br></p>`
  }
];

export function getTemplatesByProfile(profileId: ProfileType): TemplateItem[] {
  return TEMPLATES.filter(t => t.profile === profileId);
}
