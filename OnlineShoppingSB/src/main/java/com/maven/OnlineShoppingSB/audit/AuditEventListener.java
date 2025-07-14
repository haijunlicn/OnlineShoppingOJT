package com.maven.OnlineShoppingSB.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async
    @EventListener
    public void onAuditEvent(AuditEventDTO event) {
        System.out.println("✅ Received audit event: " + event.getAction());

        AuditLogEntity log = new AuditLogEntity();
        log.setAction(event.getAction());
        log.setEntityType(event.getEntityType());
        log.setEntityId(event.getEntityId());

        try {
            log.setChangedData(objectMapper.writeValueAsString(event.getChangedData()));
        } catch (Exception e) {
            log.setChangedData("{}");
        }

        log.setPerformedBy(event.getUserId());
        log.setPerformedByType(event.getUserType());
        log.setIpAddress(event.getIpAddress());
        log.setUserAgent(event.getUserAgent());
        log.setCreatedAt(java.time.LocalDateTime.now());

        auditLogRepository.save(log);
        System.out.println("✅ Audit log saved for entity ID: " + event.getEntityId());
    }

}
