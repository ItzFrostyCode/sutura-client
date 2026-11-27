# How to Open SUTURA (Windows and macOS)

Daily steps after the one-time setup. You need **two terminals**: one for the backend (`sutura-server`) and one for the frontend (`sutura-client`). Keep both open while you use the system.

| Part | Folder | Address |
|---|---|---|
| Backend (Laravel API) | `sutura-server` | http://127.0.0.1:8000 |
| Frontend (Next.js) | `sutura-client` | http://localhost:3000 |
| Database (MySQL) | — | 127.0.0.1:3306 |

New computer? Do the [one-time setup](#one-time-setup-new-computer) first.

## Quick start (one command)

Both repos have a start script. It starts MySQL, the backend and the frontend, then opens the browser. `sutura-server` and `sutura-client` must be side by side in the same folder, with those exact folder names.

**Windows:** double-click `start-sutura.bat` (in `sutura-server` or `sutura-client`), or run it in PowerShell:

```powershell
.\start-sutura.bat
```

It opens two windows, "SUTURA Backend" and "SUTURA Frontend". To stop SUTURA, close both windows.

**macOS:**

```bash
cd path/to/sutura-server
./start-sutura.sh
```

Everything runs in that one terminal. To stop SUTURA, press `Ctrl + C`.

If the script doesn't work, use the manual steps below.

## Windows (manual)

**1. Start MySQL.** Open the XAMPP Control Panel and click **Start** on **MySQL**. Apache is not needed.

**2. Start the backend (Terminal 1, PowerShell).**

```powershell
cd path\to\sutura-server
php artisan serve --host=127.0.0.1 --port=8000
```

If PowerShell says `php` is not recognized, use XAMPP's PHP:

```powershell
& "C:\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8000
```

**3. Start the frontend (Terminal 2, PowerShell).**

```powershell
cd path\to\sutura-client
npm run dev
```

**4. Open http://localhost:3000**

## macOS (manual)

**1. Start MySQL (Homebrew).**

```bash
brew services start mysql@8.4
```

It stays on after a restart. To check, run `brew services list`; `mysql@8.4` should say `started`.

**2. Start the backend (Terminal 1).**

```bash
cd path/to/sutura-server
php artisan serve --host=127.0.0.1 --port=8000
```

**3. Start the frontend (Terminal 2).**

```bash
cd path/to/sutura-client
npm run dev
```

**4. Open http://localhost:3000**

## If port 8000 is busy

Run the backend on `8001` and point the frontend to it. Also set `APP_URL=http://localhost:8001` in `sutura-server/.env`, or uploaded pictures won't show.

**Windows**

```powershell
# Terminal 1
php artisan serve --host=127.0.0.1 --port=8001

# Terminal 2
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:8001/api/v1"
npm run dev
```

**macOS**

```bash
# Terminal 1
php artisan serve --host=127.0.0.1 --port=8001

# Terminal 2
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api/v1 npm run dev
```

## To stop

Press `Ctrl + C` in both terminals. MySQL can stay running.

## After `git pull`

```bash
# sutura-server
composer install
php artisan migrate

# sutura-client
npm install
```

> **Warning:** `php artisan migrate:fresh` and `php artisan db:seed` delete the data in the database. Back it up first with `mysqldump`. Before `php artisan test`, run `php artisan config:clear` so the tests don't use the real database.

## Common problems

| Problem | Fix |
|---|---|
| Login says "Network Error" or pages don't load data | Terminal 1 (backend) is not running, or its port doesn't match `NEXT_PUBLIC_API_URL`. |
| `SQLSTATE[HY000] [2002] Connection refused` | MySQL is not started (XAMPP on Windows, `brew services start mysql@8.4` on macOS). |
| `Unknown database` | The database in `DB_DATABASE` (`sutura-server/.env`) doesn't exist. Create it in MySQL. The default name is `sutura`. |
| Pictures don't show | Run `php artisan storage:link` once in `sutura-server`, and check that `APP_URL` uses the backend's port. |
| `php` is not recognized (Windows) | Use `& "C:\xampp\php\php.exe"` or add `C:\xampp\php` to PATH. |
| Frontend complains about the Node version | Install Node.js 20.9 or newer. |

## One-time setup (new computer)

Requirements: PHP 8.2+, Composer, Node.js 20.9+, MySQL 8.

**Windows:** start MySQL in XAMPP, then double-click `setup-windows.bat` in `sutura-server`, then the one in `sutura-client`.

**macOS:**

```bash
# Backend
cd path/to/sutura-server
composer install
cp .env.example .env
php artisan key:generate
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed
php artisan storage:link

# Frontend
cd path/to/sutura-client
npm install
```

Note: on Joshua's MacBook, `DB_DATABASE` is `sutura_merge_preview` (the merged data with Bongo's changes). Everyone else uses `sutura`.

## Demo Accounts

### Sakuragi Embroidery Davao (Active Shop)
| Role | Email | Password |
|---|---|---|
| Shop Account (Owner) | `sakuragiembroiderydavao@sutura.shop` | `Password!1` |
| Staff Account | `itzjoshuawaymantest@gmail.com` | `ItzFrosty6932!` |

### Seeded Demo Accounts
| Role | Email | Password |
|---|---|---|
| Shop Owner (Seeded) | `maria.cruz@gmail.com` | `password` |
| Staff (Seeded) | `juan.delacruz@sutura.com` | `password` |
| Branch Manager | `miguel.manager@sutura.com` | `password` |
| Admin (login at `/admin/login`) | `admin@sutura.com` | `password` |
| Customer | `juan.delacruz@gmail.com` | `password` |
| Customer (no bookings yet — use this one to test booking) | `tess.tester@gmail.com` | `password` |
| Customer | `jose.rizal@gmail.com` | `password` |
