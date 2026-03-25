# How to Run the Application

This guide explains how to run **InventoryIQ** (Laravel + React) and, optionally, the **ML model** on the same PC or on another PC. It also describes how to make the ML service start automatically when Windows starts.

---

## For store staff (no terminal – just use the link)

On the **store PC**, after one-time setup, staff only need to **open the app link** in the browser. No commands, no terminal.

### One-time setup (admin or developer does this once per PC)

1. Install **Docker Desktop** and enable **“Start Docker Desktop when you sign in”** (Settings → General).
2. Copy the whole project folder to the store PC (e.g. `D:\laravel-react-inventory`).
3. Double‑click **`FirstTimeSetup.bat`** in the project folder. Wait until it finishes (database + Passport + **demo data**). Do this only once (or after a full reset). Demo data adds sample products, deliveries, and a supplier contract expiring soon so the dashboard and analytics show real numbers.

### Every time the store uses the app

1. Make sure **Docker Desktop is running** (it can start automatically at Windows login if you enabled it).
2. Double‑click **`Start InventoryIQ.bat`** in the project folder.
3. The browser will open to **http://localhost:3000**. Use that link to work; no need to type anything.
4. Log in with: **Email** `test@test.com`, **Password** `Test1234!`

**Optional:** Create a desktop shortcut that points to `http://localhost:3000`. Staff can use “Start InventoryIQ.bat” once to start the app, then click the shortcut to open the link (or keep the tab open).

---

## For developers (manual steps)

The main app runs with **Docker**. No need to install PHP or Node on your machine.

### Prerequisites

- **Docker Desktop** (Windows/Mac/Linux)  
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (included with Docker Desktop)

### Steps

1. **Open a terminal** in the project root:
   ```bash
   cd D:\laravel-react-inventory
   ```

2. **Build and start all services:**
   ```bash
   docker compose up -d --build
   ```
   This starts:
   - **MySQL** (port 3306, internal)
   - **Laravel API** (port **8000**)
   - **React frontend** (port **3000**)

   **Live code (no rebuild for every edit):** `docker-compose.yml` mounts `./server` and `./client` into the containers. The React container runs **`npm start`** (dev server) so UI changes show after a refresh; Laravel picks up PHP changes on the next request. You only need `--build` again when you change **Dockerfiles** or want to refresh `vendor` / `node_modules` in the named volumes.

3. **Setup the database** (first time only, or after a reset):
   ```bash
   docker compose exec inventoryiq-backend php artisan migrate:fresh --seed
   docker compose exec inventoryiq-backend php artisan passport:install --force
   ```

4. **Open the app in the browser:**
   - Frontend: **http://localhost:3000**
   - API: http://localhost:8000

5. **Log in** with the seeded admin user:
   - **Email:** `test@test.com`
   - **Password:** `Test1234!`

### Useful commands

| Action              | Command |
|---------------------|--------|
| Stop the app        | `docker compose down` |
| View logs           | `docker compose logs -f` |
| Restart backend     | `docker compose restart inventoryiq-backend` |
| Restart frontend    | `docker compose restart inventoryiq-frontend` |

If the UI still looks old after a code change, hard-refresh the browser (**Ctrl+Shift+R**). If dependencies seem broken after a big change, recreate containers once: `docker compose up -d --build`.

---

## Part 2: Run the ML Model (Optional)

The **ML / prediction service** (Flask + TensorFlow) is **optional**. The main app works without it. If you want to run it (e.g. for experiments or a future integration), use the steps below.

### On the same PC as the main app

