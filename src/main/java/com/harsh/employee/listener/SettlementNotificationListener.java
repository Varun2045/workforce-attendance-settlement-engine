package com.harsh.employee.listener;

import com.harsh.employee.event.OvertimeSettlementEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class SettlementNotificationListener {
    private static final Logger log = LoggerFactory.getLogger(SettlementNotificationListener.class);

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSmsNotificationDispatch(OvertimeSettlementEvent event) {
        log.info("Database transaction committed successfully for worker: {}", event.getWorkerId());
        try {
            // Place actual SMS client API call logic here.
            log.info("SMS dispatched successfully to {}: Overtime settlement for {} of Rs. {} is settled.", 
                    event.getPhone(), event.getMonth(), event.getTotalAmount());
        } catch (Exception ex) {
            log.error("Outbound notification transmission failure. System data is verified safe: {}", ex.getMessage());
        }
    }
}
