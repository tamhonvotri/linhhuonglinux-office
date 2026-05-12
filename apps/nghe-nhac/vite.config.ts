import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import fs from "fs";
import path from "path";
import os from "os";
import * as typst from "typst";

const typstRenderer = () => ({
  name: 'typst-renderer',
  configureServer(server: any) {
    server.middlewares.use('/api/typst', async (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { code } = JSON.parse(body);
            // Prefix to ensure math works nicely or just raw
            const content = code;
            const tmpdir = os.tmpdir();
            const id = Math.random().toString(36).substring(7);
            const inPath = path.join(tmpdir, `typst_${id}.typ`);
            const outPath = path.join(tmpdir, `typst_${id}.svg`);
            fs.writeFileSync(inPath, content);
            await typst.compile(inPath, outPath);
            const svg = fs.readFileSync(outPath, 'utf8');
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(svg);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err.message || 'Typst Compile Error');
          }
        });
      }
    });
  }
});

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [svelte(), typstRenderer()],
  base: './',

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
