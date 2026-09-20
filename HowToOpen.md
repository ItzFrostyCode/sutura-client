# How to Run SUTURA (Frontend & Backend)

SUTURA consists of two separate projects running **at the same time**, each in its own terminal window:

- **`sutura-server`** — Laravel backend/API (runs on `http://127.0.0.1:8000`)
- **`sutura-client`** — Next.js frontend/dashboard (runs on `http://localhost:3000`)

**Always start the backend first, then the frontend.**

---

## 0. Clone Both Repositories

```bash
git clone https://github.com/ItzFrostyCode/sutura-server.git
git clone https://github.com/ItzFrostyCode/sutura-client.git
```

---

## TERMINAL 1: Backend (`sutura-server`)

### Windows (with XAMPP):
1. Start **MySQL** in XAMPP Control Panel.
2. In phpMyAdmin (`http://localhost/phpmyadmin`), click **New**, create a database named `sutura`.
3. In terminal:
   ```bash
   cd sutura-server
   setup-windows.bat
   php artisan serve
   ```

### macOS:
1. Start MySQL: `brew services start mysql@8.4`
2. In terminal:
   ```bash
   cd sutura-server
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve
   ```

---

## TERMINAL 2: Frontend (`sutura-client`)

In a new terminal window:
```bash
cd sutura-client
npm install
cp .env.example .env.local
npm run dev
```
*(On Windows Command Prompt, use `copy .env.example .env.local` or run `setup-windows.bat`)*

Open **http://localhost:3000** in your browser.

---

## Test Accounts

- **Shop Owner**: `owner@sutura.com` | `password`
- **Staff**: `staff@sutura.com` | `password`
- **Admin**: `admin@sutura.com` | `password`
