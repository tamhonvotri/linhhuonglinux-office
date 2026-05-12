import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_music_dataset(num_samples=500):
    """
    Sinh dữ liệu cho Musician Mode (Viết lời bài hát, Gắn hợp âm).
    """
    chu_des = [
        "tình yêu tan vỡ", "niềm vui ngày mới", "cuộc sống bon chen",
        "tình bạn học trò", "giấc mơ tuổi trẻ", "hành trình đi bụi"
    ]
    the_loais = ["Pop Ballad", "Rock", "Acoustic Indie", "R&B", "Bolero"]

    prompt_templates = [
        "Sáng tác lời bài hát thể loại {the_loai} về {chu_de}, có kèm hợp âm.",
        "Viết một đoạn Điệp khúc (Chorus) mang âm hưởng {the_loai} nói về {chu_de} và chèn hợp âm guitar.",
        "Gợi ý vòng hợp âm và viết lời cho ca khúc {the_loai} chủ đề {chu_de}."
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Music (Nhạc sĩ)...")

    for _ in range(num_samples):
        chu_de = random.choice(chu_des)
        the_loai = random.choice(the_loais)
        
        # Cấu trúc JSON cho Nhạc sĩ
        structured_output = {
            "the_loai_nhac": the_loai,
            "chu_de": chu_de,
            "vong_hop_am_chinh": "[C] - [G] - [Am] - [Em] - [F] - [C] - [F] - [G]",
            "loi_bai_hat_co_hop_am": f"[Verse 1]\n[C]Ngày xưa em đến mang theo mùa [G]xuân\n[Am]Gió mây bỗng như reo [Em]vui\n[F]Giờ em đi vắng để lại niềm [C]đau\n[F]Mưa rơi ướt nát con [G]tim..."
        }
        
        instruction = random.choice(prompt_templates).format(the_loai=the_loai, chu_de=chu_de)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    repo_name = "linhhuong-office-music-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
