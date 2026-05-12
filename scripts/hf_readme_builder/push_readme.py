import os
from dotenv import load_dotenv
from huggingface_hub import HfApi, login

def push_model_card():
    # Tải biến môi trường
    load_dotenv()
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("❌ Lỗi: Không tìm thấy HF_TOKEN trong file .env")
        return

    # Đăng nhập
    login(token=hf_token)
    api = HfApi()
    
    repo_id = "nguyendinhduybigtreetc/linhhuonglinux-office-van-ban-hanh-chinh"
    repo_type = "model" # Assuming it's a model repo since it's an exported LoRA
    
    try:
        # Create repo if not exists
        api.create_repo(repo_id=repo_id, repo_type=repo_type, exist_ok=True)
        print(f"✅ Đã kết nối tới Repo: {repo_id}")
    except Exception as e:
        print(f"⚠️ Không thể tạo/xác minh repo (có thể nó đã tồn tại): {e}")

    # Đường dẫn file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    readme_path = os.path.join(current_dir, "README.md")
    
    # Absolute path to the AI generated banner
    banner_path = r"C:\Users\Yphuc\.gemini\antigravity\brain\aba926aa-59f9-4371-b585-53faa24e6a5d\linhhuong_office_banner_1777211004107.png"

    # Push Banner Image
    if os.path.exists(banner_path):
        print("Đang đẩy ảnh Banner lên Hugging Face...")
        api.upload_file(
            path_or_fileobj=banner_path,
            path_in_repo="banner.png",
            repo_id=repo_id,
            repo_type=repo_type,
            commit_message="Add AI-generated banner for Model Card"
        )
    else:
        print("⚠️ Không tìm thấy ảnh Banner.")

    # Push README.md
    if os.path.exists(readme_path):
        print("Đang đẩy file README.md lên Hugging Face...")
        api.upload_file(
            path_or_fileobj=readme_path,
            path_in_repo="README.md",
            repo_id=repo_id,
            repo_type=repo_type,
            commit_message="Update Model Card (README) with SEO and Research standards"
        )
        print("🎉 Hoàn tất! Bạn có thể xem trang Model tại:")
        print(f"👉 https://huggingface.co/{repo_id}")
    else:
        print("❌ Không tìm thấy file README.md.")

if __name__ == "__main__":
    push_model_card()
