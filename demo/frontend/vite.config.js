import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Mở Chrome khi chạy dev (Windows: `start chrome …`; macOS: `open -a "Google Chrome"`) */
function moChromeKhiSanSang() {
  return {
    name: 'mo-chrome-khi-san-sang',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const port = server.config.server?.port ?? 5173;
        const url = `http://localhost:${port}`;
        setTimeout(() => {
          try {
            if (process.platform === 'win32') {
              // Không bọc URL trong ngoặc kép để tránh `start` hiểu nhầm là tiêu đề cửa sổ
              execSync(`start chrome ${url}`, { stdio: 'ignore', shell: true });
            } else if (process.platform === 'darwin') {
              execSync(`open -a "Google Chrome" "${url}"`, { stdio: 'ignore' });
            } else {
              execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
            }
          } catch {
            /* Chrome chưa cài hoặc lệnh thất bại */
          }
        }, 300);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), moChromeKhiSanSang()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
