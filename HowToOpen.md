# How to Run SUTURA (Shop Owner System)

SUTURA is two separate projects that run **at the same time**, each in its own terminal window:

- **`sutura-server`** — the Laravel backend/API (runs on `http://127.0.0.1:8000`)
- **`sutura-client`** — the Next.js frontend/dashboard, the actual app you see in the browser (runs on `http://localhost:3000`)

If the backend (Terminal 1) isn't running, the dashboard (Terminal 2) will look stuck loading or broken. **Always start the backend first, then the frontend.**

## 0) Clone both repos

Open a terminal and run:

```bash
git clone https://github.com/ItzFrostyCode/sutura-server.git
git clone https://github.com/ItzFrostyCode/sutura-client.git
```

This creates two folders, `sutura-server/` and `sutura-client/`, side by side wherever you ran the commands (e.g. your Desktop, or a "Projects" folder). **Remember this location** — you'll need to `cd` into it in the next steps.

## Requirements

Install these first if you don't have them:

- **PHP 8.3+** (`php -v` to check)
- **Composer** (`composer -V` to check)
- **Node.js 20+** and **npm** (`node -v` to check)
- **MySQL 8.4+** — matches the thesis's documented tech stack (production runs on
  PlanetScale, a hosted MySQL). Install it locally with Homebrew:
  ```bash
  brew install mysql@8.4
  brew services start mysql@8.4
  ```

---

## TERMINAL 1 — Backend (`sutura-server`)

Open a terminal and **go to the exact folder** where you cloned `sutura-server`. Plain `cd sutura-server` only works if your terminal happens to already be sitting in the parent folder — if you get "No such file or directory," you're in the wrong place. Use the **full path** instead:

```bash
cd /full/path/to/sutura-server
```

Replace `/full/path/to/sutura-server` with wherever you actually cloned it. For example, if you cloned it on your Desktop on a Mac, the real command looks like:

```bash
cd /Users/yourname/Desktop/sutura-server
```

**Not sure of the exact path?** Open the `sutura-server` folder in Finder (Mac) or File Explorer (Windows), then:
- **Mac**: right-click the folder → "Get Info" and copy the path shown, or drag the folder icon straight into the terminal window after typing `cd ` (a space after `cd`) — the terminal will auto-fill the full path for you.
- **Windows**: click the address bar in File Explorer, copy the path, and use `cd` with that path in quotes.

Once you're in the right folder, confirm it worked — run `ls` (Mac) and you should see files like `composer.json` and `artisan` listed. If you see those, you're in the right place.

### One-time setup (only needed the first time)

Create the local database:

```bash
/opt/homebrew/opt/mysql@8.4/bin/mysql -u root -e "
CREATE DATABASE sutura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutura'@'localhost' IDENTIFIED BY 'sutura_local_dev';
GRANT ALL PRIVILEGES ON sutura.* TO 'sutura'@'localhost';
FLUSH PRIVILEGES;
"
```

Then set up the app:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

`.env.example` already points at `DB_DATABASE=sutura`, `DB_USERNAME=sutura`, `DB_PASSWORD=sutura_local_dev` — matching the database you just created, so this should work without editing `.env` at all. If you later get a paid PlanetScale plan, just swap `DB_HOST`/`DB_USERNAME`/`DB_PASSWORD`/`DB_DATABASE` in `.env` for PlanetScale's connection string — nothing else about the app needs to change.

`--seed` loads demo data: roles, a subscription plan, and a full sample shop (services, staff, jobs, appointments, catalog items, etc.). This is what makes sure **you and your groupmates see the same demo data**, as long as everyone runs this same command on a fresh database. It's also safe to re-run (`php artisan db:seed`) on top of existing data — it won't create duplicates.

### Start the backend

```bash
php artisan serve
```

**Leave this terminal running** — do not close it or press Ctrl+C. It serves the API at `http://127.0.0.1:8000`. You should see a message like "Server running on [http://127.0.0.1:8000]".

---

## TERMINAL 2 — Frontend (`sutura-client`)

