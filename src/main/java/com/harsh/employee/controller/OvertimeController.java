package com.harsh.employee.controller;

import com.harsh.employee.model.OvertimeEntry;
import com.harsh.employee.model.SettlementStatus;
import com.harsh.employee.repository.OvertimeEntryRepository;
import com.harsh.employee.service.ExternalWageRateService;
import com.harsh.employee.service.SettlementService;
import com.harsh.employee.exception.BadRequestException;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/overtime")
@RequiredArgsConstructor
public class OvertimeController {

    private final OvertimeEntryRepository overtimeRepository;
    private final SettlementService settlementService;
    private final ExternalWageRateService externalWageRateService;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OvertimeSummaryResponse {
        private double totalOvertimeHours;
        private BigDecimal totalPayoutAmount;
        private String settlementStatus;
        private List<OvertimeBreakdown> breakdown;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OvertimeBreakdown {
        private String date;
        private double hours;
        private BigDecimal amount;
        private String status;
    }

    @GetMapping("/summary/{workerId}")
    public ResponseEntity<OvertimeSummaryResponse> getOvertimeSummary(
            @PathVariable Long workerId,
            @RequestParam String month
    ) {
        // 1. Fetch external third party values BEFORE opening any database transaction (LF-205)
        BigDecimal minimumWageMultiplier = externalWageRateService.fetchMinimumWageMultiplier();

        YearMonth targetMonth;
        try {
            targetMonth = YearMonth.parse(month); // YYYY-MM
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Invalid month format. Expected YYYY-MM");
        }

        LocalDate startDate = targetMonth.atDay(1);
        LocalDate endDate = targetMonth.atEndOfMonth();

        // 2. Fetch the data from the repository (outside long-held transactions)
        List<OvertimeEntry> entries = overtimeRepository.findByWorkerAndMonth(workerId, startDate, endDate);

        double totalHours = 0.0;
        BigDecimal totalPayout = BigDecimal.ZERO;
        List<OvertimeBreakdown> breakdowns = new ArrayList<>();

        for (OvertimeEntry entry : entries) {
            totalHours += entry.getOvertimeHours();
            // Apply external wage API multiplier (Ticket LF-205)
            BigDecimal entryAmount = entry.getAmount().multiply(minimumWageMultiplier);
            totalPayout = totalPayout.add(entryAmount);

            breakdowns.add(new OvertimeBreakdown(
                    entry.getEntryDate().toString(),
                    entry.getOvertimeHours(),
                    entryAmount,
                    entry.getSettlementStatus().name()
            ));
        }

        String overallStatus = "NONE";
        if (!entries.isEmpty()) {
            boolean allSettled = entries.stream().allMatch(e -> e.getSettlementStatus() == SettlementStatus.SETTLED);
            boolean allPending = entries.stream().allMatch(e -> e.getSettlementStatus() == SettlementStatus.PENDING);
            if (allSettled) {
                overallStatus = "SETTLED";
            } else if (allPending) {
                overallStatus = "PENDING";
            } else {
                overallStatus = "PARTIALLY_SETTLED";
            }
        }

        OvertimeSummaryResponse response = new OvertimeSummaryResponse(
                totalHours,
                totalPayout,
                overallStatus,
                breakdowns
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/settle/{workerId}")
    public ResponseEntity<Map<String, Object>> settleOvertime(
            @PathVariable Long workerId,
            @RequestParam String month
    ) {
        BigDecimal settledAmount = settlementService.settleMonthlyOvertime(workerId, month);
        return ResponseEntity.ok(Map.of(
                "workerId", workerId,
                "month", month,
                "amountSettled", settledAmount,
                "status", "SETTLED"
        ));
    }
}
