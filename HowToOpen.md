# How to Run SUTURA (Shop Owner System)

Two projects, two terminals, running **at the same time**:

- `sutura-server` — Laravel API → `http://127.0.0.1:8000`
- `sutura-client` — Next.js dashboard → `http://localhost:3000`

**Start the backend first, then the frontend.**

---

# 🪟 WINDOWS

### Requirements
- PHP 8.3+, Composer, Node.js 20+
- **XAMPP** (for MySQL) — download from [apachefriends.org](https://www.apachefriends.org) if you don't have it

### 1. Clone
```
git clone https://github.com/ItzFrostyCode/sutura-server.git
git clone https://github.com/ItzFrostyCode/sutura-client.git
```

### 2. Create the database
Open **XAMPP Control Panel** → Start **MySQL** → click **Admin** (opens phpMyAdmin) → **SQL** tab → paste and run:
```sql
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutura'@'localhost' IDENTIFIED BY 'sutura_local_dev';
GRANT ALL PRIVILEGES ON sutura.* TO 'sutura'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend setup (Terminal 1)
`cd` into `sutura-server` using its full path, e.g.:
```
cd "C:\Users\yourname\Desktop\sutura-server"
```
Then:
```
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```
`storage:link` needs **Developer Mode ON** (Settings → For Developers) or run the terminal **as Administrator** — otherwise it fails.

### 4. Start backend
```
php artisan serve
```
Leave this running.

### 5. Frontend (Terminal 2 — new window)
`cd` into `sutura-client` using its full path, then:
```
npm install
npm run dev
```
Leave this running. Open **http://localhost:3000**

### If it won't start (stuck port)
```
netstat -ano | findstr :8000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
Then repeat steps 4–5.

---

# 🍎 macOS

### Requirements
- PHP 8.3+, Composer, Node.js 20+
- **MySQL 8.4** via Homebrew:
```
brew install mysql@8.4
brew services start mysql@8.4
```

### 1. Clone
```
git clone https://github.com/ItzFrostyCode/sutura-server.git
git clone https://github.com/ItzFrostyCode/sutura-client.git
```

### 2. Create the database
```
/opt/homebrew/opt/mysql@8.4/bin/mysql -u root -e "
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutura'@'localhost' IDENTIFIED BY 'sutura_local_dev';
GRANT ALL PRIVILEGES ON sutura.* TO 'sutura'@'localhost';
FLUSH PRIVILEGES;
"
```

### 3. Backend setup (Terminal 1)
`cd` into `sutura-server` using its full path, e.g.:
```
cd /Users/yourname/Desktop/sutura-server
```
Then:
```
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

### 4. Start backend
```
php artisan serve
```
Leave this running.

### 5. Frontend (Terminal 2 — new window)
`cd` into `sutura-client` using its full path, then:
```
npm install
npm run dev
```
Leave this running. Open **http://localhost:3000**

### If it won't start (stuck port)
```
lsof -i :8000
lsof -i :3000
kill -9 <PID>
```
Then repeat steps 4–5.

---

# Login

| Role | Email | Password |
|---|---|---|
| Shop Owner | `owner@sutura.com` | `password` |
| Staff | `staff@sutura.com` | `password` |
| Admin | `admin@sutura.com` | `password` |

Use **Shop Owner** — that's the dashboard being built (Jobs, Appointments, Catalog, Payments, Staff, Reports).

---

# Common Errors

| Error | Fix |
|---|---|
| "Connection refused" on `migrate` | MySQL isn't running — start it (XAMPP Control Panel / `brew services start mysql@8.4`) |
| "Access denied for user 'sutura'" | `.env`'s `DB_PASSWORD` must be `sutura_local_dev` |
| Login fails / no accounts | Run `php artisan migrate:fresh --seed` |
| Uploaded images show broken | Run `php artisan storage:link` |
| "php"/"composer" not recognized (Windows) | Add PHP folder (e.g. `C:\xampp\php`) to your system PATH, reopen terminal |
| Port already in use | See "If it won't start" above |
