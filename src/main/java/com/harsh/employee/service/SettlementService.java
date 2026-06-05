package com.harsh.employee.service;

import com.harsh.employee.event.OvertimeSettlementEvent;
import com.harsh.employee.exception.BadRequestException;
import com.harsh.employee.exception.ConflictException;
import com.harsh.employee.exception.ResourceNotFoundException;
import com.harsh.employee.model.OvertimeEntry;
import com.harsh.employee.model.SettlementStatus;
import com.harsh.employee.model.Worker;
import com.harsh.employee.repository.OvertimeEntryRepository;
import com.harsh.employee.repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {
    private final OvertimeEntryRepository overtimeRepository;
    private final WorkerRepository workerRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public BigDecimal settleMonthlyOvertime(Long workerId, String monthStr) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));

        YearMonth targetMonth;
        try {
            targetMonth = YearMonth.parse(monthStr); // YYYY-MM
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Invalid month format. Expected YYYY-MM");
        }

        YearMonth currentMonth = YearMonth.now();
        if (!targetMonth.isBefore(currentMonth)) {
            throw new BadRequestException("Cannot settle current or future months");
        }

        LocalDate startDate = targetMonth.atDay(1);
        LocalDate endDate = targetMonth.atEndOfMonth();

        List<OvertimeEntry> entries = overtimeRepository.findPendingEntries(
                workerId, startDate, endDate, SettlementStatus.PENDING);

        if (entries.isEmpty()) {
            List<OvertimeEntry> allEntries = overtimeRepository.findByWorkerAndMonth(workerId, startDate, endDate);
            boolean hasSettled = allEntries.stream().anyMatch(e -> e.getSettlementStatus() == SettlementStatus.SETTLED);
            if (hasSettled) {
                throw new ConflictException("Overtime entries for this month are already settled");
            }
            return BigDecimal.ZERO;
        }

        BigDecimal totalSettledAmount = BigDecimal.ZERO;

        for (OvertimeEntry entry : entries) {
            entry.setSettlementStatus(SettlementStatus.SETTLED);
            totalSettledAmount = totalSettledAmount.add(entry.getAmount());
        }

        overtimeRepository.saveAll(entries);

        // Publish event to dispatch SMS decoupled after transaction commit
        eventPublisher.publishEvent(new OvertimeSettlementEvent(
                worker.getId(), worker.getPhone(), monthStr, totalSettledAmount));

        return totalSettledAmount;
    }
}
