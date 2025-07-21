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
import java.util.Map;

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

        // 🔍 Debug prints
        System.out.println("✅ AuditAspect triggered!");
        System.out.println("Action: " + audit.action());
        System.out.println("Entity Type: " + audit.entityType());
        System.out.println("Returned Result: " + result);

        // Dummy values — replace with actual authentication extraction
        Long userId = getCurrentUserId();
        String userType = getCurrentUserType();

        Long entityId = extractEntityId(result); // Optional helper
        Map<String, Object> changes = extractChanges(joinPoint.getArgs()); // Optional

        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        AuditEventDTO event = new AuditEventDTO(
                audit.action(),
                audit.entityType(),
                entityId,
                changes,
                userId,
                getCurrentUsername(), 
                userType,
                ip,
                userAgent
        );

        publisher.publishEvent(event);
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
            return userDetails.getUser().getUsername();
        }
        return "UNKNOWN";
    }


}
