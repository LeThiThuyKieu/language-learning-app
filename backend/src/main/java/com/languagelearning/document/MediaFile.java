package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "media_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaFile {
    @Id
    private String id;
    
    private String fileName;
    private String fileUrl;
    private String fileType; // image, audio, video
    private Long fileSize;
    private String mimeType;
    private LocalDateTime uploadedAt;
    private Integer uploadedBy;
}

