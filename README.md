# QRIS Donation Generator

Generator QRIS dinamis dengan notifikasi real-time untuk donasi. Sistem ini terdiri dari frontend React dan backend Cloudflare Workers yang terintegrasi dengan Android Notification Listener.

## 🌟 Fitur

- ✅ **Generate QRIS Dinamis** - Buat QR code QRIS dengan nominal custom
- ✅ **Session-Based Matching** - Popup notifikasi hanya muncul untuk user yang generate QRIS
- ✅ **Real-time Notifications** - Notifikasi otomatis saat pembayaran berhasil
- ✅ **Timer Countdown** - QR code berlaku 10 menit dengan countdown timer
- ✅ **Recent Donations Display** - Tampilan donasi terbaru dengan detail
- ✅ **Responsive Design** - Desktop dan mobile friendly
- ✅ **Docker Support** - Easy deployment dengan Docker

## 📋 Prerequisites

- **Node.js** (v20 atau lebih baru)
- **Docker & Docker Compose** (untuk deployment)
- **Cloudflare Account** (untuk backend)
- **Wrangler CLI** (untuk deploy backend)
- **Android Notification Listener App** (untuk capture notifikasi pembayaran)

## 🚀 Setup Frontend

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi QRIS

Edit file `constants.ts` untuk mengubah QRIS payload default:

```typescript
export const DEFAULT_QRIS_PAYLOAD = "YOUR_QRIS_STRING_HERE";
export const SETTINGS_PASSWORD = "YOUR_PASSWORD";
```

**Cara mendapatkan QRIS String:**
1. Buka aplikasi e-wallet (DANA, GoPay, OVO, dll)
2. Generate QRIS statis
3. Scan dengan QRIS reader/decoder
4. Copy raw string QRIS

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 4. Build untuk Production

```bash
npm run build
```

### 5. Deploy dengan Docker

```bash
docker-compose up -d --build
```

Aplikasi akan berjalan di `http://localhost:5656`

## 🔧 Setup Backend (Cloudflare Workers)

### 1. Masuk ke Folder Backend

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Login ke Cloudflare

```bash
npx wrangler login
```

### 4. Buat D1 Database

```bash
npx wrangler d1 create notification-listener-db
```

Copy database ID yang muncul dan update di `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "notification-listener-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 5. Jalankan Migrasi Database

```bash
npx wrangler d1 execute notification-listener-db --file=./schema.sql
```

### 6. Set API Key Secret

```bash
npx wrangler secret put API_KEY
```

Masukkan API key yang sama dengan yang akan digunakan di Android app.

### 7. Deploy ke Cloudflare

```bash
npm run cf:deploy
```

Backend akan tersedia di: `https://notification-listener-backend.YOUR_SUBDOMAIN.workers.dev`

### 8. Update Backend URL di Frontend

Edit `components/RecentDonations.tsx` dan update URL backend:

```typescript
const response = await fetch('https://YOUR_BACKEND_URL/public/donations?limit=10');
```

## 📱 Setup Android Notification Listener

### 1. Install Android App

Install aplikasi Notification Listener di Android device.

### 2. Konfigurasi

- **Backend URL**: `https://YOUR_BACKEND_URL/webhook`
- **API Key**: API key yang sama dengan yang di-set di Cloudflare
- **Target Apps**: Pilih aplikasi e-wallet (DANA, GoPay, OVO, dll)

### 3. Grant Permissions

Berikan permission Notification Access ke aplikasi.

## 🎯 Cara Penggunaan

### Generate QRIS

1. Buka aplikasi di browser
2. Masukkan nominal donasi (minimal Rp 1.000)
3. (Opsional) Isi nama donatur dan pesan
4. Klik **Generate QRIS**
5. QR code akan muncul dengan timer countdown 10 menit

### Pembayaran

1. Buka aplikasi e-wallet (DANA, GoPay, OVO, dll)
2. Pilih menu **QRIS** atau **Scan QR**
3. Scan QR code yang sudah di-generate
4. Konfirmasi pembayaran
5. Notifikasi akan muncul otomatis di halaman web (dalam 5 detik)

### Lihat Donasi Terbaru

List "Donasi Terbaru" akan otomatis update setiap 5 detik menampilkan:
- Nama aplikasi pembayaran
- Nominal donasi
- Waktu transaksi

## 🔐 Keamanan

- **API Key Authentication**: Backend dilindungi dengan API key
- **Session-Based Matching**: Popup hanya muncul untuk user yang generate QRIS
- **Time-Based Validation**: Donasi hanya valid dalam 10 menit setelah generate
- **Amount Matching**: Sistem memverifikasi nominal sesuai dengan QR yang di-generate

## 🛠️ Troubleshooting

### QRIS tidak bisa dibayar

1. Pastikan QRIS payload di `constants.ts` valid
2. Clear browser localStorage:
   ```javascript
   localStorage.removeItem('qris_config')
   ```
3. Refresh halaman

### Popup tidak muncul

1. Cek console browser untuk error
2. Pastikan backend URL sudah benar
3. Pastikan Android app sudah mengirim notifikasi
4. Cek apakah time matching valid (donasi harus setelah generate QR)

### Reset Donations List

Via Cloudflare Dashboard:
1. Login ke Cloudflare Dashboard
2. Workers & Pages → D1 → notification-listener-db
3. Console → Run query:
   ```sql
   DELETE FROM notifications WHERE amount_detected IS NOT NULL;
   ```

Via Wrangler CLI:
```bash
cd backend
npx wrangler d1 execute notification-listener-db --command "DELETE FROM notifications WHERE amount_detected IS NOT NULL"
```

## 📂 Struktur Project

```
QRIS-Donation-Generator/
├── backend/                    # Cloudflare Workers backend
│   ├── src/
│   │   └── worker.js          # Main worker logic
│   ├── schema.sql             # Database schema
│   ├── wrangler.toml          # Cloudflare config
│   └── package.json
├── components/                 # React components
│   ├── RecentDonations.tsx    # Donation list & popup
│   └── SettingsModal.tsx      # QRIS settings modal
├── utils/
│   └── qris.ts                # QRIS generation logic
├── constants.ts               # QRIS payload & settings
├── App.tsx                    # Main app component
├── docker-compose.yml         # Docker config
├── Dockerfile                 # Docker build
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- QRIS specification by Bank Indonesia
- Cloudflare Workers for serverless backend
- React + Vite for frontend framework
