package com.taxi.service;

import com.taxi.dto.*;
import com.taxi.model.*;
import com.taxi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of all 4 taxi booking feature services.
 *
 * Key collections demonstrated:
 *  - List<Driver>                      : available drivers fetched from DB (Feature 1)
 *  - Map<Long, Double>                 : driverId → distance to pickup (Feature 1)
 *  - Map<Long, String>                 : driverId → offerExpiry timestamp (Feature 1)
 *  - Map<String, Integer>              : zoneId → availableDriverCount (Feature 1)
 *  - Map<String, Double>               : RatioRange → SurgeMultiplier (Feature 2)
 *  - Map<String, Double>               : zoneId → currentSurgeMultiplier (Feature 2)
 *  - Map<String, Double>               : VehicleType → Multiplier (Feature 3)
 *  - Map<String, Double>               : TollPoint → TollAmount (Feature 3)
 *  - List<RideStop>                    : multi-stop list for distance summation (Feature 3)
 *  - List<DriverRating>                : last N ratings for rolling average (Feature 4)
 *  - Map<String, Integer>              : IncentivePeriod → TripTarget (Feature 4)
 *  - Map<String, Double>               : IncentivePeriod → BonusAmount (Feature 4)
 */
@Service
public class TaxiFeatureServiceImpl implements TaxiFeatureService {

    // ── Repositories ──────────────────────────────────────────────────────────
    @Autowired private DriverRepository            driverRepository;
    @Autowired private PassengerRepository         passengerRepository;
    @Autowired private RideRequestRepository       rideRequestRepository;
    @Autowired private RideStopRepository          rideStopRepository;
    @Autowired private DriverRatingRepository      driverRatingRepository;
    @Autowired private CancellationRecordRepository cancellationRecordRepository;
    @Autowired private PromoCodeRepository         promoCodeRepository;

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 1 — Driver Matching and Nearest Cab Finder
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public Driver saveDriver(Driver driver) {
        validateDriverStatus(driver.getStatus());
        validateVehicleType(driver.getVehicleType());
        return driverRepository.save(driver);
    }

    @Override
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @Override
    public Driver getDriverById(Long driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
    }

    @Override
    public Driver updateDriverStatus(Long driverId, String status) {
        validateDriverStatus(status);
        Driver driver = getDriverById(driverId);
        driver.setStatus(status);
        return driverRepository.save(driver);
    }

    /**
     * Core driver matching logic:
     *  1. Fetch List<Driver> with status AVAILABLE from DB
     *  2. For each driver, compute Haversine distance to pickup point
     *  3. Build Map<DriverId, DistanceKm> and sort using a Comparator by distance
     *  4. Select top N nearest drivers
     *  5. Build Map<DriverId, OfferExpiry> — tracks pending offers with expiry time
     *  6. Create a RideRequest with status PENDING and save it
     */
    @Override
    public DriverMatchResult findNearestDrivers(DriverMatchRequest request) {

        // 1. Fetch all available drivers — List<Driver>
        List<Driver> availableDrivers = driverRepository.findByStatus("AVAILABLE");

        if (availableDrivers.isEmpty()) {
            DriverMatchResult result = new DriverMatchResult();
            result.setNearestDrivers(Collections.emptyList());
            result.setDriverDistances(Collections.emptyMap());
            result.setOfferExpiryMap(Collections.emptyMap());
            result.setTotalAvailableDrivers(0);
            result.setMessage("No available drivers found at this time. Please try again shortly.");
            return result;
        }

        // 2. Compute Haversine distance from each driver to pickup point
        //    Build Map<DriverId, EstimatedDistanceKm>
        Map<Long, Double> driverDistances = new LinkedHashMap<>();
        for (Driver driver : availableDrivers) {
            double distKm = haversineDistanceKm(
                    driver.getLatitude(), driver.getLongitude(),
                    request.getPickupLat(), request.getPickupLng()
            );
            driverDistances.put(driver.getId(), round2(distKm));
        }

        // 3. Sort available drivers by distance using a Comparator
        List<Driver> sortedDrivers = availableDrivers.stream()
                .sorted(Comparator.comparingDouble(d ->
                        driverDistances.getOrDefault(d.getId(), Double.MAX_VALUE)))
                .collect(Collectors.toList());

        // 4. Select top N nearest drivers
        int topN = request.getTopN() > 0 ? request.getTopN() : 3;
        List<Driver> topDrivers = sortedDrivers.stream()
                .limit(topN)
                .collect(Collectors.toList());

        // 5. Build Map<DriverId, OfferExpiry> — pending offers
        //    Simulates: if driver does not accept within window, next driver is tried
        int expirySeconds = request.getOfferExpirySeconds() > 0 ? request.getOfferExpirySeconds() : 30;
        LocalDateTime offerSent = LocalDateTime.now();
        Map<Long, String> offerExpiryMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        for (int i = 0; i < topDrivers.size(); i++) {
            Driver d = topDrivers.get(i);
            // Each subsequent driver gets an offer only after the previous one expires
            LocalDateTime expiry = offerSent.plusSeconds((long) expirySeconds * (i + 1));
            offerExpiryMap.put(d.getId(), expiry.format(formatter));
        }

        // 6. Save the ride request with status PENDING
        RideRequest ride = new RideRequest();
        ride.setPassengerId(request.getPassengerId());
        ride.setPickupLat(request.getPickupLat());
        ride.setPickupLng(request.getPickupLng());
        ride.setDropLat(request.getDropLat());
        ride.setDropLng(request.getDropLng());
        ride.setZone(request.getZone() != null ? request.getZone() : "DEFAULT");
        ride.setVehicleType(request.getVehicleType() != null ? request.getVehicleType() : "SEDAN");
        ride.setStatus("PENDING");
        ride.setRequestTime(LocalDateTime.now());
        RideRequest savedRide = rideRequestRepository.save(ride);

        // Build result
        DriverMatchResult result = new DriverMatchResult();
        result.setRideRequestId(savedRide.getId());
        result.setNearestDrivers(topDrivers);
        result.setDriverDistances(driverDistances);
        result.setOfferExpiryMap(offerExpiryMap);
        result.setTotalAvailableDrivers(availableDrivers.size());
        result.setMessage("Top " + topDrivers.size() + " nearest driver(s) identified out of "
                + availableDrivers.size() + " available. Offers sent with "
                + expirySeconds + "s expiry window per driver.");
        return result;
    }

