package com.maven.OnlineShoppingSB.entity;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
@Entity
@Table(name = "vlog")
public class VlogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INT(11)")
    private Long id;

    @Column(length = 45)
    private String title;

    @Column(name = "vlog_content", columnDefinition = "TEXT")
    private String vlogContent;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "vlog", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<VlogFilesEntity> vlogFiles;

    // Add this field for storing multiple file URLs as a string
    @Column(name = "file_paths", columnDefinition = "TEXT")
    private String filePaths;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
