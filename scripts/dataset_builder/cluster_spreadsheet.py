import json
import random
from utils import push_alpaca_dataset_to_hf

def generate_spreadsheet_dataset(num_samples=500):
    """
    Sinh dữ liệu cho việc tạo công thức bảng tính (Excel/Calc).
    """
    yeu_cau = [
        ("Tính tổng các giá trị trong cột A nếu cột B lớn hơn 100", "=SUMIF(B:B, \">100\", A:A)"),
        ("Tìm tên nhân viên ở cột C dựa vào mã nhân viên ở ô A1, vùng dò tìm E:G", "=VLOOKUP(A1, E:G, 3, FALSE)"),
        ("Đếm số lượng sinh viên qua môn (điểm >= 5) trong vùng D2:D50", "=COUNTIF(D2:D50, \">=5\")"),
        ("Tính trung bình cộng các số trong cột C nếu cột A là 'Nam'", "=AVERAGEIF(A:A, \"Nam\", C:C)"),
        ("Kết hợp Họ và Tên từ ô A2 và B2, có khoảng trắng ở giữa", "=A2 & \" \" & B2")
    ]

    prompt_templates = [
        "Viết công thức Excel để: {yeu_cau_text}.",
        "Làm sao để {yeu_cau_text} trong bảng tính?",
        "Cung cấp công thức LibreOffice Calc cho yêu cầu sau: {yeu_cau_text}"
    ]

    formatted_dataset = []
    print(f"Đang tạo {num_samples} mẫu cho cụm Spreadsheet (Bảng tính)...")

    for _ in range(num_samples):
        item = random.choice(yeu_cau)
        yeu_cau_text = item[0]
        cong_thuc = item[1]
        
        # Cấu trúc output
        structured_output = {
            "cong_thuc": cong_thuc,
            "giai_thich": f"Công thức này sử dụng hàm để {yeu_cau_text.lower()}."
        }
        
        instruction = random.choice(prompt_templates).format(yeu_cau_text=yeu_cau_text)
        
        alpaca_item = {
            "instruction": instruction,
            "input": "",
            "output": json.dumps(structured_output, ensure_ascii=False, indent=2)
        }
        formatted_dataset.append(alpaca_item)

    # Đẩy lên repo chuyên biệt cho Spreadsheet
    repo_name = "linhhuong-office-spreadsheet-instruct"
    push_alpaca_dataset_to_hf(formatted_dataset, repo_name)
