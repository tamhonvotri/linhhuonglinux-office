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
    "Bạn là trợ lý hành chính. Hãy soạn thảo một {loai} về việc {trich_yeu}.",
    "Đóng vai chuyên viên văn thư của Linh Hương Linux, hãy viết {loai} với nội dung chính: {trich_yeu}. Yêu cầu xuất ra JSON.",
    "Soạn {loai} liên quan đến: {trich_yeu}. Output định dạng JSON.",
    "Tôi cần tạo một bản nháp cho {loai} về {trich_yeu}. Vui lòng viết đúng chuẩn thể thức văn bản hành chính và trả về JSON."
]

formatted_dataset = []
print("Đang tạo lại dữ liệu theo định dạng Alpaca (chuẩn tuyệt đối cho Unsloth)...")

for i in range(1500):
    loai = random.choice(loai_van_bans)
    chu_de = random.choice(chu_des)
    cq = random.choice(co_quan)
    
    structured_output = {
        "loai_van_ban": loai,
        "co_quan_ban_hanh": cq,
        "trich_yeu": chu_de.capitalize(),
        "can_cu_phap_ly": [
            "Căn cứ Luật Tổ chức chính quyền địa phương năm 2015;",
            "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ về công tác văn thư;"
        ],
        "dieu_khoan": [
            f"Điều 1. Nay ban hành {loai.lower()} về việc {chu_de} theo quy định hiện hành.",
            "Điều 2. Các đơn vị, cá nhân có liên quan chịu trách nhiệm thi hành."
        ],
        "toan_van": f"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n{cq.upper()}\n\n{loai.upper()}\nVề việc {chu_de}\n\n[Nội dung chi tiết theo các điều khoản nêu trên]"
    }
    
    template = random.choice(prompt_templates)
    instruction = template.format(loai=loai, trich_yeu=chu_de)
    output_json = json.dumps(structured_output, ensure_ascii=False, indent=2)
    
    # Định dạng Alpaca: instruction, input, output
    alpaca_item = {
        "instruction": instruction,
        "input": "",
        "output": output_json
    }
    
    formatted_dataset.append(alpaca_item)

print("Đang đóng gói và đẩy lên Hugging Face...")
hf_dataset = Dataset.from_list(formatted_dataset)
repo_name = "linhhuong-office-legal-instruct"

try:
    hf_dataset.push_to_hub(repo_name, private=False) # Chuyển thành Public luôn để Unsloth Studio khỏi báo lỗi
    print("✅ Đẩy dữ liệu thành công! Dataset đã được đặt thành Public.")
except Exception as e:
    print(f"❌ Lỗi: {e}")
