package com.harsh.employee;

import com.harsh.employee.model.*;
import com.harsh.employee.repository.*;
import com.harsh.employee.service.*;
import com.harsh.employee.exception.BadRequestException;
import com.harsh.employee.exception.ConflictException;
import com.harsh.employee.event.OvertimeSettlementEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeSystemBackendApplicationTests {

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private AttendanceLogRepository attendanceRepository;

    @Mock
    private OvertimeEntryRepository overtimeRepository;

    @Mock
    private CacheService cacheService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AttendanceOvertimeService attendanceOvertimeService;

    @InjectMocks
    private SettlementService settlementService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testClockInSuccess() {
        Worker worker = Worker.builder().id(1L).name("John Doe").isActive(true).build();
        Site site = Site.builder().id(1L).siteName("Greenfield").isActive(true).build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));
        when(attendanceRepository.existsByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(false);
        when(attendanceRepository.save(any(AttendanceLog.class))).thenAnswer(i -> i.getArguments()[0]);

        AttendanceLog result = attendanceOvertimeService.clockIn(1L, 1L);

        assertNotNull(result);
        assertEquals(worker, result.getWorker());
        assertEquals(site, result.getSite());
        assertNotNull(result.getClockInTime());
        verify(cacheService, times(1)).cacheActiveWorker(any(AttendanceLog.class));
    }

    @Test
    void testClockInAlreadyClockedInThrowsConflict() {
        Worker worker = Worker.builder().id(1L).name("John Doe").isActive(true).build();
        Site site = Site.builder().id(1L).siteName("Greenfield").isActive(true).build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));
        when(attendanceRepository.existsByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> attendanceOvertimeService.clockIn(1L, 1L));
    }

    @Test
    void testClockOutUnderEightHoursNoOvertime() {
        Worker worker = Worker.builder().id(1L).name("John Doe").isActive(true).build();
        AttendanceLog log = AttendanceLog.builder()
                .id(10L)
                .worker(worker)
                .clockInTime(LocalDateTime.now().minusHours(5))
                .build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(attendanceRepository.findByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(Optional.of(log));
        when(attendanceRepository.save(any(AttendanceLog.class))).thenAnswer(i -> i.getArguments()[0]);

        AttendanceLog result = attendanceOvertimeService.clockOut(1L);

        assertNotNull(result.getClockOutTime());
        assertTrue(result.getTotalHours() >= 4.9 && result.getTotalHours() <= 5.1);
        assertEquals(0.0, result.getOvertimeHours());
        assertFalse(result.isFlagged());
        verify(overtimeRepository, never()).save(any(OvertimeEntry.class));
        verify(cacheService, times(1)).evictActiveWorker(1L);
    }

    @Test
    void testClockOutOvertimeCalculation() {
        Worker worker = Worker.builder()
                .id(1L)
                .name("John Doe")
                .isActive(true)
                .dailyWageRate(BigDecimal.valueOf(160.0)) // $20/hr base rate
                .build();
        AttendanceLog log = AttendanceLog.builder()
                .id(10L)
                .worker(worker)
                .clockInTime(LocalDateTime.now().minusHours(11)) // 3 hours overtime
                .build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(attendanceRepository.findByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(Optional.of(log));
        when(overtimeRepository.sumOvertimeHoursByWorkerAndMonth(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(10.0)); // Total current OT is 10 hrs
        when(attendanceRepository.save(any(AttendanceLog.class))).thenAnswer(i -> i.getArguments()[0]);

        AttendanceLog result = attendanceOvertimeService.clockOut(1L);

        assertEquals(3.0, result.getOvertimeHours());
        verify(overtimeRepository, times(1)).save(any(OvertimeEntry.class));
    }

    @Test
    void testOvertimeCappedAtSixtyHours() {
        Worker worker = Worker.builder()
                .id(1L)
                .name("John Doe")
                .isActive(true)
                .dailyWageRate(BigDecimal.valueOf(160.0))
                .build();
        AttendanceLog log = AttendanceLog.builder()
                .id(10L)
                .worker(worker)
                .clockInTime(LocalDateTime.now().minusHours(13)) // 5 hours overtime
                .build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(attendanceRepository.findByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(Optional.of(log));
        when(overtimeRepository.sumOvertimeHoursByWorkerAndMonth(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(58.0)); // 58 hours already logged. Capped at 2 remaining.
        when(attendanceRepository.save(any(AttendanceLog.class))).thenAnswer(i -> i.getArguments()[0]);

        AttendanceLog result = attendanceOvertimeService.clockOut(1L);

        assertEquals(2.0, result.getOvertimeHours()); // Capped to 2
    }

    @Test
    void testClockOutFlaggedIfOverSixteenHours() {
        Worker worker = Worker.builder().id(1L).name("John Doe").isActive(true).build();
        AttendanceLog log = AttendanceLog.builder()
                .id(10L)
                .worker(worker)
                .clockInTime(LocalDateTime.now().minusHours(18)) // 18 hours worked
                .build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(attendanceRepository.findByWorkerIdAndClockOutTimeIsNull(1L)).thenReturn(Optional.of(log));
        when(attendanceRepository.save(any(AttendanceLog.class))).thenAnswer(i -> i.getArguments()[0]);

        AttendanceLog result = attendanceOvertimeService.clockOut(1L);

        assertTrue(result.isFlagged());
    }

    @Test
    void testSettleMonthlyOvertimeSuccess() {
        Worker worker = Worker.builder().id(1L).phone("1234567890").isActive(true).build();
        OvertimeEntry entry1 = OvertimeEntry.builder().id(101L).worker(worker).amount(BigDecimal.valueOf(50.0)).build();
        OvertimeEntry entry2 = OvertimeEntry.builder().id(102L).worker(worker).amount(BigDecimal.valueOf(75.0)).build();
        List<OvertimeEntry> pending = List.of(entry1, entry2);

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(overtimeRepository.findPendingEntries(eq(1L), any(LocalDate.class), any(LocalDate.class), eq(SettlementStatus.PENDING)))
                .thenReturn(pending);

        BigDecimal result = settlementService.settleMonthlyOvertime(1L, "2026-04");

        assertEquals(BigDecimal.valueOf(125.0), result);
        assertEquals(SettlementStatus.SETTLED, entry1.getSettlementStatus());
        assertEquals(SettlementStatus.SETTLED, entry2.getSettlementStatus());
        verify(overtimeRepository, times(1)).saveAll(pending);
        verify(eventPublisher, times(1)).publishEvent(any(OvertimeSettlementEvent.class));
    }
}
