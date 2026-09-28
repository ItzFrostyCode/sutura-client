# SUTURA — Local Development Setup

> Complete setup guide for thesis group members on **Windows** and **macOS**.

---

## 📋 System Requirements

| Tool | Minimum | Notes |
|------|---------|-------|
| PHP | **8.3+** | Laravel 13 requires this — older PHP will fail |
| Composer | 2.x | PHP dependency manager |
| Node.js | **18+ LTS** | For the Next.js frontend (v20 recommended) |
| MySQL | 8.x | Local database |
| Git | Any | For cloning |

---

## 🪟 Windows Setup

### Option A — XAMPP (Recommended for beginners)
1. Download **XAMPP** → https://www.apachefriends.org/download.html
2. Install it (includes PHP 8.3+, MySQL, Apache)
3. Open **XAMPP Control Panel** → Start **Apache** and **MySQL**
4. If PHP version is below 8.3, update it:
   - Download PHP 8.3 Thread Safe zip → https://windows.php.net/download/
   - Replace contents of `C:\xampp\php\` with the downloaded files
5. Install **Node.js LTS** → https://nodejs.org/ (choose "LTS" button)
6. Install **Composer** → https://getcomposer.org/Composer-Setup.exe

### Option B — Laravel Herd for Windows
1. Download → https://herd.laravel.com/windows
2. Install Herd — automatically sets up PHP 8.3+, Nginx, and Composer
3. Install MySQL separately via XAMPP or [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

### Verify before continuing:
Open **Command Prompt** or **PowerShell** and run:
```cmd
php --version
node --version
composer --version
```
PHP must be 8.3+, Node must be 18+.

---

## 🍎 macOS Setup

### Option A — Laravel Herd (Recommended for Mac)
1. Download → https://herd.laravel.com/
2. Install — automatically sets up PHP 8.3+, Nginx, Composer
3. Open Herd → Ensure PHP 8.3+ is active
4. Install MySQL via Homebrew:
   ```bash
   brew install mysql@8.4
   brew services start mysql@8.4
   ```

### Option B — Homebrew (Manual)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PHP 8.3+, Composer, Node.js, MySQL
brew install php composer node mysql@8.4
brew services start mysql@8.4
```

---

## 📦 Clone & Run

### Step 1 — Clone both repos

```bash
git clone https://github.com/ItzFrostyCode/sutura-server.git
git clone https://github.com/ItzFrostyCode/sutura-client.git
```

> You need **both running at the same time** in two separate terminals.

---

### Step 2 — Create the MySQL Database

> Do this **before** running migrations.

**macOS:**
```bash
/opt/homebrew/opt/mysql@8.4/bin/mysql -u root -e "
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutura'@'localhost' IDENTIFIED BY 'sutura_local_dev';
GRANT ALL PRIVILEGES ON sutura.* TO 'sutura'@'localhost';
FLUSH PRIVILEGES;
"
```

**Windows (XAMPP):**
Open XAMPP Control Panel → click **Admin** next to MySQL → **SQL tab** → paste and run:
```sql
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutura'@'localhost' IDENTIFIED BY 'sutura_local_dev';
GRANT ALL PRIVILEGES ON sutura.* TO 'sutura'@'localhost';
FLUSH PRIVILEGES;
```

---

### Step 3 — Backend Setup (Terminal 1)

Navigate into `sutura-server`:
```bash
# macOS:
cd sutura-server

# Windows — use the full path, e.g.:
cd "C:\Users\yourname\Desktop\sutura-server"
```

Run these **in order**:

```bash
# Install PHP packages
composer install

# Copy environment file
# macOS / Git Bash:
cp .env.example .env
# Windows CMD only:
copy .env.example .env

# Generate app secret key (required!)
php artisan key:generate

# Run migrations + seed demo data
php artisan migrate --seed

# Link file storage (for uploaded images)
php artisan storage:link

# Start the backend server
php artisan serve
```

> **Windows:** `storage:link` needs **Developer Mode ON** (Windows Settings → For Developers) or run terminal **as Administrator**.

✅ Backend running at **http://127.0.0.1:8000** — leave this terminal open.

---

### Step 4 — Frontend Setup (Terminal 2)

Open a **new terminal** and navigate into `sutura-client`:
```bash
# macOS:
cd sutura-client

# Windows:
cd "C:\Users\yourname\Desktop\sutura-client"
```

