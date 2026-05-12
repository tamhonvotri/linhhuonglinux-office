from datasets import load_dataset

ds = load_dataset("th1nhng0/vietnamese-legal-documents", "content", split="data", streaming=True)
count = 0
for item in ds:
    print("--- SAMPLE ---")
    print(item.keys())
    if "title" in item:
        print("TITLE:", item["title"][:100])
    if "text" in item:
        print("TEXT:", item["text"][:200])
    
    count += 1
    if count >= 2:
        break
