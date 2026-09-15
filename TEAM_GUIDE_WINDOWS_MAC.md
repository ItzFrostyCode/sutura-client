# SUTURA Team Guide: Cross-Platform Setup & Git Conflict Resolution

This document explains the architecture of the SUTURA codebase, why previous cloning/download attempts caused conflicts, and the definitive guide for running the project on **Windows (with XAMPP)** and **macOS**.

---

## 1. Understanding the Project Structure

### Why can't we download/clone the entire "SUTURA" parent folder from GitHub?
The `SUTURA` folder on your computer is simply a workspace directory. It is **NOT** a single Git repository.

Instead, it contains **two independent Git repositories**:
```text
SUTURA/ (Workspace Folder - NOT a Git Repo)
├── sutura-server/   → https://github.com/ItzFrostyCode/sutura-server.git
└── sutura-client/   → https://github.com/ItzFrostyCode/sutura-client.git
```

### Common Traps to Avoid:
1. **Never `git init` or push the parent `SUTURA` folder to GitHub**:
   - Because `sutura-server` and `sutura-client` each contain their own `.git` folders, Git treats them as "gitlink submodules".
   - When someone clones that parent repo, both `sutura-client` and `sutura-server` will download as **completely empty folders**!
2. **Never send `node_modules` or `vendor` via Zip / Google Drive**:
   - Compressing `node_modules` and `vendor` includes thousands of OS-specific binary packages compiled for macOS (Apple Silicon arm64).
   - Windows cannot run macOS binaries. Furthermore, Windows zip extraction often crashes on symlinks created by `php artisan storage:link`.
3. **Always clone the two repositories separately**:
   ```bash
   git clone https://github.com/ItzFrostyCode/sutura-server.git
   git clone https://github.com/ItzFrostyCode/sutura-client.git
   ```

---

## 2. Resolving Git Conflicts Between Team Members

### Why were there "puro conflicts" when cloning or pulling?
1. **Feature Branches vs. Main**:
   - Active development has been happening on feature branches:
     - Server: `feature/data-validation-audit`
     - Client: `feature/shop-owner-ui-redesign`
   - When teammates cloned, Git checked out `main` by default, which lacked recent changes.
   - Merging or pulling across different branches with uncommitted edits triggers merge conflicts.
2. **Windows (CRLF) vs. Mac (LF) Line Endings**:
   - macOS uses `LF` line breaks; Windows uses `CRLF`.
   - Without `.gitattributes`, Windows Git converts all line breaks, making Git believe every single line in every file has been changed.
   - We have now added `.gitattributes` to both repos with `* text=auto eol=lf` to lock line endings and eliminate these phantom conflicts.

### Team Git Rules:
- **Rule 1**: Always run `git status` before pulling. Commit or stash any local edits first.
- **Rule 2**: When switching branches, ensure both members are working on the same branch or make pull requests into `main`.

---

## 3. Windows Setup Guide (Using XAMPP)

