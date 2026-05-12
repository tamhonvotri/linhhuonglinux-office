import json
import random
from datasets import Dataset
from huggingface_hub import login

print("Đang đăng nhập Hugging Face...")
token = "REMOVED_TOKEN"
login(token=token)

loai_van_bans = ["Quyết định", "Thông báo", "Tờ trình", "Công văn", "Chỉ thị"]
chu_des = [
    "thành lập ban chỉ đạo phòng chống dịch", "bổ nhiệm cán bộ quản lý", "nghỉ lễ Quốc khánh 2/9", 
    "phân công nhiệm vụ nhân viên", "tổ chức hội thảo khoa học", "kiểm tra công tác an toàn lao động", 
    "phê duyệt dự án đầu tư", "khen thưởng nhân viên xuất sắc", "kỷ luật lao động", "cử cán bộ đi công tác",
    "thanh tra tài chính định kỳ", "nghỉ phép năm của cán bộ", "điều động nhân sự dự án mới", 
    "chấn chỉnh tác phong làm việc", "tổ chức tiệc tất niên", "tham gia khóa đào tạo nâng cao năng lực"
]

co_quan = ["UBND Thành phố", "Sở Thông tin và Truyền thông", "Giám đốc Công ty", "Bộ phận Nhân sự", "Ban Quản lý Dự án"]

prompt_templates = [
    "Hãy soạn thảo một {loai} về việc {trich_yeu}.",
    "Đóng vai chuyên viên hành chính, hãy viết {loai} với nội dung chính: {trich_yeu}.",
    "Soạn {loai} liên quan đến: {trich_yeu}.",
    "Tôi cần tạo một bản nháp cho {loai} về {trich_yeu}. Vui lòng viết đúng chuẩn thể thức văn bản hành chính."
]

system_prompt = "Bạn là trợ lý AI chuyên môn cao về hành chính văn phòng của hệ thống Linh Hương Linux. Nhiệm vụ của bạn là soạn thảo các văn bản hành chính với văn phong trang trọng, pháp lý chặt chẽ và trả về định dạng JSON có cấu trúc để hệ thống dễ dàng xử lý."

formatted_dataset = []
print("Đang tạo 1500 mẫu dữ liệu JSON sạch (Synthetic Data)...")

for i in range(1500):
    loai = random.choice(loai_van_bans)
    chu_de = random.choice(chu_des)
    cq = random.choice(co_quan)
    
    # Tạo nội dung giả lập
    structured_output = {
        "loai_van_ban": loai,
        "co_quan_ban_hanh": cq,
        "trich_yeu": chu_de.capitalize(),
        "can_cu_phap_ly": [
            "Căn cứ Luật Tổ chức chính quyền địa phương năm 2015;",
            "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ về công tác văn thư;",
            "Căn cứ yêu cầu thực tế của cơ quan."
        ],
        "dieu_khoan": [
            f"Điều 1. Nay ban hành {loai.lower()} về việc {chu_de} theo quy định hiện hành.",
            "Điều 2. Các đơn vị, cá nhân có liên quan chịu trách nhiệm thi hành.",
            "Điều 3. Quyết định/Thông báo này có hiệu lực kể từ ngày ký."
        ],
        "toan_van": f"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n{cq.upper()}\n\n{loai.upper()}\nVề việc {chu_de}\n\n[Nội dung chi tiết theo các điều khoản nêu trên]"
    }
    
    template = random.choice(prompt_templates)
    user_message = template.format(loai=loai, trich_yeu=chu_de)
    
    conversation = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": json.dumps(structured_output, ensure_ascii=False, indent=2)}
    ]
    
    formatted_dataset.append({"messages": conversation})

print("Đang đóng gói và đẩy lên Hugging Face...")
hf_dataset = Dataset.from_list(formatted_dataset)
repo_name = "linhhuong-office-legal-instruct"

try:
    hf_dataset.push_to_hub(repo_name, private=True)
    print("✅ Đẩy dữ liệu thành công!")
except Exception as e:
    print(f"❌ Lỗi: {e}")
