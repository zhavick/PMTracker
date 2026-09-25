import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const backendTarget = env.VITE_API_BASE_URL || env.BACKEND_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    envDir: '../',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
})
