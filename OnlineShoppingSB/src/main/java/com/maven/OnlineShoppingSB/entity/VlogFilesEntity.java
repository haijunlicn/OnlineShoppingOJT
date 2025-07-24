package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
@Entity
@Table(name = "vlog_files")
public class VlogFilesEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_path", length = 225)
    private String filePath;

    @Column(name = "file_type", length = 45)
    private String fileType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vlog_id") 
    private VlogEntity vlog;
}
