package com.harsh.employee.service;

import com.harsh.employee.exception.*;
import com.harsh.employee.model.*;
import com.harsh.employee.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceOvertimeService {

    private final WorkerRepository workerRepository;
    private final SiteRepository siteRepository;
    private final AttendanceLogRepository attendanceRepository;
    private final OvertimeEntryRepository overtimeRepository;
    private final CacheService cacheService;

    @Transactional
    public AttendanceLog clockIn(Long workerId, Long siteId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));
        if (!worker.isActive()) {
            throw new BadRequestException("Worker profile is inactive");
        }

        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found"));
        if (!site.isActive()) {
            throw new BadRequestException("Site is inactive");
        }

        // Check if already clocked in
        boolean active = attendanceRepository.existsByWorkerIdAndClockOutTimeIsNull(workerId);
        if (active) {
            throw new ConflictException("Worker is already clocked in");
        }

        AttendanceLog log = AttendanceLog.builder()
                .worker(worker)
                .site(site)
                .clockInTime(LocalDateTime.now())
                .isFlagged(false)
                .build();

        AttendanceLog savedLog = attendanceRepository.save(log);
        cacheService.cacheActiveWorker(savedLog);
        return savedLog;
    }

    @Transactional
    public AttendanceLog clockOut(Long workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));

        AttendanceLog log = attendanceRepository.findByWorkerIdAndClockOutTimeIsNull(workerId)
                .orElseThrow(() -> new BadRequestException("No active clock-in session found for worker"));

        LocalDateTime now = LocalDateTime.now();
        log.setClockOutTime(now);

        double durationHours = Duration.between(log.getClockInTime(), now).toMinutes() / 60.0;
        log.setTotalHours(durationHours);

        if (durationHours > 16.0) {
            log.setFlagged(true);
        }

        if (durationHours > 8.0) {
            double rawOvertime = durationHours - 8.0;
            processOvertimeCalculation(log, worker, rawOvertime);
        } else {
            log.setOvertimeHours(0.0);
        }

        AttendanceLog savedLog = attendanceRepository.save(log);
        cacheService.evictActiveWorker(workerId);
        return savedLog;
    }

    private void processOvertimeCalculation(AttendanceLog log, Worker worker, double rawOvertime) {
        LocalDate localDate = log.getClockInTime().toLocalDate();
        YearMonth yearMonth = YearMonth.from(localDate);

        double currentMonthOtHours = overtimeRepository.sumOvertimeHoursByWorkerAndMonth(
                worker.getId(), yearMonth.atDay(1), yearMonth.atEndOfMonth()).orElse(0.0);

        if (currentMonthOtHours >= 60.0) {
            log.setOvertimeHours(0.0);
            return; // Hard capped
        }

        double allowedOtHours = rawOvertime;
        if (currentMonthOtHours + rawOvertime > 60.0) {
            allowedOtHours = 60.0 - currentMonthOtHours;
        }

        log.setOvertimeHours(allowedOtHours);

        if (allowedOtHours <= 0.0) {
            return;
        }

        // Tiered Overtime Calculations
        BigDecimal baseHourlyWage = worker.getDailyWageRate().divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);
        BigDecimal totalOtAmount = BigDecimal.ZERO;

        double tier1Hours = Math.min(allowedOtHours, 2.0);
        double tier2Hours = Math.max(0.0, allowedOtHours - 2.0);

        if (tier1Hours > 0) {
            BigDecimal tier1Rate = baseHourlyWage.multiply(BigDecimal.valueOf(1.5));
            totalOtAmount = totalOtAmount.add(tier1Rate.multiply(BigDecimal.valueOf(tier1Hours)));
        }
        if (tier2Hours > 0) {
            BigDecimal tier2Rate = baseHourlyWage.multiply(BigDecimal.valueOf(2.0));
            totalOtAmount = totalOtAmount.add(tier2Rate.multiply(BigDecimal.valueOf(tier2Hours)));
        }

        OvertimeEntry otEntry = OvertimeEntry.builder()
                .worker(worker)
                .attendanceLog(log)
                .entryDate(localDate)
                .overtimeHours(allowedOtHours)
                .rateApplied(allowedOtHours > 2.0 ? BigDecimal.valueOf(2.0) : BigDecimal.valueOf(1.5))
                .amount(totalOtAmount)
                .settlementStatus(SettlementStatus.PENDING)
                .build();

        overtimeRepository.save(otEntry);
    }
}
