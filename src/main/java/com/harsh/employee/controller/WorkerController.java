package com.harsh.employee.controller;

import com.harsh.employee.model.Worker;
import com.harsh.employee.service.WorkerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

@RestController
@RequestMapping("/api/workers")
@Tag(name = "Worker Management", description = "Endpoints for creating, updating, retrieving, and deleting worker profiles")
public class WorkerController {

    private final WorkerService workerService;

    public WorkerController(WorkerService workerService) {
        this.workerService = workerService;
    }

    // Build Create Worker REST API
    @PostMapping
    @Operation(summary = "Register a new worker", description = "Creates a new worker record with their name, phone, designation enum, daily wage rate, and active status.")
    public ResponseEntity<Worker> saveWorker(@RequestBody Worker worker) {
        return new ResponseEntity<>(workerService.saveWorker(worker), HttpStatus.CREATED);
    }

    // Build Get All Workers REST API
    @GetMapping
    @Operation(summary = "Get all workers", description = "Retrieves a complete list of all registered workers.")
    public List<Worker> getAllWorkers() {
        return workerService.getAllWorkers();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing worker", description = "Updates the profile details (name, phone, designation, wage rate) for a worker by ID.")
    public ResponseEntity<Worker> updateWorker(@PathVariable Long id, @RequestBody Worker workerDetails) {
        workerDetails.setId(id);
        return ResponseEntity.ok(workerService.saveWorker(workerDetails));
    }

    // Delete a worker
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a worker", description = "Removes a worker record from the database by ID.")
    public ResponseEntity<String> deleteWorker(@PathVariable Long id) {
        workerService.deleteWorker(id);
        return ResponseEntity.ok("Worker deleted successfully");
    }
}
