package com.harsh.employee.service;

import com.harsh.employee.model.Worker;
import java.util.List;

public interface WorkerService {
    Worker saveWorker(Worker worker);
    List<Worker> getAllWorkers();
    void deleteWorker(Long id);
}
