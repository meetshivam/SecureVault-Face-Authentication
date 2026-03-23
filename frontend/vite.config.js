import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/auth': 'http://127.0.0.1:5000',
      '/vault': 'http://127.0.0.1:5000',
      '/video_feed': 'http://127.0.0.1:5000',
      '/set_mode': 'http://127.0.0.1:5000',
      '/get_status': 'http://127.0.0.1:5000',
    }
  }
})