Run:

```bash
# Install JS packages
npm install

# Copy environment file
# macOS / Git Bash:
cp .env.example .env.local
# Windows CMD only:
copy .env.example .env.local

# Start the dev server
npm run dev
```

✅ Frontend running at **http://localhost:3000** — leave this terminal open.

---

### Step 5 — Open in Browser

Go to → **http://localhost:3000** 🎉

---

## 🔑 Default Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Shop Owner | `owner@sutura.com` | `password` |
| Staff | `staff@sutura.com` | `password` |
| Admin | `admin@sutura.com` | `password` |
| Customer | `customer@sutura.com` | `password` |
| Customer | `jose.rizal@gmail.com` | `password` |

---

## ❓ Common Errors & Fixes

### ❌ `'php' is not recognized` (Windows)
Add PHP to PATH:
1. Find PHP folder (e.g. `C:\xampp\php`)
2. Open **Start → "Edit the system environment variables"**
3. Under **System variables** → find **Path** → Edit → Add `C:\xampp\php`
4. Click OK → **reopen terminal**

### ❌ `'composer' is not recognized` (Windows)
Download and run: https://getcomposer.org/Composer-Setup.exe — then reopen terminal.

### ❌ `composer install` fails — PHP version error
Upgrade PHP to 8.3+:
- Windows: Download from https://windows.php.net/download/ and replace `C:\xampp\php\`
- macOS: `brew upgrade php`

### ❌ `SQLSTATE[HY000] [1049] Unknown database 'sutura'`
Create the database first — see **Step 2** above.

### ❌ `SQLSTATE[HY000] [1045] Access denied for user 'sutura'`
The MySQL user doesn't exist. Re-run the SQL from Step 2. Then check `.env`:
```env
DB_USERNAME=sutura
DB_PASSWORD=sutura_local_dev
```

### ❌ `php artisan migrate` — Connection refused
MySQL isn't running:
- XAMPP: Click **Start All** in XAMPP Control Panel
- Homebrew: `brew services start mysql@8.4`

### ❌ `php artisan storage:link` fails (Windows)
Run terminal **as Administrator** (right-click → Run as administrator) OR enable **Developer Mode** in Windows Settings.

### ❌ Login fails — no accounts
```bash
php artisan migrate:fresh --seed
```

### ❌ Images show broken (404 on `/storage/...`)
```bash
cd sutura-server
php artisan storage:link
```

### ❌ `npm install` fails — Node version error
Install Node.js LTS (v20) from https://nodejs.org/

### ❌ Frontend shows "Network Error" / can't connect
1. Make sure Laravel is running (`php artisan serve` in sutura-server)
2. Check `sutura-client/.env.local` contains:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   ```

### ❌ Port already in use
**Windows:**
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```
**macOS:**
```bash
lsof -i :8000
kill -9 <PID>
```

### ❌ CRLF / LF merge conflicts (Windows ↔ Mac)
Run once per machine:
```bash
git config core.autocrlf false
git config core.eol lf
git add --renormalize .
git commit -m "chore: normalize line endings"
```

---

## 🛠️ Recommended Tools

| Tool | Purpose | Download |
|------|---------|----------|
| **VS Code** | Code editor | https://code.visualstudio.com/ |
| **TablePlus** | MySQL GUI (Mac/Win) | https://tableplus.com/ |
| **Postman** | API testing | https://www.postman.com/ |
| **Laravel Herd** | PHP environment | https://herd.laravel.com/ |

---

## 📁 Project Structure

```
SUTURA/
├── sutura-server/     ← Laravel 13 Backend (PHP API)
│   ├── app/           ← Controllers, Models
│   ├── database/      ← Migrations, Seeders
│   ├── routes/api.php ← All API routes
│   └── .env.example   ← Copy to .env
└── sutura-client/     ← Next.js 16 Frontend
    ├── src/app/       ← Pages and routes
    ├── src/components/← UI components
    └── .env.example   ← Copy to .env.local
```

---

## 🔄 Git Workflow

1. Always pull before working:
   ```bash
   git pull origin main
   ```
2. Work on a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Pull before pushing:
   ```bash
   git pull origin main --rebase
   git push origin feature/your-feature-name
   ```
4. `.gitattributes` enforces LF line endings — no CRLF conflicts on fresh clones.
