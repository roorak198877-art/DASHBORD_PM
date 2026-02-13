
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // ปิดโหมด strict เพื่ออนุญาตให้ Vite เข้าถึงไฟล์นอก root และจัดการ Path ที่มีอักขระพิเศษ
      strict: false,
      // เพิ่ม Path ของคุณเข้าไปในรายการที่อนุญาต (Allowed Paths)
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
  // กำหนด Root Directory ให้ตรงกับ Directory ปัจจุบันของโปรเจกต์
  root: process.cwd()
});
