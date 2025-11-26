import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify("AIzaSyBBLCD7k1lgljXCR6nPrylGnsoOdT1qqqI")
  }
});