package com.maven.OnlineShoppingSB.audit;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audit {
    String action();       // e.g., "CREATE", "UPDATE", "DELETE"
    String entityType();   // e.g., "Product"
}