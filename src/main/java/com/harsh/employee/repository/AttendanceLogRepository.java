package com.harsh.employee.repository;

import com.harsh.employee.model.AttendanceLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {

    Optional<AttendanceLog> findByWorkerIdAndClockOutTimeIsNull(Long workerId);

    boolean existsByWorkerIdAndClockOutTimeIsNull(Long workerId);

    @EntityGraph(attributePaths = {"worker", "site"})
    @Query("SELECT a FROM AttendanceLog a WHERE a.worker.id = :workerId " +
           "AND a.clockInTime >= :fromDate AND a.clockInTime <= :toDate")
    Page<AttendanceLog> findLogsPaginated(
            @Param("workerId") Long workerId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
