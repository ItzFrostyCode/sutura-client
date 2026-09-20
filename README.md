# SUTURA — Local Development Setup

> Complete setup guide for thesis group members on **Windows** and **macOS**.

---

## 📋 System Requirements

| Tool | Minimum | Notes |
|------|---------|-------|
| PHP | **8.3+** | Laravel 13 requires this — older PHP will fail |
| Composer | 2.x | PHP dependency manager |
| Node.js | **18+ LTS** | For the Next.js frontend |
| MySQL | 8.x | Local database |
| Git | Any | For cloning |

---

## 🪟 Windows Setup

**Recommended: Use Laravel Herd (easiest)**

### Option A — Laravel Herd (Recommended)
1. Download → https://herd.laravel.com/windows
2. Install Herd — it automatically sets up PHP 8.3+, Nginx, and Node.js
3. Open **Herd** and make sure PHP 8.3+ is selected

### Option B — Laragon (Alternative, works with XAMPP-style MySQL)
1. Download **Laragon Full** → https://laragon.org/download/
2. Install → it includes PHP 8.3+, MySQL, Apache, and a terminal
3. Inside Laragon: Right-click tray → PHP → Switch to **8.3** or higher
4. Install Node.js LTS separately → https://nodejs.org/

### Verify before continuing:
```bash
php --version      # Must say 8.3.x or higher
node --version     # Must say 18.x or higher
composer --version # Must say 2.x
mysql --version    # Any 8.x
```

---

## 🍎 macOS Setup

**Recommended: Use Laravel Herd (easiest, for macOS 12 Monterey+)**

### Option A — Laravel Herd (Recommended)
1. Download → https://herd.laravel.com/
2. Install — automatically sets up PHP 8.3+, Nginx, Composer
3. Open Herd → Ensure PHP 8.3 or higher is active

### Option B — Homebrew (Manual)
```bash
# 1. Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install PHP 8.3+
brew install php
php --version    # verify: 8.3.x or higher

# 3. Install Composer
brew install composer

# 4. Install Node.js LTS
brew install node

# 5. Install and start MySQL
brew install mysql
brew services start mysql
```

---

## 📦 Clone & Run (Both Windows and macOS)

### Step 1 — Clone the project
```bash
git clone <your-github-repo-url>
cd SUTURA
```

> **Note:** The project has two separate folders:
> - `sutura-server/` → Laravel backend (PHP)
> - `sutura-client/` → Next.js frontend (JavaScript)
>
> You need **both running** at the same time.

---

### Step 2 — Backend Setup (`sutura-server`)

```bash
cd sutura-server

# Install PHP packages
composer install

# Copy environment file
cp .env.example .env          # macOS / Linux / Git Bash
# On Windows CMD (if cp doesn't work):
# copy .env.example .env

# Generate the app key (required!)
php artisan key:generate
```

**Edit your `.env` file** — open it in VS Code and set:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sutura
DB_USERNAME=root
DB_PASSWORD=          ← leave blank for Laragon/Herd default
```

> **MySQL — Create the database first!**
> Open MySQL (via Laragon's HeidiSQL, TablePlus, or terminal):
> ```sql
> CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

```bash
# Run all migrations (creates all tables)
php artisan migrate

# Seed with demo data (shops, users, catalog items, etc.)
php artisan db:seed

# Link file storage (for uploaded images to work)
php artisan storage:link

# Start the backend server
php artisan serve
```

✅ Backend now running at: **http://127.0.0.1:8000**

---

### Step 3 — Frontend Setup (`sutura-client`)

Open a **new terminal tab/window**, then:

```bash
cd sutura-client

# Install JS packages
npm install

# Copy environment file
cp .env.example .env.local          # macOS / Git Bash
# On Windows CMD:
# copy .env.example .env.local

# The .env.local file should contain:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
# (this is already set correctly in .env.example)

# Start the frontend dev server
npm run dev
```

✅ Frontend now running at: **http://localhost:3000**

---

### Step 4 — Open in Browser

Go to → **http://localhost:3000** 🎉

---

## 🔑 Default Login Accounts (Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sutura.com | password |
| Shop Owner | owner@sutura.com | password |
| Customer | customer@sutura.com | password |
| Staff | staff@sutura.com | password |

*(Check `sutura-server/database/seeders/` for the complete list)*

---

## ❓ Common Errors & Fixes

### ❌ `composer install` fails with PHP version error
**Fix:** Your PHP is below 8.3. Upgrade:
- Windows: Switch to PHP 8.3+ in Laragon or reinstall Herd
- macOS: `brew upgrade php`

### ❌ `SQLSTATE[HY000] [1049] Unknown database 'sutura'`
**Fix:** Create the database first:
```sql
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ❌ `php artisan migrate` fails with connection error
**Fix:** Make sure MySQL is running:
- Laragon: click **Start All** in Laragon
- Herd: check Services panel
- Homebrew: `brew services start mysql`

### ❌ Images show as broken (404 on `/storage/...`)
**Fix:**
```bash
cd sutura-server
php artisan storage:link
```

### ❌ `npm install` fails on Node version
**Fix:** Install Node.js LTS from https://nodejs.org/ (choose the "LTS" button)

### ❌ Frontend says "Network Error" or API not found
**Fix:** Make sure Laravel is running:
```bash
cd sutura-server
php artisan serve
```
Then check `sutura-client/.env.local` contains:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

### ❌ Git merge conflicts on every pull (CRLF vs LF)
**Fix (one-time per machine):**
```bash
# In the project root:
git config core.autocrlf false
git config core.eol lf

# Then re-normalize existing files:
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
├── README.md                  ← You are here
├── sutura-server/             ← Laravel 13 Backend
│   ├── app/                   ← Controllers, Models
│   ├── database/              ← Migrations, Seeders
│   ├── routes/api.php         ← All API routes
│   ├── .env.example           ← Copy this to .env
│   └── ...
└── sutura-client/             ← Next.js 16 Frontend
    ├── src/app/               ← Pages and routes
    ├── src/components/        ← Reusable UI components
    ├── .env.example           ← Copy this to .env.local
    └── ...
```

---

## 🔄 Git Workflow (Avoiding Merge Conflicts)

To avoid CRLF/LF conflicts between Windows and Mac:

1. **Always pull before you start working:**
   ```bash
   git pull origin main
   ```

2. **Work on a feature branch, not directly on main:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Before pushing, pull again to catch conflicts early:**
   ```bash
   git pull origin main --rebase
   git push origin feature/your-feature-name
   ```

4. **The `.gitattributes` files in both repos enforce LF** — as long as you don't override them, line ending conflicts will not happen.
