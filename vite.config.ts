import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖНО: Замените 'rpg-world-map' на название вашего репозитория на GitHub!
  base: '/rpg-world-map/', 
});