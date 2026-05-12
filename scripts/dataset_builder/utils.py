import os
from dotenv import load_dotenv
from huggingface_hub import login
from datasets import Dataset

def load_environment():
    """Tải các biến môi trường từ file .env"""
    load_dotenv()
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("❌ Lỗi: Không tìm thấy HF_TOKEN trong file .env")
        exit(1)
    return hf_token

def authenticate_huggingface():
    """Đăng nhập vào Hugging Face Hub"""
    token = load_environment()
    print("Đang đăng nhập Hugging Face...")
    login(token=token)

def push_alpaca_dataset_to_hf(formatted_dataset, repo_name):
    """
    Đóng gói list các dict chứa (instruction, input, output) thành Dataset
    và đẩy lên Hugging Face Hub.
    """
    print(f"Đang đóng gói và đẩy lên Hugging Face Repo: {repo_name}...")
    hf_dataset = Dataset.from_list(formatted_dataset)
    
    try:
        # Cấu hình private=False để tránh lỗi Unsloth Studio không đọc được split
        hf_dataset.push_to_hub(repo_name, private=False)
        print(f"✅ Đẩy dữ liệu thành công! Bạn có thể xem tại: https://huggingface.co/datasets/{repo_name}")
    except Exception as e:
        print(f"❌ Lỗi khi đẩy lên Hugging Face: {e}")
