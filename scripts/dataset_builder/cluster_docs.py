import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_docs_dataset(num_samples=500):
    """
    Sinh dữ liệu cho việc tạo và kiểm tra văn bản hành chính.
    Output là một file JSON có cấu trúc.
    """
    loai_van_bans = ["Quyết định", "Thông báo", "Tờ trình", "Công văn"]
    chu_des = [
        "thành lập ban chỉ đạo phòng chống lụt bão", "bổ nhiệm trưởng phòng nhân sự",
        "phân công trực tết Nguyên đán", "kiểm tra công tác phòng cháy chữa cháy",
        "tổ chức đại hội cổ đông thường niên"
    ]
    co_quan = ["UBND Quận", "Tổng Giám đốc", "Hội đồng Quản trị", "Sở Nội vụ"]

    prompt_templates = [
        "Soạn {loai} về việc {trich_yeu}.",
        "Hãy viết bản nháp {loai} cho {co_quan} với nội dung chính: {trich_yeu}. Trả về định dạng JSON."
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Document (Văn thư)...")

    for _ in range(num_samples):
        loai = random.choice(loai_van_bans)
        chu_de = random.choice(chu_des)
        cq = random.choice(co_quan)
        
        # Cấu trúc output
        structured_output = {
            "loai_van_ban": loai,
            "co_quan_ban_hanh": cq,
            "trich_yeu": chu_de.capitalize(),
            "can_cu_phap_ly": [
                "Căn cứ Luật Tổ chức chính quyền địa phương;",
                "Căn cứ tình hình thực tế."
            ],
            "dieu_khoan": [
                f"Điều 1. Ban hành {loai.lower()} về việc {chu_de}.",
                "Điều 2. Các cá nhân, đơn vị liên quan chịu trách nhiệm thi hành."
            ],
            "toan_van": f"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n{cq.upper()}\n\n{loai.upper()}\nVề việc {chu_de}\n\n[Nội dung chi tiết]"
        }
        
        instruction = random.choice(prompt_templates).format(loai=loai, trich_yeu=chu_de, co_quan=cq)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    # Đẩy lên repo chuyên biệt cho Document
    repo_name = "linhhuong-office-docs-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
