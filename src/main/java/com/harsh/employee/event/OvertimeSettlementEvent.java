package com.harsh.employee.event;

import lombok.Getter;
import java.math.BigDecimal;

@Getter
public class OvertimeSettlementEvent {
    private final Long workerId;
    private final String phone;
    private final String month;
    private final BigDecimal totalAmount;

    public OvertimeSettlementEvent(Long workerId, String phone, String month, BigDecimal totalAmount) {
        this.workerId = workerId;
        this.phone = phone;
        this.month = month;
        this.totalAmount = totalAmount;
    }
}