1. **Install Python 3.8+**  
   - [python.org](https://www.python.org/downloads/)  
   - During setup, check **“Add Python to PATH”**.

2. **Open a terminal** in the ML project folder:
   ```bash
   cd D:\laravel-react-inventory\Inventory-Management-System-main\Inventory-Management-System-main
   ```

3. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the ML service:**
   ```bash
   python app.py
   ```
   - Service runs at **http://localhost:5001**  
   - Leave this terminal open while using the ML features.

### On another PC (separate machine)

Use this when the ML service runs on a **different computer** than the one where you open the React app.

**On the PC where the ML will run:**

1. Install **Python 3.8+** and add it to PATH.

2. Copy the whole ML project folder to that PC, e.g.:
   ```
   Inventory-Management-System-main\
     └── Inventory-Management-System-main\
           ├── app.py
           ├── Prediction.py
           ├── utils.py
           ├── requirements.txt
           ├── data_set\
           ├── static\
           └── templates\
   ```
   (Include `trained_model.pkl` and `data_set/data.csv` if you already have them.)

3. Open a terminal in that folder:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
   The app runs on `0.0.0.0:5001`, so it is reachable from other PCs on the same network.

4. **Find this PC’s IP address** (e.g. `192.168.1.20`):
   - Windows: `ipconfig` → “IPv4 Address”.
   - Make sure the firewall allows inbound connections on port **5001**.

**On the PC where the main app (React) runs:**

5. Point the frontend to the ML PC’s IP. In the **React** project, set:
   - Create or edit `client\.env`:
     ```
     REACT_APP_ML_API_URL=http://192.168.1.20:5001
     ```
   - Replace `192.168.1.20` with the ML PC’s actual IP.

6. Rebuild/restart the frontend so it picks up the new env:
   ```bash
   docker compose up -d --build inventoryiq-frontend
   ```
   Now the React app will call the ML service on the other PC.

**Summary for “another PC”:**

| Step | Where | What to do |
|------|--------|------------|
| 1 | ML PC | Install Python, copy ML project, install deps, run `python app.py` |
| 2 | ML PC | Note its IP and allow port 5001 in firewall |
| 3 | App PC | Set `REACT_APP_ML_API_URL=http://<ML_PC_IP>:5001` in `client\.env` |
| 4 | App PC | Rebuild/restart frontend container |

---

## Part 3: Make the ML Model Start Automatically (Windows, locally)

If the ML service runs **on the same PC** and you want it to start when Windows starts (locally, no login required or after login), you can use one of the options below.

### Option A: Task Scheduler (recommended)

1. Open **Task Scheduler** (search in Windows).
2. **Create Basic Task** → Name: e.g. “Start ML Inventory Service”.
3. **Trigger:** “When I log on” (or “When the computer starts” if you use a local account that auto-logs in).
4. **Action:** “Start a program”.
5. **Program/script:**  
   Use the full path to `python.exe` in your venv, e.g.:
   ```
   D:\laravel-react-inventory\Inventory-Management-System-main\Inventory-Management-System-main\venv\Scripts\python.exe
   ```
6. **Add arguments:**  
   ```
   app.py
   ```
7. **Start in:**  
   ```
   D:\laravel-react-inventory\Inventory-Management-System-main\Inventory-Management-System-main
   ```
8. Finish and test by running the task manually. After a reboot (or logon), the ML service should start automatically on port 5001.

### Option B: Startup folder (runs after you log in)

1. Press **Win + R**, type `shell:startup`, press Enter.
2. Create a shortcut or a **batch file** (e.g. `StartMLService.bat`) in that folder with content like:
   ```bat
   @echo off
   cd /d "D:\laravel-react-inventory\Inventory-Management-System-main\Inventory-Management-System-main"
   call venv\Scripts\activate.bat
   python app.py
   ```
   Adjust the `cd` path if your project is elsewhere.
3. When you log in, a command window will open and run the ML service. Closing the window stops the service.

### Option C: Run as a Windows service (advanced)

For a background service that starts at boot (even before any user logs in), you can use **NSSM** (Non-Sucking Service Manager) or **pywin32** to install the Python app as a Windows service. This is more advanced; if you need it, we can add a short section for NSSM in a follow-up.

---

## Quick reference

| What | URL / Command |
|------|----------------|
| Main app (React) | http://localhost:3000 |
| Laravel API | http://localhost:8000 |
| ML service (optional) | http://localhost:5001 |
| Start main app | `docker compose up -d --build` |
| DB setup (first time) | `docker compose exec inventoryiq-backend php artisan migrate:fresh --seed` then `passport:install --force` |
| Start ML (manual) | In ML folder: `python app.py` |
| Default login | `test@test.com` / `Test1234!` |

---

*InventoryIQ – Laravel + React. ML service optional.*
