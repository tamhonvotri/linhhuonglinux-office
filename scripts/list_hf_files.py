from huggingface_hub import list_repo_files

repo_id = "nguyendinhduybigtreetc/linhhuonglinux-office-van-ban-hanh-chinh"
try:
    files = list_repo_files(repo_id)
    print("FILES IN REPO:")
    for f in files:
        print(f)
except Exception as e:
    print(f"Error: {e}")
