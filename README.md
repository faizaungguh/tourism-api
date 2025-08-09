# REST API Rekomendasi Destinasi Wisata

## Deskripsi Singkat
Projek ini merupakan pemenuhan syarat kelulusan untuk mendapatkan gelar Sarjana

## Identitas
| Civitas    | Nama |
| -------- | ------- |
| Dosen Pembimbing | Dr. Fandy Setyo Utomo S.Kom., M.Cs.     |
| Mahasiswa  | Ungguh Faizaturrohman    |

## Running in WSL

| Teknologi    | Keterangan |
| -------- | ------- |
| WSL | Distro Fedora 42  |
| Node Js  | Jod/v22   |
| Database  | MongoDB   |

## Konfigurasi awal

copy dan ubah nama file example.env menjadi -> .env, kemudian sesuaikan dengan konfigurasi pengembanganmu

```env
PORT=<port konfigurasi>
MONGO_IP=<IP Mongo>
MONGO_USER= <Username Mongo>
MONGO_PASSWORD= <Password Mongo>
MONGO_DB= <Nama DB>
JWT_SECRET=<Kata random>
JWT_EXPIRES_IN=<kadaluarsa JWT>
APP_URL=<BaseUrl>
```

## Install MongoDB

### Menggunakan Docker
```
sudo docker run -d --name mongodev -p 27017:27017 -v mongodev:/data/db mongo:7.0.20-jammy 
```

## Penggunaan Nodejs

### Install nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

### Install nodejs
```bash
nvm Install jod && nvm use jod
```

### Install pnpm
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Install semua node library di package.json
```bash
pnpm install
```

### Jalankan import ke database awal untuk development
```bash
make dev-default
```

### Menjalankan projek untuk development
```bash
pnpm dev
```

### Admin Default
```json
{
    "username": "admin01",
    "password": "rahasiaAdmin01",
    "name": "Admin 01",
    "email": "admin01@example.com",
    "contactNumber": "081234567890",
    "role": "admin"
}
```

### Manager Default
```json
{
    "username": "manager01",
    "password": "rahasiaManager01",
    "name": "Manager Wisata 01",
    "email": "manager01@example.com",
    "contactNumber": "08518202025",
    "role": "manager"
}
```