import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_slides_dataset(num_samples=500):
    """
    Sinh dữ liệu cho việc tạo cấu trúc trình chiếu (Slides/Presentation).
    Output JSON sẽ bao gồm danh sách các trang slide với nội dung và hiệu ứng.
    """
    chu_des = [
        "Báo cáo kết quả kinh doanh quý 3", "Kế hoạch marketing năm mới",
        "Đào tạo nhân sự mới", "Giới thiệu sản phẩm phần mềm",
        "Tổng kết phong trào thi đua", "Dự án phát triển ứng dụng di động"
    ]
    phong_cach = ["Chuyên nghiệp", "Ngắn gọn", "Trực quan", "Thuyết phục"]

    prompt_templates = [
        "Lên dàn ý slide cho chủ đề: {chu_de} với phong cách {phong_cach}.",
        "Tạo cấu trúc trình chiếu (JSON) gồm 3-4 slide về {chu_de}.",
        "Đóng vai chuyên gia thuyết trình, thiết kế một bài slide ngắn về {chu_de}."
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Presentation (Trình chiếu)...")

    for _ in range(num_samples):
        chu_de = random.choice(chu_des)
        pc = random.choice(phong_cach)
        
        # Cấu trúc JSON phức tạp cho Slide (Reveal.js tương thích)
        structured_output = {
            "presentation_title": chu_de,
            "theme": "corporate",
            "slides": [
                {
                    "slide_number": 1,
                    "title": chu_de.upper(),
                    "content": ["Trình bày bởi: Linh Hương Office", "Cập nhật mới nhất"],
                    "animation": "fade-in"
                },
                {
                    "slide_number": 2,
                    "title": "Mục Tiêu Chính",
                    "content": ["Nắm bắt yêu cầu", "Triển khai nhanh chóng", "Tối ưu hóa nguồn lực"],
                    "animation": "slide-left"
                },
                {
                    "slide_number": 3,
                    "title": "Chi Tiết Triển Khai",
                    "content": ["Giai đoạn 1: Chuẩn bị", "Giai đoạn 2: Thực thi", "Giai đoạn 3: Đánh giá"],
                    "animation": "zoom-in"
                }
            ]
        }
        
        instruction = random.choice(prompt_templates).format(chu_de=chu_de, phong_cach=pc)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    repo_name = "linhhuong-office-slides-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
