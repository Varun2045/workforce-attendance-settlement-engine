package com.harsh.employee.service.impl;

import com.harsh.employee.model.Worker;
import com.harsh.employee.repository.WorkerRepository;
import com.harsh.employee.service.WorkerService;
import com.harsh.employee.service.CacheService;
import com.harsh.employee.exception.ConflictException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkerServiceImpl implements WorkerService {

    private final WorkerRepository workerRepository;
    private final CacheService cacheService;

    public WorkerServiceImpl(WorkerRepository workerRepository, CacheService cacheService) {
        this.workerRepository = workerRepository;
        this.cacheService = cacheService;
    }

    @Override
    public Worker saveWorker(Worker worker) {
        if (worker.getId() == null) {
            if (workerRepository.existsByPhone(worker.getPhone())) {
                throw new ConflictException("Phone number " + worker.getPhone() + " is already registered for another worker.");
            }
        } else {
            if (workerRepository.existsByPhoneAndIdNot(worker.getPhone(), worker.getId())) {
                throw new ConflictException("Phone number " + worker.getPhone() + " is already registered for another worker.");
            }
        }
        Worker saved = workerRepository.save(worker);
        if (saved.getId() != null) {
            cacheService.evictActiveWorker(saved.getId());
        }
        return saved;
    }

    @Override
    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    @Override
    public void deleteWorker(Long id) {
        cacheService.evictActiveWorker(id);
        workerRepository.deleteById(id);
    }
}
