package com.taxi.repository;

import com.taxi.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    // Feature 1: fetch all drivers with status = AVAILABLE
    List<Driver> findByStatus(String status);

    // Feature 2: fetch available drivers in a specific zone
    List<Driver> findByZoneAndStatus(String zone, String status);

    // Feature 4: fetch all drivers flagged with a warning
    List<Driver> findByWarningFlagged(boolean warningFlagged);
}
