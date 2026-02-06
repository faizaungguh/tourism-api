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

### Struktur Projek

```
├── 📁 app
│   ├── 📄 db.mjs
│   ├── 📄 logging.mjs
│   └── 📄 web.mjs
├── 📁 configs
│   ├── 📄 security.mjs
│   └── 📄 variable.mjs
├── 📁 controllers
│   ├── 📁 data
│   │   ├── 📄 data.admin.mjs
│   │   ├── 📄 data.attraction.mjs
│   │   ├── 📄 data.auth.mjs
│   │   ├── 📄 data.category.mjs
│   │   ├── 📄 data.destination.mjs
│   │   ├── 📄 data.manager.mjs
│   │   ├── 📄 data.recommendation.mjs
│   │   └── 📄 data.subdistrict.mjs
│   ├── 📁 media
│   │   ├── 📄 media.admin.mjs
│   │   ├── 📄 media.attraction.mjs
│   │   ├── 📄 media.destination.mjs
│   │   └── 📄 media.facility.mjs
│   └── 📄 index.mjs
├── 📁 errors
│   └── 📄 responseError.mjs
├── 📁 helpers
│   ├── 📁 data
│   │   ├── 📄 admin.mjs
│   │   ├── 📄 attraction.mjs
│   │   ├── 📄 auth.mjs
│   │   ├── 📄 destination.mjs
│   │   ├── 📄 duplication.mjs
│   │   └── 📄 recommendation.mjs
│   ├── 📁 media
│   │   ├── 📄 admin.mjs
│   │   ├── 📄 attraction.mjs
│   │   ├── 📄 destination.mjs
│   │   └── 📄 facility.mjs
│   └── 📄 index.mjs
├── 📁 middlewares
│   ├── 📄 auth.mjs
│   ├── 📄 error.mjs
│   └── 📄 media.mjs
├── 📁 routes
│   ├── 📄 api.mjs
│   └── 📄 public.mjs
├── 📁 schemas
│   ├── 📄 admin.mjs
│   ├── 📄 attraction.mjs
│   ├── 📄 category.mjs
│   ├── 📄 destination.mjs
│   └── 📄 subdistrict.mjs
├── 📁 services
│   ├── 📁 data
│   │   ├── 📄 data.admin.mjs
│   │   ├── 📄 data.attraction.mjs
│   │   ├── 📄 data.auth.mjs
│   │   ├── 📄 data.category.mjs
│   │   ├── 📄 data.destination.mjs
│   │   ├── 📄 data.manager.mjs
│   │   ├── 📄 data.recommendation.mjs
│   │   └── 📄 data.subdistrict.mjs
│   ├── 📁 media
│   │   ├── 📄 media.admin.mjs
│   │   ├── 📄 media.attraction.mjs
│   │   ├── 📄 media.destination.mjs
│   │   └── 📄 media.facility.mjs
│   └── 📄 index.mjs
├── 📁 validations
│   ├── 📁 data
│   │   ├── 📄 admin.mjs
│   │   ├── 📄 attraction.mjs
│   │   ├── 📄 auth.mjs
│   │   ├── 📄 category.mjs
│   │   ├── 📄 destination.mjs
│   │   ├── 📄 recommendation.mjs
│   │   └── 📄 subdistrict.mjs
│   ├── 📁 field
│   │   ├── 📄 admin.mjs
│   │   ├── 📄 attraction.mjs
│   │   └── 📄 destination.mjs
│   ├── 📁 utils
│   │   └── 📄 checker.mjs
│   └── 📄 index.mjs
└── 📄 app.mjs
```

---

## Seeding cheatsheet

command di bawah merupakan tools tambahan untuk memudahkan menjalankan perintah seeding yang sudah dibuat, harus menginstall Makefile terlebih dahulu,  atau bisa menggunakan command node

### 1. Fullpack
Command ini akan sekaligus mengimpor data dari seed `.json` ke Database
#### Makefile
```Makefile
make import-fullpack
```
#### Nodejs
```nodejs
node data/seeds/seeding.mjs --import-fullpack
```
Command ini akan sekaligus menghapus data pada Database
#### Makefile
```Makefile
make delete-data
```
#### Nodejs
```nodejs
node data/seeds/seeding.mjs --delete-all
```

### 2. Default (Admin, Subdistrict, Category)
Command ini akan sekaligus mengimpor data Admin, Subdistrict, dan Category dari seed `.json` ke Database
#### Makefile
```Makefile
make import-admin import-default
```
#### Nodejs
```nodejs
node data/seeds/seeding.mjs --import-admin && node data/seeds/seeding.mjs --import-default
```

### 3. Satu per Satu
Command ini akan sekaligus mengimpor data Admin, Subdistrict, Category, + Destinasi dan Attraction dari seed `.json` ke Database
#### Makefile
```Makefile
make import-admin
```
```Makefile
make import-default
```
```Makefile
make import-destination 
```
```Makefile
make import-ticket-destination 
```
```Makefile
make import-attraction 
```
```Makefile
make import-facility 
```
```Makefile
make import-parking 
```
```Makefile
make import-contact
```