package com.harsh.employee.repository;

import com.harsh.employee.model.OvertimeEntry;
import com.harsh.employee.model.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OvertimeEntryRepository extends JpaRepository<OvertimeEntry, Long> {

    @Query("SELECT SUM(o.overtimeHours) FROM OvertimeEntry o WHERE o.worker.id = :workerId AND o.entryDate >= :startDate AND o.entryDate <= :endDate")
    Optional<Double> sumOvertimeHoursByWorkerAndMonth(
            @Param("workerId") Long workerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT o FROM OvertimeEntry o JOIN FETCH o.worker WHERE o.worker.id = :workerId AND o.entryDate >= :startDate AND o.entryDate <= :endDate")
    List<OvertimeEntry> findByWorkerAndMonth(
            @Param("workerId") Long workerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT o FROM OvertimeEntry o JOIN FETCH o.worker WHERE o.worker.id = :workerId AND o.entryDate >= :startDate AND o.entryDate <= :endDate AND o.settlementStatus = :status")
    List<OvertimeEntry> findPendingEntries(
            @Param("workerId") Long workerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") SettlementStatus status
    );
}
