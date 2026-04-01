-- ═══════════════════════════════════════════════════════════════════
-- ZipRide Seed Data — Run after schema is created by Hibernate
-- PostgreSQL compatible
-- ═══════════════════════════════════════════════════════════════════

-- NOTE: Passwords are BCrypt encoded
-- admin@zipride.com    → password: admin123
-- driver1@zipride.com  → password: driver123
-- passenger@zipride.com→ password: pass123

-- ── Users ──────────────────────────────────────────────────────────
INSERT INTO app_users (full_name, email, password_hash, phone_number, role, created_at, is_active, driver_id)
VALUES
  ('Admin User',      'admin@zipride.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9999900000', 'ADMIN',     NOW(), true, NULL),
  ('Ravi Kumar',      'driver1@zipride.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9876543210', 'DRIVER',    NOW(), true, 1),
  ('Suresh Babu',     'driver2@zipride.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9876543211', 'DRIVER',    NOW(), true, 2),
  ('Anand Raja',      'driver3@zipride.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9876543212', 'DRIVER',    NOW(), true, 3),
  ('Priya Sharma',    'passenger@zipride.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9123456789', 'PASSENGER', NOW(), true, NULL),
  ('Mohammed Ali',    'passenger2@zipride.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '9123456780', 'PASSENGER', NOW(), true, NULL)
ON CONFLICT (email) DO NOTHING;

-- ── Drivers ─────────────────────────────────────────────────────────
INSERT INTO drivers (driver_name, contact_number, vehicle_type, vehicle_number, status, latitude, longitude, zone, rolling_average_rating, total_rides_rated, warning_flagged, trips_today, trips_this_week)
VALUES
  ('Ravi Kumar',   '9876543210', 'SEDAN', 'TN34AB1001', 'AVAILABLE', 11.9346, 79.8370, 'ZONE_A', 4.5, 12, false, 3, 18),
  ('Suresh Babu',  '9876543211', 'AUTO',  'PY01CD2002', 'AVAILABLE', 11.9500, 79.8200, 'ZONE_B', 4.2, 8,  false, 2, 12),
  ('Anand Raja',   '9876543212', 'SUV',   'TN34EF3003', 'BUSY',      11.9250, 79.8100, 'ZONE_A', 3.8, 5,  false, 1, 7),
  ('Kumar Vel',    '9876543213', 'MINI',  'PY01GH4004', 'AVAILABLE', 11.9600, 79.8450, 'ZONE_C', 4.7, 20, false, 5, 30),
  ('Siva Prasad',  '9876543214', 'SEDAN', 'TN34IJ5005', 'OFFLINE',   11.9150, 79.7900, 'ZONE_D', 3.2, 15, true,  0, 5),
  ('Muthu Raman',  '9876543215', 'AUTO',  'PY01KL6006', 'AVAILABLE', 11.9420, 79.8090, 'ZONE_A', 4.8, 30, false, 4, 22)
ON CONFLICT DO NOTHING;

-- ── Passengers ──────────────────────────────────────────────────────
INSERT INTO passengers (passenger_name, contact_number, email)
VALUES
  ('Priya Sharma',  '9123456789', 'passenger@zipride.com'),
  ('Mohammed Ali',  '9123456780', 'passenger2@zipride.com'),
  ('Lakshmi Devi',  '9123456781', 'lakshmi@example.com')
ON CONFLICT DO NOTHING;

-- ── Promo Codes ─────────────────────────────────────────────────────
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_amount, min_fare_required, max_usage_count, usage_count, valid_from, valid_until, status)
VALUES
  ('SAVE20',   '20% off your ride',           'PERCENTAGE', 20.0, 100.0,  50.0,  200, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'ACTIVE'),
  ('FLAT50',   'Flat ₹50 off',                'FLAT',       50.0, NULL,   100.0, 100, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'ACTIVE'),
  ('NEWUSER',  'New user special — 30% off',  'PERCENTAGE', 30.0, 150.0,  80.0,  50,  0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', 'ACTIVE'),
  ('WEEKEND10','Weekend 10% bonus',           'PERCENTAGE', 10.0, 50.0,   30.0,  500, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days',  'ACTIVE')
ON CONFLICT DO NOTHING;

-- ── Completed Ride (sample history) ─────────────────────────────────
INSERT INTO ride_requests (passenger_id, driver_id, pickup_lat, pickup_lng, drop_lat, drop_lng, zone, vehicle_type, status, request_time, estimated_fare, final_fare)
VALUES
  (1, 1, 11.9346, 79.8370, 11.9416, 79.8083, 'ZONE_A', 'SEDAN',  'COMPLETED', NOW() - INTERVAL '2 days', 145.50, 145.50),
  (1, 2, 11.9500, 79.8200, 11.9250, 79.8100, 'ZONE_B', 'AUTO',   'COMPLETED', NOW() - INTERVAL '1 day',   62.00,  62.00),
  (2, 1, 11.9416, 79.8083, 11.9600, 79.8450, 'ZONE_A', 'SEDAN',  'COMPLETED', NOW() - INTERVAL '3 hours', 188.00, 188.00)
ON CONFLICT DO NOTHING;
