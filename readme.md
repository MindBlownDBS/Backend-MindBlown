# 🧠 MindBlown API

MindBlown adalah API platform pelacakan kesehatan mental dan komunitas yang komprehensif yang dibangun dengan Node.js dan Hapi.js. API ini menyediakan fitur untuk pelacakan suasana hati, berbagi cerita, interaksi komunitas, rekomendasi, dan chatbot bertenaga AI.

## ✨ Fitur

- **Autentikasi Pengguna** - Sistem autentikasi berbasis JWT
- **Mind Tracker** - Pelacakan suasana hati dan kemajuan harian dengan prediksi suasana hati AI
- **Cerita & Komunitas** - Berbagi cerita, komentar, suka, dan berinteraksi dengan komunitas
- **Rekomendasi Cerdas** - Rekomendasi aktivitas bertenaga ML berdasarkan preferensi pengguna
- **AI Chatbot** - Chatbot real-time berbasis WebSocket untuk dukungan kesehatan mental
- **Notifikasi Push** - Notifikasi push web untuk pengingat dan interaksi
- **Pengingat Terjadwal** - Pengingat mind tracker otomatis pada waktu tertentu

## 🚀 Memulai

### Prasyarat

- Node.js >= 18.0.0
- Database MongoDB
- Kunci VAPID untuk notifikasi push

### Instalasi

1. Clone repository
```bash
git clone <repository-url>
cd Backend-MindBlown
```

2. Install dependencies
```bash
npm install
```

3. Buat file environment
```bash
cp .env.example .env
```

4. Konfigurasi variabel environment di `.env`:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=string_koneksi_mongodb_anda
JWT_SECRET_KEY=kunci_rahasia_jwt_anda
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=24h
VAPID_PUBLIC_KEY=kunci_publik_vapid_anda
VAPID_PRIVATE_KEY=kunci_privat_vapid_anda
```

5. Jalankan server
```bash
# Development
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 Dokumentasi API

### 🔐 Auth

#### User Register
```http
POST /register
```
**Body:**
```json
{
  "username": "string",
  "name": "string", 
  "email": "string",
  "password": "string",
  "preferences": ["Olahraga", "Belajar", "Relaksasi"]
}
```

#### Login
```http
POST /login
```
**Body:**
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

### 👤 User Profile

#### Ambil User Profile
```http
GET /profile/{username}
Authorization: Bearer {token}
```

#### Edit Profile
```http
PUT /profile
Authorization: Bearer {token}
```
**Body:**
```json
{
  "username": "string",
  "name": "string",
  "profilePicture": "string"
}
```

### 🧘 Mind Tracker

#### Kirim Entry Harian
```http
POST /mind-tracker
Authorization: Bearer {token}
```
**Body:**
```json
{
  "progress": "string"
}
```

#### Cek Entry
```http
GET /mind-tracker/check/{date}
Authorization: Bearer {token}
```

#### Ambil Entry Harian
```http
GET /mind-tracker/{date}
Authorization: Bearer {token}
```

#### Ambil Mood Tracker Bulanan
```http
GET /mind-tracker/monthly?startDate=2024-01
Authorization: Bearer {token}
```

### 🎯 Rekomendasi

#### Ambil Rekomendasi Pengguna
```http
GET /recommendations/{username}
Authorization: Bearer {token}
```

#### Regenerasi Rekomendasi
```http
POST /recommendations/{username}/regenerate
Authorization: Bearer {token}
```

### 📖 Cerita

#### Buat Cerita
```http
POST /stories
Authorization: Bearer {token}
```
**Body:**
```json
{
  "content": "string",
  "isAnonymous": false
}
```

#### Ambil Semua Cerita
```http
GET /stories
Authorization: Bearer {token}
```

#### Ambil Detail Cerita
```http
GET /stories/{storyId}
Authorization: Bearer {token}
```

#### Edit Cerita
```http
PUT /stories/{storyId}
Authorization: Bearer {token}
```
**Body:**
```json
{
  "content": "string"
}
```

#### Hapus Cerita
```http
DELETE /stories/{storyId}
Authorization: Bearer {token}
```

#### Like/Unlike Cerita
```http
POST /stories/{storyId}/likes
Authorization: Bearer {token}
```

### 💬 Komentar

#### Tambah Komentar
```http
POST /stories/{storyId}/comments
Authorization: Bearer {token}
```
**Body:**
```json
{
  "content": "string"
}
```

#### Balas Komentar
```http
POST /comments/{commentId}/replies
Authorization: Bearer {token}
```
**Body:**
```json
{
  "content": "string"
}
```

#### Ambil Detail Komentar
```http
GET /comments/{commentId}
Authorization: Bearer {token}
```

#### Like/Unlike Komentar
```http
POST /comments/{commentId}/likes
Authorization: Bearer {token}
```

#### Hapus Komentar
```http
DELETE /comments/{commentId}
Authorization: Bearer {token}
```

### 🔔 Notifikasi

