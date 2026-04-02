package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

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
    private Integer duration; // for audio/video, seconds
    private List<String> tags;
    private LocalDateTime uploadedAt;
    private Integer uploadedBy; //users.id (MySQL)
}


