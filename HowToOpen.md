	

# How to Open SUTURA

Run these steps after the one-time setup is complete. Keep both terminals open.

Windows backend: port `8001` (or `8080` if needed). macOS backend: port `8000` (or `8080` if occupied). The frontend uses port `3000`.

## 1. Windows: Open XAMPP

Open XAMPP Control Panel so its PHP is available. Do not start MySQL for this setup: the current server `.env` uses SQLite. Apache is not needed because Laravel serves the backend in Terminal 1.

## 2. Start the Backend (Terminal 1)

Open a terminal at the `SUTURA THESIS` folder, then run:

**Windows PowerShell**
```powershell
cd sutura-server
& "C:\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8001
```

**macOS**
```bash
cd sutura-server
php artisan serve --host=127.0.0.1 --port=8000
```

If port `8000` is occupied, use `--port=8080` and set the frontend API URL to port `8080`.

Leave this terminal running.

## 3. Start the Frontend (Terminal 2)

Open a second terminal at the `SUTURA THESIS` folder, then run:

**Windows PowerShell**
```powershell
cd sutura-client
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:8001/api/v1"
npm run dev
```

**macOS**
```bash
cd sutura-client
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1 npm run dev
```

Leave this terminal running and open **http://localhost:3000**.
For macOS port `8080`, replace `8000` in `NEXT_PUBLIC_API_URL` with `8080`.

If this is a fresh clone, complete the one-time setup in the `sutura-server` and `sutura-client` README files first.

## Demo Accounts

- Shop Owner: `owner@sutura.com` / `password`
- Staff: `staff@sutura.com` / `password`
- Admin: `admin@sutura.com` / `password`
