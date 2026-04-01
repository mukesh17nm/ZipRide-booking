package com.taxi.repository;

import com.taxi.model.CancellationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CancellationRecordRepository extends JpaRepository<CancellationRecord, Long> {

    Optional<CancellationRecord> findByRideRequestId(Long rideRequestId);

    List<CancellationRecord> findByCancellerIdAndCancelledBy(Long cancellerId, String cancelledBy);

    long countByCancellerIdAndCancelledBy(Long cancellerId, String cancelledBy);
}
