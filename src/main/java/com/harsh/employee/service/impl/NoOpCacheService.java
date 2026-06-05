package com.harsh.employee.service.impl;

import com.harsh.employee.model.AttendanceLog;
import com.harsh.employee.service.CacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@ConditionalOnProperty(name = "app.cache.provider", havingValue = "none", matchIfMissing = true)
public class NoOpCacheService implements CacheService {
    private static final Logger log = LoggerFactory.getLogger(NoOpCacheService.class);

    public NoOpCacheService() {
        log.info("NoOpCacheService initialized. Caching is disabled.");
    }

    @Override
    public void cacheActiveWorker(AttendanceLog attendanceLog) {
        // No-Op
    }

    @Override
    public void evictActiveWorker(Long workerId) {
        // No-Op
    }

    @Override
    public boolean isWorkerClockedIn(Long workerId) {
        return false;
    }

    @Override
    public List<ActiveWorkerDto> getActiveWorkers() {
        return Collections.emptyList();
    }
}
