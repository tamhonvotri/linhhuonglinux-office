import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_extended_dataset(num_samples=500):
    """
    Sinh dữ liệu cho cụm Extended (Email, Tóm tắt báo cáo, Dịch thuật).
    """
    chu_des = [
        "Xin nghỉ phép", "Báo cáo tiến độ dự án", "Phản hồi khách hàng phàn nàn",
        "Mời họp giao ban", "Đề xuất tăng lương", "Biên bản bàn giao công việc"
    ]
    loai_hinhs = ["Email nội bộ", "Email gửi đối tác", "Tóm tắt báo cáo", "Dịch thuật (Anh-Việt)"]

    prompt_templates = [
        "Soạn một {loai_hinh} về việc {chu_de}.",
        "Đóng vai trợ lý văn phòng, xử lý yêu cầu sau: Viết {loai_hinh} liên quan đến {chu_de}.",
        "Bạn hãy soạn thảo {loai_hinh} với nội dung chính là: {chu_de}."
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Extended (Mở rộng)...")

    for _ in range(num_samples):
        chu_de = random.choice(chu_des)
        loai = random.choice(loai_hinhs)
        
        # Cấu trúc JSON đa năng
        if "Email" in loai:
            structured_output = {
                "loai_van_ban": loai,
                "tieu_de_email": f"[{loai.upper()}] {chu_de}",
                "noi_dung_chinh": f"Kính gửi Anh/Chị,\n\nTôi viết email này để {chu_de.lower()}.\n[Chi tiết...]\n\nTrân trọng,\n[Tên của bạn]"
            }
        elif "Tóm tắt" in loai:
            structured_output = {
                "loai_van_ban": loai,
                "tieu_de": f"TÓM TẮT: {chu_de.upper()}",
                "bullet_points": [
                    "Điểm chính 1: Đã hoàn thành 80% khối lượng công việc.",
                    "Điểm chính 2: Cần thêm nguồn lực hỗ trợ trong tuần tới.",
                    "Điểm chính 3: Kế hoạch triển khai giai đoạn 2 đã sẵn sàng."
                ]
            }
        else:
            structured_output = {
                "loai_van_ban": loai,
                "chu_de": chu_de,
                "van_ban_goc": f"This is a sample text about {chu_de}.",
                "ban_dich": f"Đây là một đoạn văn bản mẫu về {chu_de}."
            }
            
        instruction = random.choice(prompt_templates).format(loai_hinh=loai, chu_de=chu_de)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    repo_name = "linhhuong-office-extended-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
