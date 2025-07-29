package com.maven.OnlineShoppingSB.audit;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final ApplicationEventPublisher publisher;
    private final HttpServletRequest request;

    @AfterReturning(pointcut = "@annotation(com.maven.OnlineShoppingSB.audit.Audit)", returning = "result")
    public void handleAudit(JoinPoint joinPoint, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Audit audit = method.getAnnotation(Audit.class);

        Long userId = getCurrentUserId();
        String userType = getCurrentUserType();
        String username = getCurrentUsername();

        Map<String, Object> newData = extractChanges(joinPoint.getArgs());
        Map<String, Object> oldData = extractOldChanges(joinPoint.getArgs());

        Map<String, Object> changes = getDifferences(oldData, newData);

        // ✅ Do NOT log if nothing changed
        if (changes.isEmpty()) return;

        // ✅ Entity ID from returned object (if method returns updated product)
        Long entityId = extractEntityId(result);

        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        AuditEventDTO event = new AuditEventDTO(
                audit.action(),
                audit.entityType(),
                entityId,
                changes,
                userId,
                username,
                userType,
                ip,
                userAgent
        );

        publisher.publishEvent(event);
    }

    private Map<String, Object> extractOldChanges(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof AuditableDto auditable) {
                Map<String, Object> oldMap = auditable.toOldAuditMap();
                if (oldMap != null && !oldMap.isEmpty()) {
                    return oldMap;
                }
            }
        }
        return Map.of();
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUser().getId();
        }
        return null;
    }

    private String getCurrentUserType() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUser().getRole().getName();
        }
        return "UNKNOWN";
    }

    private Long extractEntityId(Object result) {
        try {
            return (Long) result.getClass().getMethod("getId").invoke(result);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> extractChanges(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof AuditableDto auditable) {
                return auditable.toAuditMap();
            }
        }
        return Map.of();
    }

    private String getCurrentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUser().getName();
        }
        return "UNKNOWN";
    }
    public static Map<String, Object> getDifferences(Map<String, Object> oldMap, Map<String, Object> newMap) {
        Map<String, Object> changes = new LinkedHashMap<>();

        System.out.println("Starting difference check...");
        System.out.println("Old map: " + oldMap);
        System.out.println("New map: " + newMap);

        for (String key : newMap.keySet()) {
            Object newVal = newMap.get(key);
            Object oldVal = oldMap.get(key);

            System.out.println("Checking key: '" + key + "'");
            System.out.println("  oldVal = " + oldVal);
            System.out.println("  newVal = " + newVal);

            if (!Objects.equals(newVal, oldVal)) {
                System.out.println("  -> Values differ, recording change.");

                Map<String, Object> diff = new LinkedHashMap<>();
                diff.put("old", oldVal); // may be null
                diff.put("new", newVal); // may be null
                changes.put(key, diff);
            } else {
                System.out.println("  -> Values are equal, no change.");
            }
        }

        System.out.println("Detected changes: " + changes);
        System.out.println("Difference check complete.");

        return changes;
    }


}
