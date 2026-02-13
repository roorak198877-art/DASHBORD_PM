
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // Disable strict mode to allow Vite to access files outside of the root and handle paths with special characters
      strict: false,
      // Allowed file system paths for the server
      allow: [
        '..',
        './',
        'E:/TTgv.2app/final!ttg-v.2/PM-NEW-FINAL'
      ]
    },
    host: true,
    port: 5173,
    hmr: {
      overlay: true
    }
  },
  // Set root to the current working directory
  root: process.cwd()
});
