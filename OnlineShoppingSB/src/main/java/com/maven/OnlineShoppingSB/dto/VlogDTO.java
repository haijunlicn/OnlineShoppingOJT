package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VlogDTO {
    private Long id;
    private String title;
    private String vlogContent;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private List<VlogFilesDTO> vlogFiles;
    private String filePaths; // New field for storing multiple file URLs as a string
}
