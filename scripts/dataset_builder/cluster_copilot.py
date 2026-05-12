import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_copilot_dataset(num_samples=1500):
    """
    Sinh dữ liệu cho Mô Hình Chính (Copilot Orchestrator)
    Dạy AI cách: Giao tiếp, Điều hướng ứng dụng (Routing), Gọi hàm (Function Calling).
    """
    
    # 1. Routing Intents
    routing_intents = [
        {"q": "Mở cho tôi giao diện soạn công văn", "a": '{"action": "navigate", "target": "document_app", "profile": "administrative"}'},
        {"q": "Tôi muốn làm một bảng tính excel", "a": '{"action": "navigate", "target": "spreadsheet_app"}'},
        {"q": "Thiết kế một bài thuyết trình slide", "a": '{"action": "navigate", "target": "presentation_app"}'},
        {"q": "Tôi đang có cảm hứng, hãy mở phần sáng tác văn học", "a": '{"action": "navigate", "target": "document_app", "profile": "creative"}'},
        {"q": "Chuyển sang chế độ Nhạc sĩ", "a": '{"action": "navigate", "target": "document_app", "profile": "musician"}'}
    ]

    # 2. System Commands
    system_commands = [
        {"q": "Lưu file này lại cho tôi", "a": '{"action": "save_file", "format": "native"}'},
        {"q": "Lưu thành PDF", "a": '{"action": "export_file", "format": "pdf"}'},
        {"q": "Bật Dark Mode lên", "a": '{"action": "toggle_theme", "theme": "dark"}'},
        {"q": "Chuyển sang chế độ màn hình sáng", "a": '{"action": "toggle_theme", "theme": "light"}'},
        {"q": "Tạo văn bản mới trắng trơn", "a": '{"action": "new_file"}'}
    ]

    # 3. Help & Q&A
    help_qa = [
        {"q": "Làm sao để chèn chữ ký số vào Quyết định?", "a": "Để chèn chữ ký số, bạn hãy di chuyển chuột vào khối [CHỮ KÝ], bấm nút công cụ nhỏ giọt nước bên cạnh và chọn 'Chèn Chữ Ký Số'."},
        {"q": "Linh Hương Linux Office có thể dùng offline được không?", "a": "Có! Linh Hương Linux Office được trang bị máy chủ AI Cục bộ chạy bằng công nghệ GGUF, cho phép bạn làm việc hoàn toàn không cần Internet."},
        {"q": "Tôi gõ văn bản nhưng bị mất điện thì sao?", "a": "Bạn đừng lo, hệ thống có tính năng Auto-Save tự động lưu trạng thái (Draft) vào bộ nhớ cục bộ theo thời gian thực. Khi mở lại app, dữ liệu sẽ tự phục hồi."}
    ]

    all_intents = routing_intents + system_commands + help_qa
    formatted_dataset = []

    print(f"Đang tạo {num_samples} mẫu cho cụm Copilot (Mô hình chính)...")

    for _ in range(num_samples):
        # Trộn ngẫu nhiên các loại intent
        sample = random.choice(all_intents)
        
        # Thêm một chút biến thể từ ngữ để AI học linh hoạt hơn
        q_variation = sample["q"]
        if random.random() > 0.5:
            prefixes = ["Trợ lý ơi, ", "Giúp tôi ", "AI ơi, ", "Bạn có thể "]
            q_variation = random.choice(prefixes) + q_variation.lower()
            
        instruction = "Bạn là Trợ lý Copilot của Linh Hương Linux Office. Nhiệm vụ của bạn là hỗ trợ người dùng bằng cách cung cấp thông tin hoặc trả về chuỗi JSON để điều khiển phần mềm. Yêu cầu của người dùng:\n" + q_variation
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": sample["a"]
        }
        formatted_dataset.append(alpaca_item)

    repo_name = "linhhuong-office-copilot-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
