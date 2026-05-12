import argparse
from cluster_docs import generate_docs_dataset
from cluster_spreadsheet import generate_spreadsheet_dataset
from cluster_slides import generate_slides_dataset
from cluster_creative import generate_creative_dataset
from cluster_music import generate_music_dataset
from cluster_extended import generate_extended_dataset
from cluster_copilot import generate_copilot_dataset
from utils import authenticate_huggingface

def main():
    parser = argparse.ArgumentParser(description="Linh Hương Office Dataset Builder")
    parser.add_argument(
        '--cluster', 
        choices=['docs', 'spreadsheet', 'slides', 'creative', 'music', 'extended', 'copilot', 'all'], 
        required=True,
        help="Chọn cụm dữ liệu muốn tạo và đẩy lên Hugging Face"
    )
    
    args = parser.parse_args()
    
    print("🚀 Bắt đầu hệ thống tạo Dataset tự động...")
    authenticate_huggingface()
    
    if args.cluster == 'docs' or args.cluster == 'all':
        generate_docs_dataset(num_samples=1500)
        
    if args.cluster == 'spreadsheet' or args.cluster == 'all':
        generate_spreadsheet_dataset(num_samples=1500)
        
    if args.cluster == 'slides' or args.cluster == 'all':
        generate_slides_dataset(num_samples=1500)
        
    if args.cluster == 'creative' or args.cluster == 'all':
        generate_creative_dataset(num_samples=1500)
        
    if args.cluster == 'music' or args.cluster == 'all':
        generate_music_dataset(num_samples=1500)
        
    if args.cluster == 'extended' or args.cluster == 'all':
        generate_extended_dataset(num_samples=1500)
        
    if args.cluster == 'copilot' or args.cluster == 'all':
        generate_copilot_dataset(num_samples=1500)
        
    print("🎉 Hoàn tất toàn bộ tiến trình!")

if __name__ == "__main__":
    main()
