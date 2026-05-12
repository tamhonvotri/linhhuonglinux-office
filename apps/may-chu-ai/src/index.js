import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import https from "https";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Xác định thư mục AppData đa nền tảng để lưu trữ an toàn khi build app
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Preferences') : path.join(process.env.HOME, ".local", "share"));
const modelsDir = path.join(appDataPath, "LinhHuongOffice", "models");
const modelPath = path.join(modelsDir, "model.gguf");

// URL Model GGUF từ Repo của bạn
const MODEL_URL = "https://huggingface.co/nguyendinhduybigtreetc/linhhuonglinux-office-van-ban-hanh-chinh/resolve/main/qwen2.5-3b-instruct.Q4_K_M.gguf?download=true";

let llama = null;
let model = null;
let context = null;

let downloadState = {
    status: 'idle', // idle, downloading, loading, ready, error
    percent: 0,
    downloadedMB: 0,
    totalMB: 0,
    errorMsg: ''
};

function downloadModel(url, dest) {
    return new Promise((resolve, reject) => {
        downloadState.status = 'downloading';
        
        const file = fs.createWriteStream(dest);
        
        // Cần xử lý Redirect (Hugging Face thường trả về 302 cho file lớn)
        const request = https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Theo dõi link redirect
                downloadModel(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Tải file thất bại với mã lỗi: ${response.statusCode}`));
                return;
            }

            const totalBytes = parseInt(response.headers['content-length'], 10);
            downloadState.totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
            
            let downloadedBytes = 0;

            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                downloadState.downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
                if (totalBytes) {
                    downloadState.percent = Math.floor((downloadedBytes / totalBytes) * 100);
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            downloadState.status = 'error';
            downloadState.errorMsg = err.message;
            reject(err);
        });
    });
}

async function initAI() {
    try {
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }

        // KỊCH BẢN 1: Nếu file chưa tồn tại -> Bắt đầu Tải tự động
        if (!fs.existsSync(modelPath)) {
            console.log("📥 Phát hiện lần khởi chạy đầu tiên. Đang tải Mô hình AI từ Hugging Face...");
            await downloadModel(MODEL_URL, modelPath);
            console.log("✅ Tải xong mô hình!");
        }

        // KỊCH BẢN 2: Load mô hình vào RAM/VRAM
        downloadState.status = 'loading';
        console.log("🚀 Đang nạp AI Engine (node-llama-cpp)...");
        llama = await getLlama(); 
        
        console.log(`📦 Đang khởi động mô hình: ${modelPath}`);
        model = await llama.loadModel({ modelPath });
        context = await model.createContext();
        
        downloadState.status = 'ready';
        console.log("✅ AI Server hoàn toàn SẴN SÀNG!");
    } catch (error) {
        console.error("❌ Lỗi hệ thống:", error);
        downloadState.status = 'error';
        downloadState.errorMsg = error.message;
    }
}

// Chạy khởi tạo ngầm
initAI();

// API 1: Trả về trạng thái Download để giao diện Svelte hiển thị Loading Bar
app.get("/api/status", (req, res) => {
    res.json(downloadState);
});

// API 2: Sinh văn bản
app.post("/api/generate", async (req, res) => {
    if (downloadState.status !== 'ready' || !model || !context) {
        return res.status(503).json({ error: "AI chưa sẵn sàng, đang tải hoặc khởi tạo..." });
    }

    try {
        const { prompt, systemPrompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Thiếu prompt" });

        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: systemPrompt || "Bạn là một AI thông minh trong phần mềm Office."
        });

        console.log("⏳ Đang suy luận...");
        const responseText = await session.prompt(prompt);
        res.json({ result: responseText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Tự động tải & phục vụ AI tại cổng ${PORT}`);
});