Open a **second, brand-new terminal window** (don't reuse Terminal 1 — it needs to keep running `php artisan serve`). Same as before, go to the exact folder where you cloned `sutura-client` using its full path:

```bash
cd /full/path/to/sutura-client
```

Confirm you're in the right place — `ls` should show `package.json` and a `src` folder.

Then run:

```bash
npm install
npm run dev
```

**Leave this running too.** No `.env` file is needed here — it already points to `http://127.0.0.1:8000/api/v1` by default.

Open **http://localhost:3000** in your browser — that's the actual app.

---

## Log in as the Shop Owner

Go to `http://localhost:3000/login` and use:

| Role | Email | Password |
|---|---|---|
| Shop Owner | `owner@sutura.com` | `password` |
| Staff | `staff@sutura.com` | `password` |
| Admin | `admin@sutura.com` | `password` |

For this thesis's scope, you only need the **Shop Owner** account — that's the dashboard we've been building (Jobs, Appointments, Catalog, Payments, Staff, Reports, etc.).

## Everyday use after the first setup

You don't need to repeat the one-time setup steps again — `brew services start mysql@8.4` keeps MySQL running permanently in the background, even after a restart. Each time you want to use the app, just open two terminals:

```bash
# Terminal 1 — full path to sutura-server
cd /full/path/to/sutura-server && php artisan serve

# Terminal 2 — full path to sutura-client
cd /full/path/to/sutura-client && npm run dev
```

---

## Reset everything (stuck ports / "won't start" / weird errors)

If `php artisan serve` or `npm run dev` refuses to start, or the browser shows a red error/blank page, the most common cause is a leftover server from a previous session still holding onto port `8000` (backend) or `3000` (frontend). Here's how to fully reset back to normal:

**1. Find what's using the ports:**

```bash
lsof -i :8000
lsof -i :3000
```

Each command prints a table if something is running on that port. Look at the `PID` column (a number, e.g. `41234`).

**2. Kill it:**

```bash
kill -9 <PID>
```

Replace `<PID>` with the actual number you saw (e.g. `kill -9 41234`). Run this for every PID you found on both ports.

**3. Confirm the ports are free:**

```bash
lsof -i :8000
lsof -i :3000
```

Both commands should now print nothing.

**4. Start fresh, in order:**

```bash
# Terminal 1
cd /full/path/to/sutura-server && php artisan serve

# Terminal 2 (after Terminal 1 says it's running)
cd /full/path/to/sutura-client && npm run dev
```

If you still get a database error after this, also run `php artisan migrate:fresh --seed` in Terminal 1 (before `php artisan serve`) to reset the database to a clean state.

## Why `QUEUE_CONNECTION=sync` in `.env.example`?

Notifications (job status updates, new appointment/order alerts, etc.) are built as **queued** jobs in Laravel — normally that means they get written to a `jobs` table and only actually sent once a separate background process (`php artisan queue:work`) picks them up and runs them.

If you set it to `QUEUE_CONNECTION=database` and never run that separate queue worker, notifications will just silently never fire — nothing crashes, they just quietly sit there forever, which looks like a bug ("bakit walang notification?") but isn't.

`QUEUE_CONNECTION=sync` makes those jobs run **immediately**, in the same request, with no worker process needed. One less terminal to remember to keep open, and one less way for the demo to look broken when it isn't. For a class demo this is the simpler, safer default — `database` only matters if you actually need things to happen in the background without blocking the request (not something this project needs).

## Troubleshooting

- **Dashboard stuck loading / network errors**: make sure `php artisan serve` is still running in its terminal.
- **"SQLSTATE[HY000] [2002] Connection refused" or similar on `migrate`**: MySQL isn't running. Run `brew services start mysql@8.4`.
- **"SQLSTATE[HY000] [1045] Access denied for user 'sutura'@'localhost' (using password: NO)" on `migrate`**: your `.env`'s `DB_PASSWORD` is blank or wrong. It should be `sutura_local_dev` (matching the `CREATE USER` command from the one-time setup above).
- **Login fails with "unauthorized" or accounts don't exist**: re-run `php artisan migrate --seed` (add `:fresh` — i.e. `php artisan migrate:fresh --seed` — if the database already has partial/broken data and you want a clean slate).
- **Port already in use, or anything acting stuck/broken**: see "Reset everything" above.
- **"npm run dev" errors about Node version**: update Node to 20 or newer.