### Step 1: Requirements Check
- **PHP 8.2 or higher**:
  - Laravel 12 requires PHP 8.2+. (The project ran Laravel 13, which needs PHP 8.3+, until XAMPP for Windows turned out to never have shipped a PHP 8.3 build at all — downgraded to Laravel 12 specifically so XAMPP's stock PHP works.)
  - If your XAMPP has PHP 8.0 or 8.1, reinstall XAMPP choosing the **8.2.12** build from [apachefriends.org](https://www.apachefriends.org/download.html).
  - Open terminal and type `php -v` to confirm.
- **Node.js 20+**: (`node -v` to confirm).
- **Composer**: (`composer -V` to confirm).
- **Windows Developer Mode**: Turn **ON** Developer Mode in Windows Settings (*Settings → System → For Developers*) so Windows permits symlinks.

### Step 2: Enable PHP Extensions in XAMPP
Open `C:\xampp\php\php.ini` in Notepad and ensure the following lines have **no semicolon `;`** at the beginning:
```ini
extension=pdo_mysql
extension=mysqli
extension=fileinfo
extension=curl
extension=mbstring
extension=openssl
extension=zip
extension=gd
```

### Step 3: Start MySQL & Create Database
1. Open **XAMPP Control Panel** and click **Start** next to **MySQL**. *(Note: You do NOT need to start Apache if you run `php artisan serve`)*.
2. Open phpMyAdmin: `http://localhost/phpmyadmin`
3. Click **New**, type `sutura`, and click **Create**.
   - Default user in XAMPP is `root` with no password.
   - The `.env.example` in `sutura-server` is already configured for this!

### Step 4: Setup & Run Backend (`sutura-server`)
Open Terminal 1:
```bash
cd sutura-server
setup-windows.bat
```
*(Or manually run: `composer install` → `copy .env.example .env` → `php artisan key:generate` → `php artisan migrate --seed` → `php artisan storage:link`)*

Then start the server:
```bash
php artisan serve
```
Leave this terminal running! (Listening on `http://127.0.0.1:8000`).

### Step 5: Setup & Run Frontend (`sutura-client`)
Open Terminal 2:
```bash
cd sutura-client
setup-windows.bat
```
*(Or manually run: `npm install` → `copy .env.example .env.local`)*

Then start the frontend:
```bash
npm run dev
```
Open **http://localhost:3000** in your browser!

---

## 4. macOS Setup Guide

Open Terminal 1 (Backend):
```bash
brew services start mysql@8.4
cd sutura-server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Open Terminal 2 (Frontend):
```bash
cd sutura-client
npm install
cp .env.example .env.local
npm run dev
```
Open **http://localhost:3000** in your browser!

---

## 5. Photos Taken on iPhone/Mac Won't Upload ("Invalid File" Errors)

### Why do image uploads randomly fail on some machines but not others?
iPhones and Macs save camera photos as **HEIC** by default. Windows PCs and Android phones default to **JPEG**. This is a real, common source of "puro error" that has nothing to do with cloning or migrations:

- Browsers (Chrome, Firefox, Edge) **cannot display HEIC images at all.**
- PHP's GD library (what XAMPP ships) **cannot decode HEIC either.**
- SUTURA's upload endpoints only accept `jpeg, png, jpg, webp` — a `.heic` file is correctly rejected, but until this fix the app just said a generic "Failed to upload image. File may be too large." even though size had nothing to do with it.

**Already fixed in the codebase (2026-09-15):**
- Backend (`FileUploadController.php`, `ProfileController.php`) now returns a specific message explaining the HEIC issue instead of a generic validation error.
- Frontend (`src/lib/apiError.ts`) now shows that real backend message instead of a hardcoded guess, across every upload flow (catalog, logo/banner, receipts, staff/customer photos, job reference/progress photos, etc.).

**If you still hit this uploading from an iPhone/Mac:** go to iPhone **Settings → Camera → Formats → "Most Compatible"** (saves new photos as JPEG), or in the Mac/iPhone Photos app use **Share → export as JPEG** before uploading an existing HEIC photo.

---

## 6. Checking That Everyone's PHP/Node/XAMPP Versions Actually Match

`php -v` or `node -v` succeeding only proves the command is *found* — not that the version is new enough. This project needs **PHP 8.2+** (Laravel 12) and **Node 20+** (Next.js 16 / React 19); an older version left on PATH from a previous XAMPP/Node install would pass that basic check and then fail much later with a confusing Composer/npm error, which is exactly the kind of "conflict" that's hard to diagnose remotely.

**Already fixed (2026-09-15):** both `setup-windows.bat` scripts now parse the *actual* version number and fail immediately with a clear message (and a fix) if it's too old, instead of silently proceeding. The backend script also verifies the required PHP extensions are enabled and attempts to auto-create the `sutura` database. Everyone should re-run `setup-windows.bat` (or `composer install`/`npm install` again on Mac) after pulling this fix to confirm their machine actually reports a passing version — screenshot the `[OK] PHP ...` / `[OK] Node.js ...` lines and compare across the team if something still looks off.

---

## 7. Seeded Test Credentials

| Role | Email | Password |
|---|---|---|
| Shop Owner | `owner@sutura.com` | `password` |
| Staff | `staff@sutura.com` | `password` |
| Admin | `admin@sutura.com` | `password` |

---

## 8. Summary of Fixes Applied in the Codebase

1. **MariaDB 1000-byte Index Limit Fix**:
   - Added `Schema::defaultStringLength(191)` in `sutura-server/app/Providers/AppServiceProvider.php`. Fresh migrations on XAMPP MariaDB will no longer throw Error 1071.
2. **Performance Indexes Migration Fix**:
   - Adjusted `database/migrations/2026_09_12_000000_add_performance_indexes_to_critical_tables.php` to prevent redundant indexing and MariaDB key length overflow on the `users` table.
3. **Zero-Config Database Defaults**:
   - Updated `sutura-server/.env.example` with `DB_USERNAME=root` and `DB_PASSWORD=` (matches standard XAMPP out-of-the-box).
4. **Cross-Platform Dev Scripts**:
   - Updated `composer.json` dev scripts so Unix-specific Pail commands do not crash Windows command line.
5. **Git Line-Ending Normalization**:
   - Added `.gitattributes` enforcing `* text=auto eol=lf` to prevent line-ending merge conflicts across Windows and macOS.
6. **Frontend Environment Configuration**:
   - Added `sutura-client/.env.example` pointing to `http://127.0.0.1:8000/api/v1`.
7. **Verified against a real fresh MariaDB 12.3 instance (2026-09-15)**:
   - Ran `migrate:fresh --seed` (all 137 migrations + seeders) against a throwaway MariaDB server matching what XAMPP bundles, not just the team's real MySQL dev databases — confirms the schema itself is not the source of any remaining Windows-only migration failure.
8. **HEIC Image Upload Errors (2026-09-15)**:
   - iPhone/Mac photos saved as HEIC were being rejected with a misleading "File may be too large" message. Backend now returns a specific explanation; frontend now shows the real backend message instead of a hardcoded guess. See section 5 above.
9. **Real PHP/Node Version Checks in Setup Scripts (2026-09-15)**:
   - Both `setup-windows.bat` scripts now check the actual installed version (not just that the command exists) and fail early with a clear fix instead of a confusing error deep inside `composer install`/`npm install`. The backend script also verifies required PHP extensions and attempts to auto-create the `sutura` database. See section 6 above.
