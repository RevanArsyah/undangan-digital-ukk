# Wedding Invitation Website

Sebuah website undangan pernikahan modern, elegan, dan interaktif yang dibangun menggunakan **Astro**, **React**, **Tailwind CSS**, dan **SQLite**. Website ini mendukung mode gelap (dark mode), animasi halus, musik latar otomatis, dan sistem manajemen tamu yang terintegrasi.

![Banner](gambar.png)

---

## Fitur Utama

### Pengalaman Pengguna (User Experience)

- **Amplop Digital**: Animasi pembuka undangan yang elegan dengan personalisasi nama tamu.
- **Tema Siang & Malam**: Dukungan Dark Mode yang menyesuaikan preferensi sistem atau pilihan pengguna.
- **Musik Latar**: Pemutar musik otomatis (dengan interaksi pengguna) untuk suasana romantis.
- **Animasi Halus**: Efek _reveal_ saat scroll, _floating petals_, dan transisi antar elemen.
- **Countdown Timer**: Hitung mundur waktu nyata menuju acara pernikahan.

### Fungsionalitas

- **Personalisasi Tamu**: Nama tamu dapat diambil otomatis dari parameter URL (`?to=Nama Tamu Bisa Pakai Spasi`).
- **RSVP Online**: Formulir konfirmasi kehadiran yang terhubung langsung ke database.
  - _Smart Update_: Jika tamu dengan nama yang sama mengisi ulang, data lama akan diperbarui (tidak duplikat).
  - _Dashboard_: Menampilkan statistik kehadiran secara _real-time_.
- **Buku Tamu (Wishes)**: Fitur kirim ucapan dan doa dengan paginasi.
- **Integrasi Peta & Kalender**: Tautan langsung ke Google Maps dan fitur "Add to Calendar" (Google/ICS).
- **Galeri Foto**: Penampil foto interaktif (lightbox).
- **Informasi Kado**: Fitur _copy-to-clipboard_ untuk nomor rekening dan alamat kirim kado.

### Teknis

- **Server-Side Rendering (SSR)**: Menggunakan Astro Node Adapter untuk performa optimal dan SEO.
- **Database SQLite**: Penyimpanan data tamu dan ucapan yang ringan, cepat, dan mandiri (tanpa perlu setup MySQL/PostgreSQL terpisah).
- **Optimasi Deployment**: Konfigurasi siap pakai untuk deploy menggunakan PM2 dan Nginx Reverse Proxy.

---

## Struktur Proyek

```txt
.
├── src/
│   ├── components/ # Komponen UI (React)
│   ├── layouts/ # Layout dasar halaman (Astro)
│   ├── lib/ # Konfigurasi Database (SQLite)
│   ├── pages/
│   │   ├── api/ # API Endpoints (RSVP & Wishes)
│   │   └── index.astro # Halaman utama
│   ├── services/ # Logic penghubung Frontend ke API
│   ├── styles/ # Global CSS & Tailwind Config
│   └── types.ts # Definisi Tipe TypeScript
├── public/ # Aset statis
├── astro.config.mjs # Konfigurasi Astro
├── ecosystem.config.cjs # Konfigurasi PM2 untuk Production
├── nginx.conf # Contoh konfigurasi Nginx
└── package.json # Daftar dependensi

```

---

## Cara Instalasi & Menjalankan (Development)

Pastikan Anda sudah menginstal **Node.js** (v18+) dan **Yarn** atau **NPM**.

1.  **Clone Repository**

    ```bash
    git clone https://github.com/zulfikriyahya/wedding-invitation.git
    cd wedding-invitation
    ```

2.  **Install Dependencies**

    ```bash
    yarn install
    # atau
    npm install
    ```

3.  **Jalankan Server Development**
    ```bash
    yarn dev
    ```
    Website akan berjalan di `http://localhost:4321`. File database `wedding.db` akan otomatis dibuat saat pertama kali aplikasi dijalankan.

---

## Deployment ke Production (VPS / Dedicated Server)

Proyek ini menggunakan adapter **Node.js Standalone** dan database **SQLite**. Berikut langkah-langkah deploy ke server Ubuntu/CentOS:

### 1. Build Project

Di komputer lokal Anda, jalankan perintah build:

```bash
yarn build
```

Ini akan menghasilkan folder `dist/`.

### 2. Upload File ke Server

Upload file/folder berikut ke direktori server (misal: `/var/www/wedding.feyaya.com`):

- Folder `dist/`
- File `package.json`
- File `ecosystem.config.cjs`
- File `yarn.lock` atau `package-lock.json`

### 3. Install Production Dependencies di Server

Masuk ke terminal server dan jalankan:

```bash
cd /var/www/wedding.feyaya.com
yarn install --production
```

_Langkah ini penting untuk meng-compile driver SQLite (`better-sqlite3`) sesuai sistem operasi server._

### 4. Jalankan dengan PM2

Gunakan PM2 untuk menjalankan aplikasi di background:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 5. Konfigurasi Nginx (Reverse Proxy)

Buat file konfigurasi Nginx (biasanya di `/etc/nginx/sites-available/wedding`) dan isi dengan konten dari file `nginx.conf` yang disertakan di repository ini. Sesuaikan `server_name` dengan domain Anda.

```bash
# Link konfigurasi
sudo ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/

# Test & Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL (Opsional tapi Disarankan)

Gunakan Certbot untuk mengaktifkan HTTPS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d wedding.feyaya.com
```

---

## Personalisasi Undangan

Untuk membuat link undangan spesifik untuk tamu tertentu, tambahkan parameter `?to=` di akhir URL.

**Contoh:**
`https://wedding.feyaya.com/?to=Budi+Santoso`

- Nama "Budi Santoso" akan muncul otomatis di sampul undangan.
- Kolom nama di form RSVP dan Ucapan akan otomatis terisi "Budi Santoso" dan **terkunci** agar tidak bisa diubah sembarangan.

---

## Preview

[![Preview](gambar.png)](video.mp4)

---

## Lisensi

[MIT License](LICENSE) - Dibuat dengan ❤️ oleh **Yahya Zulfikri**.
