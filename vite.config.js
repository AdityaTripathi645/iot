import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose on LAN (0.0.0.0) so other devices can connect
    port: 5173,
    // Optional proxy: if you want /socket.io calls to go to backend automatically
    // proxy: {
    //   '/socket.io': { target: 'http://localhost:3001', ws: true },
    // },
  },
  optimizeDeps: {
    include: ['socket.io-client'],
  },
})
