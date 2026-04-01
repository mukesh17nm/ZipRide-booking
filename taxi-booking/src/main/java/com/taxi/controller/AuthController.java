package com.taxi.controller;

import com.taxi.dto.ForgotPasswordRequest;
import com.taxi.dto.LoginRequest;
import com.taxi.dto.SignupRequest;
import com.taxi.model.AppUser;
import com.taxi.model.Driver;
import com.taxi.model.Passenger;
import com.taxi.repository.AppUserRepository;
import com.taxi.repository.DriverRepository;
import com.taxi.repository.PassengerRepository;
import com.taxi.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private PassengerRepository passengerRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** POST /api/auth/signup */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            response.put("success", false);
            response.put("message", "Full name is required.");
            return ResponseEntity.badRequest().body(response);
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            response.put("success", false);
            response.put("message", "Password must be at least 6 characters.");
            return ResponseEntity.badRequest().body(response);
        }
        if (appUserRepository.existsByEmail(request.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already registered: " + request.getEmail());
            return ResponseEntity.badRequest().body(response);
        }

        java.util.Set<String> validRoles = java.util.Set.of("PASSENGER", "DRIVER", "ADMIN");
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "PASSENGER";
        if (!validRoles.contains(role)) {
            response.put("success", false);
            response.put("message", "Invalid role: " + role);
            return ResponseEntity.badRequest().body(response);
        }

        AppUser user = new AppUser();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        user.setActive(true);

        // For DRIVER role: create a Driver record and link it
        if ("DRIVER".equals(role)) {
            Driver driver = new Driver();
            driver.setDriverName(request.getFullName());
            driver.setContactNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
            driver.setVehicleType("SEDAN");
            driver.setVehicleNumber("TBD");
            driver.setStatus("AVAILABLE");
            driver.setLatitude(11.9416);
            driver.setLongitude(79.8083);
            driver.setZone("ZONE_A");
            driver.setRollingAverageRating(0.0);
            driver.setTotalRidesRated(0);
            driver.setWarningFlagged(false);
            Driver savedDriver = driverRepository.save(driver);
            user.setDriverId(savedDriver.getId());
        }

        AppUser saved = appUserRepository.save(user);

        // For PASSENGER role: create a Passenger record
        if ("PASSENGER".equals(role)) {
            boolean exists = passengerRepository.findByEmail(request.getEmail().toLowerCase()).isPresent();
            if (!exists) {
                Passenger passenger = new Passenger();
                passenger.setPassengerName(request.getFullName());
                passenger.setContactNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
                passenger.setEmail(request.getEmail().toLowerCase());
                passengerRepository.save(passenger);
            }
        }

        response.put("success", true);
        response.put("message", "Account created successfully. Please login.");
        response.put("userId", saved.getId());
        response.put("email", saved.getEmail());
        response.put("role", saved.getRole());
        return ResponseEntity.ok(response);
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        AppUser user = appUserRepository.findByEmail(request.getEmail().toLowerCase()).orElse(null);

        if (user == null) {
            response.put("success", false);
            response.put("message", "No account found with email: " + request.getEmail());
            return ResponseEntity.status(401).body(response);
        }
        if (!user.isActive()) {
            response.put("success", false);
            response.put("message", "Account is deactivated. Please contact support.");
            return ResponseEntity.status(403).body(response);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            response.put("success", false);
            response.put("message", "Invalid password. Please try again.");
            return ResponseEntity.status(401).body(response);
        }

        // On login, ensure DRIVER has a driver record
        if ("DRIVER".equals(user.getRole())) {
            if (user.getDriverId() == null) {
                Driver driver = new Driver();
                driver.setDriverName(user.getFullName());
                driver.setContactNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
                driver.setVehicleType("SEDAN");
                driver.setVehicleNumber("TBD");
                driver.setStatus("AVAILABLE");
                driver.setLatitude(11.9416);
                driver.setLongitude(79.8083);
                driver.setZone("ZONE_A");
                driver.setRollingAverageRating(0.0);
                driver.setTotalRidesRated(0);
                driver.setWarningFlagged(false);
                Driver savedDriver = driverRepository.save(driver);
                user.setDriverId(savedDriver.getId());
                appUserRepository.save(user);
            }
        }

        // On login, ensure PASSENGER has a passenger record
        if ("PASSENGER".equals(user.getRole())) {
            boolean exists = passengerRepository.findByEmail(user.getEmail()).isPresent();
            if (!exists) {
                Passenger passenger = new Passenger();
                passenger.setPassengerName(user.getFullName());
                passenger.setContactNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
                passenger.setEmail(user.getEmail());
                passengerRepository.save(passenger);
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        // Fetch passengerId for PASSENGER role
        Long passengerId = null;
        if ("PASSENGER".equals(user.getRole())) {
            passengerId = passengerRepository.findByEmail(user.getEmail())
                .map(p -> p.getId()).orElse(null);
        }

        response.put("success", true);
        response.put("message", "Login successful. Welcome, " + user.getFullName() + "!");
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("driverId", user.getDriverId());
        response.put("passengerId", passengerId);
        return ResponseEntity.ok(response);
    }

    /** POST /api/auth/forgot-password */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            response.put("success", false);
            response.put("message", "Email is required.");
            return ResponseEntity.badRequest().body(response);
        }

        AppUser user = appUserRepository.findByEmail(request.getEmail().toLowerCase()).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "No account found with email: " + request.getEmail());
            return ResponseEntity.status(404).body(response);
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            response.put("success", false);
            response.put("message", "New password must be at least 6 characters.");
            return ResponseEntity.badRequest().body(response);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            response.put("success", false);
            response.put("message", "Passwords do not match.");
            return ResponseEntity.badRequest().body(response);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(user);

        response.put("success", true);
        response.put("message", "Password reset successfully! Please login with your new password.");
        return ResponseEntity.ok(response);
    }

    /** GET /api/auth/check-email?email=xxx */
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        boolean exists = appUserRepository.existsByEmail(email.toLowerCase());
        response.put("exists", exists);
        response.put("message", exists ? "Email found. You can reset your password." : "No account found with this email.");
        return ResponseEntity.ok(response);
    }

    /** GET /api/auth/users — ADMIN: get all users */
    @GetMapping("/users")
    public ResponseEntity<List<AppUser>> getAllUsers() {
        return ResponseEntity.ok(appUserRepository.findAll());
    }

    /** PATCH /api/auth/users/{id}/deactivate — ADMIN: deactivate a user */
    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        AppUser user = appUserRepository.findById(id).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found.");
            return ResponseEntity.status(404).body(response);
        }
        user.setActive(false);
        appUserRepository.save(user);
        response.put("success", true);
        response.put("message", "User deactivated.");
        return ResponseEntity.ok(response);
    }

    /** PATCH /api/auth/users/{id}/activate — ADMIN: activate a user */
    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, Object>> activateUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        AppUser user = appUserRepository.findById(id).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found.");
            return ResponseEntity.status(404).body(response);
        }
        user.setActive(true);
        appUserRepository.save(user);
        response.put("success", true);
        response.put("message", "User activated.");
        return ResponseEntity.ok(response);
    }
}
