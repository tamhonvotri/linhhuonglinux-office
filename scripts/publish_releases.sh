#!/bin/bash
# Script để tự động hóa việc đẩy các bản build (.deb, .AppImage) lên HuggingFace Datasets

echo "============================================================"
echo "    LINHHUONG LINUX - TỰ ĐỘNG PUBLISH RELEASES LÊN HUGGINGFACE"
echo "============================================================"

# Thư mục chứa toàn bộ file cài đặt
RELEASE_DIR="../linhhuonglinux-releases"
WORKSPACE_DIR=$(pwd)

echo "[1] Tạo thư mục quản lý tập trung: $RELEASE_DIR"
mkdir -p $RELEASE_DIR
cd $RELEASE_DIR

# Khởi tạo Git nếu chưa có
if [ ! -d ".git" ]; then
  git init
  git remote add origin https://huggingface.co/datasets/linhhuong/linhhuonglinux-releases
  
  # Cấu hình Git LFS cho các file dung lượng lớn
  git lfs install
  cat <<EOF > .gitattributes
*.deb filter=lfs diff=lfs merge=lfs -text
*.AppImage filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
EOF
  git add .gitattributes
  git commit -m "Initial commit with LFS tracking"
fi

echo "[2] Đang thu thập các file .deb và .AppImage từ Workspace..."
# Copy các file build mới nhất vào thư mục Release
find $WORKSPACE_DIR/apps -name "*.deb" -exec cp {} ./ \;
find $WORKSPACE_DIR/apps -name "*.AppImage" -exec cp {} ./ \;

echo "[3] Đang cập nhật metadata (versions.json) cho Software Center..."
# Khởi tạo hoặc cập nhật file versions.json
cat <<EOF > versions.json
{
  "document": "1.0.2",
  "spreadsheet": "1.0.1",
  "presentation": "1.0.0",
  "formula": "1.0.0",
  "calculator": "1.0.0",
  "music": "1.0.0",
  "video": "1.0.0"
}
EOF

echo "[4] Đang commit lên HuggingFace..."
git add .
git commit -m "Cập nhật các bản build mới nhất của hệ điều hành LinhHuong"

echo "[5] Hoàn tất chuẩn bị! Hãy chạy lệnh sau để đẩy lên server:"
echo "    cd ../linhhuonglinux-releases && git push origin main"
echo "Lưu ý: Hãy chắc chắn bạn đã đăng nhập HuggingFace CLI (huggingface-cli login)"
