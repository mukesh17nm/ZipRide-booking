# 🚖 ZipRide — Taxi Booking System

## ✅ All Bugs Fixed

### Critical Backend Fixes
1. **API Path Prefix** — `RatingController`, `SurgeController`, `DriverController` all now use `/api/` prefix
2. **CORS** — Added `PATCH` and `OPTIONS` to allowed methods
3. **Security** — `/api/fare/rides/**` now accessible to all authenticated roles
4. **Accept Race Condition** — `acceptRide` now checks status is `PENDING` before accepting
5. **Driver ID in Login** — Login response now returns `driverId` so drivers know their own ID
6. **AppUser.driverId** — New field linking a DRIVER account to their Driver record
7. **Admin User Management** — New endpoints: `GET /api/auth/users`, `PATCH /api/auth/users/{id}/activate|deactivate`
8. **PATCH in CORS** — Security config now allows PATCH method

### Critical Frontend Fixes
1. **Wrong API Endpoints** — `DriverPanel` used `/api/drivers/find-nearest` (wrong) → fixed to `/api/drivers/match`
2. **RatingPanel endpoint** — Was calling `/api/ratings/submit` which didn't exist (was `/rating/submit`) → fixed
3. **SurgePanel endpoint** — Was calling `/api/surge/compute` → controller path now matches
4. **403 Alert** — Removed disruptive `alert()` on 403 errors in `api.js`
5. **PATCH query strings** — All PATCH calls now use `?status=X` directly in URL, not Axios params
6. **driverId for drivers** — `DriverNotificationPanel` and `DriverHistoryPanel` now use `user.driverId` correctly
7. **Admin can't monitor rides** — `DriverNotificationPanel` now shows all pending rides to ADMIN without accept button
8. **New AdminPanel** — Full admin dashboard with Rides/Users/Drivers management tabs and stats

### New Features Added
- **Admin Dashboard** (`/admin` tab) — View/manage all rides, users, drivers, stats
- **Admin user deactivation/activation** — Toggle user accounts on/off
- **Admin driver status control** — Change any driver's status
- **Quick select** in Rating/Cancellation panels — Auto-fill from your completed rides
- **Seed SQL** — Sample data with test accounts

---

## 🚀 Quick Start

### Test Accounts
| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| ADMIN     | admin@zipride.com        | admin123    |
| DRIVER    | driver1@zipride.com      | driver123   |
| DRIVER    | driver2@zipride.com      | driver123   |
| PASSENGER | passenger@zipride.com    | pass123     |
| PASSENGER | passenger2@zipride.com   | pass123     |

### Backend (Spring Boot)
```bash
cd taxi-booking
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend (React)
```bash
cd taxi-frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Database (PostgreSQL)
```sql
CREATE DATABASE taxi_db;
-- Then run data.sql manually if you want seed data:
-- psql -U postgres -d taxi_db -f src/main/resources/data.sql
```

---

## 🗺️ How the 3-Role Flow Works

### PASSENGER Flow
1. Sign up / Login as PASSENGER
2. **Book a Ride** → Click map for pickup & drop → Get fare estimate → Book
3. Booking is saved to DB with status `PENDING`
4. **My Rides** → Watch status update when driver accepts (polls every 5s)
5. Cancel from My Rides if needed (2-min free window)

### DRIVER Flow
1. Sign up / Login as DRIVER
2. **Ride Requests** → All pending bookings appear here (polls every 6s)
3. Click **Accept Ride** within 30s window → Status becomes `MATCHED`
4. **My History** → See accepted ride → Click "Start Ride" → "Complete"
5. Earnings tracked per day / week

### ADMIN Flow
1. Login as ADMIN
2. **Admin Dashboard** → View all rides, manage users, manage drivers, see stats
3. **Driver Matching** → Register new drivers
4. **Ride Requests** → Monitor all pending requests in real-time
5. **Promo Codes** → Create new promo codes for passengers
6. **Ratings** → View warned drivers, manage quality

---

## 🔌 All API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`  
- `POST /api/auth/forgot-password`
- `GET  /api/auth/check-email?email=x`
- `GET  /api/auth/users` (ADMIN)
- `PATCH /api/auth/users/{id}/activate` (ADMIN)
- `PATCH /api/auth/users/{id}/deactivate` (ADMIN)

### Drivers
- `POST  /api/drivers` (ADMIN)
- `GET   /api/drivers`
- `GET   /api/drivers/{id}`
- `PATCH /api/drivers/{id}/status?status=AVAILABLE`
- `POST  /api/drivers/match`
- `POST  /api/drivers/find-nearest` (alias)
- `GET   /api/drivers/available-by-zone`

### Rides / Fare
- `POST  /api/fare/estimate`
- `POST  /api/fare/rides` — book a ride
- `GET   /api/fare/rides` — all rides
- `GET   /api/fare/rides/{id}`
- `GET   /api/fare/rides/pending`
- `PATCH /api/fare/rides/{id}/accept?driverId=X`
- `PATCH /api/fare/rides/{id}/status?status=X`

### Surge
- `POST /api/surge/compute`
- `GET  /api/surge/by-zone`

### Ratings
- `POST /api/ratings/submit`
- `GET  /api/ratings/driver/{driverId}`
- `GET  /api/ratings/warned-drivers`

### Cancellation
- `POST /api/cancellation/cancel`
- `GET  /api/cancellation/history?cancellerId=X&cancelledBy=PASSENGER`

### Promo
- `POST /api/promo/create` (ADMIN)
- `POST /api/promo/apply`
- `GET  /api/promo/active`
- `GET  /api/promo/all` (ADMIN)

### Passengers
- `POST /api/fare/passengers`
- `GET  /api/fare/passengers`
