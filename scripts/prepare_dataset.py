import pandas as pd
import json
import random
import re
from datasets import Dataset
from huggingface_hub import login
import os

print("Đang đăng nhập Hugging Face...")
token = "REMOVED_TOKEN"
login(token=token)

print("Đang tải dữ liệu qua Pandas (bypass PyArrow bug)...")
try:
    df = pd.read_parquet("hf://datasets/th1nhng0/vietnamese-legal-documents/data/content.parquet")
    print(f"Tải thành công! Số lượng dòng: {len(df)}")
except Exception as e:
    print(f"Lỗi tải parquet: {e}")
    exit(1)

prompt_templates = [
    "Hãy soạn thảo một {loai} về việc {trich_yeu}.",
    "Đóng vai chuyên viên hành chính, hãy viết {loai} với nội dung chính: {trich_yeu}.",
    "Soạn {loai} liên quan đến: {trich_yeu}.",
    "Tôi cần tạo một bản nháp cho {loai} về {trich_yeu}. Vui lòng viết đúng chuẩn thể thức văn bản hành chính."
]

system_prompt = "Bạn là trợ lý AI chuyên môn cao về hành chính văn phòng của hệ thống Linh Hương Linux. Nhiệm vụ của bạn là soạn thảo các văn bản hành chính với văn phong trang trọng, pháp lý chặt chẽ và trả về định dạng JSON có cấu trúc để hệ thống dễ dàng xử lý."

formatted_dataset = []
count = 0
target_count = 5000  

def extract_type_from_title(title):
    if not isinstance(title, str): return None
    title_lower = title.lower()
    if "quyết định" in title_lower: return "Quyết định"
    if "thông báo" in title_lower: return "Thông báo"
    if "tờ trình" in title_lower: return "Tờ trình"
    if "chỉ thị" in title_lower: return "Chỉ thị"
    if "công văn" in title_lower: return "Công văn"
    return None

print("Bắt đầu xử lý dữ liệu...")

for index, row in df.iterrows():
    title = row.get("title", "")
    text = row.get("text", "")
    
    if not isinstance(title, str) or not isinstance(text, str):
        continue
        
    loai_van_ban = extract_type_from_title(title)
    if not loai_van_ban:
        continue
        
    text = re.sub(r'\n+', '\n', text).strip()
    
    can_cu = []
    dieu_khoan = []
    lines = text.split('\n')
    
    for line in lines:
        line_clean = line.strip()
        if line_clean.lower().startswith("căn cứ"):
            can_cu.append(line_clean)
        elif line_clean.lower().startswith("điều "):
            dieu_khoan.append(line_clean)
            
    structured_output = {
        "loai_van_ban": loai_van_ban,
        "trich_yeu": title.replace(loai_van_ban.upper(), "").replace(loai_van_ban, "").strip(" -:"),
        "can_cu_phap_ly": can_cu if can_cu else ["Theo các quy định hiện hành"],
        "dieu_khoan": dieu_khoan if dieu_khoan else [],
        "toan_van": text
    }

    template = random.choice(prompt_templates)
    user_message = template.format(loai=loai_van_ban, trich_yeu=structured_output["trich_yeu"])
    
    conversation = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": json.dumps(structured_output, ensure_ascii=False, indent=2)}
    ]
    
    formatted_dataset.append({"messages": conversation})
    count += 1
    
    if count % 500 == 0:
        print(f"Đã xử lý: {count}/{target_count} văn bản")
        
    if count >= target_count:
        break

print(f"Hoàn thành xử lý {len(formatted_dataset)} văn bản.")

print("Đang tạo Dataset Object...")
hf_dataset = Dataset.from_list(formatted_dataset)

repo_name = "linhhuong-office-legal-instruct"
print(f"Đang đẩy lên Hugging Face Hub (Repo: {repo_name})...")
try:
    hf_dataset.push_to_hub(repo_name, private=True)
    print("✅ Đẩy dữ liệu thành công! Bạn có thể kiểm tra trên Hugging Face.")
except Exception as e:
    print(f"❌ Lỗi khi đẩy lên Hugging Face: {e}")
    with open("linhhuong_dataset.jsonl", "w", encoding="utf-8") as f:
        for data in formatted_dataset:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")
    print("Đã lưu fallback ra file linhhuong_dataset.jsonl")