    @Override
    public Map<String, Integer> getAvailableDriverCountByZone() {
        // Map<ZoneId, AvailableDriverCount>
        List<Driver> availableDrivers = driverRepository.findByStatus("AVAILABLE");
        Map<String, Integer> zoneCountMap = new LinkedHashMap<>();
        for (Driver d : availableDrivers) {
            zoneCountMap.merge(d.getZone(), 1, Integer::sum);
        }
        return zoneCountMap;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 2 — Surge Pricing Calculator
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Core surge pricing logic:
     *  1. Count active ride requests in zone — List<RideRequest> filtered by zone + PENDING/ACTIVE
     *  2. Count available drivers in zone — List<Driver> filtered by zone + AVAILABLE
     *  3. Compute supply-demand ratio = availableDrivers / activeRequests
     *  4. Map ratio to surge multiplier via Map<RatioRange, SurgeMultiplier>
     *  5. Cap multiplier at regulatory maximum (3.0)
     *  6. Apply multiplier to base fare and return breakdown
     */
    @Override
    public SurgePriceResult computeSurgePrice(SurgePriceRequest request) {

        String zone = request.getZone();

        // 1. Count active ride requests in zone
        List<RideRequest> pendingInZone = rideRequestRepository.findByZoneAndStatus(zone, "PENDING");
        List<RideRequest> activeInZone  = rideRequestRepository.findByZoneAndStatus(zone, "ACTIVE");
        int activeRequestCount = pendingInZone.size() + activeInZone.size();

        // 2. Count available drivers in zone
        List<Driver> availableInZone = driverRepository.findByZoneAndStatus(zone, "AVAILABLE");
        int availableDriverCount = availableInZone.size();

        // 3. Compute supply-demand ratio
        //    ratio > 1 means more drivers than demand (no surge); ratio < 0.5 means high demand
        double ratio = (activeRequestCount == 0)
                ? 99.0   // no requests → no surge
                : (double) availableDriverCount / activeRequestCount;

        // 4. Map<RatioRange, SurgeMultiplier> — key format "MIN:MAX" → multiplier
        //    Lower ratio = fewer drivers per request = higher surge
        Map<String, Double> surgeMultiplierTable = buildSurgeMultiplierTable();

        double surgeMultiplier = resolveSurgeMultiplier(ratio, surgeMultiplierTable);

        // 5. Regulatory cap at 3.0×
        final double REGULATORY_MAX = 3.0;
        boolean capApplied = false;
        if (surgeMultiplier > REGULATORY_MAX) {
            surgeMultiplier = REGULATORY_MAX;
            capApplied = true;
        }

        // 6. Apply to base fare
        double baseFare   = request.getBaseFare();
        double surgedFare = round2(baseFare * surgeMultiplier);

        // Build breakdown string
        String breakdown = String.format(
                "Zone: %s | Active Requests: %d | Available Drivers: %d | "
                        + "Supply-Demand Ratio: %.2f | Surge Multiplier: %.2fx%s | "
                        + "Base Fare: ₹%.2f | Surged Fare: ₹%.2f",
                zone, activeRequestCount, availableDriverCount, ratio,
                surgeMultiplier, (capApplied ? " (regulatory cap applied)" : ""),
                baseFare, surgedFare);

        SurgePriceResult result = new SurgePriceResult();
        result.setZone(zone);
        result.setActiveRideRequests(activeRequestCount);
        result.setAvailableDrivers(availableDriverCount);
        result.setSupplyDemandRatio(round2(ratio));
        result.setSurgeMultiplier(surgeMultiplier);
        result.setSurgeMultiplierTable(surgeMultiplierTable);
        result.setOriginalFare(baseFare);
        result.setSurgedFare(surgedFare);
        result.setCapApplied(capApplied);
        result.setRegulatoryMaxMultiplier(REGULATORY_MAX);
        result.setBreakdown(breakdown);
        result.setMessage("Surge pricing computed for zone '" + zone + "'. "
                + (surgeMultiplier > 1.0
                ? "Surge active: " + surgeMultiplier + "× applied."
                : "No surge — supply meets demand."));
        return result;
    }

    @Override
    public Map<String, Double> getCurrentSurgeByZone() {
        // Map<ZoneId, SurgeMultiplier> — compute for each distinct zone
        List<RideRequest> allPending = rideRequestRepository.findByStatus("PENDING");
        List<RideRequest> allActive  = rideRequestRepository.findByStatus("ACTIVE");

        // Collect all distinct zones from requests
        Set<String> zones = new LinkedHashSet<>();
        allPending.forEach(r -> zones.add(r.getZone()));
        allActive.forEach(r -> zones.add(r.getZone()));

        Map<String, Double> surgeByZone = new LinkedHashMap<>();
        Map<String, Double> surgeTable  = buildSurgeMultiplierTable();

        for (String zone : zones) {
            int reqCount = (int) allPending.stream().filter(r -> zone.equals(r.getZone())).count()
                         + (int) allActive.stream().filter(r -> zone.equals(r.getZone())).count();
            int drvCount = driverRepository.findByZoneAndStatus(zone, "AVAILABLE").size();
            double ratio = (reqCount == 0) ? 99.0 : (double) drvCount / reqCount;
            double multiplier = Math.min(resolveSurgeMultiplier(ratio, surgeTable), 3.0);
            surgeByZone.put(zone, multiplier);
        }
        return surgeByZone;
    }

    /** Build the Map<RatioRange, SurgeMultiplier> used for all surge computations */
    private Map<String, Double> buildSurgeMultiplierTable() {
        // Key: "minRatio:maxRatio" → surge multiplier
        // Lower ratio means fewer drivers per request → higher surge
        Map<String, Double> table = new LinkedHashMap<>();
        table.put("0.0:0.3",  3.5);   // extreme demand: 0–0.3 drivers per request
        table.put("0.3:0.5",  2.5);   // very high demand
        table.put("0.5:0.7",  2.0);   // high demand
        table.put("0.7:1.0",  1.5);   // moderate demand
        table.put("1.0:1.5",  1.2);   // slight demand
        table.put("1.5:99.0", 1.0);   // supply >= demand → no surge
        return table;
    }

    /** Resolve the surge multiplier by finding which ratio range the given ratio falls in */
    private double resolveSurgeMultiplier(double ratio, Map<String, Double> table) {
        for (Map.Entry<String, Double> entry : table.entrySet()) {
            String[] parts = entry.getKey().split(":");
            double min = Double.parseDouble(parts[0]);
            double max = Double.parseDouble(parts[1]);
            if (ratio >= min && ratio < max) {
                return entry.getValue();
            }
        }
        return 1.0; // default: no surge
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 3 — Ride Fare Calculator with Multiple Stop Support
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public Passenger savePassenger(Passenger passenger) {
        return passengerRepository.save(passenger);
    }

    @Override
    public List<Passenger> getAllPassengers() {
        return passengerRepository.findAll();
    }

    /**
     * Multi-stop fare estimation logic:
     *  1. Iterate List<Stop> and sum Haversine segment distances
     *  2. Compute: baseFare + (distanceRate × km) + (timeRate × mins) + perStopCharge × extraStops
     *  3. Add toll charges from Map<TollPoint, TollAmount>
     *  4. Apply Map<VehicleType, Multiplier>
     *  5. Apply night surcharge (22:00–05:00) or peak-hour surcharge (07:00–10:00 / 17:00–20:00)
     *  6. Apply surge multiplier (passed from Feature 2)
     */
    @Override
    public FareEstimateResult estimateFare(FareEstimateRequest request) {

        List<RideStop> stops = request.getStops();
        if (stops == null || stops.size() < 2) {
            throw new RuntimeException(
                    "At least 2 stops (pickup + drop) are required for fare estimation.");
        }

        // 1. Sum segment distances across all consecutive stop pairs — List<RideStop> iteration
        double totalDistanceKm = 0.0;
        for (int i = 0; i < stops.size() - 1; i++) {
            RideStop from = stops.get(i);
            RideStop to   = stops.get(i + 1);
            totalDistanceKm += haversineDistanceKm(
                    from.getLatitude(), from.getLongitude(),
                    to.getLatitude(),   to.getLongitude());
        }
        totalDistanceKm = round2(totalDistanceKm);

        // 2. Fare components
        final double BASE_FARE        = 30.0;   // ₹ flat base charge
        final double DISTANCE_RATE    = 12.0;   // ₹ per km
        final double TIME_RATE        = 1.5;    // ₹ per minute
        final double PER_STOP_CHARGE  = 15.0;   // ₹ per extra stop (beyond pickup + drop)

        // Estimated speed: 25 km/h in city traffic
        double estimatedMinutes = round2((totalDistanceKm / 25.0) * 60.0);
        int    extraStops       = Math.max(0, stops.size() - 2);

        double distanceFare  = round2(DISTANCE_RATE * totalDistanceKm);
        double timeFare      = round2(TIME_RATE * estimatedMinutes);
        double perStopCharge = round2(PER_STOP_CHARGE * extraStops);

        // 3. Toll charges — Map<TollPoint, TollAmount> summed
        Map<String, Double> tollCharges = request.getTollCharges();
        double totalTollCharges = 0.0;
        if (tollCharges != null && !tollCharges.isEmpty()) {
            totalTollCharges = tollCharges.values().stream()
                    .mapToDouble(Double::doubleValue)
                    .sum();
            totalTollCharges = round2(totalTollCharges);
        }

        // 4. Map<VehicleType, Multiplier>
        Map<String, Double> vehicleMultiplierTable = new LinkedHashMap<>();
        vehicleMultiplierTable.put("AUTO",  0.8);
        vehicleMultiplierTable.put("MINI",  1.0);
        vehicleMultiplierTable.put("SEDAN", 1.2);
        vehicleMultiplierTable.put("SUV",   1.5);
        vehicleMultiplierTable.put("LUXURY",2.0);

        String vehicleType = (request.getVehicleType() != null)
                ? request.getVehicleType().toUpperCase() : "SEDAN";
        double vehicleMultiplier = vehicleMultiplierTable.getOrDefault(vehicleType, 1.0);

        // 5. Time-based surcharges
        double nightSurcharge    = 0.0;
        double peakHourSurcharge = 0.0;

        if (request.getPickupTime() != null && !request.getPickupTime().isBlank()) {
            try {
                LocalDateTime pickupTime = LocalDateTime.parse(
                        request.getPickupTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                int hour = pickupTime.getHour();

                // Night surcharge: 22:00–05:00
                if (hour >= 22 || hour < 5) {
                    nightSurcharge = round2((BASE_FARE + distanceFare + timeFare) * 0.20); // 20%
                }
                // Peak-hour surcharge: 07:00–10:00 or 17:00–20:00
                else if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
                    peakHourSurcharge = round2((BASE_FARE + distanceFare + timeFare) * 0.15); // 15%
                }
            } catch (Exception e) {
                System.err.println("[FareEstimator] Could not parse pickupTime: "
                        + request.getPickupTime() + " — no time-based surcharge applied.");
            }
        }

        // 6. Apply vehicle multiplier and surge, then sum everything
        double surgeMultiplier = request.getSurgeMultiplier() > 0 ? request.getSurgeMultiplier() : 1.0;

        double subtotal = (BASE_FARE + distanceFare + timeFare + perStopCharge) * vehicleMultiplier;
        subtotal = round2(subtotal);
        double totalFare = round2(
                (subtotal + nightSurcharge + peakHourSurcharge + totalTollCharges) * surgeMultiplier);

        // Build human-readable breakdown
        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Base Fare: ₹%.2f", BASE_FARE));
        breakdown.append(String.format(" | Distance (%.2f km × ₹%.2f): ₹%.2f",
                totalDistanceKm, DISTANCE_RATE, distanceFare));
        breakdown.append(String.format(" | Time (%.0f min × ₹%.2f): ₹%.2f",
                estimatedMinutes, TIME_RATE, timeFare));
        if (extraStops > 0) {
            breakdown.append(String.format(" | Extra Stops (%d × ₹%.2f): ₹%.2f",
                    extraStops, PER_STOP_CHARGE, perStopCharge));
        }
        breakdown.append(String.format(" | Vehicle Multiplier (%s × %.2f): ₹%.2f",
                vehicleType, vehicleMultiplier, subtotal));
        if (nightSurcharge > 0) {
            breakdown.append(String.format(" | Night Surcharge (20%%): ₹%.2f", nightSurcharge));
        }
        if (peakHourSurcharge > 0) {
            breakdown.append(String.format(" | Peak-Hour Surcharge (15%%): ₹%.2f", peakHourSurcharge));
        }
        if (totalTollCharges > 0) {
            breakdown.append(String.format(" | Toll Charges: ₹%.2f", totalTollCharges));
        }
        if (surgeMultiplier > 1.0) {
            breakdown.append(String.format(" | Surge (%.2fx): ₹%.2f", surgeMultiplier, totalFare));
        }
        breakdown.append(String.format(" | TOTAL: ₹%.2f", totalFare));

        // Update ride request with estimated fare if rideRequestId provided
        if (request.getRideRequestId() != null) {
            rideRequestRepository.findById(request.getRideRequestId()).ifPresent(ride -> {
                ride.setEstimatedFare(totalFare);
                rideRequestRepository.save(ride);
            });
        }

        FareEstimateResult result = new FareEstimateResult();
        result.setRideRequestId(request.getRideRequestId());
        result.setTotalStops(stops.size());
        result.setTotalDistanceKm(totalDistanceKm);
        result.setEstimatedMinutes(estimatedMinutes);
        result.setBaseFare(BASE_FARE);
        result.setDistanceFare(distanceFare);
        result.setTimeFare(timeFare);
        result.setPerStopCharge(perStopCharge);
        result.setTotalTollCharges(totalTollCharges);
        result.setVehicleMultiplierTable(vehicleMultiplierTable);
        result.setVehicleMultiplierApplied(vehicleMultiplier);
        result.setSurgeMultiplierApplied(surgeMultiplier);
        result.setNightSurcharge(nightSurcharge);
        result.setPeakHourSurcharge(peakHourSurcharge);
        result.setTotalFare(totalFare);
        result.setBreakdown(breakdown.toString());
        result.setMessage("Fare estimated for " + stops.size() + "-stop ride ("
                + (stops.size() - 2 > 0 ? (stops.size() - 2) + " extra stop(s)" : "direct")
                + "). Total: ₹" + totalFare);
        return result;
    }

    @Override
    public RideRequest saveRide(RideRequest ride) {
        if (ride.getRequestTime() == null) {
            ride.setRequestTime(LocalDateTime.now());
        }
        return rideRequestRepository.save(ride);
    }

    @Override
    public RideRequest getRideById(Long rideId) {
        return rideRequestRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: " + rideId));
    }

    @Override
    public List<RideRequest> getAllRides() {
        return rideRequestRepository.findAll();
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 4 — Driver Rating and Incentive Engine
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Core rating + incentive logic:
     *  1. Validate and save new DriverRating
     *  2. Fetch last N ratings (N=10) for driver → List<DriverRating>
     *  3. Compute rolling average using stream averaging over last N trips
     *  4. If rolling average < 3.5 threshold → set warningFlagged on Driver profile
     *  5. Check Map<IncentivePeriod, TripTarget> — "DAILY" and "WEEKLY"
     *  6. Award bonus if driver completed the required trips
     */
    @Override
    public RatingAndIncentiveResult submitRatingAndComputeIncentive(RatingRequest request) {

        // 1. Validate rating
        if (request.getRating() < 1.0 || request.getRating() > 5.0) {
            throw new RuntimeException(
                    "Rating must be between 1.0 and 5.0. Provided: " + request.getRating());
        }

        Driver driver = getDriverById(request.getDriverId());

        // Save new rating entry to List<DriverRating>
        DriverRating newRating = new DriverRating();
        newRating.setDriverId(request.getDriverId());
        newRating.setRideRequestId(request.getRideRequestId());
        newRating.setPassengerId(request.getPassengerId());
        newRating.setRating(request.getRating());
        newRating.setComment(request.getComment());
        newRating.setRatedAt(LocalDateTime.now());
        driverRatingRepository.save(newRating);

        // 2. Fetch last N=10 ratings for rolling average — List<DriverRating>
        final int ROLLING_WINDOW = 10;
        List<DriverRating> recentRatings =
                driverRatingRepository.findTop10ByDriverIdOrderByRatedAtDesc(request.getDriverId());

        // 3. Compute rolling average via stream averaging
        double rollingAverage = recentRatings.stream()
                .mapToDouble(DriverRating::getRating)
                .average()
                .orElse(request.getRating());
        rollingAverage = round2(rollingAverage);

        // 4. Update driver profile with new rolling average
        driver.setRollingAverageRating(rollingAverage);
        driver.setTotalRidesRated(driver.getTotalRidesRated() + 1);

        // Increment trip counts for incentive check
        driver.setTripsToday(driver.getTripsToday() + 1);
        driver.setTripsThisWeek(driver.getTripsThisWeek() + 1);

        // Check minimum rating threshold → set warning flag
        final double WARNING_THRESHOLD = 3.5;
        boolean warningFlagged = false;
        String warningReason = null;

        if (rollingAverage < WARNING_THRESHOLD) {
            warningFlagged = true;
            warningReason = "Rolling average rating (" + rollingAverage
                    + ") dropped below minimum threshold (" + WARNING_THRESHOLD + "). "
                    + "Computed over last " + recentRatings.size() + " trip(s).";
            driver.setWarningFlagged(true);
            driver.setWarningReason(warningReason);
        }
        driverRepository.save(driver);

        // 5. Map<IncentivePeriod, TripTarget> — targets for bonus eligibility
        Map<String, Integer> incentiveTripTargets = new LinkedHashMap<>();
        incentiveTripTargets.put("DAILY",  10);   // 10 trips/day → bonus
        incentiveTripTargets.put("WEEKLY", 60);   // 60 trips/week → bonus

        // Map<IncentivePeriod, BonusAmount> — award amounts per period
        Map<String, Double> bonusAmounts = new LinkedHashMap<>();
        bonusAmounts.put("DAILY",  150.0);   // ₹150 daily completion bonus
        bonusAmounts.put("WEEKLY", 700.0);   // ₹700 weekly completion bonus

        // Actual trips completed per period
        Map<String, Integer> actualTripsCompleted = new LinkedHashMap<>();
        actualTripsCompleted.put("DAILY",  driver.getTripsToday());
        actualTripsCompleted.put("WEEKLY", driver.getTripsThisWeek());

        // 6. Check each incentive period and award bonus if target met
        Map<String, Double> incentiveBonusAwarded = new LinkedHashMap<>();
        StringBuilder incentiveSummary = new StringBuilder();

        for (Map.Entry<String, Integer> entry : incentiveTripTargets.entrySet()) {
            String period = entry.getKey();
            int    target = entry.getValue();
            int    actual = actualTripsCompleted.getOrDefault(period, 0);
            double bonus  = bonusAmounts.getOrDefault(period, 0.0);

            if (actual >= target) {
                incentiveBonusAwarded.put(period, bonus);
                incentiveSummary.append(period).append(": ₹").append(bonus)
                        .append(" bonus awarded (").append(actual).append("/")
                        .append(target).append(" trips). ");
            } else {
                incentiveBonusAwarded.put(period, 0.0);
                incentiveSummary.append(period).append(": No bonus (")
                        .append(actual).append("/").append(target).append(" trips). ");
            }
        }

        // Build result
        double totalBonusAwarded = incentiveBonusAwarded.values().stream()
                .mapToDouble(Double::doubleValue).sum();

        String summary = String.format(
                "Driver %s | Rolling Avg: %.2f (last %d trips) | Warning: %s | "
                        + "Total Bonus Awarded: ₹%.2f | %s",
                driver.getDriverName(), rollingAverage, recentRatings.size(),
                warningFlagged ? "YES" : "NO",
                totalBonusAwarded, incentiveSummary.toString().trim());

        RatingAndIncentiveResult result = new RatingAndIncentiveResult();
        result.setDriverId(request.getDriverId());
        result.setNewRollingAverageRating(rollingAverage);
        result.setTotalRatingsConsidered(recentRatings.size());
        result.setRecentRatings(recentRatings);
        result.setWarningFlagged(warningFlagged);
        result.setWarningReason(warningReason);
        result.setIncentiveTripTargets(incentiveTripTargets);
        result.setIncentiveBonusAwarded(incentiveBonusAwarded);
        result.setActualTripsCompleted(actualTripsCompleted);
        result.setSummary(summary);
        result.setMessage("Rating submitted successfully. New rolling average: "
                + rollingAverage + (warningFlagged ? " — WARNING ISSUED." : " — Performance OK."));
        return result;
    }

    @Override
    public List<DriverRating> getRatingsByDriver(Long driverId) {
        return driverRatingRepository.findByDriverIdOrderByRatedAtDesc(driverId);
    }

    @Override
    public List<Driver> getWarnedDrivers() {
        return driverRepository.findByWarningFlagged(true);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Haversine formula — computes great-circle distance in km between two GPS points.
     * Used in Feature 1 (driver distance to pickup) and Feature 3 (segment distances).
     */
    private double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double EARTH_RADIUS_KM = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private void validateDriverStatus(String status) {
        Set<String> valid = Set.of("AVAILABLE", "BUSY", "OFFLINE");
        if (!valid.contains(status.toUpperCase())) {
            throw new RuntimeException(
                    "Invalid driver status: " + status + ". Allowed: " + valid);
        }
    }

    private void validateVehicleType(String vehicleType) {
        Set<String> valid = Set.of("AUTO", "MINI", "SEDAN", "SUV", "LUXURY");
        if (!valid.contains(vehicleType.toUpperCase())) {
            throw new RuntimeException(
                    "Invalid vehicle type: " + vehicleType + ". Allowed: " + valid);
        }
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 5 — Ride Cancellation with Penalty Logic
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Cancel a ride and compute the applicable penalty.
     *
     * Collections used:
     *  - Map<String, Double>  : TimeWindow -> PenaltyAmount (penalty policy table)
     *  - Map<String, Double>  : DriverPenalty -> Amount (flat driver penalty table)
     *
     * Logic:
     *  1. Validate ride exists and status is cancellable (PENDING | MATCHED | ACTIVE)
     *  2. Compute minutes elapsed since ride.requestTime
     *  3. Determine canceller type (PASSENGER or DRIVER)
     *  4. For PASSENGER: apply time-window Map to find penalty tier
     *     "0:2"  -> 0.0   grace period
     *     "2:5"  -> 30.0  early cancel
     *     "5:15" -> 60.0  mid cancel
     *     "15:+" -> 100.0 late cancel
     *  5. For DRIVER: flat ₹50 penalty
     *  6. Waive penalty if first-ever cancellation by this user
     *  7. Mark ride as CANCELLED, save CancellationRecord
     */
    @Override
    public CancellationResult cancelRide(CancellationRequest request) {

        // 1. Validate ride
        RideRequest ride = rideRequestRepository.findById(request.getRideRequestId())
                .orElseThrow(() -> new RuntimeException(
                        "Ride not found with id: " + request.getRideRequestId()));

        Set<String> cancellableStatuses = Set.of("PENDING", "MATCHED", "ACTIVE");
        if (!cancellableStatuses.contains(ride.getStatus())) {
            throw new RuntimeException(
                    "Ride cannot be cancelled. Current status: " + ride.getStatus()
                    + ". Only PENDING, MATCHED, or ACTIVE rides can be cancelled.");
        }

        // 2. Compute elapsed minutes since booking
        LocalDateTime now = LocalDateTime.now();
        double minutesElapsed = java.time.Duration.between(ride.getRequestTime(), now).toSeconds() / 60.0;
        minutesElapsed = round2(minutesElapsed);

        String cancelledBy = request.getCancelledBy().toUpperCase();

        // 3. Build penalty policy Map<TimeWindow, PenaltyAmount> for PASSENGER
        Map<String, Double> passengerPenaltyTable = new LinkedHashMap<>();
        passengerPenaltyTable.put("0:2",   0.0);    // grace period — free cancel
        passengerPenaltyTable.put("2:5",   30.0);   // early cancel
        passengerPenaltyTable.put("5:15",  60.0);   // mid cancel
        passengerPenaltyTable.put("15:999", 100.0); // late cancel

        // 4. Flat penalty map for DRIVER
        Map<String, Double> driverPenaltyTable = new LinkedHashMap<>();
        driverPenaltyTable.put("DRIVER_FLAT_PENALTY", 50.0);

        double penaltyAmount = 0.0;
        String appliedPolicyWindow = "";
        Map<String, Double> usedPolicyTable;

        if ("PASSENGER".equals(cancelledBy)) {
            usedPolicyTable = passengerPenaltyTable;
            for (Map.Entry<String, Double> entry : passengerPenaltyTable.entrySet()) {
                String[] bounds = entry.getKey().split(":");
                double min = Double.parseDouble(bounds[0]);
                double max = Double.parseDouble(bounds[1]);
                if (minutesElapsed >= min && minutesElapsed < max) {
                    penaltyAmount = entry.getValue();
                    appliedPolicyWindow = entry.getKey() + " min → ₹" + penaltyAmount;
                    break;
                }
            }
        } else if ("DRIVER".equals(cancelledBy)) {
            usedPolicyTable = driverPenaltyTable;
            penaltyAmount = driverPenaltyTable.get("DRIVER_FLAT_PENALTY");
            appliedPolicyWindow = "DRIVER flat penalty → ₹" + penaltyAmount;
        } else {
            throw new RuntimeException("cancelledBy must be PASSENGER or DRIVER. Got: " + cancelledBy);
        }

        // 5. Waive penalty for first-ever cancellation
        boolean penaltyWaived = false;
        String waiverReason = null;
        long previousCancellations = cancellationRecordRepository
                .countByCancellerIdAndCancelledBy(request.getCancellerId(), cancelledBy);

        if (previousCancellations == 0 && penaltyAmount > 0) {
            penaltyWaived = true;
            waiverReason = "First-time cancellation waiver applied — no penalty charged.";
            penaltyAmount = 0.0;
        }

        // 6. Mark ride as CANCELLED
        ride.setStatus("CANCELLED");
        rideRequestRepository.save(ride);

        // 7. Save cancellation record
        CancellationRecord record = new CancellationRecord();
        record.setRideRequestId(request.getRideRequestId());
        record.setCancelledBy(cancelledBy);
        record.setCancellerId(request.getCancellerId());
        record.setReason(request.getReason());
        record.setMinutesAfterBooking(minutesElapsed);
        record.setPenaltyAmount(penaltyAmount);
        record.setPenaltyWaived(penaltyWaived);
        record.setWaiverReason(waiverReason);
        record.setCancelledAt(now);
        cancellationRecordRepository.save(record);

        String summary = String.format(
                "Ride #%d cancelled by %s after %.1f min | Penalty: ₹%.2f%s | Policy: %s",
                ride.getId(), cancelledBy, minutesElapsed, penaltyAmount,
                penaltyWaived ? " (WAIVED)" : "", appliedPolicyWindow);

        CancellationResult result = new CancellationResult();
        result.setRideRequestId(ride.getId());
        result.setCancelledBy(cancelledBy);
        result.setMinutesAfterBooking(minutesElapsed);
        result.setPenaltyAmount(penaltyAmount);
        result.setPenaltyWaived(penaltyWaived);
        result.setWaiverReason(waiverReason);
        result.setPenaltyPolicyTable(passengerPenaltyTable);
        result.setAppliedPolicyWindow(appliedPolicyWindow);
        result.setCancellationRecord(record);
        result.setSummary(summary);
        result.setMessage("Ride #" + ride.getId() + " successfully cancelled. Penalty: ₹"
                + penaltyAmount + (penaltyWaived ? " (waived)" : ""));
        return result;
    }

    @Override
    public List<CancellationRecord> getCancellationHistory(Long cancellerId, String cancelledBy) {
        return cancellationRecordRepository.findByCancellerIdAndCancelledBy(cancellerId, cancelledBy.toUpperCase());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FEATURE 6 — Promo Code / Discount Engine
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Apply a promo code discount to an original fare.
     *
     * Collections used:
     *  - Map<String, PromoCode> : code -> PromoCode (in-memory lookup map built from DB)
     *  - Map<String, Object>    : discount breakdown details
     *
     * Logic:
     *  1. Build Map<code, PromoCode> from DB for O(1) lookup
     *  2. Validate: code exists in map
     *  3. Validate: status = ACTIVE
     *  4. Validate: current time within validFrom - validUntil window
     *  5. Validate: usageCount < maxUsageCount
     *  6. Validate: originalFare >= minFareRequired
     *  7. Compute discount:
     *     PERCENTAGE -> (discountValue / 100) * originalFare, capped at maxDiscountAmount
     *     FLAT       -> discountValue, capped at originalFare
     *  8. Increment usage count, save PromoCode
     *  9. Update RideRequest.finalFare if rideRequestId provided
     * 10. Return PromoApplyResult with full breakdown Map
     */
    @Override
    public PromoApplyResult applyPromoCode(PromoApplyRequest request) {

        // 1. Build Map<code, PromoCode> for lookup
        List<PromoCode> allCodes = promoCodeRepository.findAll();
        Map<String, PromoCode> codeMap = new LinkedHashMap<>();
        for (PromoCode pc : allCodes) {
            codeMap.put(pc.getCode().toUpperCase(), pc);
        }

        PromoApplyResult result = new PromoApplyResult();
        result.setPromoCode(request.getPromoCode());
        result.setOriginalFare(request.getOriginalFare());

        String lookupCode = request.getPromoCode().toUpperCase();

        // 2. Code existence check
        if (!codeMap.containsKey(lookupCode)) {
            result.setValid(false);
            result.setValidationMessage("Promo code '" + request.getPromoCode() + "' does not exist.");
            result.setDiscountAmount(0.0);
            result.setFinalFare(request.getOriginalFare());
            result.setMessage("Invalid promo code.");
            return result;
        }

        PromoCode promo = codeMap.get(lookupCode);
        LocalDateTime now = LocalDateTime.now();

        // 3. Status check
        if (!"ACTIVE".equalsIgnoreCase(promo.getStatus())) {
            result.setValid(false);
            result.setValidationMessage("Promo code is " + promo.getStatus() + " and cannot be applied.");
            result.setDiscountAmount(0.0);
            result.setFinalFare(request.getOriginalFare());
            result.setMessage("Promo code not active.");
            return result;
        }

        // 4. Validity window check
        if (now.isBefore(promo.getValidFrom()) || now.isAfter(promo.getValidUntil())) {
            result.setValid(false);
            result.setValidationMessage("Promo code is outside its valid date range ("
                    + promo.getValidFrom() + " to " + promo.getValidUntil() + ").");
            result.setDiscountAmount(0.0);
            result.setFinalFare(request.getOriginalFare());
            result.setMessage("Promo code expired or not yet valid.");
            return result;
        }

        // 5. Usage count check
        if (promo.getUsageCount() >= promo.getMaxUsageCount()) {
            result.setValid(false);
            result.setValidationMessage("Promo code has reached its maximum usage limit of "
                    + promo.getMaxUsageCount() + ".");
            result.setDiscountAmount(0.0);
            result.setFinalFare(request.getOriginalFare());
            result.setMessage("Promo code usage limit reached.");
            return result;
        }

        // 6. Minimum fare check
        if (request.getOriginalFare() < promo.getMinFareRequired()) {
            result.setValid(false);
            result.setValidationMessage("Minimum fare of ₹" + promo.getMinFareRequired()
                    + " required to use this promo code. Your fare: ₹" + request.getOriginalFare());
            result.setDiscountAmount(0.0);
            result.setFinalFare(request.getOriginalFare());
            result.setMessage("Fare too low to apply promo code.");
            return result;
        }

        // 7. Compute discount based on type
        double discountAmount;
        StringBuilder breakdown = new StringBuilder();
        breakdown.append("Original Fare: ₹").append(request.getOriginalFare());

        if ("PERCENTAGE".equalsIgnoreCase(promo.getDiscountType())) {
            discountAmount = round2((promo.getDiscountValue() / 100.0) * request.getOriginalFare());
            breakdown.append(String.format(" | %s%% discount: ₹%.2f", (int) promo.getDiscountValue(), discountAmount));
            // Apply cap
            if (promo.getMaxDiscountAmount() != null && discountAmount > promo.getMaxDiscountAmount()) {
                breakdown.append(String.format(" (capped at ₹%.2f)", promo.getMaxDiscountAmount()));
                discountAmount = promo.getMaxDiscountAmount();
            }
        } else {
            // FLAT
            discountAmount = Math.min(promo.getDiscountValue(), request.getOriginalFare());
            breakdown.append(String.format(" | Flat discount: ₹%.2f", discountAmount));
        }

        double finalFare = round2(request.getOriginalFare() - discountAmount);
        breakdown.append(String.format(" | Final Fare: ₹%.2f", finalFare));

        // 8. Increment usage count
        promo.setUsageCount(promo.getUsageCount() + 1);
        promoCodeRepository.save(promo);

        // 9. Update ride final fare if rideRequestId provided
        if (request.getRideRequestId() != null) {
            rideRequestRepository.findById(request.getRideRequestId()).ifPresent(ride -> {
                ride.setFinalFare(finalFare);
                rideRequestRepository.save(ride);
            });
        }

        result.setValid(true);
        result.setValidationMessage("Promo code applied successfully.");
        result.setDiscountAmount(discountAmount);
        result.setFinalFare(finalFare);
        result.setDiscountType(promo.getDiscountType());
        result.setDiscountValue(promo.getDiscountValue());
        result.setPromoDetails(promo);
        result.setBreakdown(breakdown.toString());
        result.setMessage(String.format("Promo '%s' applied! You save ₹%.2f. Final fare: ₹%.2f",
                promo.getCode(), discountAmount, finalFare));
        return result;
    }

    @Override
    public PromoCode createPromoCode(PromoCode promoCode) {
        // Normalize code to uppercase
        promoCode.setCode(promoCode.getCode().toUpperCase());
        if (promoCode.getStatus() == null) {
            promoCode.setStatus("ACTIVE");
        }
        return promoCodeRepository.save(promoCode);
    }

    @Override
    public List<PromoCode> getActivePromoCodes() {
        return promoCodeRepository.findByStatus("ACTIVE");
    }

    @Override
    public List<PromoCode> getAllPromoCodes() {
        return promoCodeRepository.findAll();
    }
}
