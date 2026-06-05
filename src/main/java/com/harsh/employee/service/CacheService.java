package com.harsh.employee.service;

import com.harsh.employee.model.AttendanceLog;
import java.io.Serializable;
import java.util.List;

public interface CacheService {

    void cacheActiveWorker(AttendanceLog attendanceLog);

    void evictActiveWorker(Long workerId);

    boolean isWorkerClockedIn(Long workerId);

    List<ActiveWorkerDto> getActiveWorkers();

    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    class ActiveWorkerDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long workerId;
        private String name;
        private String siteName;
        private String clockInTime;
    }
}
