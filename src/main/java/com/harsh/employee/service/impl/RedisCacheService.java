package com.harsh.employee.service.impl;

import com.harsh.employee.model.AttendanceLog;
import com.harsh.employee.service.CacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@ConditionalOnProperty(name = "app.cache.provider", havingValue = "redis")
public class RedisCacheService implements CacheService {
    private static final Logger log = LoggerFactory.getLogger(RedisCacheService.class);
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String KEY_PREFIX = "active_worker:";
    private static final long CACHE_TTL_HOURS = 16;

    public RedisCacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void cacheActiveWorker(AttendanceLog attendanceLog) {
        try {
            ActiveWorkerDto dto = new ActiveWorkerDto(
                    attendanceLog.getWorker().getId(),
                    attendanceLog.getWorker().getName(),
                    attendanceLog.getSite().getSiteName(),
                    attendanceLog.getClockInTime().toString()
            );
            String key = KEY_PREFIX + attendanceLog.getWorker().getId();
            redisTemplate.opsForValue().set(key, dto, Duration.ofHours(CACHE_TTL_HOURS));
        } catch (Exception e) {
            log.error("Direct Redis connection write error. Proceeding without populating cache: {}", e.getMessage());
        }
    }

    @Override
    public void evictActiveWorker(Long workerId) {
        try {
            String key = KEY_PREFIX + workerId;
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Direct Redis connection write error. Proceeding with cache eviction bypass: {}", e.getMessage());
        }
    }

    @Override
    public boolean isWorkerClockedIn(Long workerId) {
        try {
            String key = KEY_PREFIX + workerId;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Direct Redis lookup error. Bypassing check: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public List<ActiveWorkerDto> getActiveWorkers() {
        try {
            Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
            if (keys == null || keys.isEmpty()) {
                return Collections.emptyList();
            }
            List<ActiveWorkerDto> list = new ArrayList<>();
            for (String key : keys) {
                ActiveWorkerDto dto = (ActiveWorkerDto) redisTemplate.opsForValue().get(key);
                if (dto != null) {
                    list.add(dto);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("Redis cluster unreachable during operational query fetch. Returning empty container fallback.", e);
            return Collections.emptyList();
        }
    }
}
