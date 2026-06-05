package com.harsh.employee.controller;

import com.harsh.employee.model.AttendanceLog;
import com.harsh.employee.service.AttendanceOvertimeService;
import com.harsh.employee.service.CacheService;
import com.harsh.employee.repository.AttendanceLogRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceOvertimeService attendanceService;
    private final CacheService cacheService;
    private final AttendanceLogRepository attendanceLogRepository;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClockInRequest {
        private Long workerId;
        private Long siteId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClockOutRequest {
        private Long workerId;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class PaginatedResponse<T> {
        private List<T> content;
        private long totalElements;
        private int totalPages;
        private int currentPage;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<AttendanceLog> clockIn(@RequestBody ClockInRequest request) {
        if (request.getWorkerId() == null || request.getSiteId() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        AttendanceLog log = attendanceService.clockIn(request.getWorkerId(), request.getSiteId());
        return new ResponseEntity<>(log, HttpStatus.CREATED);
    }

    @PostMapping("/clock-out")
    public ResponseEntity<AttendanceLog> clockOut(@RequestBody ClockOutRequest request) {
        if (request.getWorkerId() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        AttendanceLog log = attendanceService.clockOut(request.getWorkerId());
        return new ResponseEntity<>(log, HttpStatus.OK);
    }

    @GetMapping("/active")
    public ResponseEntity<List<CacheService.ActiveWorkerDto>> getActiveWorkers() {
        return ResponseEntity.ok(cacheService.getActiveWorkers());
    }

    @GetMapping("/log")
    public ResponseEntity<PaginatedResponse<AttendanceLog>> getAttendanceLogs(
            @RequestParam Long workerId,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LocalDateTime fromDateTime = LocalDate.parse(from).atStartOfDay();
        LocalDateTime toDateTime = LocalDate.parse(to).atTime(LocalTime.MAX);

        Pageable pageable = PageRequest.of(page, size, Sort.by("clockInTime").descending());
        Page<AttendanceLog> logsPage = attendanceLogRepository.findLogsPaginated(
                workerId, fromDateTime, toDateTime, pageable);

        PaginatedResponse<AttendanceLog> response = new PaginatedResponse<>(
                logsPage.getContent(),
                logsPage.getTotalElements(),
                logsPage.getTotalPages(),
                logsPage.getNumber()
        );

        return ResponseEntity.ok(response);
    }
}
