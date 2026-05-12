import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_creative_dataset(num_samples=500):
    """
    Sinh dữ liệu cho Zen Mode (Sáng tác Thơ, Văn, Copywriting).
    """
    chu_des = [
        "mùa thu Hà Nội", "tình mẹ", "tuổi thanh xuân", "hoàng hôn trên biển",
        "sự nỗ lực vươn lên", "cà phê buổi sáng", "nỗi nhớ quê hương"
    ]
    the_loais = ["thơ lục bát", "thơ tự do", "tản văn ngắn", "bài viết marketing", "status facebook"]

    prompt_templates = [
        "Sáng tác một bài {the_loai} về chủ đề {chu_de}.",
        "Viết {the_loai} lấy cảm hứng từ {chu_de}.",
        "Hãy đóng vai một nhà văn, viết {the_loai} miêu tả {chu_de}."
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Creative (Sáng tác)...")

    for _ in range(num_samples):
        chu_de = random.choice(chu_des)
        the_loai = random.choice(the_loais)
        
        # Output cho Zen Mode thường là văn bản thuần túy, nhưng để hệ thống dễ xử lý, ta bọc trong JSON đơn giản
        structured_output = {
            "the_loai": the_loai,
            "chu_de": chu_de,
            "noi_dung": f"[Nội dung sáng tác nghệ thuật về {chu_de} theo thể loại {the_loai}]\n\nCảm xúc trào dâng...\nMọi thứ thật tuyệt vời."
        }
        
        instruction = random.choice(prompt_templates).format(the_loai=the_loai, chu_de=chu_de)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    repo_name = "linhhuong-office-creative-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
