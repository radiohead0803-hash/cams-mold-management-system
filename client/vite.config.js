import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // 외부 접속 허용
    https: process.env.VITE_HTTPS === 'true', // HTTPS 모드 (모바일 카메라용)
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: process.env.PORT || 4173,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'bountiful-nurturing-production-cd5c.up.railway.app',
      '.railway.app',
      'localhost'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 관련 라이브러리
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // UI 라이브러리
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          // 차트 라이브러리
          if (id.includes('node_modules/recharts') || 
              id.includes('node_modules/d3')) {
            return 'chart-vendor';
          }
          // 상태 관리
          if (id.includes('node_modules/zustand') || 
              id.includes('node_modules/@tanstack')) {
            return 'state-vendor';
          }
          // 유틸리티
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/lodash')) {
            return 'utils-vendor';
          }
        },
      },
    },
  },
})
