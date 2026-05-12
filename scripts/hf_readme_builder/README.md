---
language:
- vi
- en
tags:
- qwen
- qwen2.5
- lora
- peft
- unsloth
- administrative
- legal
- sft
- vietnamese
license: apache-2.0
base_model: unsloth/Qwen2.5-3B-Instruct
---

![Linh Huong Linux Office AI Banner](banner.png)

# 🏢 Linh Hương Linux Office: Văn Bản Hành Chính (Qwen2.5-3B-Instruct LoRA)

**Linh Hương Linux Office AI** là mô hình Trí tuệ Nhân tạo (AI) chuyên biệt đầu tiên dành cho tác vụ soạn thảo văn bản hành chính theo tiêu chuẩn **Nghị định 30/2020/NĐ-CP** của Chính phủ Việt Nam. 

Mô hình này được tinh chỉnh (Fine-tuned) bằng phương pháp **LoRA (Low-Rank Adaptation)** trên nền tảng model `Qwen2.5-3B-Instruct`, giúp mô hình cực kỳ nhẹ bé mà vẫn duy trì khả năng suy luận xuất sắc về thể thức văn bản tiếng Việt.

🔗 **Trang chủ Dự án:** [Linh Hương Linux Chat](https://linhhuonglinux-chat.vercel.app/)

---

## 🎯 Giới thiệu (Model Description)
- **Developed by:** Linh Huong Linux Research Team (Nguyen Dinh Duy)
- **Model type:** Causal Language Model with LoRA adapter
- **Language(s):** Vietnamese (Primary), English
- **Base Model:** `unsloth/Qwen2.5-3B-Instruct`
- **Training Framework:** [Unsloth](https://github.com/unslothai/unsloth)

Mô hình này không chỉ là một chatbot thông thường. Nó được thiết kế để xuất dữ liệu dưới định dạng **Cấu trúc JSON khắt khe**, cho phép tích hợp trực tiếp (plug-and-play) vào hệ thống Frontend Svelte/Vite của trình soạn thảo Linh Hương Linux Office.

### ✨ Các Tính Năng Cốt Lõi (Key Capabilities)
1. **Soạn thảo tự động:** Sinh bản thảo Quyết định, Thông báo, Tờ trình, Công văn chỉ từ vài từ khóa (Trích yếu).
2. **Kiểm soát Thể thức (Nghị định 30):** Tự động điền [CƠ QUAN CHỦ QUẢN], [TÊN CƠ QUAN BAN HÀNH], [QUYỀN HẠN KÝ].
3. **Cấu trúc JSON:** Khả năng định dạng đầu ra thành JSON ổn định, phân tách rõ `can_cu_phap_ly`, `dieu_khoan`, `noi_nhan` để Render ra UI.

---

## 🚀 Hướng Dẫn Sử Dụng (Usage)

Mô hình này được huấn luyện ở dạng **Adapter LoRA**. Để chạy hiệu quả nhất trong môi trường Node.js / Web, chúng tôi khuyên dùng định dạng **GGUF** qua thư viện `node-llama-cpp`.

### Tích hợp qua Python (Transformers)
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_name = "Qwen/Qwen2.5-3B-Instruct"
adapter_repo = "nguyendinhduybigtreetc/linhhuonglinux-office-van-ban-hanh-chinh"

# Load Base Model
model = AutoModelForCausalLM.from_pretrained(base_model_name)
tokenizer = AutoTokenizer.from_pretrained(base_model_name)

# Load LoRA Adapter
model = PeftModel.from_pretrained(model, adapter_repo)

prompt = "Soạn thảo Quyết định về việc thành lập ban chỉ đạo chuyển đổi số."
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=1024)
print(tokenizer.decode(outputs[0]))
```

---

## 📊 Tập Dữ Liệu Huấn Luyện (Training Data)
Mô hình được SFT (Supervised Fine-Tuning) trên tập dữ liệu tổng hợp (Synthetic Dataset) với định dạng **Alpaca**, bao gồm hàng ngàn mẫu Quyết định, Thông báo, Tờ trình và Công văn tuân thủ nghiêm ngặt thể thức hành chính Việt Nam.

## ⚙️ Chi Tiết Huấn Luyện (Training Procedure)
- **Framework:** Unsloth (Giúp tăng tốc độ train x2 và giảm VRAM).
- **Quantization:** 4-bit (bitsandbytes).
- **Epochs:** 2
- **Context Length:** 2048
- **Learning Rate:** 2e-4

---

## 🛡️ Giới hạn và Khuyến cáo (Limitations)
- Mô hình này nhằm mục đích **Hỗ trợ Soạn thảo** (Drafting Assistant). Người dùng phải rà soát lại nội dung, thông tin pháp lý, số thứ tự văn bản và chức danh người ký trước khi ban hành chính thức.
- Mô hình đôi khi có thể bị "ảo giác" (hallucination) với các số hiệu Nghị định/Luật nếu không được cung cấp rõ trong Prompt.

*🌟 Nếu bạn thấy mô hình này hữu ích cho dự án mã nguồn mở hoặc công việc của bạn, hãy thả 1 💖 (Like) cho Repo này nhé!*
