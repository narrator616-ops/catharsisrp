import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative path to ensure assets load correctly in any environment (dev, preview, prod subdir)
  base: './', 
  build: {
    chunkSizeWarningLimit: 1600,
  }
});