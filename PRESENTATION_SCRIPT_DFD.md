# Naskah Presentasi: Penjelasan DFD Level 1

**Visual:** Menampilkan Diagram DFD Level 1.

## 1. Pembukaan

"Selanjutnya, saya akan menjelaskan **Data Flow Diagram (DFD) Level 1**. Diagram ini merupakan perincian dari proses utama sistem Undangan Digital yang telah kita lihat di Level 0. Di sini, kita bisa melihat lebih jelas bagaimana data mengalir antar sub-proses."

## 2. Aktor Utama

"Sistem ini memiliki dua pengguna utama:

1.  **Admin / Pengelola** (Kiri): Memiliki akses penuh manajemen.
2.  **Tamu Undangan** (Atas/Kanan): Pengguna akhir yang menerima undangan."

## 3. Penjelasan Alur Proses

### A. Sisi Admin (Persiapan)

"Alur dimulai dari sisi Admin.

- **1.0 Autentikasi**: Admin login dan sistem memverifikasi kredensial dari tabel **Admin Users (D1)**.
- **4.0 Manajemen Admin**: Setelah masuk, Admin mengelola data melalui proses ini. Data tamu disimpan ke **Guest Invitations (D2)** dan pengaturan acara ke **Settings (D5)**."

### B. Sisi Tamu (Distribusi & Respon)

"Kemudian di sisi Tamu:

- **2.0 Kelola Tampilan**: Saat tamu membuka link, sistem mengambil data dari **Settings (D5)** dan **Guest Invitations (D2)** untuk menampilkan undangan personal.
- **3.0 RSVP & Ucapan**: Tamu mengirimkan konfirmasi kehadiran dan doa. Data ini masuk ke **RSVPs (D3)** dan **Wishes (D4)**."

### C. Saat Acara (Validasi)

- **5.0 Check-In System**: Pada hari H, Admin/Petugas melakukan scan QR Code tamu. Sistem memvalidasi data langsung ke **Guest Invitations (D2)** dan mengupdate status kehadiran."

## 4. Penutup

"Dengan alur ini, seluruh siklus data mulai dari input, distribusi, respon, hingga validasi kehadiran telah terintegrasi dalam satu sistem terpusat."