#### Subscribe Notifikasi Push
```http
POST /notifications/push/subscribe
Authorization: Bearer {token}
```
**Body:**
```json
{
  "subscription": {
    "endpoint": "string",
    "keys": {
      "p256dh": "string",
      "auth": "string"
    }
  }
}
```

#### Unsubscribe Notifikasi Push
```http
POST /notifications/push/unsubscribe
Authorization: Bearer {token}
```

#### Ambil Notifikasi
```http
GET /notifications
Authorization: Bearer {token}
```

#### Tandai Notifikasi Sebagai Dibaca
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer {token}
```

#### Tandai Semua Notifikasi Sebagai Dibaca
```http
PUT /notifications/read-all
Authorization: Bearer {token}
```

### 🤖 Chatbot

#### Ambil Riwayat Chat
```http
GET /chatbot/history
Authorization: Bearer {token}
```

#### Tes Chatbot (HTTP)
```http
POST /chatbot/test
Authorization: Bearer {token} (opsional)
```
**Body:**
```json
{
  "message": "string",
  "user_id": "string"
}
```

## 🌐 API WebSocket (Chatbot)

Hubungkan ke: `ws://localhost:5000/chatbot-ws`

### Event

#### Client → Server

**Autentikasi:**
```json
{
  "type": "auth",
  "userId": "user_id_disini"
}
```

**Kirim Pesan:**
```json
{
  "type": "chatbot_request",
  "message": "Halo, apa kabar?",
  "requestId": "request_id_unik"
}
```

#### Server → Client

**Koneksi Terbentuk:**
```json
{
  "type": "connected",
  "message": "Terhubung ke chatbot MindBlown",
  "connectionId": "uuid",
  "anonymousId": "anonymous_user_id",
  "isAnonymous": true
}
```

**Respon Bot:**
```json
{
  "type": "chatbot_response",
  "data": {
    "message": "pesan_pengguna",
    "response": "respon_bot",
    "processingTime": "5 detik",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "requestId": "request_id_unik"
}
```

**Error:**
```json
{
  "type": "chatbot_error",
  "message": "Pesan error",
  "requestId": "request_id_unik",
  "retryAfter": 30
}
```

### Contoh WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:5000/chatbot-ws');

ws.onopen = () => {
  // Autentikasi (opsional)
  ws.send(JSON.stringify({
    type: 'auth',
    userId: 'user_id_anda'
  }));
  
  // Kirim pesan
  ws.send(JSON.stringify({
    type: 'chatbot_request',
    message: 'Saya butuh saran kesehatan mental',
    requestId: Date.now().toString()
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Diterima:', data);
  
  switch(data.type) {
    case 'connected':
      console.log('Terhubung ke chatbot');
      break;
    case 'chatbot_response':
      console.log('Respon bot:', data.data.response);
      break;
    case 'chatbot_error':
      console.error('Error:', data.message);
      break;
  }
};
```

## 🔧 Fitur Sistem

### Tugas Terjadwal

Sistem secara otomatis mengirim pengingat mind tracker pada:
- 06:00 WIB
- 12:00 WIB (Siang)  
- 18:00 WIB
- 23:00 WIB

### Integrasi AI

- **Prediksi Suasana Hati**: Menggunakan API Hugging Face untuk deteksi emosi dari teks
- **Chatbot**: Terintegrasi dengan API chatbot kesehatan mental kustom
- **Rekomendasi**: Rekomendasi aktivitas bertenaga ML

### Model Database

API menggunakan MongoDB dengan koleksi utama berikut:
- `user` - Akun pengguna dan preferensi
- `story` - Cerita dan postingan komunitas
- `comment` - Komentar dan balasan
- `notification` - Notifikasi push
- `mindTracker` - Entri suasana hati dan kemajuan harian
- `recommendations` - Rekomendasi aktivitas yang dihasilkan ML
- `chatHistory` - Riwayat percakapan chatbot

## 🛡️ Keamanan

- Autentikasi berbasis JWT
- Hashing password dengan bcrypt
- Validasi dan sanitasi request
- Konfigurasi CORS
- Rate limiting untuk request chatbot

## 📝 Penanganan Error

Semua endpoint mengembalikan respon error yang terstandar:

```json
{
  "error": true,
  "message": "Deskripsi error"
}
```

## 🚀 Deployment

### Variabel Environment untuk Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET_KEY=kunci-rahasia-yang-kuat
VAPID_PUBLIC_KEY=kunci-publik-vapid-anda
VAPID_PRIVATE_KEY=kunci-privat-vapid-anda
```

### Deployment Docker (Opsional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur Anda (`git checkout -b feature/FiturMenakjubkan`)
3. Commit perubahan Anda (`git commit -m 'Tambah FiturMenakjubkan'`)
4. Push ke branch (`git push origin feature/FiturMenakjubkan`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi ISC.

## 🆘 Dukungan

Untuk dukungan, silakan hubungi tim pengembang atau buat issue di repository.

---

**Catatan**: API ini dirancang untuk aplikasi kesehatan mental. Pastikan untuk menerapkan langkah-langkah privasi data dan keamanan yang tepat saat melakukan deployment ke production.